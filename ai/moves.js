import { PIECES } from '../game/pieces.js';
import { dropPiece, clearLines } from '../game/board.js';
import { evaluateBoard } from './scoring.js';
import { detectTSpin, getTSpinAction, detectTSpinFin } from './tspin.js';

// 모든 가능한 배치 찾기 (T피스 로직 통합)
export function findBestMove(board, pieceType, isB2B, mode) {
  if (pieceType === 'T') {
    return findBestTMoveInternal(board, isB2B, mode);
  }

  const rotations = PIECES[pieceType];
  let bestScore = -Infinity;
  let bestMove = null;

  for (let rot = 0; rot < rotations.length; rot++) {
    const piece = rotations[rot];
    for (let col = 0; col < 10; col++) {
      const result = dropPiece(board, piece, col);
      if (!result) continue;

      const { board: newBoard, cleared } = clearLines(result.board);

      let action = "none";
      if (cleared === 4) action = "tetris";
      else if (cleared === 3) action = "triple";
      else if (cleared === 2) action = "double";
      else if (cleared === 1) action = "single";

      const isPC = newBoard.every(row => row.every(cell => cell === 0));
      if (isPC) {
        if (action === "tetris") action = "tetris_pc";
        else if (action === "triple") action = "triple_pc";
        else if (action === "double") action = "double_pc";
        else if (action === "single") action = "single_pc";
        else action = "pc";
      }

      const isTetris = action === "tetris" || action === "tetris_pc";
      const isPCAction = ['pc','tetris_pc','single_pc','double_pc','triple_pc'].includes(action);
      const newB2B = (isB2B && (isTetris || isPCAction)) ? true : 
                    (isTetris || isPCAction) ? true : false;

      const score = evaluateBoard(newBoard, action, newB2B, 0, mode);

      if (score > bestScore) {
        bestScore = score;
        bestMove = { rotation: rot, col, score, action };
      }
    }
  }
  return bestMove;
}

// T피스 전용 로직 (내부 함수)
function findBestTMoveInternal(board, isB2B, mode) {
  const rotations = PIECES["T"];
  let bestScore = -Infinity;
  let bestMove = null;

  for (let rot = 0; rot < rotations.length; rot++) {
    const piece = rotations[rot];
    for (let col = 0; col < 10; col++) {
      const result = dropPiece(board, piece, col);
      if (!result) continue;

      const { board: newBoard, row } = result;
      const { board: clearedBoard, cleared } = clearLines(newBoard);

      const tspinType = detectTSpin(board, row, col, rot);
      const isFin = detectTSpinFin(newBoard, row, col, rot);

      let action = "none";
      if (isFin && tspinType === "full") {
        action = "tsf"; // T-Spin Fin
      } else {
        action = getTSpinAction(tspinType, cleared);
      }
      
      if (action === "none") {
        if (cleared === 1) action = "single";
        else if (cleared === 2) action = "double";
        else if (cleared === 3) action = "triple";
      }

      const isPC = clearedBoard.every(row => row.every(cell => cell === 0));
      if (isPC && !['tsd', 'tst', 'tss', 'tsf', 'tsm'].includes(action)) {
        if (cleared === 4) action = "tetris_pc"; // This is not possible with T-piece
        else if (cleared === 3) action = "triple_pc";
        else if (cleared === 2) action = "double_pc";
        else if (cleared === 1) action = "single_pc";
        else action = "pc";
      }

      const isTSpin = ['tsd','tst','tss','tsf','tsm'].includes(action);
      const isTetris = action === "tetris" || action === "tetris_pc";
      const isPCAction = ['pc','tetris_pc','single_pc','double_pc','triple_pc'].includes(action);
      const newB2B = (isB2B && (isTSpin || isTetris || isPCAction)) ? true : 
                    (isTSpin || isTetris || isPCAction) ? true : false;

      const score = evaluateBoard(clearedBoard, action, newB2B, 0, mode);

      if (score > bestScore) {
        bestScore = score;
        bestMove = { rotation: rot, col, score, action, tspinType };
      }
    }
  }
  return bestMove;
}
