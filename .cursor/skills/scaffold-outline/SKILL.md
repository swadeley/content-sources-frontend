---
name: scaffold-outline
description: >-
  Operating perspective for Lightwell UI — return-as-spec, Rule 0 (nodes earn
  their place), config cascade (TS props + CSS presentational), logic
  passthrough, page-header vs page-hero (anti-God), three-tier kit
  (primitive → assembly → page/domain). Use when authoring or refactoring
  JSX, pages, kit assemblies, Lw* primitives, data-view, naming, upgrades,
  semantic maps (severity→color), or when the user mentions scaffold, outline,
  code efficiency, passthrough, page.config, or centralized capability. Replaces
  visible-scaffolding + outline-first-ui.
---

# Scaffold & Outline

This skill is a **perspective** — how to operate, not only what to check.

| Read first | Purpose |
| ---------- | ------- |
| **[perspective.md](perspective.md)** | **Why** — Rule 0, three-tier kit, config cascade, harness vs wrapper |
| This file | **How** — process, CHECK FIRST, authoring, checklist |
| [examples.md](examples.md) | **Traces** — Demo stack, anti-patterns, refactor steps |

**Tenant config:** [tenant-ui-config.yaml](../tenant-ui-config.yaml) — if
`exportPrefix` is unset, stop and define it before shared kit work.

