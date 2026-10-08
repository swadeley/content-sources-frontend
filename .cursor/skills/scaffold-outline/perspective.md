# Perspective — operate from centralized capability

**Read this first.** [SKILL.md](SKILL.md) is the operational checklist; this document
is the lens. Kit home: `src/kit` (see [tenant-ui-config.yaml](../tenant-ui-config.yaml)).

---

## One principle, two scales

**The return is the spec.** Structure visible in JSX; data in slots above.

**Code efficiency** = capability **centralized** (one harness, one config, one integration)
and **configured** at call sites — not reimplemented per page.

---

## Three-tier kit

`components/` is the **domain**. Within it, two structural tiers:

| Tier | What it is | Path | Examples |
| ---- | ---------- | ---- | -------- |
| **Primitive** | Base unit — one configured PF host | `components/primitives/` | `LwButton`, `LwCard`, `LwMenu`, `LwPopover`, `LwTooltip`, `LwEmptyState`, `LwSkeleton` |
| **Assembly** | Structured / movable multi-region slots; **uses primitives** | `components/assemblies/` | `LwPageHeader`, `LwButtonGroup`, `LwDataView`, metrics family (`LwMetricsStepper`, `LwMetricsCount`, `LwStatItem`, …) |

**Assembly docs:** new assemblies require family/unit `ROADMAP.md` + unit `README.md`
**before** implementation code. Family and unit roadmaps must not overlap. See
[SKILL.md § Assembly docs](SKILL.md#assembly-docs-required-before-code).

**Primitive test (all three):**

| # | Criterion |
| - | --------- |
| A | **Single unit** — one PF host as the tree root |
| B | **Not a special composition** — standard presentation of that PF control |
| C | **PF-shaped** — same job PatternFly already names (Button, Dropdown, Label, …) |

Lightwell-owned props on that host (`label` / `isBusy` / `items` / `fieldLabel` on
`LwMenu`, future `intent` on `LwButton`) are **configuration of the base unit**. They do
**not** promote to assembly. Kit invention ≠ assembly. Menu toggle + menu are one
primitive (`LwMenu`) — toggles do not ship alone in the wild. Secondary PF pieces
required by a host slot (MenuToggle via Dropdown `toggle`) stay inside that harness;
pure PF knobs use a props bag (`toggleProps`), not renamed owned twins.

**Promotion rule:** a primitive becomes an assembly when it owns a **multi-region
slot contract** (title / description / actions / … that rearrange chrome), and/or
begins **composing other `Lw*` units**. Example: a future composed status card that
nests metrics units + `LwMenu` inside `LwCard` would be an assembly. `LwCard` /
`LwMenu` / `LwPopover` stay primitive: one PF host each, Lightwell props map onto
that host. Metrics value cells (`LwStatItem`, `LwMetricsCount`) live under
`assemblies/metrics/` — metric concern, not base PF hosts.

**Layout assemblies** (`LwButtonGroup`): children-only arrangement. Call site passes
N controls; the assembly must not hard-code Beacon (or any product) slots.

**Hidden CSS namespace:** `KitCssScopePlugin` wraps `src/kit/**` in
`html.lightwell-v1-theme`. Authors write as if already inside that block — never
re-declare the theme class (double-nest → rules miss). Details: [SKILL.md](SKILL.md#hidden-theme-namespace-kitcssscopeplugin).

**Domain wiring** (Beacon table, column catalogs, pipeline views) is not a kit tier.
It stays with the product until it earns extraction. Never call domain code an "assembly"
in kit paths.

**Chrome vs domain:** Lightwell surfaces compose **kit roots** for PF hosts. Domain may
own fetch, copy, and item builders — not product-named chrome shells (`SlaInfoPopover`,
`lightwell-help-btn`). Replace **usages** on the page first; leave dead domain files
**untouched** until a [dissolution sweep](examples/dissolution-map.md) — do not edit or
mass-delete them in the migrate PR. Icon-help is centralized: `LwTooltip` defaults its
trigger to `LwButton` + PF `isCircle`; richer help stays `LwPopover` + circle `LwButton`
at the call site. `EmptyState` / `Skeleton` are **root-only** kit hosts — subregions stay
call-site composition until a second surface earns a kit job.

Stack:

```
lightwell.config.ts
  → components.config.ts (+ components.config.css)
    → assemblies/page/page.config.css   ← page-family presentational defaults
      → primitives / assemblies → page / domain
```

---

## Config cascade

Prop defaults and presentational defaults travel on **parallel tracks**. Do not collapse
them into one format.

### Prop / behavior track (TypeScript)

| File | Role |
| ---- | ---- |
| `src/kit/lightwell.config.ts` | Tenant root — brand identity, `cssPrefix`, `exportPrefix`, palette intent |
| `src/kit/components/components.config.ts` | Domain config — prop defaults for primitives + assemblies; `mergeComponentProps`; `mergeClassNames` |
| `Lw*` root | Call-site props win; `className` / `style` merge via `mergeComponentProps` |

Add to `lightwell.config.ts` when a value must be shared across domains (brand tokens, palette).
Add to `components.config.ts` when a value is component/assembly-specific **prop** default
(`isGlass`, variant). Do not put presentational spacing in TS via utility class strings.
Do not put tenant identity in `components.config.ts`.

**No YAML.** Prop defaults already live in TS; a YAML file would need a build step and
would fork the cascade.

### Presentational track (CSS)

| File | Role |
| ---- | ---- |
| `src/kit/components/components.config.css` | Domain presentational defaults — title type, field label, shared control gaps |
| `src/kit/components/assemblies/page/page.config.css` | Page-family tokens — page padding (Hero mirror), chrome-slot gap, page-title aliases |
| Co-located `*.css` next to each `Lw*` | Unit-specific rules; **consume** tokens from the files above — do not re-declare |

Presentational values (padding, font-size, font-weight, spacers) belong in **CSS**,
not in `components.config.ts`. Use CSS custom properties so page chrome and body can
share one spacer scale without prop plumbing.

**Utility classes are a last resort.** Do not casually apply PatternFly utilities
(`@patternfly/react-styles` spacing maps, `pf-v6-u-*`) for kit layout. Prefer
co-located unit CSS and global spacer tokens. Reach for a utility only after
CHECK FIRST proves no host token or kit rule fits — and only for a true one-off.

```
components.config.css          ← Lightwell domain presentational baseline
  └── assemblies/page/page.config.css   ← page-family overrides of that baseline
        └── page-header.css   ← unit rules only when needed
```

`page.config.css` is the page-family config surface — **CSS, not YAML**. Same idea as
`components.config.ts`, but for paint and space.

**PF breakpoints in kit CSS:** PatternFly defines them as SCSS
(`$pf-v6-global--breakpoint--*`). Kit is plain CSS — `@media` cannot use those
vars or `--pf-t--global--breakpoint--*`. Copy the **rem** value. The lookup map
lives as a comment in
[components.config.css](../../../src/kit/components/components.config.css)
(header). Do not re-look up PF SCSS per file; do not use `px` (`1200px` is not
`75rem` if the root font size is not 16px).

### Base support, not exotic selectors

Kit unit CSS declares **base support** — what the surface is (padding, flex column,
gap, align). It is not exotic: easy to read, easy to debug.

An **elaborate, exotic approach** is a very bad idea and an anti-pattern for many
reasons:

- It's fragile and contextual
- It's unnecessary
- It's overly-complex
- It's noise
- It confuses concepts

Exotic means encoding layout *situations* in the selector — deep `:has()`,
`:nth-child()`, `:first-child` / `:not(:only-child)` stacks that infer intent from
DOM order. That muddies “what this component is” with “what happens when siblings
exist.” Prefer an explicit class or prop when a variant earns a name; do not hide
policy in combinators.

See [SKILL.md § Kit CSS](SKILL.md#kit-css-co-located) and
[examples.md § Base support CSS](examples.md#base-support-css-not-exotic-selectors).

---

## Logic passthrough model

Every `Lw*` is a **logic harness**, not a DOM wrapper.

| Mode | When | What happens |
| ---- | ---- | ------------ |
| **Passthrough** | Caller passes `children` / `content` (or equivalent) | Interior is the caller's tree; harness only merges defaults onto the host |
| **Slot build** | Owned args set (`title`, `description`, `actions`, `has*`, …); no full interior | Harness builds the known interior from args |
| **Minimal shell** | Neither | Empty / empty-state interior per assembly contract |

Same cascade as `LwCard`: children win for full composition; slot args build when the
caller wants the kit outline. Do not invent a third mode per assembly.

**Rule:** one job per assembly. A surface pre-config on the same composition grammar
(`LwPageHeader` `hero`) is not a second job. Fork when a unit owns two unrelated
contracts — that is how God components form; refuse them.

---

## Page family — one header; hero is surface

`page-header` does **not** exist in PatternFly. Kit invents **one** `LwPageHeader`.
PF `Hero` is the host when `hero` is set — surface pre-config, not a second assembly.

```
assemblies/
  page/
    page.config.css          # page spacers / type (presentational config)
    page-header/             # one assembly — plain or hero surface
      page-header.tsx
      page-header.css
      page-header.test.tsx
    page-chrome-slots.tsx    # PageTitleStack + PageChromeSlots / PageChromeSlot / PageChromeSlotFooter (exported)
```

| | Plain | Hero (`hero`) |
| - | ----- | ------------- |
| **Host** | `Flex` | PF `Hero` |
| **Classes** | `lw-c-page-header` | `lw-c-page-header` + `lw-c-page-hero` |
| **Composition** | `children` **or** `title` / `description` / `actions` | **identical** |

**Padding:** hero leaves PF Hero padding alone; plain mirrors via `--lw-space--page-*`.

Do not invent region props (`hasAside`, `hasChromeRows`). Call sites compose
`PageChromeSlots` / `PageChromeSlot` / `PageChromeSlotFooter`. Do not fork a second page-chrome assembly for Hero.

---

## Rule 0 — nodes must earn their place

**Wrappers add a node without adding a job.**

| Term | Meaning |
| ---- | ------- |
| **Expedient** | Editor speed over document cost |
| **Inert** | In the tree; no semantic or layout job |
| **Ceremonial** | Structure for code readers, not the UI contract |

**Passthrough harnesses (`Lw*`)** are not DOM wrappers.

| | Meaning |
| - | ------- |
| **Logic wrap** | Function resolves defaults, maps domain → PF props, hydrates owned slots as children |
| **DOM wrap** | Extra host around the PF component — refused |

Tree root = PatternFly host (or the kit host when PF has no equivalent — e.g. plain
`LwPageHeader` on `Flex`). `className` / passthrough args apply **on that host**.
PF may own internal structure (e.g. `Hero` → `__body`); that is not a kit wrapper.

Canonical shapes:

- `LwPageHeader` → `<Flex className="lw-c-page-header">…</Flex>`
- `LwPageHeader hero` → `<Hero className="lw-c-page-header lw-c-page-hero">…</Hero>`

Flex/grid format **direct children** — extra `div`s re-parent content and break
`flex`, `gap`, sticky, and `overflow`. Each node costs layout, paint, a11y, and memory.

**Intrinsic size:** do not set `width: 100%` or `height: 100%` unless stretch is an
**explicit** job (fill a known containing block). Prefer natural block flow, flex/grid
growth, or `min-width` tokens. Forced width is the quieter twin of forced height —
less catastrophic, still layout debt.

Rule 0 applies at both primitive and assembly tiers.

---

## Same pattern on every surface

| Surface | Harness (once) | Consumers configure |
| ------- | -------------- | ------------------- |
| **Prop defaults** | `components.config.ts` | passthrough on `Lw*` |
| **Presentational defaults** | `components.config.css` → `page.config.css` | tokens / unit CSS |
| **Primitive** | `LwButton`, `LwCard`, `LwMenu`, `LwPopover`, `LwTooltip`, `LwEmptyState`, `LwSkeleton`, … | props / Lightwell-owned config on one host |
| **Assembly** | `LwPageHeader`, metrics (`LwMetricsStepper`, `LwMetricsCount`, `LwStatItem`, …), … | multi-region slots or children |
| **Page / domain** | async outline + domain wiring | assembly slots + product data |

**One source → many consumers. Find the harness; do not fork.**

> **Data layer note:** `api-matrix.ts` (query keys, mock gates, collect) is a
> separate architectural effort, not in scope for the current kit work (component
> reusability and consistency). Reference it separately when that effort begins.

---

## Cross-cutting

`ouiaId`, error boundaries, telemetry: **once in the harness** — inherited by every
consumer. Extend `mergeComponentProps` on `Lw*` roots.

---

## Layer stack

```
lightwell.config.ts
  → components.config.ts + components.config.css
    → assemblies/page/page.config.css
      → primitives / assemblies → page / domain
```

**Name the resource, not the consumer.**

---

## Summary

1. Return is the spec.
2. Rule 0 — refuse expedient/inert/ceremonial DOM; logic wrap ≠ DOM wrap.
3. Three-tier kit — primitive (A/B/C: one PF host + Lightwell config) → assembly
   (multi-region slots; uses primitives) → page/domain. Kit invention ≠ assembly.
4. Config cascade — TS for props; CSS for presentational. No YAML. Page family uses `page.config.css`.
5. Logic passthrough — children compose; slot args build; one cascade per assembly.
6. One page header — hero is surface pre-config (`hero`), same composition grammar.
7. Domain wiring is not a kit tier — stays with the product until extracted.

Operate from this perspective.
