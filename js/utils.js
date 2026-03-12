/**
 * @file Utility math/geometry helpers used across the game.
 *
 * These are pure functions with no side effects, making them easy to test
 * and reuse in any module that needs hit-testing or randomisation.
 */

/**
 * Check whether a point (x, y) lies inside an axis-aligned rectangle.
 *
 * @param {number} x  - Point X coordinate.
 * @param {number} y  - Point Y coordinate.
 * @param {number} left   - Rectangle left edge.
 * @param {number} top    - Rectangle top edge.
 * @param {number} width  - Rectangle width.
 * @param {number} height - Rectangle height.
 * @returns {boolean} `true` when the point is inside (inclusive of edges).
 */
export function pointInBox(x, y, left, top, width, height) {
  return x >= left && x < left + width && y >= top && y < top + height;
}

/**
 * Euclidean distance between two points (each offset by 32 px – legacy
 * behaviour kept for compatibility with the original framework).
 *
 * @param {number} x1 - First point X.
 * @param {number} y1 - First point Y.
 * @param {number} x2 - Second point X.
 * @param {number} y2 - Second point Y.
 * @returns {number} The distance in pixels.
 */
export function getDistance(x1, y1, x2, y2) {
  return Math.hypot((x1 + 32) - (x2 + 32), (y1 + 32) - (y2 + 32));
}

/**
 * Pick a random integer in `[0, max)` that has not appeared in the recent
 * history window (avoiding immediate repeats).
 *
 * @param {number} max           - Upper bound (exclusive).
 * @param {number[]} history     - Mutable array of recent picks.
 * @param {number} [historySize] - Maximum history length (defaults to `max/2`).
 * @returns {number} A non-recently-repeated random integer.
 */
export function randomNonRepeating(max, history, historySize) {
  const limit = historySize ?? Math.floor(max / 2);
  let value;
  do {
    value = Math.floor(Math.random() * max);
  } while (history.includes(value));

  history.push(value);
  if (history.length > limit) history.shift();
  return value;
}

