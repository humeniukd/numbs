/**
 * @file Core game engine — owns canvases, renderers, input, and the main loop.
 *
 * `GameEngine` is the central orchestrator.  It:
 *  1. Initialises the HTML `<canvas>` elements and their 2D contexts.
 *  2. Handles responsive scaling so the 1024×768 logical area fills the
 *     browser window while preserving its aspect ratio.
 *  3. Runs a `requestAnimationFrame`-based game loop that delegates
 *     `update()` and `render()` calls to whatever game object is registered.
 *  4. Provides access to shared subsystems (`Renderer`, `InputManager`,
 *     `AssetLoader`) so the game doesn't need to know about raw DOM APIs.
 */

import Renderer from './Renderer.js';
import InputManager from './InputManager.js';
import AssetLoader from './AssetLoader.js';

export default class GameEngine {
  /** @type {HTMLCanvasElement} Background canvas (static images). */
  bgCanvas;
  /** @type {HTMLCanvasElement} Main (foreground) canvas for dynamic content. */
  canvas;

  /** @type {Renderer} Renderer bound to the **background** canvas context. */
  bgRenderer;
  /** @type {Renderer} Renderer bound to the **foreground** canvas context. */
  renderer;

  /** @type {InputManager} Unified pointer-event handler. */
  input;
  /** @type {AssetLoader} Promise-based image loader. */
  assets;

  /** @type {string} CSS font-family name used throughout the game. */
  font;

  /** @type {{ update: Function, render: Function } | null} Active game object. */
  #game = null;
  /** @type {number | null} requestAnimationFrame handle. */
  #rafId = null;

  /**
   * Create the engine, locate canvases in the DOM, and set up subsystems.
   *
   * @param {Object} options
   * @param {string} [options.font='Impact'] - Default font family.
   */
  constructor({ font = 'Impact' } = {}) {
    // ── Locate canvas elements ─────────────────────────────────────────
    this.bgCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('bgcanvas'));
    this.canvas   = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));

    // ── Create renderers ───────────────────────────────────────────────
    this.bgRenderer = new Renderer(this.bgCanvas.getContext('2d'));
    this.renderer   = new Renderer(this.canvas.getContext('2d'));

    // ── Input (attach to top-most canvas to receive all pointer events) ─
    this.input = new InputManager(this.canvas);

    // ── Asset loader ───────────────────────────────────────────────────
    this.assets = new AssetLoader();

    this.font = font;

    // ── Responsive resize ──────────────────────────────────────────────
    this.#resize();
    window.addEventListener('resize', () => this.#resize());
    window.addEventListener('orientationchange', () => this.#resize());
  }

  // ─── Responsive scaling ────────────────────────────────────────────────

  /**
   * Scale the canvases so the 1024×768 logical area fits the viewport while
   * maintaining its 4∶3 aspect ratio.  Only the CSS `width`/`height` change;
   * the internal resolution stays at 1024×768.
   */
  #resize() {
    const scaleFactor = this.canvas.width / this.canvas.height; // 4:3
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let cssW, cssH;
    if (vw / vh > scaleFactor) {
      // Viewport is wider than 4:3 → constrain by height.
      cssH = vh;
      cssW = Math.floor(vh * scaleFactor);
    } else {
      // Viewport is taller than 4:3 → constrain by width.
      cssW = vw;
      cssH = Math.floor(vw / scaleFactor);
    }

    const style = `${cssW}px`;
    const styleH = `${cssH}px`;

    for (const c of [this.bgCanvas, this.canvas]) {
      c.style.width = style;
      c.style.height = styleH;
    }

    const holder = document.getElementById('canvasHold');
    if (holder) {
      holder.style.width = style;
      holder.style.height = styleH;
    }
  }

  // ─── Game loop ─────────────────────────────────────────────────────────

  /**
   * Register a game object that implements `update(dt)` and `render(engine)`.
   *
   * @param {{ update: (dt: number) => void, render: (engine: GameEngine) => void }} game
   */
  setGame(game) {
    this.#game = game;
  }

  /**
   * Start the `requestAnimationFrame` game loop.
   */
  start() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      if (this.#game) {
        this.#game.update(dt);
        this.#game.render(this);
      }

      this.#rafId = requestAnimationFrame(loop);
    };

    this.#rafId = requestAnimationFrame(loop);
  }

  /**
   * Stop the game loop (e.g. when leaving the page).
   */
  stop() {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }
}

