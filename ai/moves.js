import { PIECES } from '../game/pieces.js';
import { canPlace, placePiece, clearLines, dropRowOn } from '../game/board.js';
import { evaluateBoard } from './scoring.js';
import { checkTSpin, getTSpinAction } from './tspin.js';
import { attemptRotation } from '../game/rotation.js';

const LOOKAHEAD_DEPTH = 6;
const BEAM_WIDTH = 24;
const SPECIAL_BEAM = 12;

function isPerfectClear(board) {
  return board.every(row => row.every(cell => cell === 0));
}

function getTCenter(row, col, rotation) {
  // NOTE: We use trimmed piece matrices in PIECES, so offsets differ by rotation.
  // These offsets map back to the true T pivot used by the 3-corner check.
  switch (rotation) {
    case 0:
      return { centerR: row + 1, centerC: col + 1 };
    case 1:
      return { centerR: row + 1, centerC: col };
    case 2:
      return { centerR: row + 1, centerC: col + 1 };
    case 3:
      return { centerR: row + 1, centerC: col + 1 };
    default:
      return { centerR: row + 1, centerC: col + 1 };
  }
}

function findAllMovePositions(board, pieceType) {
  const rotations = PIECES[pieceType];
  if (!rotations || rotations.length === 0) return [];

  const allMoves = [];
  const lockSeen = new Set();

  // Cold Clear/Cobra 계열처럼 스폰 상태에서 도달 가능한 상태 그래프를 탐색한다.
  // (현재 구현은 softdrop 기반 BFS로 reachable lock만 수집)
  const spawn = { row: 0, col: 3, rotation: 0, wasRotated: false, wasKicked: false, kickIndex: 0 };
  if (!canPlace(board, rotations[spawn.rotation], spawn.row, spawn.col)) {
    return [];
  }

  const queue = [spawn];
  const visited = new Set([`${spawn.row}:${spawn.col}:${spawn.rotation}:${spawn.wasRotated ? 1 : 0}`]);

  const pushState = (state) => {
    const key = `${state.row}:${state.col}:${state.rotation}:${state.wasRotated ? 1 : 0}`;
    if (visited.has(key)) return;
    visited.add(key);
    queue.push(state);
  };

  while (queue.length > 0) {
    const state = queue.shift();
    const piece = rotations[state.rotation];

    // 현재 상태에서 하드드롭한 lock 위치 추가
    const lockRow = dropRowOn(board, piece, state.col);
    if (lockRow !== -1) {
      const lockKey = `${state.rotation}:${state.col}:${lockRow}:${state.wasRotated ? 1 : 0}:${state.kickIndex}`;
      if (!lockSeen.has(lockKey)) {
        lockSeen.add(lockKey);
        allMoves.push({
          rotation: state.rotation,
          row: lockRow,
          col: state.col,
          piece,
          wasRotated: state.wasRotated,
          wasKicked: state.wasKicked,
          kickIndex: state.kickIndex,
        });
      }
    }

    // Soft drop
    if (canPlace(board, piece, state.row + 1, state.col)) {
      pushState({
        row: state.row + 1,
        col: state.col,
        rotation: state.rotation,
        wasRotated: false,
        wasKicked: false,
        kickIndex: 0,
      });
    }

    // Shift left/right
    for (const dc of [-1, 1]) {
      const newCol = state.col + dc;
      if (canPlace(board, piece, state.row, newCol)) {
        pushState({
          row: state.row,
          col: newCol,
          rotation: state.rotation,
          wasRotated: false,
          wasKicked: false,
          kickIndex: 0,
        });
      }
    }

    // Rotate CW / CCW
    if (rotations.length > 1 && pieceType !== 'O') {
      const nextRot = (state.rotation + 1) % rotations.length;
      const prevRot = (state.rotation - 1 + rotations.length) % rotations.length;
      for (const toRot of new Set([nextRot, prevRot])) {
        const rotResult = attemptRotation(
          board,
          piece,
          rotations[toRot],
          state.row,
          state.col,
          pieceType,
          state.rotation,
          toRot,
        );
        if (!rotResult) continue;
        pushState({
          row: rotResult.row,
          col: rotResult.col,
          rotation: toRot,
          wasRotated: true,
          wasKicked: rotResult.kicked,
          kickIndex: rotResult.kickIndex,
        });
      }
    }
  }

  return allMoves;
}


