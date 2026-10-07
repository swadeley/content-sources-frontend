#!/usr/bin/env python3
"""Sync GitHub PR draft & ready state to HMS Jira ticket status.

Parses HMS-#### keys from the PR title (same convention as title.yml),
comments the Jira browse URL on the PR, and transitions:
  - draft PR → In Progress
  - non-draft open PR → Review

Does not transition on merge. Development → Pull requests is handled by
GitHub for Jira when the issue key is in the PR title.
"""

from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any

HMS_KEY_RE = re.compile(r"^HMS-\d+$")
SKIP_ISSUE_TYPES = {"Story", "Epic", "Feature"}
REQUIRED_COMPONENT = "Content"

# HMS workflow transition IDs from Focaccia HMSContentConfig (fallback).
HMS_TRANSITION_IDS = {
    "New": "11",
    "Backlog": "111",
    "In Progress": "71",
    "Review": "41",
    "Testing": "121",
    "Resolved": "61",
    "Closed": "61",
}

TRANSITION_ORDER = [
    "New",
    "Backlog",
    "In Progress",
    "Review",
    "Testing",
    "Closed",
    "Resolved",
]


class JiraError(Exception):
    pass


def require_env(*names: str) -> dict[str, str]:
    values = {}
    missing = []
    for name in names:
        value = os.environ.get(name, "").strip()
        if not value:
            missing.append(name)
        else:
            values[name] = value
    if missing:
        print(
            "::warning::Missing required configuration: "
            + ", ".join(missing)
            + ". Skipping Jira sync."
        )
        sys.exit(0)
    return values


def issues_from_title(title: str) -> list[str]:
    """Extract HMS keys from the PR title prefix before the first colon."""
    if ":" not in title:
        print(f"No ':' in title; skipping: {title}")
        return []

    prefix, _rest = title.split(":", 1)
    if prefix.strip() == "Build":
        print("Build: title; skipping Jira sync")
        return []

    keys: list[str] = []
    seen: set[str] = set()
    for part in prefix.split(","):
        key = part.strip()
        if not key:
            continue
        if not HMS_KEY_RE.match(key):
            print(f"Ignoring invalid issue key in title: {key!r}")
            continue
        if key not in seen:
            seen.add(key)
            keys.append(key)
    return keys


