/**
 * lighthouse-runner.js
 *
 * Runs Lighthouse against a URL from the Preview Server and returns
 * the main scores. Uses headless Chrome — no visible browser window.
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

/**
 * @param {string} url - Full URL to audit (e.g. http://localhost:5175/preview/header?mock=true)
 * @returns {Promise<{
 *   performance: number,
 *   accessibility: number,
 *   lcp: number,
 *   cls: string,
 *   tbt: number,
 *   timestamp: string
 * }>}
 */
export async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility'],
      output: 'json',
      logLevel: 'error',
    });

    const lhr = result.lhr;
    return {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
      cls: lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3),
      tbt: Math.round(lhr.audits['total-blocking-time'].numericValue),
      timestamp: new Date().toISOString(),
    };
  } finally {
    await chrome.kill();
  }
}