function _findMovesForPiece(board, pieceType, isB2B, mode) {
  const pieceMoves = findAllMovePositions(board, pieceType);
  const scoredMoves = [];

  for (const move of pieceMoves) {
    const { rotation, row, col, piece, wasKicked, wasRotated, kickIndex } = move;
    const boardWithPiece = placePiece(board, piece, row, col);
    const { board: clearedBoard, cleared } = clearLines(boardWithPiece);

    let action = 'none';
    let isTSpin = false;
    let isMini = false;
    let extraBonus = 0;

    if (pieceType === 'T' && cleared > 0) {
      const { centerR, centerC } = getTCenter(row, col, rotation);
      const tspinResult = checkTSpin(boardWithPiece, centerR, centerC, rotation, wasKicked, wasRotated, kickIndex);
      if (tspinResult.isTSpin) {
        isTSpin = true;
        isMini = tspinResult.isMini;
        action = getTSpinAction(true, isMini, cleared);
        if (!isMini) {
          extraBonus += [0, 1200, 3200, 4800][Math.min(cleared, 3)] || 0;
        } else {
          extraBonus += cleared > 0 ? 400 : 80;
        }
      }
    }

    if (!isTSpin) {
      action = ['none', 'single', 'double', 'triple', 'tetris'][cleared] || 'none';
    }

    if (isPerfectClear(clearedBoard)) {
      action = cleared > 0 ? `${action}_pc` : 'pc';
      extraBonus += 25000;
    }

    let newB2B = isB2B;
    if (isTSpin || action.includes('tetris') || action.includes('_pc') || action === 'pc') {
      newB2B = true;
    } else if (isB2B && cleared > 0 && cleared < 4) {
      newB2B = false;
    }

    const baseScore = evaluateBoard(clearedBoard, action, newB2B, isB2B ? 1 : 0, mode);
    const score = baseScore + extraBonus;

    scoredMoves.push({
      move,
      score,
      board: clearedBoard,
      b2b: newB2B,
      action,
      isTSpin,
      isMini,
      isPerfectClear: action === 'pc' || action.includes('_pc'),
      wasRotated,
      wasKicked,
      kickIndex,
    });
  }

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves;
}

function actionPriority(action) {
  if (!action) return 0;
  if (action === 'pc' || action.includes('_pc')) return 100;
  if (action === 'tsd') return 80;
  if (action === 'tst') return 75;
  if (action === 'tss') return 60;
  if (action === 'tsm') return 50;
  if (action === 'tetris') return 40;
  return 0;
}

function findBestMoveRecursive(board, pieces, isB2B, mode, depth = 0) {
  if (pieces.length === 0 || depth >= LOOKAHEAD_DEPTH) {
    return { score: evaluateBoard(board, 'none', isB2B, 0, mode), move: null, action: 'none' };
  }

  const [currentPiece, ...nextPieces] = pieces;
  const moves = _findMovesForPiece(board, currentPiece, isB2B, mode);
  if (moves.length === 0) {
    return { score: -Infinity, move: null, action: 'none' };
  }

  const dynamicBeam = Math.max(8, BEAM_WIDTH - depth * 3);
  const candidates = moves.slice(0, dynamicBeam);

  let bestScore = -Infinity;
  let bestMove = null;
  let bestAction = 'none';

  for (const candidate of candidates) {
    const futureResult = findBestMoveRecursive(candidate.board, nextPieces, candidate.b2b, mode, depth + 1);
    const totalScore = candidate.score * 0.55 + futureResult.score * 0.95;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = candidate.move;
      bestAction = candidate.action;
    }
  }

  return { score: bestScore, move: bestMove, action: bestAction };
}

