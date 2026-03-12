/**
 * @file Achievement definitions, tracking, and point calculation.
 *
 * The achievement system awards bonus points for feats such as solving a
 * puzzle quickly, never resetting, or completing all 10 puzzles without
 * skipping.  Each achievement has a human-readable label, a point value,
 * and a running count (how many times it was earned in this session).
 */

/**
 * Achievement identifier constants.
 * @readonly
 * @enum {number}
 */
export const Achievement = Object.freeze({
  /** Solved the puzzle in under 15 seconds. */
  SOLVE_15S:                  0,
  /** Solved the puzzle in under 30 seconds. */
  SOLVE_30S:                  1,
  /** Solved the puzzle in under 45 seconds. */
  SOLVE_45S:                  2,
  /** Solved the puzzle in under 60 seconds. */
  SOLVE_60S:                  3,
  /** Solved despite resetting 3+ times (perseverance award). */
  SOLVE_RESET_3X:             4,
  /** Solved without any resets or undos (perfect play). */
  SOLVE_NO_RESET_OR_UNDO:     5,
  /** Used division twice in one solution. */
  SOLVE_DOUBLE_DIVISION:      6,
  /** Used subtraction twice in one solution. */
  SOLVE_DOUBLE_SUBTRACTION:   7,
  /** Completed all 10 puzzles without skipping any. */
  COMPLETE_NO_SKIP:           8,
  /** Completed all 10 puzzles in under 4 minutes. */
  COMPLETE_4M:                9,
});

/**
 * @typedef {Object} AchievementDef
 * @property {string} text   - Display label shown to the player.
 * @property {number} points - Bonus points awarded each time this is earned.
 * @property {number} count  - Times earned in this session (mutable).
 */

export default class AchievementSystem {
  /** @type {AchievementDef[]} */
  definitions = [
    { text: 'under 15 sec',       points: 100, count: 0 },
    { text: 'under 30 sec',       points: 75,  count: 0 },
    { text: 'under 45 sec',       points: 50,  count: 0 },
    { text: 'under 60 sec',       points: 25,  count: 0 },
    { text: "didn't give up",     points: 100, count: 0 },
    { text: 'perfect level',      points: 50,  count: 0 },
    { text: 'double division',    points: 25,  count: 0 },
    { text: 'double subtraction', points: 25,  count: 0 },
    { text: 'no skips',           points: 200, count: 0 },
    { text: 'super fast',         points: 500, count: 0 },
  ];

  /**
   * Reset every achievement count to zero (called at the start of a new
   * 10-puzzle game).
   */
  resetAll() {
    for (const def of this.definitions) {
      def.count = 0;
    }
  }

  /**
   * Award an achievement: push its index to the state's gained list,
   * increment the session count, and add its points to the player's total.
   *
   * @param {number} index        - One of the `Achievement.*` constants.
   * @param {import('./GameState.js').default} state - Current game state.
   */
  award(index, state) {
    state.achievementsGained.push(index);
    const def = this.definitions[index];
    def.count += 1;
    state.points += def.points;
    console.log(`🏆 Achievement: "${def.text}" (+${def.points} pts)`);
  }

  /**
   * Evaluate time-based and behaviour-based achievements after a successful
   * solve.  Call this once immediately after the player reaches the target.
   *
   * @param {import('./GameState.js').default} state
   */
  evaluateSolve(state) {
    const elapsed = performance.now() - state.startTime;

    // ── Speed achievements (mutually exclusive tiers) ─────────────────
    if (elapsed < 15_000)      this.award(Achievement.SOLVE_15S, state);
    else if (elapsed < 30_000) this.award(Achievement.SOLVE_30S, state);
    else if (elapsed < 45_000) this.award(Achievement.SOLVE_45S, state);
    else if (elapsed < 60_000) this.award(Achievement.SOLVE_60S, state);

    // ── Perfect play ─────────────────────────────────────────────────
    if (state.resetCount === 0 && state.undoCount === 0) {
      this.award(Achievement.SOLVE_NO_RESET_OR_UNDO, state);
    }

    // ── Perseverance ─────────────────────────────────────────────────
    if (state.resetCount >= 3) {
      this.award(Achievement.SOLVE_RESET_3X, state);
    }

    // ── Double-division / double-subtraction (now actually tracked!) ─
    const divCount = state.usedOperations.filter((op) => op === '/').length;
    const subCount = state.usedOperations.filter((op) => op === '-').length;
    if (divCount >= 2) this.award(Achievement.SOLVE_DOUBLE_DIVISION, state);
    if (subCount >= 2) this.award(Achievement.SOLVE_DOUBLE_SUBTRACTION, state);
  }

  /**
   * Evaluate game-completion achievements (called after the 10th puzzle).
   *
   * @param {import('./GameState.js').default} state
   */
  evaluateGameEnd(state) {
    if (state.skipCount === 0) {
      this.award(Achievement.COMPLETE_NO_SKIP, state);
    }
    const totalElapsed = performance.now() - state.gameStartTime;
    if (totalElapsed < 240_000) {
      this.award(Achievement.COMPLETE_4M, state);
    }
  }
}

