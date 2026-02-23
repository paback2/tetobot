import { PIECES } from '../game/pieces.js';
import { canPlace, placePiece, clearLines, dropRowOn } from '../game/board.js';
import { evaluateBoard } from './scoring.js';
import { checkTSpin, getTSpinAction } from './tspin.js';
import { attemptRotation } from '../game/rotation.js';

// ============================================================
// Cold Clear 2 스타일: Deep Beam Search 구현
// ============================================================

// Lookahead 설정 (Cold Clear 2 기반)
const BASE_LOOKAHEAD_DEPTH = 6;      // 기본 깊이 (Cold Clear 계열처럼 깊게)
const BASE_BEAM_WIDTH = 28;          // 기본 빔 너비 확장
const PERFECT_CLEAR_DEPTH = 8;       // Perfect Clear 전용 깊이
const PERFECT_CLEAR_BEAM = 42;       // PC 전용 빔 너비
const TSPIN_DEPTH = 7;               // T-Spin 전용 깊이
const TSPIN_BEAM = 24;               // T-Spin 전용 빔

function getDynamicSearchConfig(pieceCount) {
  const remaining = Math.max(0, pieceCount);
  if (remaining >= 10) {
    return { depth: Math.min(8, BASE_LOOKAHEAD_DEPTH + 1), beam: Math.max(BASE_BEAM_WIDTH, 32) };
  }
  if (remaining >= 7) {
    return { depth: BASE_LOOKAHEAD_DEPTH, beam: BASE_BEAM_WIDTH };
  }
  if (remaining >= 4) {
    return { depth: 5, beam: 20 };
  }
  return { depth: 4, beam: 14 };
}

function actionPriorityBoost(action) {
  if (!action) return 0;
  if (action === 'pc' || action.includes('_pc')) return 120000;
  if (action === 'tsd' || action === 'tsd_pc') return 18000;
  if (action === 'tst' || action === 'tst_pc') return 14000;
  if (action === 'tss' || action === 'tss_pc') return 7000;
  if (action === 'tsm_double' || action === 'tsm_double_pc') return 8000;
  if (action === 'tsm' || action === 'tsm_pc') return 4500;
  if (action === 'tetris' || action === 'tetris_pc') return 5000;
  return 0;
}

// 게임 상태를 문자열로 인코딩 (Memoization용)
function boardToKey(board) {
  return board.map(row => 
    row.map(cell => cell ? '1' : '0').join('')
  ).join('|');
}

// Memoization cache
const evalCache = new Map();

function isPerfectClear(board) {
  return board.every(row => row.every(cell => cell === 0));
}

function findAllMovePositions(board, pieceType) {
  const rotations = PIECES[pieceType];
  const allMoves = [];
  const seen = new Set();

  if (pieceType === 'T') {
    const addOrReplaceMove = (move) => {
      const key = `${move.rotation}-${move.col}-${move.row}`;
      const existingIndex = allMoves.findIndex(
        (existing) => existing.rotation === move.rotation && existing.col === move.col && existing.row === move.row
      );

      // 동일 최종 배치가 회전/비회전 둘 다 가능한 경우,
      // 마지막 입력이 회전이라는 보장이 없는 경로를 우선해 T-Spin 오탐을 방지한다.
      if (existingIndex !== -1) {
        if (!move.wasRotated && allMoves[existingIndex].wasRotated) {
          allMoves[existingIndex] = move;
        }
        return;
      }

      seen.add(key);
      allMoves.push(move);
    };

    // Cold Clear 2 방식: 모든 회전/킥 배치 시뮬레이션
    for (let fromRot = 0; fromRot < 4; fromRot++) {
      const piece = rotations[fromRot];
      for (let col = -2; col < 10; col++) {
        const dropRow = dropRowOn(board, piece, col);
        if (dropRow === -1) continue;

        // 각 회전 방향으로 SRS 킥 시도
        for (let toRot = 0; toRot < 4; toRot++) {
          if (toRot === fromRot) continue;
          const nextPiece = rotations[toRot];
          const rotResult = attemptRotation(board, piece, nextPiece, dropRow, col, 'T', fromRot, toRot);
          if (!rotResult) continue;

          addOrReplaceMove({
            rotation: toRot,
            row: rotResult.row,
            col: rotResult.col,
            piece: nextPiece,
            wasRotated: true,
            wasKicked: rotResult.kicked,
            kickIndex: rotResult.kickIndex,
          });
        }

        // 회전 없이 그냥 놓는 경우도 추가
        addOrReplaceMove({
          rotation: fromRot,
          row: dropRow,
          col,
          piece,
          wasRotated: false,
          wasKicked: false,
          kickIndex: 0,
        });
      }
    }
  } else {
    // 기존 방식 (회전/킥 없음)
    for (let rot = 0; rot < rotations.length; rot++) {
      const piece = rotations[rot];
      for (let col = -2; col < 10; col++) {
        const row = dropRowOn(board, piece, col);
        if (row !== -1) {
          if (canPlace(board, piece, row, col)) {
            const key = `${rot}-${col}-${row}`;
            if (!seen.has(key)) {
              seen.add(key);
              allMoves.push({
                rotation: rot,
                row,
                col,
                piece,
                wasRotated: false,
                wasKicked: false,
                kickIndex: 0,
              });
            }
          }
        }
      }
    }
  }
  return allMoves;
}