function buildTurnOptions(board, pieces, heldPiece, canHold, isB2B, mode) {
  if (!pieces || pieces.length === 0) return [];

  const currentPiece = pieces[0];
  const options = [];

  const noHoldMoves = _findMovesForPiece(board, currentPiece, isB2B, mode).slice(0, SPECIAL_BEAM);
  for (const candidate of noHoldMoves) {
    options.push({
      ...candidate,
      usedHold: false,
      nextPieces: pieces.slice(1),
      nextHeld: heldPiece,
      nextCanHold: true,
      firstMove: {
        ...candidate.move,
        action: candidate.action,
        usedHold: false,
        score: candidate.score,
        board: candidate.board,
        b2b: candidate.b2b,
      },
    });
  }

  if (!canHold) return options;

  // 홀드 박스에 피스가 있는 경우
  if (heldPiece !== null) {
    const holdMoves = _findMovesForPiece(board, heldPiece, isB2B, mode).slice(0, SPECIAL_BEAM);
    for (const candidate of holdMoves) {
      options.push({
        ...candidate,
        usedHold: true,
        nextPieces: pieces.slice(1),
        nextHeld: currentPiece,
        nextCanHold: true,
        firstMove: {
          ...candidate.move,
          action: candidate.action,
          usedHold: true,
          score: candidate.score,
          board: candidate.board,
          b2b: candidate.b2b,
          swappedPiece: currentPiece,
        },
      });
    }
  } else if (pieces.length > 1) {
    // 홀드 박스가 비어있으면 다음 피스를 현재 턴에 사용
    const nextPiece = pieces[1];
    const nextPieceMoves = _findMovesForPiece(board, nextPiece, isB2B, mode).slice(0, SPECIAL_BEAM);
    for (const candidate of nextPieceMoves) {
      options.push({
        ...candidate,
        usedHold: true,
        nextPieces: pieces.slice(2),
        nextHeld: currentPiece,
        nextCanHold: true,
        firstMove: {
          ...candidate.move,
          action: candidate.action,
          usedHold: true,
          score: candidate.score,
          board: candidate.board,
          b2b: candidate.b2b,
          heldPiece: currentPiece,
          nextPiece,
        },
      });
    }
  }

  return options;
}

function searchSpecialPath(board, pieces, heldPiece, canHold, isB2B, mode, depth = 0, maxDepth = LOOKAHEAD_DEPTH) {
  if (!pieces || pieces.length === 0 || depth >= maxDepth) {
    return {
      priority: 0,
      score: evaluateBoard(board, 'none', isB2B, 0, mode),
      firstMove: null,
    };
  }

  const options = buildTurnOptions(board, pieces, heldPiece, canHold, isB2B, mode);
  if (options.length === 0) {
    return { priority: 0, score: -Infinity, firstMove: null };
  }

  let best = { priority: -1, score: -Infinity, firstMove: null };

  for (const option of options) {
    const selfPriority = actionPriority(option.action);
    const child = searchSpecialPath(
      option.board,
      option.nextPieces,
      option.nextHeld,
      option.nextCanHold,
      option.b2b,
      mode,
      depth + 1,
      maxDepth,
    );

    const branchPriority = Math.max(selfPriority, Math.max(0, child.priority - 1));
    const branchScore = option.score * 0.45 + child.score * 0.9;
    const firstMove = depth === 0 ? option.firstMove : child.firstMove;

    if (
      branchPriority > best.priority ||
      (branchPriority === best.priority && branchScore > best.score)
    ) {
      best = {
        priority: branchPriority,
        score: branchScore,
        firstMove,
      };
    }
  }

  return best;
}

export function findBestMove(board, pieces, isB2B, mode) {
  if (!pieces || pieces.length === 0) return null;

  const lookaheadPieces = pieces.slice(0, LOOKAHEAD_DEPTH);
  const result = findBestMoveRecursive(board, lookaheadPieces, isB2B, mode, 0);
  if (!result || !result.move) return null;
  return { ...result.move, action: result.action };
}

export function findBestMoveWithHold(board, pieces, heldPiece, canHold, isB2B, mode) {
  if (!pieces || pieces.length === 0) {
    return null;
  }

  // 1) 먼저 PC/T-Spin 경로를 명시적으로 탐색
  const special = searchSpecialPath(
    board,
    pieces.slice(0, LOOKAHEAD_DEPTH + 1),
    heldPiece,
    canHold,
    isB2B,
    mode,
    0,
    LOOKAHEAD_DEPTH,
  );

  if (special.firstMove && special.priority >= 60) {
    return special.firstMove;
  }

  // 2) 일반 점수 최적화 탐색
  const options = buildTurnOptions(board, pieces, heldPiece, canHold, isB2B, mode);
  if (options.length === 0) {
    return null;
  }

  let best = null;
  for (const option of options) {
    const future = findBestMoveRecursive(option.board, option.nextPieces.slice(0, LOOKAHEAD_DEPTH - 1), option.b2b, mode, 1);
    const holdPenalty = option.usedHold ? (actionPriority(option.action) >= 60 ? 15 : 65) : 0;
    const score = option.score * 0.55 + future.score * 0.95 - holdPenalty;

    if (!best || score > best.totalScore) {
      best = {
        totalScore: score,
        move: {
          ...option.firstMove,
          score,
        },
      };
    }
  }

  return best?.move || null;
}

export { _findMovesForPiece };
