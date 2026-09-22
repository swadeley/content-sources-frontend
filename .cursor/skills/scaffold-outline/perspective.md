# Perspective — operate from centralized capability

**Read this first.** [SKILL.md](SKILL.md) is the operational checklist; this document
is the lens. Kit home: `src-migration/components` (see [tenant-ui-config.yaml](../tenant-ui-config.yaml)).

---

## One principle, two scales

**The return is the spec.** Structure visible in JSX; data in slots above.

**Code efficiency** = capability **centralized** (one harness, one map, one matrix
key) and **configured** at call sites — not reimplemented per page.

---

## Rule 0 — nodes must earn their place

**Wrappers add a node without adding a job.**

| Term | Meaning |
| ---- | ------- |
| **Expedient** | Editor speed over document cost |
| **Inert** | In the tree; no semantic or layout job |
| **Ceremonial** | Structure for code readers, not the UI contract |

**Passthrough harnesses (`Lw*`)** are not wrappers: same PF root, pure configuration.

Flex/grid format **direct children** — extra `div`s re-parent content and break
`flex`, `gap`, sticky, and `overflow`. Each node costs layout, paint, a11y, and memory.

---

## Same pattern on every surface

| Surface | Harness (once) | Consumers configure |
| ------- | -------------- | ------------------- |
| **Data** | `api-matrix.ts` → `apiMatrix.{key}` | page, composition, export |
| **PF defaults** | `config-component.ts` | passthrough on `Lw*` |
| **UI shell** | `LwDataView`, `LwLabel`, … | catalog, bodyStates, slots |
| **Composition** | `table-vulnerabilities`, … | domain defaults |
| **Page** | async outline | matrix keys + composition slots |

**One source → many consumers.** **One config → many consumers.** Find the harness;
do not fork.

---

## Data harness — `api-matrix.ts`

Not an API and fourteen callers. `services/*` = transport. Matrix owns query keys,
stale time, mock gate (`resolve-source`), `placeholderData`, error `meta`, collect,
and invalidation.

**Delivery modes** from one `beaconVulnerabilitiesDef`:

- Hook — render + cache + pagination
- `collectBeaconVulnerabilities` — export all pages
- `queryClient.fetchQuery` — imperative, same cache

**Why `.ts`:** hooks, types, and shared `queryFn` must live together. YAML is for
copy/toggles, not logic harnesses.

---

## Config planes

| Plane | File | Role |
| ----- | ---- | ---- |
| Tenant PF | `config-component.ts` | merged defaults |
| Demo toggles | `demo-config.ts` / `config.yaml` | mock/live gate |
| Copy | `static-content.yaml` | labels — not fetch fallbacks |

---

## Cross-cutting

Telemetry, `ouiaId`, error `meta`: **once in the harness** — inherited by every
consumer. Extend `mergeComponentProps` on `Lw*` roots; matrix `meta` on queries.
Lines in the harness, not months per page.

---

## Layer stack

```
api-matrix → config-component → Lw* → compositions → page outline
```

**Name the resource, not the consumer.**

---

## Demo proof

`/lightwell/demo-proof`: matrix → `Demo.tsx` → `TableVulnerabilities` →
`DemoVulnerabilityDataView` (config) → `LwDataView` (catalog + manageColumns).

---

## Summary

1. Return is the spec.
2. Rule 0 — refuse expedient/inert/ceremonial DOM.
3. Harness once — matrix, config, `Lw*`.
4. One key, many consumers.
5. Right tech per job — TS for logic harnesses; YAML for copy/toggles.

Operate from this perspective.
