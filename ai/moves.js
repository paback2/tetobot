import { PIECES } from '../game/pieces.js';
import { canPlace, placePiece, clearLines, dropRowOn, performHold, isHoldAvailable } from '../game/board.js';
import { evaluateBoard } from './scoring.js';
import { checkTSpin, getTSpinAction } from './tspin.js';

const LOOKAHEAD_DEPTH = 6;  // Cold Clear 스타일: 더 깊은 lookahead
const BEAM_WIDTH = 24;  // Top candidates to explore

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
    let tSpinBonus = 0;

    if (pieceType === 'T') {
      // T-피스의 중심 좌표 (piece의 왼쪽 위 기준)
      // Rotation 0: [[0,1,0], [1,1,1]] → 중심 (1,1) 상대좌표
      // Rotation 1: [[1,0], [1,1], [1,0]] → 중심 (1,1) 상대좌표
      // Rotation 2: [[1,1,1], [0,1,0]] → 중심 (0,1) 상대좌표
      // Rotation 3: [[0,1], [1,1], [0,1]] → 중심 (1,1) 상대좌표
      let centerR = row + 1, centerC = col + 1;
      if (rotation === 2) { centerR = row; }  // Rotation 2만 row 조정
      
      // T-piece을 놓은 후의 board에서 확인해야 함!
      const wasRotated = rotation !== 0;
      const tspinResult = checkTSpin(boardWithPiece, centerR, centerC, rotation, false, wasRotated, 0);
      if (tspinResult.isTSpin && cleared > 0) {  // T-Spin은 line clear와 함께만 유효
        isTSpin = true;
        isMini = tspinResult.isMini;
        action = getTSpinAction(true, isMini, cleared);
        
        // Cold Clear 2 스타일: T-Spin에 매우 높은 점수 부여
        if (!isMini) {  // Full T-Spin
          // TSD: 5500, TST: 9000, TSS: 3000, TSSZero: 1500
          const tSpinScores = [1500, 3000, 5500, 9000];
          tSpinBonus = tSpinScores[Math.min(cleared, 3)] || 1500;
        } else {  // Mini T-Spin
          // Mini는 낮은 점수 (setup을 방해할 수 있음)
          tSpinBonus = cleared > 0 ? 500 : 100;
        }
      }
    }

    if (!isTSpin) {
      action = ['none', 'single', 'double', 'triple', 'tetris'][cleared] || 'none';
    }
    
    let perfectClearBonus = 0;
    if (isPerfectClear(clearedBoard)) {
      action = cleared > 0 ? `${action}_pc` : 'pc';
      // Perfect Clear: 매우 높은 점수 (20000+)
      perfectClearBonus = 20000;
    }

    let newB2B = isB2B;
    if (isTSpin || action.includes('tetris')) {
      newB2B = true;
    } else if (isB2B && cleared > 0 && cleared < 4) {
      newB2B = false;
    }

    const baseScore = evaluateBoard(clearedBoard, action, newB2B, 0, mode);
    const score = baseScore + tSpinBonus + perfectClearBonus;
    
    scoredMoves.push({
      move,
      score,
      baseScore,
      tSpinBonus,
      perfectClearBonus,
      board: clearedBoard,
      b2b: newB2B,
      action,
      isTSpin,
      isMini
    });
  }
  return scoredMoves;
}

/**
 * 홀드 사용을 고려하여 현재 피스의 최적 움직임을 구함
 * @param {number[][]} board - 게임 보드
 * @param {string} currentPiece - 현재 피스
 * @param {string|null} heldPiece - 홀드된 피스 (없으면 null)
 * @param {boolean} canHold - 홀드 사용 가능 여부
 * @param {boolean} isB2B - Back-to-Back 상태
 * @param {string} mode - 게임 모드
 * @returns {{bestMoveNoHold: object, bestMoveWithHold: object|null}} 홀드하지 않은 경우와 홀드한 경우의 최적 움직임
 */