// Cold Clear 2 스타일: 단일 피스의 모든 placement 평가 (Beam search 전용)
function evaluatePieceMovements(board, pieceType, isB2B, mode, isDeepSearch = false) {
  const pieceMoves = findAllMovePositions(board, pieceType);
  const scoredMoves = [];

  for (const move of pieceMoves) {
    const { rotation, row, col, piece, wasKicked, wasRotated, kickIndex } = move;
    const boardWithPiece = placePiece(board, piece, row, col);
    const { board: clearedBoard, cleared } = clearLines(boardWithPiece);

    let action = 'none';
    let isTSpin = false, isMini = false;
    let bonusScore = 0;


    // T-Spin 감지 (반드시 회전+킥이 발생한 경우만, 줄을 지운 경우만)
    if (pieceType === 'T' && cleared > 0) {
      // cold-clear-2/cobra-tetrio-movegen 방식: 회전 상태별 중심 좌표 정확 계산
      let centerR, centerC;
      switch (rotation) {
        case 1:
          centerR = row + 1;
          centerC = col;
          break;
        case 3:
          centerR = row + 1;
          centerC = col + 1;
          break;
        case 0:
        default:
          centerR = row + 1;
          centerC = col + 1;
      }

      const tspinResult = checkTSpin(
        boardWithPiece,
        centerR,
        centerC,
        rotation,
        wasKicked,
        wasRotated,
        kickIndex || 0
      );
      if (tspinResult.isTSpin) {
        isTSpin = true;
        isMini = tspinResult.isMini;
        action = getTSpinAction(true, isMini, cleared);

        if (!isMini) {
          const tSpinScores = [1500, 3000, 5500, 9000];
          bonusScore = tSpinScores[Math.min(cleared, 3)] || 1500;
        } else {
          bonusScore = cleared > 0 ? 500 : 100;
        }
      }
    }

    // T-Spin이 아닌 경우(회전 없이 놓거나, 킥 없이 회전, 줄을 안 지운 경우 등)에는 action이 무조건 일반 줄지우기만 되도록 보장
    if (!isTSpin) {
      action = ['none', 'single', 'double', 'triple', 'tetris'][cleared] || 'none';
    }

    if (isPerfectClear(clearedBoard)) {
      action = cleared > 0 ? `${action}_pc` : 'pc';
      bonusScore = Math.max(bonusScore, 20000);
      if (action === 'tsd_pc') bonusScore += 10000;
      if (action === 'tst_pc') bonusScore += 8000;
    }

    let newB2B = isB2B;
    if (isTSpin || action.includes('tetris')) {
      newB2B = true;
    } else if (isB2B && cleared > 0 && cleared < 4) {
      newB2B = false;
    }

    const baseScore = evaluateBoard(clearedBoard, action, newB2B, 0, mode);
    const totalScore = baseScore + bonusScore;

    // Perfect Clear 발견 시 극도로 높은 보상
    const pcBoost = isPerfectClear(clearedBoard) ? 100000 : 0;

    scoredMoves.push({
      move,
      baseScore,
      bonusScore,
      score: totalScore + pcBoost,
      board: clearedBoard,
      b2b: newB2B,
      action,
      isTSpin,
      isMini,
      isPerfectClear: isPerfectClear(clearedBoard)
    });
  }

  // Cold Clear 2: 상위 K개 선택 (Beam Search)
  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves;
}

/**
 * Cold Clear 2 스타일 Deep Beam Search
 * @param {Array} board - 게임 보드
 * @param {Array} pieces - 피스 큐
 * @param {boolean} isB2B - B2B 상태
 * @param {string} mode - 게임 모드
 * @param {number} depth - 현재 깊이
 * @param {number} maxDepth - 최대 깊이
 * @param {number} beamWidth - 각 레벨에서 유지할 후보 수
 * @returns {{move, score, action, depth}} 최적 이동
 */
