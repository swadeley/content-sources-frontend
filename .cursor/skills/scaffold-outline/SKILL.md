---
name: scaffold-outline
description: >-
  Operating perspective for Lightwell UI — return-as-spec, Rule 0 (nodes earn
  their place), harness-once configuration, PF subtract, matrix→Lw*→composition→
  page layers. Use when authoring or refactoring JSX, pages, compositions, Lw*
  components, data-view, naming, upgrades, semantic maps (severity→color), or
  when the user mentions scaffold, outline, code efficiency, passthrough, or
  centralized capability. Replaces visible-scaffolding + outline-first-ui.
---

# Scaffold & Outline

This skill is a **perspective** — how to operate, not only what to check.

| Read first | Purpose |
| ---------- | ------- |
| **[perspective.md](perspective.md)** | **Why** — Rule 0, harness vs wrapper, upgrades, semantic maps, layer stack |
| This file | **How** — process, CHECK FIRST, authoring, checklist |
| [examples.md](examples.md) | **Traces** — Demo stack, anti-patterns, refactor steps |

**Tenant config:** [tenant-ui-config.yaml](../tenant-ui-config.yaml) — if
`exportPrefix` is unset, stop and define it before shared component work.

**Repo contract:** [ARCHITECTURE.md § Lightwell components](../../../ARCHITECTURE.md#lightwell-components).

---

## Perspective (summary)

**One principle:** the return is the spec. Structure visible in JSX; data in slots
above.

**Code efficiency:** capability **centralized**, call sites **configure** — not
reimplemented per page. Pay PF integration once in `Lw*` + `config-component`; pages
pass props and domain names (`payAttention`), not PF tokens (`color="orange"`).

**Rule 0:** wrappers add a node without a job — **expedient**, **inert**, and
**ceremonial** DOM are refused. Passthrough `Lw*` harnesses are **not** wrappers:
same PF root, pure configuration at callers.

Full treatment: [perspective.md](perspective.md).

### Before you write — five questions

1. Does this **node** earn its place? (Rule 0)
2. Does **PF** already own this? (subtract)
3. Does a **harness** exist? (configure `Lw*`; do not copy the PF tree)
4. **Domain name or PF token?** (map once in harness)
5. Is the **return** still the spec? (no hidden sections)

### Harness ladder (same pattern everywhere)

Data, config, UI, tables, drawers — **one capability, many consumers**:

| Harness | Configure at consumer |
| ------- | --------------------- |
| `apiMatrix.{key}` | args, pagination, enabled |
| `config-component` | passthrough overrides |
| `Lw*` | catalog, bodyStates, slots |
| composition | domain defaults |
| page | outline + which harnesses |

Full model: [perspective.md § Same pattern](perspective.md#same-pattern-on-every-surface),
[data harness](perspective.md#data-harness--api-matrixts),
[delivery modes](perspective.md#delivery-modes--best-of-both-worlds),
[cross-cutting](perspective.md#cross-cutting--inherited-in-the-harness-not-a-month-of-work).

---

## Rule 0 — mechanisms

Rule 0 is the DOM gate. Rationale and vocabulary: [perspective.md § Rule 0](perspective.md#rule-0--nodes-must-earn-their-place).

| Kind | DOM | Verdict |
| ---- | --- | ------- |
| Expedient / inert / ceremonial | +1 node | Refuse |
| Passthrough harness (`Lw*`) | Same as PF root | Write once; callers configure |
| Composition / page | Uses harness | Props and outline only |

**Flex / grid:** wrappers re-parent direct children — wrong flex item, `gap`,
sticky, and `overflow` context. [Details](perspective.md#what-an-extra-div-does-to-flex-and-grid).

**User agent:** each node adds layout, paint, a11y, hit-testing, memory cost.
[Details](perspective.md#what-every-new-dom-node-costs-the-user-agent).

**Harness once:** `LwDataView`, `LwLabel`, … — **one integration per surface type**.
Upgrades and semantic maps: [perspective.md § Centralized capability](perspective.md#centralized-capability--what-you-buy).

---

## Model

| Layer | What it is | Lightwell home |
| ----- | ---------- | -------------- |
| **Scaffolding** | Sections, headings, layout, conditionals, ARIA | Visible in the JSX return |
| **Hydration** | Flags, copy, API data, domain row builders | Above the return; injected as slots |
| **Matrix** | Hooks, query keys, mock/live, fallbacks | `api-matrix.ts` |
| **Lw\*** | PF harness + `config-component` defaults + passthrough | `src-migration/components` |
| **Composition** | Column catalog, filters, toolbar slots, body states | `compositions/` |
| **Page** | Async outline, pagination/filter state, layout only | `demo-page/` |

**Scaffolding is the spec. Hydration fills slots. Do not invert.**

| Layer owns | Does not own |
| ---------- | ------------ |
| Matrix | endpoints, cache, mock toggle | UI, column renderers |
| Lw\* | PF shell, merged defaults, semantic maps | fetch, domain copy |
| Composition | domain columns, filter UI | route params, direct `services/*` |
| Page | state, async branches, layout | inline PF config, page-level mocks |

**No `features/` layer.**

---

## Process

```
propose → dry-run → review → consensus → change → validate
```

| Step | Rule |
| ---- | ---- |
| Propose / dry-run | No edits until consensus |
| Change | `git mv` for renames; status should show `renamed:` |
| Validate | build + tests + smoke on affected routes |

**Slice done:** gates pass for what you touched.

**Campaign done:** no wrong-layer trash; matrix → composition → Lw\* → PF works end-to-end.

---

## CHECK FIRST

Before a new file, wrapper, hook, or DTO:

1. **Search** — Lw\*, composition, PF, existing helper?
2. **Extend** — props, config, defaults. New file = last resort.
3. **Parent, not wrapper** — `ref` / `className` / `style` on existing host.
4. **Subtract PF** — app-only fields on types.
5. **Relevance** — one sentence; ≥2 consumers or delete.

| Impulse | Move |
| ------- | ---- |
| Loading UI | shared status; conditional in return |
| New table shell | extend `LwDataView` |
| New columns | `columnCatalog` + keyed rows; shell owns `manageColumns` |
| `color="orange"` in page | `severity` on `LwLabel`; map in harness |

---

## Authoring

### Return-as-spec

Single return. Flags and hydration **above**; structure **below**.

```tsx
return (
  <>
    <LightwellPageHeader title={staticContent.demoProof.titleText} … />
    <PageSection>
      {!isLoadingCustomers ? <DemoCustomerIdSelect … /> : null}
      {selectedCustomerId && !isLoading ? (
        <TableVulnerabilities … />
      ) : !selectedCustomerId && !isLoadingCustomers ? (
        <EmptyState … />
      ) : (
        <LoadingSkeleton />
      )}
    </PageSection>
  </>
);
```

**Forbidden:** `introContent` / `tailContent`; duplicate scaffold across early
returns; click-time structure injection (`∅→value` is not a transition).

### Hydration slots

| Allowed | Forbidden |
| ------- | --------- |
| Flags: `isLoading`, `isEmpty`, `isError` | Whole-section variables |
| Single widgets: `introBody` | `introBlocks` from parsers |
| `error` in visible branch | Scaffold `className` constants (unless ≥2 uses) |

---

## Naming & placement

- Type-first kit: `toolbar/toolbar-table.tsx`
- Export: `{exportPrefix}{Type}` from tenant config
- Name the thing — not the first consumer
- Sections: user-facing name; no `-panel` on content files
- Page entry: ask singular name (**default `entry`**)

---

## Lw\* & PatternFly

| Rule | Detail |
| ---- | ------ |
| Typing | `OwnedProps & Partial<UpstreamHostProps>` |
| Defaults | `config-component.ts` → `mergeComponentProps` |
| Spread | Lw-owned props destructured; `...rest` on PF host |
| className / style | Every public component; merge on root |

Do not re-list one PF prop on the wrapper. Do not invent narrowed `cellProps`.

### LwDataView (catalog path)

```tsx
<LwDataView
  columnCatalog={VULNERABILITY_COLUMN_CATALOG}
  rows={buildVulnerabilityRows(vulnerabilities)}
  manageColumns={{ defaultVisibleKeys, storageKey }}
  isSticky
  borders={false}
  bodyStates={bodyStates}
  pagination={pagination}
/>
```

| Domain (catalog, row builders) | Shell (`manageColumns`, toolbar, pagination) | PF (`DataViewTh[]`, table props) |

Demo: `DemoVulnerabilityDataView` = demo **config** on harness — see
[examples.md § Lightwell Demo](examples.md#lightwell-demo).

---

## Anti-patterns → fixes

| Smell | Fix |
| ----- | --- |
| Two returns, same scaffold | One return + conditionals |
| `{tailContent}` | Inline in return |
| Matrix in composition | Parent passes data |
| Legacy `columns` + `getRowKey` | `columnCatalog` + keyed rows |
| Extra `div` for ref/class | Existing parent |
| PF tokens in pages | Domain name + harness map |
| Demo inlines PF chrome | Use same stack as prod |
| Rename Write + Delete | `git mv` |
| tsc green, UI broken | Smoke route |

Extended: [examples.md](examples.md).

---

## Validate

| Gate | Lightwell |
| ---- | --------- |
| Compile | `yarn build` |
| Tests | `yarn test` on touched paths |
| Smoke | `/lightwell/demo-proof` (Demo); prod route for prod work |

Structure review without smoke is incomplete.

---

## Review checklist

- [ ] Read [perspective.md](perspective.md) when changing layers or adding DOM
- [ ] propose → dry-run → review → consensus → change → validate
- [ ] `git mv` for rehomes
- [ ] CHECK FIRST: extended or proved absent
- [ ] Return readable without sibling files
- [ ] Hydration = flags + slots only
- [ ] PF subtract; Lw\* passthrough
- [ ] matrix → composition → Lw\* → PF traceable
- [ ] Smoke on touched routes

---

## Documentation map

| Doc | Role |
| --- | ---- |
| [perspective.md](perspective.md) | Operating lens (canonical **why**) |
| [examples.md](examples.md) | Code traces |
| [ARCHITECTURE.md § Lightwell](../../../ARCHITECTURE.md#lightwell-components) | Repo contract |
| [Demo/README.md](../../../src/Pages/Lightwell/Demo/README.md) | Platform sandbox |
| [src-migration/components](../../../src-migration/components) | `Lw*` kit home |
