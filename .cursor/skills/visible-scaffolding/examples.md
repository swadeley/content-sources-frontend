# Visible Scaffolding — Examples

Read [SKILL.md](SKILL.md) first. For authoring practice, see
[scaffold-outline/examples.md](../scaffold-outline/examples.md) for current traces.
Legacy outline-first samples: [outline-first-ui/examples.md](../outline-first-ui/examples.md).

## Bad: structure in variables

```tsx
if (hasReadme) {
  introContent = (
    <div className={INTRO_CLASS}>
      <Title headingLevel="h1">{title}</Title>
      {paragraphs}
    </div>
  );
  tailContent = <ReadmeRenderer html={rest} />;
} else {
  introContent = (
    <div className={INTRO_CLASS}>
      <Content>{fallback}</Content>
      <Title headingLevel="h2">{title}</Title>
    </div>
  );
  tailContent = <HardeningSections />;
}

return (
  <Flex>
    {introContent}
    {imageRefCard}
    {tailContent}
  </Flex>
);
```

Problems: `h1` vs `h2`, title/body order differs, card outside intro in one
mental model, three hidden structure assignments, `INTRO_CLASS` constant hides
scaffold hooks, reviewer cannot audit from return alone.

## Good: scaffold visible, one hydration slot

```tsx
let introBody: React.ReactNode = null;
if (hasReadme) {
  introBody = paragraphs.map((html, i) => (
    <Content key={i} component="p" dangerouslySetInnerHTML={{ __html: html }} />
  ));
} else {
  introBody = <Content>{fallback}</Content>;
}

return (
  <>
    <section aria-labelledby="overview-get-started-title">
      <Title headingLevel="h2" id="overview-get-started-title">
        {title}
      </Title>
      {introBody}
      {imageRefCard}
    </section>
    {hasReadme && rest.trim() ? <ReadmeRenderer html={rest} /> : null}
    {!hasReadme ? <HardeningSections /> : null}
  </>
);
```

The tab shell wraps this in `section.hb-content`; spacing is CSS, not `Flex gap`.

## Bad: tab prose injected by shell

```tsx
// container-detail-content.tsx
const cveHeader = (
  <Flex gap={{ default: "gapMd" }} className="pf-v6-u-mb-md">
    <p>{preamble}<strong>{tag}</strong></p>
    <Button href="/security-feed">Catalog feed</Button>
  </Flex>
);

<ContainerDetailTabPanel panelHeader={cveHeader} … />
```

Problems: CVE copy lives outside `hb-content`, uses one-off `Flex` + margin,
invisible when reading `container-security.tsx`.

## Good: preamble inside section file

```tsx
// container-security.tsx — first children inside hb-content
return (
  <>
    <p>
      {cvePanelCopy.results_preamble}
      <strong>"{tagDisplay}"</strong>{" "}
      <Button variant="link" isInline component="a" href="/security-feed">
        {cvePanelCopy.catalog_feed_link}
      </Button>
    </p>
    <TableToolbar … />
    …
  </>
);
```

## Bad: per-tab Flex column gaps (repeat dialect)

```tsx
// Each tab file — same spacing chrome N times
return (
  <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
    <Title headingLevel="h2">Container details</Title>
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
      <div>
        <Title headingLevel="h3">Provenance</Title>…
      </div>
      <Divider />
      <div>…</div>
    </Flex>
  </Flex>
);
```

## Good: Flex once in a view; shared CSS for repeated tab stacks

```tsx
// layout / body — once, one place (Flex + modifiers is fine scaffolding here)
return (
  <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
    <ContainerSummary />
    <ContainerTabs />
  </Flex>
);

// tab sections — outline only; stack spacing from .hb-content CSS
return (
  <>
    <Title headingLevel="h2">Container details</Title>
    <section>
      <Title headingLevel="h3">Provenance</Title>
      <DescriptionList>…</DescriptionList>
    </section>
    <section>
      <Title headingLevel="h3">Container config</Title>
      <DescriptionList>…</DescriptionList>
    </section>
  </>
);
```

```css
/* app.css — one place to tune repeated tab document spacing */
.pf-v6-c-tab-content__body > .hb-content {
  gap: var(--pf-t--global--spacer--lg);
}
.hb-content > section {
  gap: var(--pf-t--global--spacer--md);
}
```