class JiraClient:
    def __init__(self, base_url: str, email: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        credentials = base64.b64encode(f"{email}:{token}".encode()).decode()
        self.headers = {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _request(
        self, method: str, path: str, payload: dict[str, Any] | None = None
    ) -> Any:
        url = f"{self.base_url}{path}"
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read()
                if not body:
                    return None
                return json.loads(body)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise JiraError(f"HTTP {exc.code} {method} {path}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise JiraError(f"Request failed {method} {path}: {exc}") from exc

    def get_issue(self, key: str) -> dict[str, Any]:
        fields = "status,issuetype,components"
        return self._request("GET", f"/rest/api/3/issue/{key}?fields={fields}")

    def list_transitions(self, key: str) -> list[dict[str, Any]]:
        data = self._request("GET", f"/rest/api/3/issue/{key}/transitions")
        return data.get("transitions", []) if data else []

    def do_transition(self, key: str, transition_id: str) -> None:
        self._request(
            "POST",
            f"/rest/api/3/issue/{key}/transitions",
            {"transition": {"id": str(transition_id)}},
        )


def issue_components(issue: dict[str, Any]) -> list[str]:
    components = issue.get("fields", {}).get("components") or []
    return [c.get("name", "") for c in components]


def issue_status_name(issue: dict[str, Any]) -> str:
    return issue.get("fields", {}).get("status", {}).get("name", "")


def issue_type_name(issue: dict[str, Any]) -> str:
    return issue.get("fields", {}).get("issuetype", {}).get("name", "")


def find_transition_id(
    transitions: list[dict[str, Any]], target_status: str
) -> str | None:
    for transition in transitions:
        to_name = (transition.get("to") or {}).get("name", "")
        name = transition.get("name", "")
        if to_name == target_status or name == target_status:
            return str(transition["id"])
    return None


def transition_toward(
    client: JiraClient, key: str, current_status: str, target_status: str
) -> None:
    if current_status == target_status:
        print(f"{key} already in {target_status}")
        return

    if current_status not in TRANSITION_ORDER or target_status not in TRANSITION_ORDER:
        # Fall back to a single available transition by destination name.
        transitions = client.list_transitions(key)
        transition_id = find_transition_id(transitions, target_status)
        if not transition_id:
            transition_id = HMS_TRANSITION_IDS.get(target_status)
        if not transition_id:
            print(
                f"::warning::{key}: no transition to {target_status!r} "
                f"from {current_status!r}"
            )
            return
        print(f"{key}: {current_status} → {target_status} (id={transition_id})")
        client.do_transition(key, transition_id)
        return

    current_index = TRANSITION_ORDER.index(current_status)
    target_index = TRANSITION_ORDER.index(target_status)
    step = 1 if target_index > current_index else -1

    status = current_status
    # Guard against infinite loops if Jira rejects a step.
    for _ in range(len(TRANSITION_ORDER) + 1):
        if status == target_status:
            return

        status_index = TRANSITION_ORDER.index(status)
        next_status = TRANSITION_ORDER[status_index + step]
        transitions = client.list_transitions(key)
        transition_id = find_transition_id(transitions, next_status)
        if not transition_id:
            transition_id = HMS_TRANSITION_IDS.get(next_status)

        if not transition_id:
            print(
                f"::warning::{key}: cannot step {status!r} → {next_status!r} "
                f"while targeting {target_status!r}"
            )
            return

        print(f"{key}: {status} → {next_status} (id={transition_id})")
        client.do_transition(key, transition_id)
        issue = client.get_issue(key)
        status = issue_status_name(issue)

    print(f"::warning::{key}: stopped before reaching {target_status!r} (at {status!r})")


def ensure_browse_comment(pr_number: str, browse_url: str) -> None:
    repo = os.environ["GITHUB_REPOSITORY"]
    token = os.environ["GITHUB_TOKEN"]
    env = {**os.environ, "GH_TOKEN": token}

    list_cmd = [
        "gh",
        "api",
        f"repos/{repo}/issues/{pr_number}/comments",
        "--jq",
        ".[].body",
    ]
    result = subprocess.run(list_cmd, capture_output=True, text=True, env=env, check=False)
    if result.returncode != 0:
        print(f"::warning::Failed to list PR comments: {result.stderr.strip()}")
        return

    if browse_url in result.stdout:
        print(f"Browse URL already commented on PR #{pr_number}")
        return

    comment_cmd = [
        "gh",
        "pr",
        "comment",
        pr_number,
        "--repo",
        repo,
        "--body",
        browse_url,
    ]
    comment = subprocess.run(
        comment_cmd, capture_output=True, text=True, env=env, check=False
    )
    if comment.returncode != 0:
        print(f"::warning::Failed to comment on PR: {comment.stderr.strip()}")
        return
    print(f"Commented {browse_url} on PR #{pr_number}")


def process_issue(client: JiraClient, key: str, draft: bool, pr_number: str) -> None:
    try:
        issue = client.get_issue(key)
    except JiraError as exc:
        print(f"::warning::Failed to load {key}: {exc}")
        return

    components = issue_components(issue)
    if REQUIRED_COMPONENT not in components:
        print(f"{key}: skipping (component {REQUIRED_COMPONENT!r} not present; have {components})")
        return

    issue_type = issue_type_name(issue)
    if issue_type in SKIP_ISSUE_TYPES:
        print(f"{key}: skipping issue type {issue_type}")
        return

    browse_url = f"{client.base_url}/browse/{key}"
    ensure_browse_comment(pr_number, browse_url)

    current = issue_status_name(issue)
    target = "In Progress" if draft else "Review"
    print(f"{key}: current={current!r} draft={draft} target={target!r}")
    try:
        transition_toward(client, key, current, target)
    except JiraError as exc:
        print(f"::warning::Failed to transition {key}: {exc}")


def main() -> int:
    cfg = require_env("JIRA_BASE_URL", "JIRA_USER_EMAIL", "JIRA_API_TOKEN", "GITHUB_TOKEN")
    title = os.environ.get("PR_TITLE", "")
    pr_number = os.environ.get("PR_NUMBER", "")
    draft_raw = os.environ.get("PR_DRAFT", "false").lower()
    draft = draft_raw in {"true", "1", "yes"}

    if not pr_number:
        print("::error::PR_NUMBER is required")
        return 1

    keys = issues_from_title(title)
    if not keys:
        print("No HMS issue keys found in PR title; nothing to do")
        return 0

    print(f"Found issue keys: {', '.join(keys)} (draft={draft})")
    client = JiraClient(cfg["JIRA_BASE_URL"], cfg["JIRA_USER_EMAIL"], cfg["JIRA_API_TOKEN"])
    for key in keys:
        process_issue(client, key, draft, pr_number)
    return 0


if __name__ == "__main__":
    sys.exit(main())
