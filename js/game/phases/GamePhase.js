/**
 * @file Game-play phase — the core puzzle-solving screen.
 *
 * This phase renders:
 *  • The **target number** the player must reach.
 *  • The **number cards** (3 or 4) that can be selected and combined.
 *  • The **operation buttons** (+, −, ×, ÷).
 *  • HUD elements: points, progress, fast-forward / skip button, solution
 *    popup, and achievement ticker.
 *
 * Interaction flow:
 *  1. Player taps a **card** → it becomes "selected" (highlighted).
 *  2. Player taps an **operation** → it becomes "selected".
 *  3. Player taps a **second card** → the two cards are combined using the
 *     chosen operation.  The result replaces the first card; the second card
 *     is removed.
 *  4. Repeat until one card remains.
 *     • If it matches the target → success (achievements evaluated, next
 *       puzzle after 3 s).
 *     • If it doesn't → fail (auto-restart after 3 s).
 */

import { Phase, BUTTONS } from '../GameState.js';
import { pointInBox } from '../../utils.js';

export default class GamePhase {
  /**
   * Draw the game-play screen.
   */
  render(engine, state, achievements) {
    const { renderer, canvas, font } = engine;

    // ── Background ───────────────────────────────────────────────────
    if (state.drawBackground) {
      engine.bgRenderer.drawImage(engine.assets.get('game'), 0, 0);
      state.drawBackground = false;
    }

    renderer.clear(canvas);

    // ── Target number ────────────────────────────────────────────────
    renderer.fillText(
      `TARGET: ${state.target}`,
      512, 73,
      `56pt ${font}`, '#FFFF00', 'center',
    );

    // ── Points & progress (Play mode only) ───────────────────────────
    if (state.playMode) {
      renderer.fillText(`Points: ${state.points}`,                          20, 710, `24pt ${font}`, '#00CCCC', 'left');
      renderer.fillText(`Progress: ${state.equationsSolved + 1} / 10`, 20, 750, `24pt ${font}`, '#00CCCC', 'left');
    }

    // ── Victory stars ────────────────────────────────────────────────
    if (state.finished && state.resultOk) {
      const stars = engine.assets.get('stars');
      renderer.drawImage(stars, 512 - Math.floor(stars.width / 2), 325);
    }

    // ── Adaptive card font size ──────────────────────────────────────
    // Shrink the font until every card's text fits within its box.
    const ctx = renderer.ctx;
    let fs = 94;
    do {
      fs -= 2;
      ctx.font = `${fs}pt ${font}`;
    } while (
      state.numbers.some((card) => ctx.measureText(card.n.toString()).width > card.w - 16)
    );

    // ── Draw number cards ────────────────────────────────────────────
    for (let i = 0; i < state.numbers.length; i++) {
      const card = state.numbers[i];

      // Card background (rounded rect with inner fill).
      renderer.strokeFillRoundedRect(card.x, card.y, card.w, card.h, 4, '#003399', 4, '#003399');
      renderer.fillRect(card.x + 6, card.y + 6, card.w - 12, card.h - 12, '#0066FF');

      // Card value.
      const text = Number.isInteger(card.n) ? card.n.toString() : card.n.toFixed(1);
      renderer.fillText(
        text,
        card.x + Math.floor(card.w / 2),
        card.y + Math.floor(card.h / 2) + Math.floor(fs / 2),
        `${fs}pt ${font}`, 'white', 'center',
      );

      // Highlight when selected.
      if (i === state.selectedNumber1) {
        renderer.fillRect(card.x - 2, card.y - 2, card.w + 4, card.h + 4, 'rgba(255,255,255,0.3)');
      }
    }

    // ── Highlight the selected operation ──────────────────────────────
    if (state.selectedOperation >= 0) {
      const op = state.operations[state.selectedOperation];
      renderer.fillRect(op.x - 2, op.y - 2, op.w + 4, op.h + 4, 'rgba(255,255,255,0.3)');
    }

    // ── Solution popup ───────────────────────────────────────────────
    if (state.solutionPopupActive) {
      const sp = BUTTONS.SOLUTION_POPUP;
      renderer.drawImage(engine.assets.get('solutionPopup'), sp.x, sp.y);
      state.solutionLines.forEach((line, i) => {
        renderer.fillText(line, Math.floor(canvas.width / 2), sp.y + 90 + i * 54 + 18, `36pt ${font}`, 'black', 'center');
      });
    } else if (state.enableFastForward) {
      // Show the fast-forward / skip button.
      renderer.drawImage(engine.assets.get('fastForward'), BUTTONS.FAST_FORWARD.x, BUTTONS.FAST_FORWARD.y);
    }

    // ── Achievement ticker (bottom of screen) ────────────────────────
    if (state.achievementsGained.length > 0) {
      const text = state.achievementsGained
        .map((idx) => achievements.definitions[idx].text)
        .join(' | ');
      renderer.fillText(text, 668, 729, `16pt ${font}`, 'black', 'center');
    }
  }

  // ─── Input handling ──────────────────────────────────────────────────

