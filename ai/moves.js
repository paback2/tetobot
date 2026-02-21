import { PIECES } from '../game/pieces.js';
import { canPlace, placePiece, clearLines, dropRowOn } from '../game/board.js';
import { evaluateBoard } from './scoring.js';
import { checkTSpin, getTSpinAction } from './tspin.js';

const LOOKAHEAD_DEPTH = 2;
const BEAM_WIDTH = 8;

function isPerfectClear(board) {
  return board.every(row => row.every(cell => cell === 0));
}

function findAllMovePositions(board, pieceType) {
  const rotations = PIECES[pieceType];
  const allMoves = [];
  const seen = new Set();

  for (let rot = 0; rot < rotations.length; rot++) {
    const piece = rotations[rot];
    // Allow pieces to start off-screen to slide in
    for (let col = -2; col < 10; col++) {
      const row = dropRowOn(board, piece, col);
      if (row !== -1) {
        // dropRowOn gives the final resting place, check if this move is valid
        if (canPlace(board, piece, row, col)) {
            const key = `${rot}-${col}-${row}`;
            if (!seen.has(key)) {
                seen.add(key);
                allMoves.push({ rotation: rot, row, col, piece });
            }
        }
      }
    }
  }
  return allMoves;
}

function _findMovesForPiece(board, pieceType, isB2B, mode) {
  const pieceMoves = findAllMovePositions(board, pieceType);
  const scoredMoves = [];

  for (const move of pieceMoves) {
    const { rotation, row, col, piece } = move;
    
    // Now, we place the piece and score the result
    const boardWithPiece = placePiece(board, piece, row, col);
    const { board: clearedBoard, cleared } = clearLines(boardWithPiece);
    
    let action = 'none';
    let isTSpin = false, isMini = false;

    if (pieceType === 'T') {
      // Use the pre-placement board to check for T-spin conditions
      const tspinResult = checkTSpin(board, row, col, rotation, false); // Kicks aren't handled yet
      if (tspinResult.isTSpin) {
        isTSpin = true;
        isMini = tspinResult.isMini;
        action = getTSpinAction(true, isMini, cleared);
      }
    }

    if (!isTSpin) {
      action = ['none', 'single', 'double', 'triple', 'tetris'][cleared] || 'none';
    }
    
    if (isPerfectClear(clearedBoard)) {
      action = cleared > 0 ? `${action}_pc` : 'pc';
    }

    let newB2B = isB2B;
    if (isTSpin || action.includes('tetris')) {
      newB2B = true;
    } else if (isB2B && cleared > 0 && cleared < 4) {
      newB2B = false;
    }

    const score = evaluateBoard(clearedBoard, action, newB2B, 0, mode);
    scoredMoves.push({
      move,
      score,
      board: clearedBoard,
      b2b: newB2B,
      action
    });
  }
  return scoredMoves;
}

function findBestMoveRecursive(board, pieces, isB2B, mode) {
  if (pieces.length === 0) {
    return { score: evaluateBoard(board, 'none', isB2B, 0, mode), move: null };
  }

  const [currentPiece, ...nextPieces] = pieces;
  const moves = _findMovesForPiece(board, currentPiece, isB2B, mode);

  if (moves.length === 0) {
    return { score: -Infinity, move: null };
  }

  if (nextPieces.length === 0) {
    moves.sort((a, b) => b.score - a.score);
    return moves[0] ? { score: moves[0].score, move: moves[0].move, action: moves[0].action } : { score: -Infinity, move: null, action: 'none' };
  }

  moves.sort((a, b) => b.score - a.score);
  const candidates = moves.slice(0, BEAM_WIDTH);
  
  let bestScore = -Infinity;
  let bestMove = candidates.length > 0 ? candidates[0].move : null;
  let bestAction = candidates.length > 0 ? candidates[0].action : 'none';

  for (const candidate of candidates) {
    const futureResult = findBestMoveRecursive(candidate.board, nextPieces, candidate.b2b, mode);
    const totalScore = futureResult.score; // IGNORE intermediate score, only look at the final board state

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = candidate.move;
      bestAction = candidate.action;
    }
  }

  return { score: bestScore, move: bestMove, action: bestAction };
}

export function findBestMove(board, pieces, isB2B, mode) {
  if (!pieces || pieces.length === 0) {
    return null;
  }
  
  const lookaheadPieces = pieces.slice(0, LOOKAHEAD_DEPTH);
  const result = findBestMoveRecursive(board, lookaheadPieces, isB2B, mode);

  if (!result || !result.move) {
    const fallbackMoves = _findMovesForPiece(board, pieces[0], isB2B, mode);
    if (fallbackMoves.length === 0) return null;
    fallbackMoves.sort((a, b) => b.score - a.score);
    return fallbackMoves[0].move;
  }

  return { ...result.move, action: result.action };
}
