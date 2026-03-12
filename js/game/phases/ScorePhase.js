/**
 * @file Score-screen phase — displays achievements and total points.
 *
 * Shown after the player completes all 10 puzzles in Play mode.  Lists
 * every achievement earned (with counts if earned multiple times) and the
 * final point total.  Clicking the lower-right area returns to the title
 * screen.
 */

import { Phase } from '../GameState.js';
import { pointInBox } from '../../utils.js';

export default class ScorePhase {
  /**
   * Render the score / achievements summary.
   *
   * @param {import('../../framework/GameEngine.js').default} engine
   * @param {import('../GameState.js').default} state
   * @param {import('../AchievementSystem.js').default} achievements
   */
  render(engine, state, achievements) {
    const { renderer, canvas, font } = engine;

    // ── Background ───────────────────────────────────────────────────
    if (state.drawBackground) {
      engine.bgRenderer.drawImage(engine.assets.get('score'), 0, 0);
      state.drawBackground = false;
    }

    renderer.clear(canvas);

    // ── List earned achievements ─────────────────────────────────────
    let y = 250;
    for (const def of achievements.definitions) {
      if (def.count > 0) {
        let label = def.text;
        if (def.count > 1) label += ` (${def.count})`;
        renderer.fillText(label, Math.floor(canvas.width / 2), y, `24pt ${font}`, 'black', 'center');
        y += 36;
      }
    }

    // ── Total points ─────────────────────────────────────────────────
    renderer.fillText(
      `${state.points} points`,
      Math.floor(canvas.width / 2), y,
      `24pt ${font}`, 'black', 'center',
    );
  }

  /**
   * Handle a pointer-up event on the score screen.
   *
   * @param {number} x
   * @param {number} y
   * @param {import('../GameState.js').default} state
   */
  handleInput(x, y, state) {
    // Click anywhere in the lower-right area to go back to the title.
    if (pointInBox(x, y, 600, 600, 1024 - 600, 768 - 600)) {
      state.phase = Phase.TITLE;
      state.drawBackground = true;
    }
  }
}

