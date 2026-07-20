import { useEffect } from 'react';
import { REPOSITORIES_ROUTE, TEMPLATES_ROUTE } from 'Routes/constants';
import useRootPath from 'Hooks/useRootPath';

const DIVIDER_CLASS = 'content-sources-nav-divider';
const STYLE_ID = 'content-sources-nav-divider-style';
const DEBOUNCE_MS = 50;

// Prefer single selectors with `.closest()` for broader browser support
// (comma-separated lists in `.closest()` are not available everywhere).
const NAV_ROOT_SELECTORS = ['#page-sidebar', '.pf-v6-c-page__sidebar', 'nav.pf-v6-c-nav'] as const;

const NAV_ITEM_CLASS = 'pf-v6-c-nav__item';

type ContentSourcesGlobals = {
  navDividerInit?: boolean;
  navDividerObserver?: MutationObserver;
  navDividerDebounceHandle?: number;
  navDividerRootPath?: string;
  navDividerMissingWarned?: boolean;
};

declare global {
  interface Window {
    // App-scoped namespace (avoids colliding with Chrome's window.insights).
    contentSources?: ContentSourcesGlobals;
  }
}

// Chrome sets data-ouia-component-id from the nav item title in deploy/frontend.yaml.
const OUIA_IDS = {
  [TEMPLATES_ROUTE]: 'Templates',
  [REPOSITORIES_ROUTE]: 'Repositories',
} as const;

const routeToOuiaId = (route: keyof typeof OUIA_IDS) => OUIA_IDS[route];

const hasDom = () => typeof document !== 'undefined' && typeof window !== 'undefined';

const getNavRoot = (): Element | null => {
  if (!hasDom()) {
    return null;
  }

  for (const selector of NAV_ROOT_SELECTORS) {
    const match = document.querySelector(selector);
    if (match) {
      return match;
    }
  }

  return null;
};

const closestNavRoot = (el: Element): Element | null => {
  for (const selector of NAV_ROOT_SELECTORS) {
    const match = el.closest(selector);
    if (match) {
      return match;
    }
  }

  return null;
};

/**
 * Resolve a side-nav item without relying on `:has()`, which older browsers
 * might not support. Prefer OUIA id, then walk up from the quickstart link.
 */
const findNavItem = (quickstartPath: string, ouiaId: string): Element | null => {
  if (!hasDom()) {
    return null;
  }

  const byOuia = document.querySelector(`.${NAV_ITEM_CLASS}[data-ouia-component-id="${ouiaId}"]`);
  if (byOuia) {
    return byOuia;
  }

  const link = document.querySelector(`[data-quickstart-id="${quickstartPath}"]`);
  return link?.closest(`.${NAV_ITEM_CLASS}`) ?? null;
};

