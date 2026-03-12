/**
 * @file Puzzle generator — creates a solvable "Make A Number" puzzle.
 *
 * A puzzle consists of 3 or 4 number cards and a target number.  The
 * generator works **backwards**: it picks random cards, then randomly
 * combines them with `+`, `−`, `×`, `÷` until one number remains.
 * That final number becomes the target, and the original cards are
 * presented to the player.
 *
 * Because the combination sequence is recorded, the generator always
 * knows at least one valid solution (stored as human-readable lines).
 *
 * Constraints enforced during generation:
 *  • No intermediate result ≥ 100 (keeps numbers manageable).
 *  • No negative intermediate results.
 *  • Division must yield an integer (no fractions mid-solve).
 *  • No division by zero.
 *
 * If any constraint is violated the generator simply restarts its
 * random walk — this is fast in practice because the search space is
 * small.
 */

import { CARD } from './GameState.js';

export default class PuzzleGenerator {
  /**
   * Generate a new puzzle and write the results directly into `state`.
   *
   * Sets:
   *  - `state.target`
   *  - `state.startNumbers`
   *  - `state.solutionLines`
   *  - `state.operations`  (the four operation buttons with positions)
   *  - then calls `restartEquation()` equivalent on the state.
   *
   * @param {import('./GameState.js').default} state
   * @param {number} canvasWidth - Logical canvas width (for centering).
   */
  generate(state, canvasWidth) {
    const opCodes = ['+', '-', '*', '/'];

    // ── Build operation button layout ──────────────────────────────────
    state.operations = opCodes.map((code, i) => ({
      code,
      x: 220 + i * 160,
      y: 196,
      w: 104,
      h: 104,
    }));

    // ── Pick starting card values ──────────────────────────────────────
    state.nrCards = state.fourCardsSelected ? 4 : 3;

    const pickArray = [];

    for (let i = 0; i < state.nrCards; i++) {
      // Ensure the first card is at least 2 (limits trivial '1' cards).
      const minVal = i === 0 ? 2 : 1;
      for (let j = minVal; j <= 10; j++) {
        pickArray.push(j);
      }
    }

    state.startNumbers = [];
    const available = [...pickArray];

    for (let i = 0; i < state.nrCards; i++) {
      const idx = Math.floor(Math.random() * available.length);
      state.startNumbers.push({ n: available[idx] });
      available.splice(idx, 1);
    }

    // ── Random-walk to build a guaranteed solution ─────────────────────
    let reset = true;
    let numbers;

    do {
      if (reset) {
        numbers = state.startNumbers.map((c) => c.n);
        state.solutionLines = [];
        reset = false;
      }

      do {
        // Pick two distinct card indices at random.
        const i1 = Math.floor(Math.random() * numbers.length);
        let i2;
        do { i2 = Math.floor(Math.random() * numbers.length); } while (i1 === i2);

        // Pick a random operation.
        const op = opCodes[Math.floor(Math.random() * opCodes.length)];
        let n;

        switch (op) {
          case '+':
            n = numbers[i1] + numbers[i2];
            state.solutionLines.push(`${numbers[i1]} + ${numbers[i2]} = ${n}`);
            if (n >= 100) reset = true;
            break;

          case '-':
            n = numbers[i1] - numbers[i2];
            state.solutionLines.push(`${numbers[i1]} - ${numbers[i2]} = ${n}`);
            if (n < 0) reset = true;
            break;

          case '*':
            n = numbers[i1] * numbers[i2];
            state.solutionLines.push(`${numbers[i1]} × ${numbers[i2]} = ${n}`);
            if (n >= 100) reset = true;
            break;

          case '/':
            if (numbers[i2] === 0) {
              reset = true;
            } else {
              n = numbers[i1] / numbers[i2];
              state.solutionLines.push(`${numbers[i1]} ÷ ${numbers[i2]} = ${n}`);
              if (!Number.isInteger(n)) reset = true;
            }
            break;
        }

        if (!reset) {
          // Remove the two used cards, place the result at i1's position.
          const next = [];
          for (let k = 0; k < numbers.length; k++) {
            if (k === i1) next.push(n);
            else if (k !== i2) next.push(numbers[k]);
          }
          numbers = next;
        }
      } while (!reset && numbers.length > 1);
    } while (reset);

    // The last remaining number is the target.
    state.target = numbers[0];

    // ── Initialise per-puzzle state ────────────────────────────────────
    this.#restartEquation(state, canvasWidth);

    state.startTime = performance.now();
    state.enableFastForward = false;
    state.resetCount = 0;
    state.undoCount = 0;
    state.undoNumbers = null;
    state.solutionPopupActive = false;
    state.achievementsGained = [];
    state.usedOperations = [];
  }

  /**
   * Copy `startNumbers` back into `numbers` and reset selection.
   * Used both when generating and when the player hits "restart".
   *
   * @param {import('./GameState.js').default} state
   * @param {number} canvasWidth
   */
  restartEquation(state, canvasWidth) {
    this.#restartEquation(state, canvasWidth);
    state.finished = false;
    state.resultOk = false;
  }

  /**
   * Internal helper that rebuilds the card array from `startNumbers`.
   */
  #restartEquation(state, canvasWidth) {
    state.numbers = state.startNumbers.map((c) => ({ n: c.n }));
    this.calculatePositions(state, canvasWidth);
    state.selectedNumber1 = -1;
    state.selectedNumber2 = -1;
    state.selectedOperation = -1;
    state.finished = false;
    state.resultOk = false;
  }

  /**
   * Recalculate the `x, y, w, h` layout of every card so they are
   * horizontally centred on the canvas.
   *
   * @param {import('./GameState.js').default} state
   * @param {number} canvasWidth
   */
  calculatePositions(state, canvasWidth) {
    const count = state.numbers.length;
    const totalWidth = count * CARD.WIDTH + (count - 1) * CARD.SPACING;
    const xStart = Math.floor(canvasWidth / 2 - totalWidth / 2);

    for (let i = 0; i < count; i++) {
      state.numbers[i].x = xStart + i * (CARD.WIDTH + CARD.SPACING);
      state.numbers[i].y = CARD.Y;
      state.numbers[i].w = CARD.WIDTH;
      state.numbers[i].h = CARD.HEIGHT;
    }
  }
}

