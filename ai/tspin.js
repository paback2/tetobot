import { PIECES } from '../game/pieces.js';
import { canPlace } from '../game/board.js';

/**
 * Checks if a T-piece placement is a T-Spin according to Tetris Guideline rules.
 * This implementation uses the 3-corner rule and a kick check simulation.
 *
 * @param {number[][]} board The game board *before* the piece is placed.
 * @param {number} row The final row of the T-piece's center.
 * @param {number} col The final column of the T-piece's center.
 * @param {number} rotation The final rotation of the T-piece.
 * @param {object} lastMove The last move information, containing {x, y, rotation, kicked}.
 * @returns {{isTSpin: boolean, isMini: boolean}} An object indicating if it's a T-Spin and if it's a Mini T-Spin.
 */
export function checkTSpin(board, row, col, rotation, lastMove) {
    // 1. Three-Corner Rule: Check the four corners of the T's 3x3 bounding box.
    // Corners are named A, B (top-left, top-right) and C, D (bottom-left, bottom-right).
    const corners = {
        A: [row, col],
        B: [row, col + 2],
        C: [row + 2, col],
        D: [row + 2, col + 2],
    };

    const isFilled = (r, c) => r < 0 || r >= 20 || c < 0 || c >= 10 || board[r][c] !== 0;

    let filledCorners = 0;
    if (isFilled(corners.A[0], corners.A[1])) filledCorners++;
    if (isFilled(corners.B[0], corners.B[1])) filledCorners++;
    if (isFilled(corners.C[0], corners.C[1])) filledCorners++;
    if (isFilled(corners.D[0], corners.D[1])) filledCorners++;

    if (filledCorners < 3) {
        return { isTSpin: false, isMini: false };
    }

    // 2. T-Spin vs. Mini T-Spin (Guideline Rule)
    // It's a full T-Spin if the last move was a rotation that resulted in a kick.
    // It's a Mini T-Spin if the last move was a rotation, but it didn't kick, OR
    // if a specific corner check (the "T-Spin Mini Kick" rule) passes.

    if (!lastMove || !lastMove.kicked) {
        // If the piece was not kicked into place, it could be a Mini T-Spin if it still
        // meets the 3-corner criteria (e.g., dropped into a T-slot).
        // This is a simplified but effective check. Guideline says "immobile" T.
        // If it wasn't kicked, we'll consider it Mini.
        return { isTSpin: true, isMini: true };
    }

    // At this point, we know 3 corners are filled AND the piece was kicked.
    // This is sufficient for a full T-Spin under most guideline interpretations.
    // The distinction for Mini T-spins often involves checking if the kick
    // was a specific "easy" one (like from rotation state 0->1 or 2->1), but
    // simply checking `lastMove.kicked` is a very strong and common heuristic.
    
    // A common refinement for mini t-spins (like in TETR.IO) is the corner check.
    // If the kick came from a specific rotation and one of the "pointed" ends of the T is not obstructed,
    // it can be demoted to a mini. Let's check the two corners pointed to by the T's flat side.
    let isMini = false;
    switch (rotation) {
        case 0: // Facing up, flat side is top. Check bottom corners C, D.
            if (!isFilled(corners.C[0], corners.C[1]) || !isFilled(corners.D[0], corners.D[1])) {
                isMini = true;
            }
            break;
        case 1: // Facing right, flat side is left. Check corners A, C.
            if (!isFilled(corners.A[0], corners.A[1]) || !isFilled(corners.C[0], corners.C[1])) {
                isMini = true;
            }
            break;
        case 2: // Facing down, flat side is bottom. Check top corners A, B.
             if (!isFilled(corners.A[0], corners.A[1]) || !isFilled(corners.B[0], corners.B[1])) {
                isMini = true;
            }
            break;
        case 3: // Facing left, flat side is right. Check corners B, D.
            if (!isFilled(corners.B[0], corners.B[1]) || !isFilled(corners.D[0], corners.D[1])) {
                isMini = true;
            }
            break;
    }

    // Final decision: If it was kicked, but passes the mini-check, it's mini.
    // Otherwise, it's a full T-Spin.
    if (isMini) {
        return { isTSpin: true, isMini: true };
    }

    return { isTSpin: true, isMini: false };
}


// T-Spin + 라인 클리어 조합 판단
export function getTSpinAction(isTSpin, isMini, cleared) {
  if (!isTSpin) return 'none';

  if (isMini) {
      if (cleared === 2) return 'tsm_double'; // Special case, often counts as full
      if (cleared === 1) return 'tsm';
      return 'tsm_zero';
  } else { // Full T-Spin
      if (cleared === 3) return 'tst';
      if (cleared === 2) return 'tsd';
      if (cleared === 1) return 'tss';
      return 'tszero';
  }
}

// T-Spin Fin is a special case that is hard to detect with this logic.
// A more advanced simulation or move history would be needed.
// For now, we will not detect it.
export function detectTSpinFin(board, row, col, rotation) {
  return false;
}