const ensureStyle = () => {
  if (!hasDom() || document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  // Match PatternFly v6 Divider (`pf-v6-c-divider`) with xs spacer margins.
  // Injected into document.head so it survives leaving content-sources routes.
  // Update this class if Chrome moves off PF v6.
  style.textContent = `
    hr.pf-v6-c-divider.${DIVIDER_CLASS} {
      margin-block-start: var(--pf-t--global--spacer--xs);
      margin-block-end: var(--pf-t--global--spacer--xs);
    }
  `;
  document.head.appendChild(style);
};

const insertDividerAfter = (item: Element) => {
  if (item.nextElementSibling?.classList.contains(DIVIDER_CLASS)) {
    return;
  }

  const hr = document.createElement('hr');
  hr.className = `pf-v6-c-divider ${DIVIDER_CLASS}`;
  item.after(hr);
};

const ensureDividers = (rootPath: string) => {
  if (!hasDom()) {
    return;
  }

  const templatesItem = findNavItem(
    `${rootPath}/${TEMPLATES_ROUTE}`,
    routeToOuiaId(TEMPLATES_ROUTE),
  );
  const repositoriesItem = findNavItem(
    `${rootPath}/${REPOSITORIES_ROUTE}`,
    routeToOuiaId(REPOSITORIES_ROUTE),
  );
  if (!templatesItem && !repositoriesItem) {
    if (
      process.env.NODE_ENV === 'development' &&
      getNavRoot() &&
      !window.contentSources?.navDividerMissingWarned
    ) {
      const contentSources = (window.contentSources ??= {});
      contentSources.navDividerMissingWarned = true;
      console.warn('Content nav divider: could not locate Templates or Repositories nav items.');
    }
    return;
  }

  const templatesOk =
    !templatesItem || templatesItem.nextElementSibling?.classList.contains(DIVIDER_CLASS);
  const repositoriesOk =
    !repositoriesItem || repositoriesItem.nextElementSibling?.classList.contains(DIVIDER_CLASS);
  if (templatesOk && repositoriesOk) {
    return;
  }

  const navRoot =
    (templatesItem && closestNavRoot(templatesItem)) ??
    (repositoriesItem && closestNavRoot(repositoriesItem)) ??
    getNavRoot() ??
    document.body;

  navRoot.querySelectorAll(`hr.${DIVIDER_CLASS}`).forEach((el) => el.remove());

  // Order: Templates | Advisories, Packages, Repositories | Systems
  if (templatesItem) {
    insertDividerAfter(templatesItem);
  }
  if (repositoriesItem) {
    insertDividerAfter(repositoriesItem);
  }
};

/**
 * Inserts PatternFly dividers in the Content side nav after Templates and
 * after Repositories. Uses a window singleton so the dividers and styles stay
 * after navigating to Advisories / Packages / Systems (when this app unmounts).
 */
const useContentNavDivider = () => {
  const rootPath = useRootPath();

  useEffect(() => {
    if (!hasDom()) {
      return;
    }

    const contentSources = (window.contentSources ??= {});
    contentSources.navDividerRootPath = rootPath;

    ensureStyle();
    ensureDividers(rootPath);

    if (!contentSources.navDividerObserver) {
      let observedRoot: Element | null = null;

      const observer = new MutationObserver(() => {
        if (contentSources.navDividerDebounceHandle !== undefined) {
          window.clearTimeout(contentSources.navDividerDebounceHandle);
        }

        contentSources.navDividerDebounceHandle = window.setTimeout(() => {
          ensureDividers(contentSources.navDividerRootPath ?? rootPath);
          // Prefer the sidebar/nav once it exists; fall back to body until then.
          // Only switch when upgrading from body, or when the previous root was
          // removed (nav remount) — avoids thrashing if getNavRoot() returns
          // different connected elements across runs.
          const nextRoot = getNavRoot() ?? document.body;
          const shouldSwitch =
            observedRoot !== nextRoot &&
            (!observedRoot?.isConnected ||
              (observedRoot === document.body && nextRoot !== document.body));
          if (shouldSwitch) {
            observer.disconnect();
            observedRoot = nextRoot;
            observer.observe(nextRoot, { childList: true, subtree: true });
          }
        }, DEBOUNCE_MS);
      });

      observedRoot = getNavRoot() ?? document.body;
      contentSources.navDividerObserver = observer;
      contentSources.navDividerInit = true;
      observer.observe(observedRoot, { childList: true, subtree: true });
    }

    return () => {
      // Clear pending debounce work after this effect unmounts.
      if (contentSources.navDividerDebounceHandle !== undefined) {
        window.clearTimeout(contentSources.navDividerDebounceHandle);
        contentSources.navDividerDebounceHandle = undefined;
      }

      // Keep the singleton MutationObserver connected on purpose: Chrome unmounts
      // this microfrontend on Advisories / Packages / Systems, but the Content
      // sidebar can still re-render and needs dividers re-applied.
    };
  }, [rootPath]);
};

export default useContentNavDivider;
