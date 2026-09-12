# Partner Repository Publishing

## Overview

Partner repositories are upload-type repositories marked with `Partner = true` by an admin.
Publishing a snapshot makes it publicly accessible by removing its Pulp content guard.

## Backend Architecture

### Pulp Concepts Chain

Repository → Repository Version → Publication (generated metadata) → Distribution (URL path serving a publication).
A content guard on a distribution restricts who can access it.

### Snapshot Creation for Partner Repos

- Each snapshot gets its own Pulp distribution at path `<repoUUID>/<snapshotIdent>` with an org-scoped content guard.
- The `/latest` distribution is NOT automatically updated on snapshot creation for partner repos (`ShouldUpdateLatestDistributionOnCreate` returns `false`).

### Publish Snapshot Flow

1. **Handler** (`pkg/handler/snapshots.go` `publishSnapshot`):
   - Validates snapshot exists, no active publish task, repo is partner, org ownership.
   - Calls `UpdatePublishedStatus` (sets `snapshots.published = true`, updates `repositories.public`).
   - Enqueues `UpdateSnapshotPublishedTask` (Pulp work).
   - Enqueues `UpdateLatestSnapshotTask` (depends on publish task).
   - Enqueues `UpdateTemplateContentTask` for foreign-org templates (depends on publish task).

2. **UpdateSnapshotPublishedTask** (`pkg/tasks/update_snapshot_published.go`):
   - Removes content guard from snapshot's distribution (publish) or restores it (unpublish).
   - Updates `/latest` distribution to point at the latest published snapshot.
   - Creates `/latest` on first publish, deletes it when last snapshot is unpublished.

3. **Dependent tasks** all read `snapshots.published` to decide behavior:
   - `FetchLatestSnapshotForDistribution` → for partner repos, returns latest _published_ snapshot.
   - `HasPublishedSnapshot` → guards template removal.
   - `CreateOrUpdateTemplateDistribution` → refuses unguarded distribution for unpublished snapshots.

### Key DB Fields

- `snapshots.published` — whether a specific snapshot is published.
- `snapshots.publish_task_uuid` — FK to the publish/unpublish task (for frontend tracking).
- `repositories.public` — visibility flag, set to `true` when any snapshot is published. Used by `foreignPartnerVisibleSQL` to control cross-org visibility. Also used for Red Hat repo discoverability (not partner-specific).
- `repository_configurations.partner` — whether the repo is a partner repo.

### Domain Model for publish Snapshot and associated PublishLabel states

Publish snapshot status labels show either "publishing in progress" and/or "published" in the name of ContentListTable (for each Repository) and also in the Snapshot List Table (for each Snapshot).

These are the relevant types taken through the lens of Domain Driven Design:

#### PublishLabel

- PublishingInProgressLabel = `text === "Publishing in progress"`
- PublishedLabel = `text === "Published"`

#### Snapshot

Snapshot passes through couple of states:

- BasicSnapshot = `snapshot.published === false`
- SnapshotPublishingInProgress = `snapshot.published === true && snapshot.publish_task.status === "pending" || "running"`
- PublishedSnapshot = `snapshot.published === true && snapshot.publish_task.status === "completed"`
- SnapshotPublishingStopped = `snapshot.published === true && snapshot.publish_task.status === "failed" || "canceled"`

BasicSnapshot and SnapshotPublishingStopped do not have PublishLabels associated with them. SnapshotPublishingInProgress shows PublishingInProgressLabel and PublishedSnapshot shows PublishedLabel. These PublishLabels are shown in the name of the SnapshotListTable.

Snapshot states go from BasicSnapshot -> (user hits Publish button) -> SnapshotPublishingInProgress -> (polling backend task) -> PublishedSnapshot or SnapshotPublishingStopped.

#### Repository

There are couple of types of Repositories:

- RedHatRepository = `repository.origin === "red_hat"`
- CommunityRepository = `repository.origin === "community"`
- URLRepository = `repository.origin === "external"`
- UploadRepository = `repository.origin === "upload" && repository.partner === false`
- PartnerRepository = `repository.origin === "upload" && repository.partner === true`

Any Repository usualy has Snapshots associated with it.

The relevant types of repositories are UploadRepository and PartnerRepository. PartnerRepository is created from UploadRepository by a PartnerAdmin(markAsPartner function). Only PartnerRepository BasicSnapshot can be made published.

If a PartnerRepository has any SnapshotPublishingInProgress, there is PublishingInProgressLabel shown in the PartnerRepository name in the ContentListTable. When the snapshot publishing process completes with PublishedSnapshot, the PublishedLabel is shown instead.

So if PartnerRepository has at least one PublishedSnapshot, PublishedLabel is shown in the name of the PartnerRepository in the ContentListTable.