function evaluateWithHold(board, currentPiece, heldPiece, canHold, isB2B, mode) {
  const noHoldMoves = _findMovesForPiece(board, currentPiece, isB2B, mode);
  let bestMoveNoHold = null;
  if (noHoldMoves.length > 0) {
    noHoldMoves.sort((a, b) => b.score - a.score);
    bestMoveNoHold = {
      ...noHoldMoves[0].move,
      action: noHoldMoves[0].action,
      score: noHoldMoves[0].score,
      board: noHoldMoves[0].board,
      b2b: noHoldMoves[0].b2b,
      usedHold: false
    };
  }

  let bestMoveWithHold = null;
  if (canHold && heldPiece !== null) {
    // 홀드된 피스를 사용할 수 있음
    const withHoldMoves = _findMovesForPiece(board, heldPiece, isB2B, mode);
    if (withHoldMoves.length > 0) {
      withHoldMoves.sort((a, b) => b.score - a.score);
      // 홀드를 사용할 때는 점수를 약간 감소 (전략적 선택이므로)
      const holdPenalty = 50; // 약간의 페널티를 주어 홀드를 덜 사용하도록
      bestMoveWithHold = {
        ...withHoldMoves[0].move,
        action: withHoldMoves[0].action,
        score: Math.max(-Infinity, withHoldMoves[0].score - holdPenalty),
        board: withHoldMoves[0].board,
        b2b: withHoldMoves[0].b2b,
        usedHold: true,
        heldPiece: currentPiece
      };
    }
  } else if (canHold && heldPiece === null) {
    // 첫 번째 홀드 사용 (다음 피스를 받을 것)
    // 이 경우는 다음 피스의 정보 없이는 평가할 수 없으므로
    // lookahead에서 처리해야 함
    bestMoveWithHold = {
      action: 'hold',
      score: 0, // 실제 점수는 lookahead에서 계산
      usedHold: true,
      heldPiece: currentPiece
    };
  }

  return { bestMoveNoHold, bestMoveWithHold };
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
  const depth = Math.max(0, LOOKAHEAD_DEPTH - nextPieces.length - 1);
  const dynamicBeam = Math.max(8, BEAM_WIDTH - depth * 3);
  const candidates = moves.slice(0, dynamicBeam);
  
  let bestScore = -Infinity;
  let bestMove = candidates.length > 0 ? candidates[0].move : null;
  let bestAction = candidates.length > 0 ? candidates[0].action : 'none';

  for (const candidate of candidates) {
    const futureResult = findBestMoveRecursive(candidate.board, nextPieces, candidate.b2b, mode);
    const totalScore = candidate.score * 0.55 + futureResult.score * 0.95;

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

/**
 * 홀드 기능을 포함하여 최적의 움직임을 찾음
 * @param {number[][]} board - 게임 보드
 * @param {string[]} pieces - 피스 큐 (현재 피스, 다음 피스, ...)
 * @param {string|null} heldPiece - 홀드된 피스 (없으면 null)
 * @param {boolean} canHold - 홀드 사용 가능 여부
 * @param {boolean} isB2B - Back-to-Back 상태
 * @param {string} mode - 게임 모드
 * @returns {object} 최적 움직임 정보 (usedHold 플래그 포함)
 */
export function findBestMoveWithHold(board, pieces, heldPiece, canHold, isB2B, mode) {
  if (!pieces || pieces.length === 0) {
    return null;
  }

  const currentPiece = pieces[0];
  const remainingPieces = pieces.slice(1);

  const evaluateBranch = (candidate, futurePieces, usedHold, extra = {}) => {
    const lookahead = futurePieces.slice(0, LOOKAHEAD_DEPTH - 1);
    const future = findBestMoveRecursive(candidate.board, lookahead, candidate.b2b, mode);
    const branchScore = candidate.score * 0.55 + future.score * 0.95;

    return {
      ...candidate.move,
      action: candidate.action,
      score: branchScore,
      board: candidate.board,
      b2b: candidate.b2b,
      usedHold,
      isTSpinOpportunity: candidate.isTSpin && !candidate.isMini,
      isPCOpportunity: candidate.action.includes('_pc') || candidate.action === 'pc',
      ...extra
    };
  };

  // 1) no hold
  const noHoldMoves = _findMovesForPiece(board, currentPiece, isB2B, mode);
  let bestNoHold = null;
  for (const move of noHoldMoves.slice(0, Math.min(BEAM_WIDTH, noHoldMoves.length))) {
    const evaluated = evaluateBranch(move, remainingPieces, false);
    if (!bestNoHold || evaluated.score > bestNoHold.score) {
      bestNoHold = evaluated;
    }
  }

  // 2) hold path
  let bestWithHold = null;

  if (canHold && heldPiece !== null) {
    const holdMoves = _findMovesForPiece(board, heldPiece, isB2B, mode);
    for (const move of holdMoves.slice(0, Math.min(BEAM_WIDTH, holdMoves.length))) {
      const evaluated = evaluateBranch(move, remainingPieces, true, { swappedPiece: currentPiece });
      // hold 기본 페널티. 다만 T-Spin/PC는 페널티 완화
      const holdPenalty = evaluated.isPCOpportunity ? 0 : (evaluated.isTSpinOpportunity ? 20 : 70);
      evaluated.score -= holdPenalty;
      if (!bestWithHold || evaluated.score > bestWithHold.score) {
        bestWithHold = evaluated;
      }
    }
  } else if (canHold && heldPiece === null && remainingPieces.length > 0) {
    const nextPiece = remainingPieces[0];
    const nextMoves = _findMovesForPiece(board, nextPiece, isB2B, mode);
    const futureAfterNext = remainingPieces.slice(1);

    for (const move of nextMoves.slice(0, Math.min(BEAM_WIDTH, nextMoves.length))) {
      const evaluated = evaluateBranch(move, futureAfterNext, true, { heldPiece: currentPiece, nextPiece });
      const holdPenalty = evaluated.isPCOpportunity ? 5 : (evaluated.isTSpinOpportunity ? 25 : 90);
      evaluated.score -= holdPenalty;
      if (!bestWithHold || evaluated.score > bestWithHold.score) {
        bestWithHold = evaluated;
      }
    }
  }

  if (bestNoHold && bestWithHold) {
    return bestWithHold.score > bestNoHold.score ? bestWithHold : bestNoHold;
  }

  return bestWithHold || bestNoHold;
}
