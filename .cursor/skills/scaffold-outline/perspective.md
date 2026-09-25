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
| **Primitive** | Base unit — one configured PF host | `components/primitives/` | `LwButton`, `LwLabel`, `LwBrand`, `LwBadge` |
| **Assembly** | Structured / movable slots; **uses primitives** | `components/assemblies/` | `LwPageHeader`, `LwPageHero`, `LwCard`, `LwDataView` |

**Promotion rule:** a primitive becomes an assembly when it owns a **slot contract**
(title / description / actions / …), content that rearranges, and/or begins composing
other `Lw*` units. Example: `LwCard` starts as a primitive; grows a header/body/actions
slot grammar → promotes to assembly.

**Domain wiring** (Beacon table, column catalogs, pipeline views) is not a kit tier.
It stays with the product until it earns extraction. Never call domain code an "assembly"
in kit paths.

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
(`isGlass`, variant, title-stack utility classes that merge as props).
Do not put tenant identity in `components.config.ts`.

**No YAML.** Prop defaults already live in TS; a YAML file would need a build step and
would fork the cascade.

### Presentational track (CSS)

| File | Role |
| ---- | ---- |
| `src/kit/components/components.config.css` | Domain presentational defaults — generic padding, font-size, font-weight, shared spacers |
| `src/kit/components/assemblies/page/page.config.css` | Page-family notes — header mirrors Hero padding defaults (do not override Hero) |
| Co-located `*.css` next to each `Lw*` | Unit-specific rules; prefer tokens from the files above |

Presentational values (padding, font-size, font-weight, spacers) belong in **CSS**,
not in `components.config.ts`. Use CSS custom properties so page chrome and body can
share one spacer scale without prop plumbing.

```
components.config.css          ← Lightwell domain presentational baseline
  └── assemblies/page/page.config.css   ← page-family overrides of that baseline
        └── page-header.css / page-hero.css   ← unit rules only when needed
```

`page.config.css` is the page-family config surface — **CSS, not YAML**. Same idea as
`components.config.ts`, but for paint and space.

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

**Rule:** one job per assembly. Split when a unit starts owning two visual contracts
(e.g. plain page chrome **and** PF Hero). That is how God components form — refuse them.

---

## Page family — header vs hero (anti-God)

`page-header` does **not** exist in PatternFly. Kit invents it. `Hero` does exist —
kit harnesses it as `page-hero`. They are **siblings**, not one assembly with a mode flag.

```
assemblies/
  page/
    page.config.css          # page spacers / type (presentational config)
    page-header/             # kit invention — plain chrome
      page-header.tsx
      page-header.css
      page-header.test.tsx
    page-hero/               # PF Hero harness
      page-hero.tsx
      page-hero.css
      page-hero.test.tsx
```

| | `LwPageHeader` | `LwPageHero` |
| - | -------------- | ------------ |
| **Job** | Plain page chrome | Interactive / Hero surface (PF `Hero`) |
| **Host** | Layout host that earns its place (`Flex` / `header`) | `Hero` root — Rule 0, no extra wrap |
| **Styling** | Plain; **padding mirrors PF Hero defaults** (`spacer--3xl`) | Hero surface; **keep PF padding defaults** — do not override |
| **PF** | None (kit invention) | Passthrough `HeroProps`; logic wrap |

**Sibling choice:** pages pick one — header **or** hero. Do not nest Hero inside Header.
Do not grow a `variant="hero"` on Header. Hero = interactive page chrome; header = plain.

**Shared slot grammar:** both own the same slots (`title` / `description` / `actions`)
and the same children-vs-slots cascade. Extract the title stack once if it starts to
fork.

**Padding contract:** `LwPageHero` leaves PF Hero padding alone. `LwPageHeader` uses the
same values (`spacer--3xl`) so titles do not jump when navigating hero ↔ header routes.

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

Tree root = PatternFly host (or the kit host when PF has no equivalent — e.g. `LwPageHeader`).
`className` / passthrough args apply **on that host**.
PF may own internal structure (e.g. `Hero` → `__body`); that is not a kit wrapper.

Canonical shapes:

- `LwPageHero` → `<Hero {...merged}>…slots…</Hero>`
- `LwPageHeader` → layout host with shared page padding; same slots; no Hero

Flex/grid format **direct children** — extra `div`s re-parent content and break
`flex`, `gap`, sticky, and `overflow`. Each node costs layout, paint, a11y, and memory.

Rule 0 applies at both primitive and assembly tiers.

---

## Same pattern on every surface

| Surface | Harness (once) | Consumers configure |
| ------- | -------------- | ------------------- |
| **Prop defaults** | `components.config.ts` | passthrough on `Lw*` |
| **Presentational defaults** | `components.config.css` → `page.config.css` | tokens / unit CSS |
| **Primitive** | `LwLabel`, `LwButton`, … | props / semantic names |
| **Assembly** | `LwPageHeader`, `LwPageHero`, `LwCard`, … | slots or children |
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
3. Three-tier kit — primitive (base unit) → assembly (slots; uses primitives) → page/domain.
4. Config cascade — TS for props; CSS for presentational. No YAML. Page family uses `page.config.css`.
5. Logic passthrough — children compose; slot args build; one cascade per assembly.
6. Split page-header vs page-hero — siblings, shared slots, no God component.
7. Domain wiring is not a kit tier — stays with the product until extracted.

Operate from this perspective.