**Repo contract:** [ARCHITECTURE.md § Lightwell components](../../../ARCHITECTURE.md#lightwell-components).

---

## Perspective (summary)

**One principle:** the return is the spec. Structure visible in JSX; data in slots
above.

**Code efficiency:** capability **centralized**, call sites **configure** — not
reimplemented per page. Pay PF integration once in `Lw*` + `components.config.ts`;
pages pass domain names (`payAttention`), not PF tokens (`color="orange"`).

**Three-tier kit** — see [perspective.md](perspective.md#three-tier-kit):

| Tier | Role | Path |
| ---- | ---- | ---- |
| **Primitive** | Base unit — one configured PF host | `src/kit/components/primitives/` |
| **Assembly** | Structured slots; **uses primitives** | `src/kit/components/assemblies/` |
| **Page / domain** | Product outline + domain wiring | app pages; stays with product until extracted |

**Config cascade** — see [perspective.md](perspective.md#config-cascade):

```
lightwell.config.ts                    ← tenant root (brand, cssPrefix, palette)
  └── components.config.ts             ← prop / behavior defaults (mergeComponentProps)
  └── components.config.css            ← domain presentational baseline (padding, type)
        └── assemblies/page/page.config.css   ← page-family presentational overrides
              └── Lw* roots            ← merge props; co-located unit CSS
```

**TS = props. CSS = paint/space. No YAML.** Presentational page defaults
(padding, font-size, font-weight, spacers) live in `page.config.css`, not in
`components.config.ts`.

**Rule 0:** wrappers add a node without a job — refused. Logic wrap (`Lw*` function configures
and returns the host) is not a DOM wrap (extra host around PF). `className` / passthrough
apply on the host root, not on kit chrome. Full treatment: [perspective.md](perspective.md#rule-0--nodes-must-earn-their-place).

**Anti-God:** one job per assembly. Page chrome → `LwPageHeader`; Hero surface →
`LwPageHero`. Shared slots + shared `page.config.css` spacers. Sibling choice —
never `variant="hero"` on Header. See [perspective.md](perspective.md#page-family--header-vs-hero-anti-god).

---

## Before you write — questions

1. Does this **node** earn its place? (Rule 0)
2. Does **PF** already own this? (subtract)
3. **Primitive or assembly?** (base unit vs slot contract)
4. Does a **harness** exist? (configure `Lw*`; do not copy the PF tree)
5. **Domain name or PF token?** (map once in harness)
6. Is this a **second job** on an existing assembly? (split — anti-God)
7. **Prop default or presentational?** (TS config vs CSS config)
8. Is the **return** still the spec? (no hidden sections)

---

## Logic passthrough model (`Lw*`)

Same shape for primitives and assemblies — logic wrap; host as tree root.

**Composition cascade** (one grammar; do not invent per-assembly dialects):

| Priority | Condition | Behavior |
| -------- | --------- | -------- |
| 1 | `children` / `content` provided | **Passthrough** — caller owns interior |
| 2 | Owned slot args (`title`, `has*`, …) | **Slot build** — harness builds interior |
| 3 | Neither | **Minimal shell** — empty / empty-state per contract |

```tsx
// ✅ Page hero — PF Hero host; slots or children
export function LwPageHero({ title, description, actions, children, className, ...rest }: Props) {
  const heroProps = mergeComponentProps(defaults, {
    ...rest,
    className: mergeClassNames('lw-c-page-hero', className),
  });
  if (children) {
    return <Hero {...heroProps}>{children}</Hero>;
  }
  return <Hero {...heroProps}>{/* title / description / actions slots */}</Hero>;
}

// ✅ Page header — kit invention; plain host; same slots; padding from page.config.css
export function LwPageHeader({ title, description, actions, className, ...rest }: Props) {
  const props = mergeComponentProps(defaults, {
    ...rest,
    className: mergeClassNames('lw-c-page-header', className),
  });
  return <Flex {...props}>{/* same slot grammar; no Hero */}</Flex>;
}

// ❌ DOM wrap — extra host around PF; className lands on the wrong node
export function LwPageHero(props) {
  return (
    <div className="lw-c-page-hero">
      <Hero {...props} />
    </div>
  );
}

// ❌ God component — two visual contracts in one assembly
export function LwPageHeader({ variant, ... }) {
  return variant === 'hero' ? <Hero /> : <Flex />;
}
```

| Allowed | Refused |
| ------- | ------- |
| Resolve defaults / map domain → PF props | `<div>` / extra layout host around the PF root |
| Owned slots as **children** of the host | Re-parenting the host under kit chrome |
| Assembly using kit **primitives** in slots | Ceremonial wrappers "for readability" |
| Kit `className` merged onto the host root | Kit styles that assume a wrapper between page and PF |
| Sibling assemblies for distinct jobs | Mode flags that merge two PF/visual contracts |

Kit root: `src/kit/`. Pages pull; do not rewrite page-local copies in place.

---

## Rule 0 — mechanisms

| Kind | DOM | Verdict |
| ---- | --- | ------- |
| Expedient / inert / ceremonial | +1 node | Refuse |
| Primitive / assembly harness | Same as PF root (logic only) | Write once; callers configure |
| Page / domain | Uses kit | Props and outline only |

**Logic wrap ≠ DOM wrap.** The `Lw*` function may exist; an extra host around the
PF component must not.

**Flex / grid:** wrappers re-parent direct children — wrong flex item, `gap`,
sticky, and `overflow` context.

**Harness once:** one integration per surface type — primitives for base units,
assemblies for slot contracts. Upgrades and semantic maps live in the harness.

---

## Model

| Layer | What it is | Lightwell home |
| ----- | ---------- | -------------- |
| **Scaffolding** | Sections, headings, layout, conditionals, ARIA | Visible in the JSX return |
| **Hydration** | Flags, copy, API data, domain row builders | Above the return; injected as slots |
| **Primitive** | Base PF harness + defaults + passthrough | `components/primitives/` |
| **Assembly** | Slot contract; uses primitives; logic passthrough | `components/assemblies/` |
| **Page family** | Shared page chrome + presentational config | `assemblies/page/` (`page.config.css`, header, hero) |
| **Page / domain** | Async outline + product wiring | app pages / domain wiring |

> **Data layer** (`api-matrix.ts`, query keys, mock gates) is a **separate effort** —
> not in scope for the current kit work (component reusability and consistency).
> Do not model it here until that effort begins.

**Scaffolding is the spec. Hydration fills slots. Do not invert.**

| Layer owns | Does not own |
| ---------- | ------------ |
| Primitive | single PF host, maps, defaults | fetch, multi-slot chrome |
| Assembly | slot grammar, layout of slots, primitives inside | route params, direct `services/*` |
| Page / domain | state, async branches, catalogs, filter UI | inline PF config |

**No `features/` layer.** Domain wiring is not an assembly in kit paths.

---

## Process

```
propose → dry-run → review → consensus → change → validate
```

| Step | Rule |
| ---- | ---- |
| Propose / dry-run | No edits until consensus |
| Change | `git mv` for renames / rehomes; status should show `renamed:` |
| Validate | build + tests + smoke on affected routes |

---

## CHECK FIRST

Before a new file, wrapper, hook, or DTO:

1. **Search** — primitive, assembly, PF, existing helper?
2. **Tier** — base unit → `primitives/`; slot contract → `assemblies/`.
3. **Extend** — props, config, defaults. New file = last resort.
4. **Parent, not wrapper** — `ref` / `className` / `style` on existing host.
5. **Subtract PF** — app-only fields on types.
6. **Relevance** — one sentence; ≥2 consumers or delete.

| Impulse | Move |
| ------- | ---- |
| Loading UI | shared status assembly; conditional in return |
| New table shell | extend kit assembly `LwDataView` |
| New columns | domain catalog + keyed rows; shell owns `manageColumns` |
| `color="orange"` in page | `severity` on `LwLabel`; map in primitive harness |
| Tenant token / brand value | `lightwell.config.ts` |
| Component/assembly **prop** default | `components/components.config.ts` |
| Domain **presentational** default (padding, type) | `components/components.config.css` |
| Page-family spacer / type | `assemblies/page/page.config.css` |
| Header needs Hero look | use `LwPageHero` — do not add `variant` to Header |
| Assembly growing a second visual job | split into sibling assemblies (anti-God) |

---

## Authoring

### Return-as-spec

Single return. Flags and hydration **above**; structure **below**.

```tsx
return (
  <>
    <LwPageHeader title={staticContent.demoProof.titleText} … />
    {/* or LwPageHero when the page needs PF Hero surface */}
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
returns; click-time structure injection.

### Hydration slots

| Allowed | Forbidden |
| ------- | --------- |
| Flags: `isLoading`, `isEmpty`, `isError` | Whole-section variables |
| Single widgets: `introBody` | `introBlocks` from parsers |
| `error` in visible branch | Scaffold `className` constants (unless ≥2 uses) |

---

## Naming & placement

- Export: `{exportPrefix}{Type}` from tenant config (e.g. `LwPageHeader`, `LwPageHero`)
- Type-first kit files: `page-header/page-header.tsx`
- Page family under `assemblies/page/` — shared `page.config.css` + sibling units
- Name the thing — not the first consumer
- Primitives → `components/primitives/`; assemblies → `components/assemblies/`
- No `-panel` on content files
- Domain page entry: ask singular name (**default `entry`**)

### Page family layout

```
src/kit/components/assemblies/page/
  page.config.css       # presentational config (spacers, type) — not YAML
  page-header/          # kit invention — plain chrome
  page-hero/            # PF Hero harness — passthrough + slots
```

---

## Lw\* & PatternFly

| Rule | Detail |
| ---- | ------ |
| Typing | `OwnedProps & Omit<UpstreamHostProps, 'children'>` (or Partial where optional) |
| Prop defaults | `components.config.ts` → `mergeComponentProps` |
| Presentational defaults | `components.config.css` → `page.config.css` → unit `.css` |
| Kit CSS scope | Custom properties via `& { --token: … }` under the scope wrapper — never bare props or `:root` (both fail under KitCssScopePlugin) |
| Spread | Lw-owned props destructured; `...rest` on host |
| className / style | Merge onto the **host root** — never onto a wrapping element |
| Composition | children passthrough **or** slot build — see logic passthrough model |

**Logic wrap ≠ DOM wrap.** `LwFoo` configures and returns `<Foo {...}>`. May resolve
defaults, map domain props, hydrate children. Must **not** insert an extra host around the PF root.
When PF has no equivalent (`LwPageHeader`), the kit host still must earn its place (layout job).

### Kit CSS (co-located)

| Rule | Detail |
| ---- | ------ |
| Format | Plain `.css` — **not** SCSS for kit surfaces yet; **not** YAML for defaults |
| Layers | Not using CSS cascade layers yet — defer until kit hardens |
| Prefix | `lw-c-*` on the host root |
| Config vs unit | `*.config.css` = shared defaults/tokens; co-located unit CSS = unit-only rules |
| Host first | Prefer PF host when it owns the job (`Hero` → `LwPageHero`); kit invents only when PF has no equivalent (`LwPageHeader`) |
| Theme | Use host's light/dark API when present (`Hero` → `backgroundSrcLight` / `backgroundSrcDark`); otherwise `:where(.pf-v6-theme-dark)` |
| Assets | Under `src/kit/assets/`; optional props enable kit defaults; call-site PF props win |

Example — sibling page assemblies:

```tsx
<LwPageHeader title="…" description="…" actions={…} />
<LwPageHero title="…" backgroundImage />
<LwPageHero title="…" backgroundImage={{ light: '…', dark: '…' }} />
<LwPageHero>{/* full composition — caller owns interior */}</LwPageHero>
```

---

## Anti-patterns → fixes

| Smell | Fix |
| ----- | --- |
| Two returns, same scaffold | One return + conditionals |
| `{tailContent}` | Inline in return |
| Extra `div` for ref/class | Existing PF parent / host |
| `Lw*` wraps PF in kit chrome | Logic only; className on host root |
| Slot assembly in `primitives/` | Rehome to `assemblies/` |
| Base unit in `assemblies/` | Rehome to `primitives/` |
| Domain wiring labeled "assembly" in kit | Keep with product until extracted |
| Tenant token in `components.config.ts` | Move to `lightwell.config.ts` |
| Padding / font-size in `components.config.ts` | Move to `components.config.css` or `page.config.css` |
| `page.config.yaml` for spacers | Use `page.config.css` — presentational track |
| Header + Hero in one assembly / `variant` | Split `LwPageHeader` / `LwPageHero` |
| PF tokens in pages | Domain name + harness map |
| Demo inlines PF chrome | Use same stack as prod |
| Kit styles in global SCSS / layers early | Co-located `.css` on the `Lw*`; layers later |
| Flex + custom bg when PF Hero fits | `LwPageHero` + `backgroundSrcLight` / `Dark` |
| Rewrite page-local unit in place | New kit under `src/kit`; page pulls |
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
- [ ] Correct tier: primitive vs assembly vs page/domain
- [ ] Config cascade: tenant → `lightwell.config.ts`; prop default → `components.config.ts`; presentational → `components.config.css` / `page.config.css`
- [ ] Anti-God: one visual job per assembly; header vs hero are siblings
- [ ] Logic passthrough: children compose **or** slot args build
- [ ] CHECK FIRST: extended or proved absent
- [ ] Return readable without sibling files
- [ ] Hydration = flags + slots only
- [ ] Passthrough harness: logic wrap only; `className` on host root
- [ ] PF subtract; kit under `src/kit`; pages pull
- [ ] Smoke on touched routes

---

## Documentation map

| Doc | Role |
| --- | ---- |
| [perspective.md](perspective.md) | Operating lens (canonical **why**) |
| [examples.md](examples.md) | Code traces |
| [ARCHITECTURE.md § Lightwell](../../../ARCHITECTURE.md#lightwell-components) | Repo contract |
| [src/kit/README.md](../../../src/kit/README.md) | Kit structure + cascade |
| [src/kit/components/primitives](../../../src/kit/components/primitives) | Kit primitives |
| [src/kit/components/assemblies](../../../src/kit/components/assemblies) | Kit assemblies |
| [assemblies/page/page.config.css](../../../src/kit/components/assemblies/page/page.config.css) | Page-family presentational config |
