import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateBlocks,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlock,
  loadCSS,
  loadSection,
  loadSections,
  sampleRUM,
  waitForFirstImage,
} from './aem.js';
import { getOrigin, getHref } from './utils/dom.js';

// Detects Sidekick Library srcdoc iframe
const CURRENT_ORIGIN = getOrigin();
const CURRENT_HREF = getHref();

/**
 * Builds hero auto-block (if the first section has an image followed by content)
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  if (h1 && picture && h1.closest('.section') === picture.closest('.section')) {
    const section = h1.closest('.section');
    const elems = [...section.firstElementChild.children];
    if (!section.querySelector('.hero')) {
      const block = buildBlock('hero', { elems });
      section.firstElementChild.prepend(block);
    }
  }
}

/**
 * Builds boilerplate auto-blocks
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates a fragment (without template/theme — used from fragment.js).
 */
export function decorateMain(main) {
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Decorates the full page (includes template/theme).
 */
function decoratePage(main) {
  decorateTemplateAndTheme();
  decorateMain(main);
}

/**
 * Eager phase: what impacts LCP
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decoratePage(doc.querySelector('main'));

  const { hash } = new URL(CURRENT_HREF);
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) {
    element.scrollIntoView();
  }

  const firstSection = doc.querySelector('.section');
  if (firstSection) {
    await loadSection(firstSection, waitForFirstImage);
  }
}

/**
 * Lazy phase: non-critical LCP resources
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = new URL(CURRENT_HREF);
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  decorateIcons(doc.querySelector('main'));

  sampleRUM('lazy');
  sampleRUM.enhance();
}

/**
 * Delayed phase: scripts that are not critical for the UI
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
}

/** Entry point */
async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

// Do not run if this module was imported from the preview server
if (!window.__PREVIEW_SERVER) {
  loadPage();
}
