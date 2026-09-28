# Lightwell kit (`src/kit`)

Reusable `Lw*` units for the Lightwell app. Existing pages import from here; do not
rewrite page-local copies in place. When migration is complete, contents dissolve
into `src/` via `git mv`.

## Structure

```
src/kit/
  assets/                             Shared kit artwork (logos, backgrounds)
  components/
    primitives/                       Base units — one PF host + Lightwell config
                                      (LwButton, LwCard, LwMenu, LwPopover, LwStatItem, …)
    assemblies/                       Multi-region slots; use primitives
      page/                           Page-family assemblies (anti-God siblings)
        page.config.css               Page presentational defaults (spacers, type)
        page-header/                  Kit invention — plain chrome
        page-hero/                    PF Hero harness — passthrough + slots
      …                               (LwDataView, …)
    components.config.ts              Prop / behavior defaults for both tiers
    components.config.css             Domain presentational baseline
  lightwell.config.ts                 Tenant root config — cascade top
```

## Importing

```ts
// Kit assemblies (barrel)
import { LwPageHeader, LwPageHero } from 'kit/components/assemblies';

// Kit primitives (barrel)
import { LwButton, LwCard, LwMenu, LwPopover, LwStatItem } from 'kit/components/primitives';

// Config utilities
import { mergeComponentProps } from 'kit/components/components.config';
```

## Config cascade

**Prop / behavior (TypeScript):**

```
src/kit/lightwell.config.ts           ← tenant identity (cssPrefix, exportPrefix, brand tokens)
  └── components/components.config.ts ← prop defaults (mergeComponentProps)
        └── Lw* roots                 ← mergeComponentProps; call-site wins; className/style merge
```

**Presentational (CSS) — no YAML:**

```
components/components.config.css      ← domain baseline (generic padding, font-size, …)
  └── assemblies/page/page.config.css ← page-family overrides (header/hero spacers)
        └── unit co-located *.css     ← unit-only rules
```

## Logic passthrough

Each `Lw*` is a logic harness:

1. **children / content** → passthrough (caller owns interior)
2. **owned slot args** → harness builds interior
3. **neither** → minimal shell / empty state

One job per assembly. `LwPageHeader` (plain) and `LwPageHero` (PF Hero) are siblings
with a shared slot grammar — not one God component with a mode flag.

## Tier rules

| Tier          | Building rule                  | Promotion trigger                           |
| ------------- | ------------------------------ | ------------------------------------------- |
| **Primitive** | One PF host, configured once   | Grows a slot contract → promote to assembly |
| **Assembly**  | Slot contract; uses primitives | Kit-level, product-agnostic                 |

**Domain wiring** (Beacon table, column catalogs, pipeline views) stays with the
product until it earns extraction. It is not an assembly in `src/kit/`.

## Dissolution path

When all reusable components are extracted:

```bash
git mv src/kit/components/primitives/* src/components/primitives/
git mv src/kit/components/assemblies/* src/components/assemblies/
git mv src/kit/lightwell.config.ts src/lightwell.config.ts
# update barrel imports; remove src/kit/
```

## Skills

`.cursor/skills/scaffold-outline` — operating perspective, Rule 0, config cascade,
logic passthrough, page-header vs page-hero, naming conventions.
