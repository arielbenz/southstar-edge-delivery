import { parseConfigPage } from '../../scripts/utils/config-page-loader.js';

const FIXTURE_HTML = `
<main>
  <div>
    <h2>general</h2>
    <p>Title: Enroll in Ohio Natural Gas</p>
    <p>Subtitle: Takes only 5 minutes</p>
    <p>Support Phone: 1-800-555-0100</p>
    <p>Support Email: support@ohiong.com</p>
    <p>Terms Required: true</p>
    <p>Min Age: 18</p>
    <h2>steps</h2>
    <p>Step 1 Title: Choose Your Plan</p>
    <p>Step 1 Description: Select the plan that fits your home.</p>
    <p>Step 2 Title: Your Information</p>
    <p>Step 2 Description: We need a few details.</p>
    <p>Step 3 Title: Review & Confirm</p>
    <p>Step 3 Description: Check your details.</p>
    <h2>documents</h2>
    <p>Terms URL: /docs/terms.pdf</p>
    <p>Privacy URL: /docs/privacy.pdf</p>
    <p>Rate Schedule URL: /docs/rates.pdf</p>
    <h2>redirects</h2>
    <p>Success URL: /enrollment/confirmation</p>
    <p>Error URL: /enrollment/error</p>
    <p>Login URL: /login</p>
  </div>
</main>
`;

describe('parseConfigPage', () => {
  test('extrae strings correctamente', () => {
    expect(parseConfigPage(FIXTURE_HTML).title).toBe(
      'Enroll in Ohio Natural Gas',
    );
  });

  test('convierte a camelCase simple', () => {
    expect(parseConfigPage(FIXTURE_HTML).supportPhone).toBe('1-800-555-0100');
  });

  test('convierte a camelCase con numero', () => {
    expect(parseConfigPage(FIXTURE_HTML).step1Title).toBe('Choose Your Plan');
  });

  test('castea boolean true', () => {
    const result = parseConfigPage(FIXTURE_HTML);
    expect(result.termsRequired).toBe(true);
    expect(typeof result.termsRequired).toBe('boolean');
  });

  test('castea boolean false', () => {
    const result = parseConfigPage('<main><p>Active: false</p></main>');
    expect(result.active).toBe(false);
  });

  test('castea number entero', () => {
    const result = parseConfigPage(FIXTURE_HTML);
    expect(result.minAge).toBe(18);
    expect(typeof result.minAge).toBe('number');
  });

  test('castea URL como string', () => {
    const result = parseConfigPage(FIXTURE_HTML);
    expect(result.termsUrl).toBe('/docs/terms.pdf');
    expect(typeof result.termsUrl).toBe('string');
  });

  test('extrae campos de multiples secciones', () => {
    const result = parseConfigPage(FIXTURE_HTML);
    expect(result.title).toBe('Enroll in Ohio Natural Gas');
    expect(result.step1Title).toBe('Choose Your Plan');
  });

  test('ignora parrafos sin dos puntos', () => {
    const result = parseConfigPage(
      '<main><p>Este es un parrafo normal</p></main>',
    );
    expect(result).toEqual({});
  });

  test('ignora parrafos con dos puntos al inicio', () => {
    const result = parseConfigPage('<main><p>: valor</p></main>');
    expect(result).toEqual({});
  });

  test('ignora parrafos con dos puntos al final', () => {
    const result = parseConfigPage('<main><p>Key:</p></main>');
    expect(result).toEqual({});
  });

  test('HTML vacio devuelve objeto vacio', () => {
    expect(parseConfigPage('<main></main>')).toEqual({});
  });

  test('no falla con HTML malformado', () => {
    expect(parseConfigPage('no es html valido')).toEqual({});
  });

  test('extrae step2Title y step3Title correctamente', () => {
    const result = parseConfigPage(FIXTURE_HTML);
    expect(result.step2Title).toBe('Your Information');
    expect(result.step3Title).toBe('Review & Confirm');
  });

  test('el simbolo & en el valor se preserva', () => {
    const result = parseConfigPage(
      '<main><p>Step 3 Description: Check your details &amp; confirm.</p></main>',
    );
    expect(result.step3Description).toContain('&');
    expect(result.step3Description).toBe('Check your details & confirm.');
  });
});