  /**
   * Handle a pointer-up event during the game phase.
   *
   * @param {number} x
   * @param {number} y
   * @param {import('../GameState.js').default} state
   * @param {import('../MakeANumberGame.js').default} game
   * @param {import('../AchievementSystem.js').default} achievements
   * @param {import('../PuzzleGenerator.js').default} puzzleGen
   * @param {number} canvasWidth
   */
  handleInput(x, y, state, game, achievements, puzzleGen, canvasWidth) {
    if (state.finished) return; // Wait for the timeout to advance.

    // ── If the solution popup is showing, any click advances ─────────
    if (state.solutionPopupActive) {
      game.initLevel();
      return;
    }

    // ── Undo button (top-right) ──────────────────────────────────────
    if (pointInBox(x, y, 916, 0, 108, 98)) {
      if (state.selectedNumber1 < 0) {
        // Undo the last combine step.
        if (state.undoNumbers) {
          state.numbers = structuredClone(state.undoNumbers);
          state.undoNumbers = null;
          state.undoCount++;
          puzzleGen.calculatePositions(state, canvasWidth);
          state.selectedNumber1 = state.selectedNumber2 = state.selectedOperation = -1;
          // Also undo the last used operation tracking.
          state.usedOperations.pop();
        }
      } else {
        // Just deselect.
        state.selectedNumber1 = state.selectedNumber2 = state.selectedOperation = -1;
        state.undoCount++;
      }
      return;
    }

    // ── Restart button (top-left) ────────────────────────────────────
    if (pointInBox(x, y, 0, 0, 108, 98)) {
      if (state.numbers.length < state.nrCards) state.resetCount++;
      puzzleGen.restartEquation(state, canvasWidth);
      state.usedOperations = [];
      return;
    }

    // ── Home button ──────────────────────────────────────────────────
    if (pointInBox(x, y, BUTTONS.HOME.x, BUTTONS.HOME.y, BUTTONS.HOME.w, BUTTONS.HOME.h)) {
      state.phase = Phase.TITLE;
      state.drawBackground = true;
      return;
    }

    // ── Card selection ───────────────────────────────────────────────
    let executeStep = false;
    for (let i = 0; i < state.numbers.length; i++) {
      const c = state.numbers[i];
      if (!pointInBox(x, y, c.x, c.y, c.w, c.h)) continue;

      if (i === state.selectedNumber1 && state.selectedOperation < 0) {
        // Tap the same card again → deselect.
        state.selectedNumber1 = -1;
        state.undoCount++;
      } else if (state.selectedNumber1 < 0) {
        // First card selection.
        state.selectedNumber1 = i;
      } else if (state.selectedNumber2 < 0 && state.selectedOperation >= 0 && i !== state.selectedNumber1) {
        // Second card → ready to execute.
        state.selectedNumber2 = i;
        executeStep = true;
      }
      break;
    }

    // ── Operation selection ──────────────────────────────────────────
    if (!executeStep) {
      for (let i = 0; i < state.operations.length; i++) {
        const op = state.operations[i];
        if (pointInBox(x, y, op.x, op.y, op.w, op.h) && state.selectedNumber1 >= 0) {
          state.selectedOperation = i;
          break;
        }
      }
    }

    // ── Execute the combine step ─────────────────────────────────────
    if (executeStep) {
      this.#executeStep(state, game, achievements, puzzleGen, canvasWidth);
    }

    // ── Fast-forward / skip ──────────────────────────────────────────
    if (state.enableFastForward) {
      const ff = BUTTONS.FAST_FORWARD;
      if (pointInBox(x, y, ff.x, ff.y, ff.w, ff.h)) {
        state.solutionPopupActive = true;
        state.skipCount++;
      }
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  /**
   * Combine the two selected cards using the selected operation.
   *
   * If the operation is invalid (e.g. non-integer division, division by
   * zero) the selection is simply cleared.
   */
  #executeStep(state, game, achievements, puzzleGen, canvasWidth) {
    const opCode = state.operations[state.selectedOperation].code;
    const a = state.numbers[state.selectedNumber1].n;
    const b = state.numbers[state.selectedNumber2].n;
    let n;

    switch (opCode) {
      case '+': n = a + b; break;
      case '-': n = a - b; break;
      case '*': n = a * b; break;
      case '/':
        if (b === 0 || !Number.isInteger(a / b)) {
          this.#clearSelection(state);
          return;
        }
        n = a / b;
        break;
    }

    // Save state for undo, then build the new card array.
    state.undoNumbers = structuredClone(state.numbers);
    const next = [];
    for (let i = 0; i < state.numbers.length; i++) {
      if (i === state.selectedNumber1) next.push({ n });
      else if (i !== state.selectedNumber2) next.push({ n: state.numbers[i].n });
    }
    state.numbers = next;

    // Track which operation was used (for achievements).
    state.usedOperations.push(opCode);

    puzzleGen.calculatePositions(state, canvasWidth);
    state.selectedNumber1 = state.selectedNumber2 = state.selectedOperation = -1;

    // ── Check if the puzzle is finished ──────────────────────────────
    if (state.numbers.length === 1) {
      state.finished = true;
      if (state.numbers[0].n === state.target) {
        // ✅ Success!
        state.resultOk = true;
        state.enableFastForward = false;
        achievements.evaluateSolve(state);
        setTimeout(() => game.processResultOk(), 3000);
      } else {
        // ❌ Wrong result — auto-restart after delay.
        setTimeout(() => game.processResultError(), 3000);
      }
    }
  }

  /**
   * Clear all selection indices (used on invalid operations).
   */
  #clearSelection(state) {
    state.selectedNumber1 = state.selectedNumber2 = state.selectedOperation = -1;
  }
}


