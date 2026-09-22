# Scaffold & Outline — Examples

Companion to [perspective.md](perspective.md) (why) and [SKILL.md](SKILL.md) (how).

## Perspective

**Operating question:** “Am I configuring a harness, or re-building PF?”

If the latter, you are outside the perspective — see
[perspective.md § When you are outside](perspective.md#when-you-are-outside-the-perspective).

Demo proof page — each layer pays once:

| Layer | Pays once | Demo instance |
| ----- | --------- | ------------- |
| Data | One matrix key | `apiMatrix.beaconVulnerabilities` |
| PF table shell | One harness | `LwDataView` (scroll, toolbar, manage columns, pagination) |
| Demo wiring | One composition config | `DemoVulnerabilityDataView` + `data-view-config.ts` |
| Domain columns | One catalog + row builder | `VULNERABILITY_COLUMN_CATALOG`, `buildVulnerabilityRows` |
| Page | Outline only | `Demo.tsx` — customer select + conditional table slot |

**Wrong perspective:** `Demo.tsx` inlines `DataView` + `ColumnManagementModal` +
sticky CSS because “it’s just the demo.” That demo becomes the tax every
production page pays later.

**Right perspective:** demo proves the same stack production will use — matrix →
composition → harness → PF. Demo-only files hold **demo config** (ouia ids,
storage keys), not a second PF integration.

**Semantic map (future `LwLabel`):**

```tsx
// config or LwLabel — once
const severityToLabel = {
  critical: { color: 'red', … },
  neat: { color: 'blue', … },
  payAttention: { color: 'orange', … },
};

// composition / column renderer — many times, zero PF tokens
<LwLabel severity="payAttention">{text}</LwLabel>
```

PF v7 renames `color` → callers unchanged; harness updated once.

---

## Lightwell Demo

Proof page stack (matrix → composition → demo data-view → Lw\*):

```
api-matrix.beaconVulnerabilities(...)
        ↓
Demo.tsx                    ← async outline only
        ↓
TableVulnerabilities        ← body states + pagination props
        ↓
DemoVulnerabilityDataView   ← demo shell config (ouia, manageColumns, sticky)
        ↓
LwDataView                  ← columnCatalog + manageColumns + PF table
```

**Page outline** (`Demo.tsx`) — customer select + one conditional slot for the table:

```tsx
{selectedCustomerId && !isLoading ? (
  <TableVulnerabilities data={…} pagination={…} />
) : !selectedCustomerId && !isLoadingCustomers ? (
  <EmptyState … />
) : (
  <LoadingSkeleton />
)}
```

**Composition** owns empty/error chrome; **does not** fetch:

```tsx
export function TableVulnerabilities({ data, isLoading, isError, … }) {
  const bodyStates = useMemo(() => ({ empty: <LwEmptyState …>, error: <LwErrorState …> }), […]);
  return (
    <DemoVulnerabilityDataView
      vulnerabilities={data?.vulnerabilities ?? []}
      activeState={…}
      bodyStates={bodyStates}
      pagination={{ …pagination, itemCount }}
    />
  );
}
```

**Domain catalog** (shared utils, not page JSX):

```tsx
export const VULNERABILITY_COLUMN_CATALOG: LwDataViewColumnCatalogItem[] = […];
export function buildVulnerabilityRows(vulnerabilities: Vulnerability[]): LwDataViewKeyedRow[] { … }
```

---

## Return-as-spec

```tsx
// Good — structure visible
return (
  <>
    <Title headingLevel="h2" id="overview-title">{title}</Title>
    {introBody}
    {hasReadme ? <ReadmeRenderer html={rest} /> : (
      <>
        <section aria-labelledby="detail-a">…</section>
        <section aria-labelledby="detail-b">…</section>
      </>
    )}
  </>
);

// Bad — structure hidden
introContent = <div>…</div>;
tailContent = hasReadme ? <ReadmeRenderer /> : <></>;
return <Flex>{introContent}{card}{tailContent}</Flex>;
```

---

## File placement

```
# Bad
features/container-entry/          # fake layer
container-details-panel.tsx        # shell stem on section
app-drawer-panel-content.tsx      # slot router → double titles

# Good
pages/hardened-images/image-entry/sections/image-detail-overview.tsx
compositions/table-vulnerabilities/
Demo/components/data-view/         # demo-scoped LwDataView wiring only
```

---

## Anti-patterns (extended)

| Anti-pattern | Fix |
| ------------ | --- |
| Chrome title + document `h2` same string | Header null or one outline owns title |
| `app-drawer-panel-content.tsx` | Delete — extend panel/caller |
| Per-tab Spinner dialect | Shared status primitive |
| `catalog-browse-toolbar` (type last) | `toolbar/toolbar.tsx` |
| `HbCardCatalog` usage-named kit | `HbCard` + page `ImageCard` |
| Hand-copied PF `color` unions | `Pick<LabelProps, …>` + app-only fields |
| One-call-site table extraction | Table scaffolding stays in section/composition return |
| JS mount section trees on click | Scaffold mounted with surface; hydrate values only |

---

## Refactor workflow

1. Propose scope — no edits
2. Dry-run: relevance, CHECK FIRST, naming, smoke targets
3. Review until consensus
4. `git mv` misnamed files → edit in place
5. Write return outline from design order
6. Lift hydration into allowed slots only
7. Leave `TODO(rehome): …` on wrong-layer code not moved this pass
8. Validate: compile, tests, smoke
