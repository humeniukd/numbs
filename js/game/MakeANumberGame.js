/**
 * @file Top-level game class — orchestrates phases, state, and subsystems.
 *
 * `MakeANumberGame` is the object registered with the {@link GameEngine}.
 * It owns:
 *
 *  • **GameState** — all mutable data (phase, cards, points, timers …).
 *  • **PuzzleGenerator** — creates solvable puzzles.
 *  • **AchievementSystem** — tracks and awards bonus points.
 *  • **Phase objects** (Title / Game / Score) — each encapsulates the
 *    rendering and input logic for one screen.
 *
 * The engine calls `update(dt)` and `render(engine)` every frame.  This
 * class delegates to the active phase and runs any time-based logic (e.g.
 * enabling the fast-forward button after 60 s or 3 resets).
 */

import GameState, { Phase } from './GameState.js';
import PuzzleGenerator from './PuzzleGenerator.js';
import AchievementSystem from './AchievementSystem.js';
import TitlePhase from './phases/TitlePhase.js';
import GamePhase from './phases/GamePhase.js';
import ScorePhase from './phases/ScorePhase.js';

export default class MakeANumberGame {
  /** @type {GameState} */
  state = new GameState();

  /** @type {PuzzleGenerator} */
  #puzzleGen = new PuzzleGenerator();

  /** @type {AchievementSystem} */
  #achievements = new AchievementSystem();

  // ── Phase handlers ─────────────────────────────────────────────────
  #titlePhase = new TitlePhase();
  #gamePhase  = new GamePhase();
  #scorePhase = new ScorePhase();

  /** @type {import('../framework/GameEngine.js').default} */
  #engine;

  /**
   * @param {import('../framework/GameEngine.js').default} engine
   */
  constructor(engine) {
    this.#engine = engine;

    // Wire up pointer-up events → delegated to the active phase.
    engine.input.onUp((x, y) => this.#handleInput(x, y));
  }

  // ─── Engine interface ──────────────────────────────────────────────────

  /**
   * Called every frame by the engine.  Runs time-based game logic such as
   * enabling the fast-forward button when the player has been stuck for a
   * while.
   *
   * @param {number} _dt - Milliseconds since last frame (unused for now but
   *   available for future animations).
   */
  update(_dt) {
    const s = this.state;
    if (s.phase !== Phase.GAME || s.finished || s.enableFastForward) return;

    const elapsed = performance.now() - s.startTime;
    if (elapsed >= 60_000 || s.resetCount >= 3) {
      s.enableFastForward = true;
    }
  }

  /**
   * Called every frame by the engine.  Delegates rendering to the active
   * phase object.
   *
   * @param {import('../framework/GameEngine.js').default} engine
   */
  render(engine) {
    switch (this.state.phase) {
      case Phase.TITLE:
        this.#titlePhase.render(engine, this.state);
        break;
      case Phase.GAME:
        this.#gamePhase.render(engine, this.state, this.#achievements);
        break;
      case Phase.SCORE:
        this.#scorePhase.render(engine, this.state, this.#achievements);
        break;
    }
  }

  // ─── Input delegation ──────────────────────────────────────────────────

  /**
   * Forward a pointer-up event to the handler for the current phase.
   */
  #handleInput(x, y) {
    const canvasW = this.#engine.canvas.width;
    switch (this.state.phase) {
      case Phase.TITLE:
        this.#titlePhase.handleInput(x, y, this.state, this);
        break;
      case Phase.GAME:
        this.#gamePhase.handleInput(
          x, y, this.state, this,
          this.#achievements, this.#puzzleGen, canvasW,
        );
        break;
      case Phase.SCORE:
        this.#scorePhase.handleInput(x, y, this.state);
        break;
    }
  }

  // ─── Game-flow methods (called by phase handlers) ──────────────────────

  /**
   * Begin a new 10-puzzle game session: reset counters, generate the first
   * puzzle, and switch to the GAME phase.
   */
  startNewGame() {
    const s = this.state;
    s.gameStartTime = performance.now();
    s.equationsSolved = 0;
    s.points = 0;
    s.skipCount = 0;
    this.#achievements.resetAll();

    this.initLevel();
    s.phase = Phase.GAME;
    s.drawBackground = true;
  }

  /**
   * Generate a new puzzle and prepare for play.
   */
  initLevel() {
    this.#puzzleGen.generate(this.state, this.#engine.canvas.width);
    this.state.finished = false;
  }

  /**
   * Called 3 s after a successful solve.  Advances to the next puzzle or
   * ends the game after 10 puzzles.
   */
  processResultOk() {
    const s = this.state;
    s.equationsSolved++;

    if (s.equationsSolved >= 10) {
      this.#achievements.evaluateGameEnd(s);

      if (s.playMode) {
        s.phase = Phase.SCORE;
      } else {
        s.phase = Phase.TITLE;
      }
      s.drawBackground = true;
    } else {
      this.initLevel();
    }
  }

  /**
   * Called 3 s after a failed solve.  Increments the reset counter and
   * restarts the same puzzle.
   */
  processResultError() {
    this.state.resetCount++;
    this.#puzzleGen.restartEquation(this.state, this.#engine.canvas.width);
    this.state.usedOperations = [];
  }
}

