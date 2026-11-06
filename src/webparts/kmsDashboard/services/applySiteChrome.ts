import type { ISiteSettings } from './SiteChromeService';

/**
 * Applies page level customisation driven by the settings list:
 *
 *   sidebartoggle   Yes  -> show the floating expand/collapse button for the quick launch
 *   sidebardefault  collapsed -> initial state when no previous choice was stored
 *   hidesidebar     Yes  -> hide the quick launch permanently (ignored when toggle is on)
 *   headerbgimage   <url> -> background image behind the site header
 *   hidesitelogo    Yes  -> hide the site logo (e.g. the "PG" square)
 *   headertextcolor <color> -> force the text (and currentColor icons) in the
 *                    site header to this colour, e.g. `#ffffff` on a photo
 *   customcss       <css> -> appended verbatim to the injected stylesheet
 *
 * Everything is done by injecting a single <style> element, so the effect only
 * lasts while this web part instance exists on the page (removed on dispose).
 */

const STYLE_ID = 'kms-chrome-style';
const TOGGLE_ID = 'kms-chrome-toggle';
const SIDEBAR_HIDDEN_CLASS = 'kms-sidebar-hidden';
const STORAGE_KEY = 'kms.chrome.sidebarCollapsed';

// Modern SharePoint has shipped several DOM shapes for the quick launch /
// site header; we target them all so one of them always matches.
// Selectors verified against the live Poc-GPA DOM (inspect element, 2026-11-06).
// NOTE: the attribute is `data-automationid` (no dashes) with PascalCase values,
// and hashed classes like `mainHeader-107` must not be used as selectors.
// Legacy selectors are kept as fallbacks for other site layouts.
const SIDEBAR_SELECTORS = [
  // Current Poc-GPA DOM (verified 2026-11-06): the quick launch lives in
  // <div id="spLeftNav"> wrapping <nav aria-label="Site">.
  '#spLeftNav',
  'nav[aria-label="Site"]',
  '#main-left-nav',
  '[data-automationid="main-left-nav"]',
  '.LeftPane',
  '#sideNavBox',
  '[data-automation-id="pageNavigation"]',
  '.ms-quicklaunch'
];
const HEADER_SELECTORS = [
  '[data-automationid="SiteHeader"]',
  '[data-automation-id="siteHeader"]',
  '#siteHeader',
  '.ms-siteheader'
];
// SharePoint caps each section container at max-width: 1236px, which leaves a
// dead gutter on the right of the card grid. Release the cap - but only for the
// section that actually hosts this web part (data-sp-web-part-id from manifest).
const SECTION_CONTAINER = '[data-automation-id="CanvasZone-SectionContainer"]';
const WEB_PART_ID = 'f6cdb867-ac2b-4941-a77f-fee38132b8e5';
// The logo is the only <img> in the site header; hiding its wrapper collapses the cell.
const LOGO_SELECTORS = [
  '[data-automationid="SiteHeader"] a[data-navigationcomponent="SiteHeader"]',
  '[data-automationid="SiteHeader"] img',
  '.ms-siteheader-icon'
];

const isTrue = (value: string | undefined): boolean => /^(1|true|yes|y|on)$/i.test((value || '').trim());

/** Remove characters that could break out of a CSS url("...") string. */
const sanitizeCssValue = (value: string): string => value.replace(/["\\\r\n]/g, '');

/**
 * Only allow simple colour tokens so a settings row can never inject extra
 * rules into the stylesheet: #hex, rgb()/rgba()/hsl()/hsla() or a plain name.
 */
const safeColor = (value: string | undefined): string => {
  const raw = sanitizeCssValue((value || '').trim());
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) { return raw; }
  if (/^(rgb|rgba|hsl|hsla)\([0-9a-z,. %/-]+\)$/i.test(raw)) { return raw; }
  if (/^[a-z]{3,20}$/i.test(raw)) { return raw; }
  return '';
};

const buildCss = (settings: ISiteSettings): string => {
  const rules: string[] = [];

  // Let this web part's section use the full canvas width (see WEB_PART_ID).
  rules.push(`${SECTION_CONTAINER}:has([data-sp-web-part-id="${WEB_PART_ID}"]) { max-width: none !important; }`);

  const headerBg = settings.headerbgimage;
  if (headerBg) {
    rules.push(
      `${HEADER_SELECTORS.join(', ')} {` +
        ` background-image: url("${sanitizeCssValue(headerBg)}") !important;` +
        ' background-size: cover !important;' +
        ' background-position: center !important;' +
        ' }'
    );
  }

  if (isTrue(settings.hidesitelogo)) {
    rules.push(`${LOGO_SELECTORS.join(', ')} { display: none !important; }`);
  }

  const headerTextColor = safeColor(settings.headertextcolor);
  if (headerTextColor) {
    // Header text AND descendants: icons using currentColor follow along.
    rules.push(
      `${HEADER_SELECTORS.map((s) => `${s}, ${s} *`).join(', ')} { color: ${headerTextColor} !important; }`
    );
  }

  const toggleOn = isTrue(settings.sidebartoggle);

  if (toggleOn) {
    rules.push(`${SIDEBAR_SELECTORS.map((s) => `body.${SIDEBAR_HIDDEN_CLASS} ${s}`).join(', ')} { display: none !important; }`);
    rules.push(`
#${TOGGLE_ID} {
  position: fixed;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 9999;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  background: #ffffff;
  color: #323130;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.22);
}
#${TOGGLE_ID}:hover { background: #f3f2f1; }
#${TOGGLE_ID}:focus-visible { outline: 2px solid #0f6cbd; outline-offset: 2px; }`);
  } else if (isTrue(settings.hidesidebar)) {
    rules.push(`${SIDEBAR_SELECTORS.join(', ')} { display: none !important; }`);
  }

  const customCss = settings.customcss;
  if (customCss) {
    rules.push(customCss);
  }

  return rules.join('\n');
};

const readStoredCollapsed = (): boolean | undefined => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'true') { return true; }
    if (raw === 'false') { return false; }
  } catch {
    // storage blocked (privacy mode) -> fall back to the list default
  }
  return undefined;
};

