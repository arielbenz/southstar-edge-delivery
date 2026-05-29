/**
 * scores-cache.js
 *
 * In-memory cache for Lighthouse scores.
 * Scores are recomputed when the user triggers a run from the dashboard.
 *
 * Structure: Map<blockName, { status, scores, error }>
 * status: 'idle' | 'running' | 'done' | 'error'
 */

const cache = new Map();

export function getScore(blockName) {
  return cache.get(blockName) ?? { status: 'idle', scores: null, error: null };
}

export function setRunning(blockName) {
  cache.set(blockName, { status: 'running', scores: null, error: null });
}

export function setDone(blockName, scores) {
  cache.set(blockName, { status: 'done', scores, error: null });
}

export function setError(blockName, error) {
  cache.set(blockName, { status: 'idle', scores: null, error: error.message });
}

export function getAllScores() {
  return Object.fromEntries(cache);
}
