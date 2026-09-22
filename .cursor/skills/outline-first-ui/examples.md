# Outline-First UI — Examples

Read [scaffold-outline/perspective.md](../scaffold-outline/perspective.md) first,
then [SKILL.md](../scaffold-outline/SKILL.md).

## Process

```
propose → dry-run → review → dry-run → review → consensus → change → validate
```

Do not implement from the first dry-run. Prefer a **root fix in one place**
that retains correct click/close/URL behavior — reject reopen/gate/ref patches.
One drawer, different content: restore the shared open/hydrate contract; do not
design a parallel “CVE drawer.” CHECK FIRST for an existing primitive
before proposing a new file. Prefer existing parents over wrappers. Every
component/config accepts `className?` / `style?` merged onto the root host.
Alike README-shaped docs and scroll landmarks share one implementation — unique
forks become drift.

**Validate after change:** type-check, targeted tests, smoke UI (home,
security-feed, deep-link drawer). Do not call the work done on code review alone.

## File placement

```
# Bad — section content scattered or misnamed; shell stem collision; slot router
app/app-drawer-panel.tsx                    # real drawer chrome (keep for now)
# Bad — no relevance ruling / no UI validation
app/app-drawer-panel-content.tsx            # "shell family" in code review —
                                            # destructive double CVE title in the app
container-details-panel.tsx                 # same "panel" stem on section — collision
container-detail-overview-pull.tsx          # misnamed widget file
container-technical.tsx                     # UI says SBOM
container-detail-loading.tsx                # async chrome as a section
container-detail-content.tsx                # assembles overview via overviewPull prop

# Good — one panel shell file; sections use container-detail-{section}
app/app-drawer-panel.tsx                    # drawer chrome only (no *-panel-content)
container-detail-content.tsx                # <section class="hb-content"><TabSection /></section>
sections/container-detail-overview.tsx
sections/container-detail-details.tsx       # not *-panel, not container-details
sections/container-detail-tags.tsx
sections/container-detail-sbom.tsx
sections/container-detail-packages.tsx
primitives/…                                # ContentStatus / shared error chrome
```

## Tab shell vs section file

```tsx
// container-detail-content.tsx — shell only
<TabContentBody>
  <section className="hb-content">
    <Component data={data} />
  </section>
</TabContentBody>

// sections/container-security.tsx — outline + scroll landmark
return (
  <section id="container-detail-cve-reporting">
    <p>…preamble…</p>
    <TableToolbar … />
    …
  </section>
);

// sections/container-verify-build.tsx — outline only
return (
  <>
    <Title headingLevel="h2">{v.title}</Title>
    <p>{description}</p>
    <section>
      <Title headingLevel="h4">{v.prerequisites_title}</Title>
      <List>…</List>
    </section>
    <section>…</section>
  </>
);
```

## Async outline with shared status chrome

```tsx
// Bad — invent a dialect; or hide chrome in sections/*-loading.tsx
{
  isLoading ? <Spinner size="lg" /> : null;
}

// Good — conditionals in the section return; chrome from a primitive
return (
  <>
    <Title headingLevel="h2">{title}</Title>
    {error != null && (
      <ContentError title={loadErrorTitle}>{error.message}</ContentError>
    )}
    {isLoading && error == null && <ContentStatus ariaLabel="Loading …" />}
    {!isLoading && error == null && !isEmpty && <>{/* domain sections */}</>}
  </>
);
```

## Prop drilling vs context

```tsx
// Bad — tab shell assembles section internals
<ContainerOverview data={data} pull={{ imageRef, tagToolbar, onMoreTags }} />;

// Good — section reads what it needs
export const ContainerOverview = ({ data }) => {
  const { imageRef, tagToolbar, handleGoToTags } = useContainerDetail();
  // return outline...
};
```

## When to extract a component

```tsx
// Keep inline — section outline, single use
<section aria-labelledby="overview-get-started-title">
  <Title headingLevel="h2">…</Title>
  {introBody}
  {imageRefCard}
</section>

// Extract — reused complex widget (2+ sites or heavy logic)
<PullCommandCodeBlock imageRef={imageRef} … />
<ReadmeRenderer html={restHtml} />
<ContentStatus ariaLabel="Loading SBOM" />
```

## Readable conditional tail

```tsx
// Bad — empty fragment assignment
tailContent = <></>;
return (…hardcoded sections in return anyway…);

// Good — condition in return matches content model
{hasReadme && rest.trim() ? (
  <ReadmeRenderer html={rest} />
) : null}

{!hasReadme ? (
  <>
    <section aria-labelledby="detail-distroless">…</section>
    <section aria-labelledby="detail-hardened">…</section>
  </>
) : null}
```

## Flex once per view; shared CSS for repeated stacks

`Flex` with modifiers is fine scaffolding when it **happens once** and lives in
**one place** (that view’s return). Copying the same `Flex column gapLg` into
every tab is the smell — use `hb-content` CSS for that repeated document stack.

Horizontal title + toolbar rows:

```tsx
<div className="hb-content-toolbar">
  <Title headingLevel="h2"><RhStandardBookIcon aria-hidden /> {title}</Title>
  <ToolbarTable … />
</div>
```

Do not wrap each tab in `Flex column gapLg` for the same spacing effect.

## Comments: why and rehome, not narration

```tsx
// Bad
// Spinner while loading
{isLoading && <Spinner />}

// Good — constraint
// Shared loading slot under hb-content; do not add per-tab py-* utilities.
{isLoading && error == null && <ContentStatus ariaLabel="Loading …" />}

// Good — planned rehome left at the wrong-layer site
// TODO(rehome): pickArchConfig → @lib/… (shared with container-file).
function pickArchConfig(…) { … }
```

## className / style extension

```tsx
// Bad — no className/style; caller wraps
<div className="hb-card--split-body" style={{ "--hb-card-min-width": "32ch" }}>
  <ImageCard data={…} />
</div>

// Bad — kit-owned mode leaked as a raw class at the call site
<ImageCard className="hb-card--split-body" data={…} />

// Bad — composition accepts style but does not forward to root host
export const ImageCard = ({ style, … }) => <HbCard>{/* style dropped */}</HbCard>;

// Good — owned variant on HbCard; ImageCard forwards; className/style for open extension
<ImageCard isSplitBody data={…} />
<ImageCard className="hb-image-card--campaign-highlight" data={…} />
<ImageCard style={{ "--hb-card-min-width": "32ch" }} data={…} />
```

## Alike surfaces — one implementation

```tsx
// Bad — Verify Build rebuilds README shape in unique JSX
<section>
  <Title>…</Title>
  <HbContentSplit prose={…} action={<HbCodeBlock … />} />
</section>

// Bad — second scroll helper for CVE only
scrollToDetailTabPanel(key);
scrollToCveReportingTable(); // same rAF + smooth, different name

// Good — instructional markdown through the shared README pipeline
<InstructionalReadme markdown={v.body_markdown} tokens={{ image_ref, key_url }} />

// Good — one landmark scroll; call sites only choose ids / candidate lists
scheduleScrollToLandmark(tabContentLandmarkId(key));
scheduleScrollToLandmark([...CVE_SCROLL_LANDMARKS]);
// Implementation lives in landmark-scroll.ts (scrollDrawerToLandmark) — not inline in provider
```
