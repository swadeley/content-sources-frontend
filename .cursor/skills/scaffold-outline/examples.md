# Scaffold & Outline — Examples

Companion to [perspective.md](perspective.md) (why) and [SKILL.md](SKILL.md) (how).

## Perspective

**Operating question:** "Am I configuring a harness, or re-building PF?"

If the latter, you are outside the perspective — see
[perspective.md § When you are outside](perspective.md#when-you-are-outside-the-perspective).

Demo proof page — each layer pays once:

| Layer | Pays once | Demo instance |
| ----- | --------- | ------------- |
| PF table shell | One harness | `LwDataView` (scroll, toolbar, manage columns, pagination) |
| Demo wiring | One config | `DemoVulnerabilityDataView` + `data-view-config.ts` |
| Domain columns | One catalog + row builder | `VULNERABILITY_COLUMN_CATALOG`, `buildVulnerabilityRows` |
| Page | Outline only | `Demo.tsx` — customer select + conditional table slot |

**Wrong perspective:** `Demo.tsx` inlines `DataView` + `ColumnManagementModal` +
sticky CSS because "it's just the demo." That demo becomes the tax every
production page pays later.

**Right perspective:** demo proves the same stack production will use — page/domain
→ kit assembly → primitive/PF. Demo-only files hold **demo config** (ouia ids,
storage keys), not a second PF integration.

**Logic passthrough (page chrome):**

```tsx
// Slot build — harness owns title stack
<LwPageHeader title="Beacon" description="…" actions={<ExportMenu />} />
// Domain ExportMenu stays page-local until a migration pass; kit LwMenu is ready when rewired.
// See "Extract trace — Beacon ExportMenu"

// Passthrough — caller owns interior
<LwPageHero isGlass>
  <CustomChrome />
</LwPageHero>

// Sibling choice — never variant="hero" on Header
<LwPageHero title="…" backgroundImage />
```

Shared padding from `assemblies/page/page.config.css`. Prop defaults
(`isGlass`, …) from `components.config.ts`.

**Semantic map (future `LwLabel` primitive):**

```tsx
// components.config.ts or LwLabel primitive — once
const severityToLabel = {
  critical: { color: 'red', … },
  payAttention: { color: 'orange', … },
};

// domain / page — many times, zero PF tokens
<LwLabel severity="payAttention">{text}</LwLabel>
```

PF v7 renames `color` → callers unchanged; primitive updated once.

---

## Lightwell Demo

Proof page stack (page/domain → kit assembly → PF):

```
Demo.tsx                    ← async outline only
        ↓
TableVulnerabilities        ← domain: body states + pagination props
        ↓
DemoVulnerabilityDataView   ← demo config (ouia, manageColumns, sticky)
        ↓
LwDataView                  ← kit assembly: columnCatalog + manageColumns + PF
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

**Domain wiring** owns empty/error chrome; **does not** fetch:

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
assemblies/page-header/            # Hero + plain chrome in one God unit

# Good
src/kit/components/primitives/label/label.tsx
src/kit/components/assemblies/page/
  page.config.css                  # page spacers / type (CSS, not YAML)
  page-header/                     # plain chrome — kit invention
  page-hero/                       # PF Hero harness
src/kit/components/components.config.ts    # prop defaults
src/kit/components/components.config.css   # domain presentational baseline
# domain wiring — stays with product, not in src/kit/
src/Pages/Lightwell/Beacon/components/pipeline-view.tsx
```

---

## Anti-patterns (extended)

| Anti-pattern | Fix |
| ------------ | --- |
| Chrome title + document `h2` same string | Header null or one outline owns title |
| Per-tab Spinner dialect | Shared status primitive |
| `catalog-browse-toolbar` (type last) | `toolbar/toolbar.tsx` |
| `HbCardCatalog` usage-named kit | `HbCard` + page `ImageCard` |
| Hand-copied PF `color` unions | `Pick<LabelProps, …>` + app-only fields |
| One-call-site table extraction | Table scaffolding stays in domain/return |
| JS mount section trees on click | Scaffold mounted with surface; hydrate values only |
| Domain wiring labeled "assembly" in kit | Keep with product until extracted |
| `LwPageHeader variant="hero"` | Sibling `LwPageHero` — shared slots, separate hosts |
| Spacers in YAML or TS prop config | `page.config.css` / `components.config.css` |
| Beacon `ExportMenu` re-implements Dropdown | Primitive `LwMenu` + thin domain shell (see extract trace) |
| `LwExportMenu` before a second consumer | Configure `LwMenu` from domain; promote assembly later |
| Call `LwMenu` an assembly because of `isBusy` / `items` | Still primitive — Lightwell config on one Dropdown |

---

## Extract trace — Beacon ExportMenu → `LwMenu` (primitive)

**Problem:** `Pages/Lightwell/Beacon/components/ExportMenu.tsx` mixed (1) PF
Dropdown / MenuToggle / busy lock chrome with (2) Beacon fetch, PDF chrome,
CSV/JSON, notifications.

**Tier — why primitive, not assembly:**

| # | Criterion | `LwMenu` |
| - | --------- | -------- |
| A | Single unit | One host: PF `Dropdown` |
| B | Not a special composition | Standard toggle + menu presentation |
| C | PF-shaped | Same job as PatternFly Dropdown |

Lightwell-owned props (`label`, `isBusy`, `items`, …) **configure** that base unit.
Kit invention does not promote to assembly. Assembly would be multi-region chrome
or composing other `Lw*` (e.g. a future `LwExportMenu` that wraps `LwMenu`).

**CHECK FIRST:**

| Question | Answer |
| -------- | ------ |
| Does a harness exist? | No `LwMenu` yet — Dropdown tax paid in the page |
| What is reusable? | Open/close, toggle, items, `isBusy` lock + spinner |
| What stays domain? | `getVulnerabilities`, `buildBeaconPdfPayload`, filenames, notify |
| Promote `LwExportMenu` now? | No — one consumer; middle layer would be empty ceremony |

**Stack after extract (kit ready; domain rewire optional):**

```
Beacon ExportMenu (domain)     ← may still own PF Dropdown until a migration pass
        ↓ (when rewired) label, isBusy, items[{ id, children, onSelect }]
LwMenu (primitive)             ← PF Dropdown + Lightwell config once
        ↓
PF Dropdown / MenuToggle / DropdownList
```

Do **not** rewire page-specific Beacon shells (`ExportMenu`, `SlaInfoPopover`) in the
same pass as landing the primitive — leave pre-existing domain files untouched;
call sites migrate later.

**Return-as-spec (domain shell):**

```tsx
return (
  <LwMenu
    label="Export"
    busyLabel="Exporting"
    isBusy={isExporting}
    isDisabled={!customerId}
    toggleVariant="secondary"
    items={[
      { id: 'csv', children: 'Export as CSV', onSelect: () => void handleExport('csv') },
      { id: 'json', children: 'Export as JSON', onSelect: () => void handleExport('json') },
      { id: 'pdf', children: 'Export as PDF', onSelect: () => void handleExport('pdf') },
    ]}
  />
);
```

**Interior cascade on `LwMenu`:** `children` passthrough wins; else `items`
build; else empty menu shell. Explicit PF `toggle` wins over harness-built
toggle from `label` / busy props.

**Do not kit-ify:** `fetchAllFilteredVulnerabilities`, PDF payload builders, or
chrome `requestPdf` — that fails promotion (domain, not base-unit config).

**When to add `LwExportMenu`:** a second product surface needs the same Export
busy/format UX defaults — that assembly would **consume** primitive `LwMenu`.
Until then, domain configures `LwMenu` directly.

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