Flex with modifiers is scaffolding when it happens **once** in that view. The
smell is copying the same Flex stack into every section as a spacing system.

## Process and CHECK FIRST

```
propose → dry-run → review → (repeat) → consensus → change → validate
```

**Definition of done:** slice = validate (including render smoke). Campaign =
no trash left under these models + app works through them. Kit folder moved
while `container-detail-*` shells and wrong-layer CVE remain → **not done**.

**Validate:** `npm run type-check` (+ webpack compile), targeted tests, then
smoke presentation — catalog home, security-feed, container deep-link
(`/?name=nodejs`). Layer moves that look clean in git still fail until aliases
and smoke paths pass.

**Git moves:** `git mv catalog-card/catalog-card.tsx card/card.tsx` then edit —
not Write+Delete (that shows `D` + `??` and drops blame).

**Kit — how different?** Type-first (`toolbar/*`). Landed reshape:
`toolbar.tsx` + `toolbar-table.tsx`; alike tags filters folded as
`layout: "stack"` config — not a fourth file. Search scope → focus.
One card → `card/card.tsx` (no focus suffix until a second peer).

## PF subtract — what’s left?

```ts
// App DTO that looks like a badge — open Label.d.ts before keeping it.
type CatalogEntryBadge = {
  id: string;      // ours — list key
  label: string;   // ours — PF uses children
  color?: …;       // PF LabelProps.color — do not re-list the union
  status?: …;      // PF LabelProps.status
  icon?: …;        // PF LabelProps.icon
};

// After subtract: what’s left is { id, label } + Pick<LabelProps, "color" | "status" | "icon">
// Conclusion: PF has no badge object; we still must not hand-copy its prop unions.
```

```tsx
// Bad — invent parallel capability
// "We need loading in the drawer" → sections/container-detail-loading.tsx
// "We need type→slots" → app-drawer-panel-content.tsx

// Good — CHECK FIRST, extend existing non-destructively
// Loading → hb-content-status + shared status chrome already in app.css / sections
// Drawer variants → mount from app-drawer-panel (or caller); no new router file
```

**Whole surface:** an additive file that “helps” one developer mental model can
degrade drawer chrome, tab outlines, and primitives at once. Prefer one dry-run
across the surface over racing the first rename.

**Root vs patch:** fixing deep link by “enrich then openDrawer again” is a patch.
The root is the **shared drawer contract** (identity → open → body hydrates) that
every content type must obey. Click and URL both use it. Container content
already does; CVE content that gates on a full row is a contract violation — not
a different kind of drawer.

**Alike / different:** alike = one shell, one sync, identity open, hydrate in
body. Different = which keys identify the row, and how the body document loads
data. Never “build a CVE drawer.” Never rebuild proven open/URL/hydrate in a
silo for one content type — restore the shared contract.

## Bad: shell vocabulary / slot router without presentation check

```
app/app-drawer-panel.tsx                    # chrome — still run relevance + UI check
app/app-drawer-panel-content.tsx            # DELETE — destructive when validated
sections/container-details-panel.tsx        # rename — section content
```

**Relevance (panel-content):** Maps every drawer type into `{ header, body }`.  
**Benefit?** None — invents a third `panel` file.  
**Presentation (CVE drawer):** title in `DrawerHead` **and** `h2` in body →
double header. Code-only dry-run called this “correct shell.” That was wrong.

## Good: no content router; panel means shell only after UI check

```
app/app-drawer-panel.tsx                    # drawer chrome (close/resize) if still needed
# (no app-drawer-panel-content.tsx)
sections/container-detail-details.tsx       # tab content — container-detail-{section}
primitives/…                                # ContentStatus / ContentError chrome
```

## Bad: per-tab loading dialect

```tsx
{
  isLoading ? <Spinner size="lg" /> : null;
} // SBOM
<div className="hb-content-status pf-v6-u-py-xl">
  <Spinner size="xl" /> // CVE — different size + padding
</div>;
```

## Good: shared status chrome, visible conditionals

