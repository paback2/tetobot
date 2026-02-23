/**
 * This file is inspired by the evaluation logic in cold-clear-2.
 * https://github.com/MinusKelvin/cold-clear-2
 */

/**
 * Heuristic weights for the evaluation function.
 */
export const Weights = {
  cell_coveredness: 0,
  max_cell_covered_height: 0,
  holes: 0,
  row_transitions: 0,
  height: 0,
  height_upper_half: 0,
  height_upper_quarter: 0,
  tetris_well_depth: 0,
  tslot: [0, 0, 0, 0, 0, 0, 0, 0],
  has_back_to_back: 0,
  wasted_t: 0,
  softdrop: 0,
  normal_clears: [0, 0, 0, 0],
  mini_spin_clears: [0, 0, 0, 0],
  spin_clears: [0, 0, 0, 0],
  back_to_back_clear: 0,
  combo_attack: 0,
  perfect_clear: 0,
  perfect_clear_override: 0,
};

/**
 * Creates a default set of weights.
 * @returns {typeof Weights}
 */
export function createDefaultWeights() {
  // These weights are just placeholders and will need to be tuned.
  const weights = { ...Weights };
  weights.holes = -100;
  weights.height = -10;
  weights.perfect_clear = 10000;
  weights.spin_clears[1] = 5000; // T-Spin Double
  weights.normal_clears[3] = 2000; // Tetris
  return weights;
}

import { PIECES } from '../game/pieces.js';
import { getColumnHeights, countHoles, getRowTransitions, getCellCoveredness } from '../game/board.js';

/**
 * Evaluates a board state.
 * @param {typeof Weights} weights
 * @param {any} state - The current game state, including the board.
 * @param {any} info - Information about the placement.
 * @param {number} softdrop
 * @returns {{eval: number, reward: number}}
 */
export function evaluate(weights, state, info, softdrop) {
  let boardEval = 0;
  let reward = 0;

  // Wasted T
  if (info.piece === 'T' && !info.isTSpin) {
    reward -= weights.wasted_t;
  }

  const heights = getColumnHeights(state.board);
  const holes = countHoles(state.board, heights);
  const maxHeight = Math.max(...heights);
  const rowTransitions = getRowTransitions(state.board);
  const cellCoveredness = getCellCoveredness(state.board, weights.max_cell_covered_height);

  boardEval += holes * weights.holes;
  boardEval += maxHeight * weights.height;
  if (maxHeight > 10) {
    boardEval += (maxHeight - 10) * weights.height_upper_half;
  }
  if (maxHeight > 15) {
    boardEval += (maxHeight - 15) * weights.height_upper_quarter;
  }
  boardEval += rowTransitions * weights.row_transitions;
  boardEval += cellCoveredness * weights.cell_coveredness;

  // TODO: Implement the rest of the evaluation logic from cold-clear-2.

  return { eval: boardEval, reward };
}
