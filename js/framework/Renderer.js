/**
 * @file Canvas drawing-primitive helpers.
 *
 * Wraps a `CanvasRenderingContext2D` and exposes higher-level methods such as
 * `fillText`, `strokeRect`, `fillRoundedRect`, etc.  This avoids scattering
 * raw canvas API calls throughout the game code and keeps rendering concerns
 * in one place.
 */

export default class Renderer {
  /** @type {CanvasRenderingContext2D} */
  #ctx;

  /**
   * @param {CanvasRenderingContext2D} ctx - The 2D context to draw on.
   */
  constructor(ctx) {
    this.#ctx = ctx;
  }

  /** Expose the raw context for one-off operations (e.g. `measureText`). */
  get ctx() {
    return this.#ctx;
  }

  /**
   * Clear the entire canvas.
   *
   * @param {HTMLCanvasElement} canvas
   */
  clear(canvas) {
    this.#ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ─── Text ────────────────────────────────────────────────────────────

  /**
   * Draw filled text.
   *
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {string} font       - CSS font string, e.g. `'24pt Impact'`.
   * @param {string} fillStyle  - Fill colour.
   * @param {CanvasTextAlign} align - `'left'`, `'center'`, or `'right'`.
   */
  fillText(text, x, y, font, fillStyle, align = 'left') {
    const c = this.#ctx;
    c.font = font;
    c.fillStyle = fillStyle;
    c.textAlign = align;
    c.fillText(text, x, y);
  }

  /**
   * Draw stroked (outlined) text.
   */
  strokeText(text, x, y, font, strokeStyle, lineWidth, align = 'left') {
    const c = this.#ctx;
    c.font = font;
    c.strokeStyle = strokeStyle;
    c.lineWidth = lineWidth * 2;
    c.textAlign = align;
    c.strokeText(text, x, y);
  }

  /**
   * Draw text with both stroke and fill (stroke drawn first).
   */
  strokeFillText(text, x, y, font, strokeStyle, lineWidth, fillStyle, align = 'left') {
    const c = this.#ctx;
    c.font = font;
    c.textAlign = align;
    c.strokeStyle = strokeStyle;
    c.lineWidth = lineWidth;
    c.fillStyle = fillStyle;
    c.fillText(text, x, y);
    c.strokeText(text, x, y);
  }

  // ─── Rectangles ──────────────────────────────────────────────────────

  /**
   * Draw a filled rectangle.
   */
  fillRect(x, y, w, h, fillStyle) {
    this.#ctx.fillStyle = fillStyle;
    this.#ctx.fillRect(x, y, w, h);
  }

  /**
   * Draw a stroked (outlined) rectangle.
   */
  strokeRect(x, y, w, h, strokeStyle, lineWidth) {
    const c = this.#ctx;
    c.strokeStyle = strokeStyle;
    c.lineWidth = lineWidth;
    c.beginPath();
    c.rect(x, y, w, h);
    c.stroke();
  }

  /**
   * Draw a rectangle with both stroke and fill.
   */
  strokeFillRect(x, y, w, h, strokeStyle, lineWidth, fillStyle) {
    const c = this.#ctx;
    c.strokeStyle = strokeStyle;
    c.lineWidth = lineWidth;
    c.fillStyle = fillStyle;
    c.beginPath();
    c.rect(x, y, w, h);
    c.fill();
    c.stroke();
  }

  /**
   * Draw a rounded rectangle with stroke and optional fill.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} radius      - Corner radius (top-left / bottom-left).
   * @param {string} strokeStyle
   * @param {number} lineWidth
   * @param {string} [fillStyle] - If provided, the rect is also filled.
   * @param {number} [radiusRight] - Separate radius for right corners.
   */
  strokeFillRoundedRect(x, y, w, h, radius, strokeStyle, lineWidth, fillStyle, radiusRight) {
    const c = this.#ctx;
    const r = x + w;
    const b = y + h;
    const rr = radiusRight ?? radius;

    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(r - rr, y);
    c.quadraticCurveTo(r, y, r, y + rr);
    c.lineTo(r, b - rr);
    c.quadraticCurveTo(r, b, r - rr, b);
    c.lineTo(x + radius, b);
    c.quadraticCurveTo(x, b, x, b - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius + 1, y);

    if (lineWidth > 0) {
      c.strokeStyle = strokeStyle;
      c.lineWidth = lineWidth;
      c.stroke();
    }
    if (fillStyle) {
      c.fillStyle = fillStyle;
      c.fill();
    }
  }

  // ─── Arcs / Circles ──────────────────────────────────────────────────

  /**
   * Draw a filled circle.
   */
  fillArc(x, y, r, fillStyle) {
    const c = this.#ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fillStyle;
    c.fill();
  }

  /**
   * Draw a stroked circle.
   */
  strokeArc(x, y, r, strokeStyle, lineWidth) {
    const c = this.#ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.lineWidth = lineWidth;
    c.strokeStyle = strokeStyle;
    c.stroke();
  }

  /**
   * Draw a circle with both stroke and fill.
   */
  strokeFillArc(x, y, r, strokeStyle, lineWidth, fillStyle) {
    const c = this.#ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.lineWidth = lineWidth;
    c.fillStyle = fillStyle;
    c.strokeStyle = strokeStyle;
    c.fill();
    c.stroke();
  }

  // ─── Lines ───────────────────────────────────────────────────────────

  /**
   * Draw a line from (x, y) by delta (dx, dy).
   */
  stroke(x, y, dx, dy, style, lineWidth) {
    const c = this.#ctx;
    c.strokeStyle = style;
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + dx, y + dy);
    c.stroke();
  }

  /**
   * Draw a line between two absolute points.
   */
  strokeToPoint(x1, y1, x2, y2, style, lineWidth) {
    const c = this.#ctx;
    c.strokeStyle = style;
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }

  // ─── Images ──────────────────────────────────────────────────────────

  /**
   * Draw an image at (x, y).
   *
   * @param {HTMLImageElement} img
   * @param {number} x
   * @param {number} y
   */
  drawImage(img, x, y) {
    this.#ctx.drawImage(img, x, y);
  }
}

