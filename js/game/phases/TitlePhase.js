/**
 * @file Title-screen phase — lets the player choose card count and game mode.
 *
 * This screen is displayed at launch and after a completed game.  It shows
 * the background title image and overlays selection boxes for:
 *  • 3-card vs. 4-card mode
 *  • Practice vs. Play (competitive 10-puzzle) mode
 *
 * Clicking the lower-right area starts the game.
 */

import { BUTTONS } from '../GameState.js';
import { pointInBox } from '../../utils.js';

export default class TitlePhase {
  /**
   * Draw the title-screen UI on top of the background image.
   *
   * @param {import('../../framework/GameEngine.js').default} engine
   * @param {import('../GameState.js').default} state
   */
  render(engine, state) {
    const { renderer, canvas } = engine;

    // ── Background (drawn once, then cached) ─────────────────────────
    if (state.drawBackground) {
      engine.bgRenderer.drawImage(engine.assets.get('title'), 0, 0);
      state.drawBackground = false;
    }

    renderer.clear(canvas);

    // ── Highlight the selected card-count option ─────────────────────
    const cardBox = state.fourCardsSelected ? BUTTONS.OPTION_4CARDS : BUTTONS.OPTION_3CARDS;
    renderer.strokeRect(cardBox.x, cardBox.y, cardBox.w, cardBox.h, '#0066FF', 5);

    // ── Highlight the selected game-mode option ──────────────────────
    const modeBox = state.playMode ? BUTTONS.OPTION_PLAY : BUTTONS.OPTION_PRACTICE;
    renderer.strokeRect(modeBox.x, modeBox.y, modeBox.w, modeBox.h, '#00CCFF', 5);
  }

  /**
   * Handle a pointer-up (click / tap) on the title screen.
   *
   * @param {number} x - Logical X coordinate.
   * @param {number} y - Logical Y coordinate.
   * @param {import('../GameState.js').default} state
   * @param {import('../MakeANumberGame.js').default} game - The top-level game
   *   object, so we can trigger phase transitions.
   */
  handleInput(x, y, state, game) {
    const { OPTION_3CARDS, OPTION_4CARDS, OPTION_PLAY, OPTION_PRACTICE } = BUTTONS;

    if (pointInBox(x, y, OPTION_3CARDS.x, OPTION_3CARDS.y, OPTION_3CARDS.w, OPTION_3CARDS.h)) {
      state.fourCardsSelected = false;
    } else if (pointInBox(x, y, OPTION_4CARDS.x, OPTION_4CARDS.y, OPTION_4CARDS.w, OPTION_4CARDS.h)) {
      state.fourCardsSelected = true;
    } else if (pointInBox(x, y, OPTION_PLAY.x, OPTION_PLAY.y, OPTION_PLAY.w, OPTION_PLAY.h)) {
      state.playMode = true;
    } else if (pointInBox(x, y, OPTION_PRACTICE.x, OPTION_PRACTICE.y, OPTION_PRACTICE.w, OPTION_PRACTICE.h)) {
      state.playMode = false;
    } else if (pointInBox(x, y, 600, 600, 1024 - 600, 768 - 600)) {
      // "Start" area (lower-right quadrant of the title screen).
      game.startNewGame();
    }
  }
}

