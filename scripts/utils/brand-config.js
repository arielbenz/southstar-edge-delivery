/**
 * Brand Config Loader
 *
 * Detecta la marca activa y carga sus design tokens.
 * En producción: detecta por hostname.
 * En desarrollo: lee ?brand=xxx de la URL.
 *
 * El loader inyecta un <link> al brand token CSS correspondiente
 * DESPUÉS de que tokens.css se carga, para que los overrides funcionen.
 */

const BRAND_MAP = {
  'southstarenergy.com': 'southstar',
  'gng.com': 'gng',
  'onlyong.com': 'ong',
  'grandrapidsenergy.com': 'grand-rapids',
  'newjerseyenergy.com': 'gng',
  'virginiaretailenergy.com': 'southstar',
};

const DEFAULT_BRAND = 'southstar';

const VALID_BRANDS = new Set(['southstar', 'gng', 'ong', 'grand-rapids']);

/**
 * Detecta el brand activo.
 * Prioridad: ?brand= param > hostname > default
 */
export function detectBrand() {
  const urlBrand = new URLSearchParams(window.location.search).get('brand');
  if (urlBrand && isValidBrand(urlBrand)) return urlBrand;

  const host = window.location.hostname;
  const matched = Object.entries(BRAND_MAP).find(([domain]) =>
    host.includes(domain),
  );
  return matched?.[1] ?? DEFAULT_BRAND;
}

export function isValidBrand(brand) {
  return VALID_BRANDS.has(brand);
}

/**
 * Carga el CSS de tokens del brand activo.
 * Se llama UNA VEZ en scripts.js, antes de loadEager().
 * El <link> se agrega al final del <head> para asegurar
 * que los overrides toman precedencia sobre tokens.css.
 */
export async function loadBrandTokens(brand) {
  return new Promise((resolve) => {
    const existing = document.querySelector('[data-brand-tokens]');
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/styles/brands/${brand}/tokens.css`;
    link.dataset.brandTokens = brand;
    link.onload = resolve;
    link.onerror = () => {
      console.warn(`[Brand] tokens not found for: ${brand}, using default`);
      resolve();
    };
    // Append at end of <head> so brand overrides win over tokens.css
    document.head.appendChild(link);
  });
}

/**
 * Agrega la clase del brand al <body> para CSS targeting.
 * Permite: body.brand-gng .enrollment-flow__btn { ... }
 */
export function applyBrandClass(brand) {
  document.body.classList.add(`brand-${brand}`);
  document.documentElement.setAttribute('data-brand', brand);
}

/**
 * Setup completo — detectar, cargar y aplicar.
 * Llamar al inicio de scripts.js.
 */
export async function setupBrand() {
  const brand = detectBrand();
  await loadBrandTokens(brand);
  applyBrandClass(brand);
  return brand;
}
