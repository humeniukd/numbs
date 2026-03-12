/**
 * @file Unified pointer-event input manager.
 *
 * Modern browsers support the **Pointer Events** API, which unifies mouse,
 * touch, and stylus input into a single event model.  This class listens for
 * `pointerdown`, `pointermove`, and `pointerup` on the target element,
 * converts raw page coordinates into the game's logical coordinate space
 * (accounting for CSS scaling), and forwards them to registered callbacks.
 *
 * This replaces the legacy dual mouse + touch handler approach.
 */

export default class InputManager {
  /** @type {HTMLCanvasElement} */
  #canvas;

  /** @type {((x: number, y: number) => void) | null} */
  #onPointerDown = null;

  /** @type {((x: number, y: number) => void) | null} */
  #onPointerUp = null;

  /** @type {((x: number, y: number) => void) | null} */
  #onPointerMove = null;

  /**
   * @param {HTMLCanvasElement} canvas - The top-most canvas element that
   *   should capture input events.
   */
  constructor(canvas) {
    this.#canvas = canvas;

    // Prevent default context-menu & text-selection on the canvas.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.style.touchAction = 'none'; // Prevent browser gestures.

    // Bind pointer events.
    canvas.addEventListener('pointerdown', this.#handleDown);
    canvas.addEventListener('pointermove', this.#handleMove);
    document.body.addEventListener('pointerup', this.#handleUp);
  }

  // ─── Coordinate transform ────────────────────────────────────────────

  /**
   * Convert a raw page-coordinate event into the game's logical (1024×768)
   * coordinate system by accounting for the canvas CSS display size.
   *
   * @param {PointerEvent} e
   * @returns {{ x: number, y: number }}
   */
  #toLogical(e) {
    const rect = this.#canvas.getBoundingClientRect();
    const scaleX = this.#canvas.width / rect.width;
    const scaleY = this.#canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  }

  // ─── Internal handlers ───────────────────────────────────────────────

  /** @param {PointerEvent} e */
  #handleDown = (e) => {
    e.preventDefault();
    const { x, y } = this.#toLogical(e);
    this.#onPointerDown?.(x, y);
  };

  /** @param {PointerEvent} e */
  #handleUp = (e) => {
    e.preventDefault();
    const { x, y } = this.#toLogical(e);
    this.#onPointerUp?.(x, y);
  };

  /** @param {PointerEvent} e */
  #handleMove = (e) => {
    e.preventDefault();
    const { x, y } = this.#toLogical(e);
    this.#onPointerMove?.(x, y);
  };

  // ─── Public registration ─────────────────────────────────────────────

  /**
   * Register a callback for pointer-down (click / tap start).
   * @param {(x: number, y: number) => void} fn
   */
  onDown(fn) { this.#onPointerDown = fn; }

  /**
   * Register a callback for pointer-up (click / tap end).
   * @param {(x: number, y: number) => void} fn
   */
  onUp(fn) { this.#onPointerUp = fn; }

  /**
   * Register a callback for pointer-move (hover / drag).
   * @param {(x: number, y: number) => void} fn
   */
  onMove(fn) { this.#onPointerMove = fn; }

  /**
   * Tear down all event listeners (useful if re-initialising).
   */
  destroy() {
    this.#canvas.removeEventListener('pointerdown', this.#handleDown);
    this.#canvas.removeEventListener('pointermove', this.#handleMove);
    document.body.removeEventListener('pointerup', this.#handleUp);
  }
}