function deepBeamSearch(board, pieces, isB2B, mode, depth = 0, maxDepth = BASE_LOOKAHEAD_DEPTH, beamWidth = BASE_BEAM_WIDTH) {
  if (depth === 0) {
    evalCache.clear();  // 새 검색 시작 시 캐시 초기화
  }

  if (pieces.length === 0 || depth >= maxDepth) {
    return { score: evaluateBoard(board, 'none', isB2B, 0, mode), move: null, action: 'none' };
  }

  const currentPiece = pieces[0];
  const remainingPieces = pieces.slice(1);

  // Memoization 확인
  const boardKey = boardToKey(board);
  const cacheKey = `${boardKey}:${currentPiece}:${depth}:${isB2B}`;
  
  if (evalCache.has(cacheKey)) {
    return evalCache.get(cacheKey);
  }

  // 현재 상태에서 모든 이동 평가
  const moves = evaluatePieceMovements(board, currentPiece, isB2B, mode, depth < maxDepth - 1);

  if (moves.length === 0) {
    const result = { score: -Infinity, move: null, action: 'none' };
    evalCache.set(cacheKey, result);
    return result;
  }

  if (remainingPieces.length === 0) {
    // 마지막 피스 - 가장 좋은 이동 반환
    const best = moves[0];
    const result = {
      score: best.score,
      move: best.move,
      action: best.action,
      isPerfectClear: best.isPerfectClear
    };
    evalCache.set(cacheKey, result);
    return result;
  }

  // Beam search: 상위 K개만 재귀 탐색 (초반은 넓게, 후반은 집중)
  const depthBeamWidth = Math.max(10, Math.floor(beamWidth * (depth < 2 ? 1 : 0.82) - depth * 2));
  const candidates = moves.slice(0, Math.min(depthBeamWidth, moves.length));
  
  let bestScore = -Infinity;
  let bestMove = null;
  let bestAction = 'none';
  let foundPerfectClear = false;

  for (const candidate of candidates) {
    // Perfect Clear를 찾으면 즉시 반환
    if (candidate.isPerfectClear) {
      const result = {
        score: candidate.score + 1000000,  // 극도로 높은 점수
        move: candidate.move,
        action: candidate.action,
        isPerfectClear: true
      };
      evalCache.set(cacheKey, result);
      return result;
    }

    // 재귀 탐색
    const futureResult = deepBeamSearch(
      candidate.board,
      remainingPieces,
      candidate.b2b,
      mode,
      depth + 1,
      maxDepth,
      beamWidth
    );

    const depthWeight = depth === 0 ? 0.6 : 0.52;
    const futureWeight = depth === 0 ? 1.0 : 0.92;
    const tacticalBoost = actionPriorityBoost(candidate.action);
    const totalScore = candidate.score * depthWeight + futureResult.score * futureWeight + tacticalBoost;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = candidate.move;
      bestAction = candidate.action;
      foundPerfectClear = futureResult.isPerfectClear;
    }
  }

  const result = {
    score: bestScore,
    move: bestMove,
    action: bestAction,
    isPerfectClear: foundPerfectClear
  };

  evalCache.set(cacheKey, result);
  return result;
}

/**
 * Perfect Clear 특별 탐색 (Cold Clear 2 스타일)
 * PC를 찾기 위해 더 깊게 탐색
 */
function searchForPerfectClear(board, pieces, isB2B, mode) {
  console.log('[PC 탐색 시작]');
  
  const result = deepBeamSearch(
    board,
    pieces,
    isB2B,
    mode,
    0,
    PERFECT_CLEAR_DEPTH,
    PERFECT_CLEAR_BEAM
  );

  if (result.isPerfectClear) {
    console.log('[✓ Perfect Clear 발견!]');
  }
  return result;
}

/**
 * T-Spin Double 특별 탐색
 */
function searchForTSpinDouble(board, pieces, isB2B, mode) {
  console.log('[TSD 탐색 시작]');
  
  const result = deepBeamSearch(
    board,
    pieces,
    isB2B,
    mode,
    0,
    TSPIN_DEPTH,
    TSPIN_BEAM
  );

  if (result.action === 'tsd' || result.action === 'tsd_pc') {
    console.log('[✓ T-Spin Double 발견!]');
  }
  return result;
}

/**
 * 최적의 이동 찾기 (Cold Clear 2 Deep Beam Search)
 */
export function findBestMoveAdvanced(board, pieces, isB2B, mode) {
  if (!pieces || pieces.length === 0) {
    return null;
  }

  // 1. Perfect Clear를 먼저 탐색
  const pcResult = searchForPerfectClear(board, pieces, isB2B, mode);
  if (pcResult.isPerfectClear && pcResult.move) {
    console.log('[선택] Perfect Clear 경로');
    return { ...pcResult.move, action: pcResult.action };
  }

  // 2. T-Spin Double 탐색
  const tsdResult = searchForTSpinDouble(board, pieces, isB2B, mode);
  if ((tsdResult.action === 'tsd' || tsdResult.action === 'tsd_pc') && tsdResult.move) {
    console.log('[선택] T-Spin Double 경로');
    return { ...tsdResult.move, action: tsdResult.action };
  }

  // 3. 일반 Deep Beam Search
  const dynamicConfig = getDynamicSearchConfig(pieces.length);
  const result = deepBeamSearch(
    board,
    pieces,
    isB2B,
    mode,
    0,
    dynamicConfig.depth,
    dynamicConfig.beam
  );

  if (!result || !result.move) {
    // Fallback: 첫 번째 피스의 최적 이동
    const moves = evaluatePieceMovements(board, pieces[0], isB2B, mode, false);
    if (moves.length === 0) return null;
    return { ...moves[0].move, action: moves[0].action };
  }

  return { ...result.move, action: result.action };
}

export { evaluatePieceMovements as _findMovesForPiece };
