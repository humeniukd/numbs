/**
 * @file Central mutable state for a single "Make A Number" session.
 *
 * All gameplay variables that change over time live here.  By keeping state
 * in one place (rather than scattered across dozens of global `var m_*`
 * declarations) we get a clear picture of what the game "knows" at any
 * moment, and it becomes trivial to reset, serialise, or inspect.
 *
 * The class is intentionally a plain data container — no logic beyond
 * simple initialisers.  Logic lives in the phase objects and systems that
 * **read and write** this state.
 */

/** Enum-like object for the three game screens / phases. */
export const Phase = Object.freeze({
  TITLE: 'TITLE',
  GAME:  'GAME',
  SCORE: 'SCORE',
});

/**
 * Layout constants for number cards.
 * @readonly
 */
export const CARD = Object.freeze({
  WIDTH:    188,
  HEIGHT:   188,
  Y:        384,
  SPACING:  30,
});

/**
 * Hit-box rectangles for various on-screen buttons.
 * Each has `{ x, y, w, h }`.
 * @readonly
 */
export const BUTTONS = Object.freeze({
  FAST_FORWARD:   { x: 882, y: 150, w: 94,  h: 80  },
  OPTION_3CARDS:  { x: 130, y: 400, w: 215, h: 180 },
  OPTION_4CARDS:  { x: 400, y: 400, w: 215, h: 180 },
  OPTION_PRACTICE:{ x: 690, y: 400, w: 205, h: 60  },
  OPTION_PLAY:    { x: 690, y: 500, w: 205, h: 60  },
  SOLUTION_POPUP: { x: 92,  y: 102, w: 840, h: 270 },
  HOME:           { x: 0,   y: 100, w: 110, h: 90  },
});

export default class GameState {
  // ─── Phase ─────────────────────────────────────────────────────────────
  /** @type {string} Current phase (one of `Phase.*`). */
  phase = Phase.TITLE;

  /** When `true`, the background image needs to be redrawn. */
  drawBackground = true;

  // ─── Title-screen options ──────────────────────────────────────────────
  /** `true` = 4 cards, `false` = 3 cards. */
  fourCardsSelected = true;

  /** `true` = competitive (10-puzzle) mode, `false` = practice. */
  playMode = true;

  // ─── Puzzle / equation ─────────────────────────────────────────────────
  /** The target number the player must reach. */
  target = 0;

  /** @type {{ code: string, x: number, y: number, w: number, h: number }[]} */
  operations = [];

  /** @type {{ n: number }[]} Original card values for the current puzzle. */
  startNumbers = [];

  /**
   * Current card values (shrinks as cards are combined).
   * Each entry also carries layout fields `x, y, w, h` once positions are
   * calculated.
   * @type {{ n: number, x?: number, y?: number, w?: number, h?: number }[]}
   */
  numbers = [];

  /** Number of cards for this game (3 or 4). */
  nrCards = 6;

  // ─── Selection state ───────────────────────────────────────────────────
  /** Index of the first selected card (`-1` = none). */
  selectedNumber1 = -1;
  /** Index of the second selected card (`-1` = none). */
  selectedNumber2 = -1;
  /** Index of the selected operation (`-1` = none). */
  selectedOperation = -1;

  // ─── Timers ────────────────────────────────────────────────────────────
  /** Timestamp (ms) when the current puzzle was presented. */
  startTime = 0;
  /** Timestamp (ms) when the 10-puzzle game began. */
  gameStartTime = 0;

  // ─── Per-puzzle flags ──────────────────────────────────────────────────
  /** `true` once the last card remains (win or lose). */
  finished = false;
  /** `true` if the remaining card matches the target. */
  resultOk = false;
  /** Whether the fast-forward / skip button is showing. */
  enableFastForward = false;
  /** Whether the solution popup overlay is visible. */
  solutionPopupActive = false;

  // ─── Counters ──────────────────────────────────────────────────────────
  /** Number of times the player pressed "reset" on this puzzle. */
  resetCount = 0;
  /** Number of undo actions on this puzzle. */
  undoCount = 0;
  /** Total puzzles solved so far (0–10). */
  equationsSolved = 0;
  /** Number of puzzles skipped (via fast-forward). */
  skipCount = 0;
  /** Accumulated points. */
  points = 0;

  // ─── Solution data ─────────────────────────────────────────────────────
  /**
   * Human-readable lines showing one valid solution.
   * @type {string[]}
   */
  solutionLines = [];

  /**
   * Snapshot of `numbers` before the most recent combine, used for undo.
   * @type {{ n: number }[] | null}
   */
  undoNumbers = null;

  /**
   * Operations used in the player's solution so far (for double-division /
   * double-subtraction achievement tracking).
   * @type {string[]}
   */
  usedOperations = [];

  /**
   * Indices into the achievements array that were earned this puzzle.
   * @type {number[]}
   */
  achievementsGained = [];
}