```tsx
return (
  <>
    <Title headingLevel="h2">{title}</Title>
    {error != null && (
      <ContentError title={loadErrorTitle}>{error.message}</ContentError>
    )}
    {isLoading && error == null && (
      <ContentStatus ariaLabel="Loading container details" />
    )}
    {!isLoading && error == null && picked == null && <p>{emptyMessage}</p>}
    {!isLoading && error == null && picked != null && (
      <>{/* provenance / config / env sections */}</>
    )}
  </>
);
```

## Bad: parser owns structure

```tsx
const introBlocks = useMemo(
  () => renderSanitizedTopLevelBlocks(introHtml),
  [introHtml],
);
return <div>{introBlocks}</div>;
```

## Good: parser extracts data, JSX owns structure

```tsx
const paragraphs = parseOverviewIntroParagraphs(introHtml);
return (
  <section>
    <Title headingLevel="h2">{title}</Title>
    {paragraphs.map((html, i) => (
      <Content
        key={i}
        component="p"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ))}
  </section>
);
```

## Bad: comments that only narrate

```tsx
// Renders the provenance section
<section>
  {/* Description list for provenance fields */}
  <DescriptionList>…</DescriptionList>
</section>

function pickArchConfig(details) { /* Picks an arch config */ … }
```

## Good: why, constraint, or planned rehome

```tsx
/*
 * inlineFlex + alignItemsCenter: PF has no vertical-align utility for icon+text links.
 */
<a href={href}>…</a>

// TODO(rehome): pickArchConfig → @lib next to image-details types
// (also duplicated in container-file; section files should not own API shape).
function pickArchConfig(details) { … }

// Landmark id on this section — not on shell hb-content.
<section id="container-detail-cve-reporting">…</section>
```

## Bad: first-consumer coupling in names

```ts
// Badge is a Label DTO — not owned by catalog or card
export type CatalogEntryCardBadge = { id: string; label: string } & Pick<LabelProps, …>;
export function buildCatalogBadges(entry: …): CatalogEntryCardBadge[]

// Kit export became a catalog document
export const HbCard = ({ data }: { data: CatalogEntryCardData }) => (
  <Card>…pull command, FIPS, More tags…</Card>
);

// Usage-shaped kit peer with one consumer
export const HbCardCatalog = … // components/card/card-catalog.tsx
```

## Good: name the thing; page owns composition

```ts
export type Badge = { id: string; label: string } & Pick<LabelProps, "color" | "status" | "icon">;
export function buildBadges(entry: { meta: { fips?: boolean }; cveCount?: number }): Badge[]

// components/card/card.tsx — shell only
export const HbCard = ({ children, onClick, … }) => <Card>…slots…</Card>

// pages/hardened-images/image-card.tsx — configured HbCard for images
export const ImageCard = ({ data }) => (
  <HbCard>
    <CardHeader>…title + badges…</CardHeader>
    <CardBody>…</CardBody>
  </HbCard>
);
```

## Bad: wrapper when the parent already exists

```tsx
<DrawerContentBody className="hb-app-chrome" data-smoke="app-shell">
  <div ref={primaryChromeRef} className="hb-app-chrome__primary">
    <UniversalHeader />
    <Page />
  </div>
</DrawerContentBody>
```

## Good: hook on the existing host

```tsx
<DrawerContentBody
  ref={primaryChromeRef}
  className="hb-app-chrome"
  data-smoke="app-shell"
>
  <UniversalHeader />
  <Page />
</DrawerContentBody>
```

## Bad: no className on a component

```tsx
export type ImageCardProps = { data: ImageCardData; /* no className */ };

// Call site forced to wrap for a modifier
<div className="hb-card--split-body">
  <ImageCard data={…} />
</div>
```

## Bad: leaking a kit-owned modifier at the call site

```tsx
<ImageCard className="hb-card--split-body" data={…} />
```

## Good: owned variant prop + open className / style extension

```tsx
export type HbStyle = React.CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
};

// Kit owns the variant; style typed for CSS custom properties
export type HbCardProps = {
  className?: string;
  style?: HbStyle;
  isSplitBody?: boolean; // → hb-card--split-body on root
};

// Page composition forwards className + style to HbCard
<ImageCard isSplitBody data={…} />
<ImageCard className="hb-image-card--campaign-highlight" data={…} />
<ImageCard style={{ "--hb-card-min-width": "32ch" }} data={…} />
```
