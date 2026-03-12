/**
 * @file Application entry point — bootstraps the "Make A Number" game.
 *
 * This is the single `<script type="module">` loaded by `index.html`.
 * It performs the following startup sequence:
 *
 *  1. **Create the engine** — initialises canvases, renderer, input, and
 *     responsive scaling.
 *  2. **Load assets** — all six PNG images are fetched in parallel via the
 *     `AssetLoader` (Promise-based, no callbacks).
 *  3. **Create the game** — instantiates `MakeANumberGame`, which owns all
 *     state, phases, and subsystems.
 *  4. **Start the loop** — hands the game to the engine and kicks off
 *     `requestAnimationFrame`.
 *
 */

import GameEngine from './framework/GameEngine.js';
import MakeANumberGame from './game/MakeANumberGame.js';

// ── 1. Create the engine (reads canvases from the DOM) ───────────────────
const engine = new GameEngine({ font: 'Grilcb' });

// ── 2. Load all image assets in parallel ─────────────────────────────────
await engine.assets.loadAll([
  { name: 'title',         src: 'title_screen.png' },
  { name: 'game',          src: 'game_screen.png' },
  { name: 'score',         src: 'score_screen.png' },
  { name: 'stars',         src: 'stars.png' },
  { name: 'fastForward',   src: 'fast_forward.png' },
  { name: 'solutionPopup', src: 'solution_popup.png' },
]);

console.log('✅ All assets loaded — starting game');

// ── 3. Create the game object ────────────────────────────────────────────
const game = new MakeANumberGame(engine);

// ── 4. Register the game with the engine and start the loop ──────────────
engine.setGame(game);
engine.start();