const storeCollapsed = (collapsed: boolean): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
    // ignore
  }
};

/** Marker so we only ever remove inline styles we set ourselves. */
const INLINE_HIDDEN_ATTR = 'data-kms-hidden';

/** Re-queries the sidebar containers (SharePoint may re-render them at any time). */
const findSidebars = (): HTMLElement[] => {
  const found: HTMLElement[] = [];
  SIDEBAR_SELECTORS.forEach((selector: string): void => {
    document.querySelectorAll(selector).forEach((el: Element): void => {
      const htmlEl = el as HTMLElement;
      if (found.indexOf(htmlEl) === -1) {
        found.push(htmlEl);
      }
    });
  });
  return found;
};

/**
 * Belt and suspenders: besides the `body.kms-sidebar-hidden` CSS rule, force the
 * inline style too, so the sidebar collapses even if a stylesheet rule is
 * overridden by SharePoint CSS.
 */
const setCollapsed = (collapsed: boolean): void => {
  document.body.classList.toggle(SIDEBAR_HIDDEN_CLASS, collapsed);

  findSidebars().forEach((el: HTMLElement): void => {
    if (collapsed) {
      if (!el.hasAttribute(INLINE_HIDDEN_ATTR)) {
        el.setAttribute(INLINE_HIDDEN_ATTR, '1');
        el.style.setProperty('display', 'none', 'important');
      }
    } else if (el.hasAttribute(INLINE_HIDDEN_ATTR)) {
      el.removeAttribute(INLINE_HIDDEN_ATTR);
      el.style.removeProperty('display');
    }
  });
};

/**
 * Injects the stylesheet (and optional toggle button) for the given settings.
 * Returns a cleanup function that reverts everything.
 */
export const applySiteChrome = (settings: ISiteSettings): (() => void) => {
  // Re-apply: drop anything a previous run left behind.
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(TOGGLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.appendChild(document.createTextNode(buildCss(settings)));
  document.head.appendChild(style);

  const toggleOn = isTrue(settings.sidebartoggle);

  let button: HTMLButtonElement | undefined;
  let onClick: (() => void) | undefined;

  if (toggleOn) {
    const stored = readStoredCollapsed();
    const defaultCollapsed = (settings.sidebardefault || '').trim().toLowerCase() === 'collapsed';
    setCollapsed(stored === undefined ? defaultCollapsed : stored);

    button = document.createElement('button');
    button.id = TOGGLE_ID;
    button.type = 'button';
    button.title = 'Show / hide navigation';
    button.setAttribute('aria-label', 'Show / hide navigation');
    button.setAttribute('aria-pressed', String(document.body.classList.contains(SIDEBAR_HIDDEN_CLASS)));
    button.innerHTML = '&#9776;'; // hamburger

    onClick = (): void => {
      const collapsed = !document.body.classList.contains(SIDEBAR_HIDDEN_CLASS);
      setCollapsed(collapsed);
      storeCollapsed(collapsed);
      button?.setAttribute('aria-pressed', String(collapsed));
    };
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
  } else if (!isTrue(settings.hidesidebar)) {
    // Toggle off and no hard hide -> make sure no stale class survives.
    setCollapsed(false);
  }

  return (): void => {
    document.getElementById(STYLE_ID)?.remove();
    if (button && onClick) {
      button.removeEventListener('click', onClick);
      button.remove();
    }
    setCollapsed(false);
  };
};
