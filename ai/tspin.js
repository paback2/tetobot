import { PIECES } from '../game/pieces.js';
import { placePiece } from '../game/board.js';


/**
 * 배치 좌표(좌상단)와 회전 상태에서 T 피벗 좌표를 계산한다.
 * PIECES의 trim된 회전 매트릭스 기준 보정값을 사용한다.
 */
export function getTPivotFromPlacement(row, col, rotation) {
  switch (rotation) {
    case 1:
      return { centerR: row + 1, centerC: col };
    case 2:
      return { centerR: row, centerC: col + 1 };
    case 3:
      return { centerR: row + 1, centerC: col + 1 };
    case 0:
    default:
      return { centerR: row + 1, centerC: col + 1 };
  }
}

/**
 * Tetris Guideline T-Spin 감지 (개선된 구현)
 * Cold Clear 2와 Cobra Movegen을 기반으로 한 정확한 3-Corner Rule 구현
 *
 * @param {number[][]} board - 피스 배치 전 보드
 * @param {number} row - T-피스 배치 행
 * @param {number} col - T-피스 배치 열
 * @param {number} rotation - T-피스 회전 상태 (0-3)
 * @param {boolean} wasKicked - 이 배치가 킥된 회전 결과인지 여부
 * @param {boolean} wasRotated - 마지막 동작이 회전인지 여부
 * @param {number} kickIndex - SRS 킥 시도 번호 (0-4, 4는 test-5)
 * @param {number} cleared - 클리어된 라인 수
 * @param {boolean} debug - 디버그 모드 (로깅 활성화)
 * @returns {{isTSpin: boolean, isMini: boolean}} T-Spin 여부 및 미니 여부
 */
export function checkTSpin(board, row, col, rotation, wasKicked = false, wasRotated = false, kickIndex = 0, cleared = 0, debug = false) {
  // Guideline 기본 조건: 마지막 입력이 회전이어야 한다.
  if (!wasRotated) {
    if (debug) console.log('[T-Spin] Last action was not a rotation');
    return { isTSpin: false, isMini: false };
  }

  // 보드 경계와 채워진 셀 확인
  const isFilled = (r, c) => {
    if (r < 0 || r >= 20 || c < 0 || c >= 10) return true;
    return board[r][c] !== 0;
  };

  // 4개 코너 확인
  const corners = [
    isFilled(row - 1, col - 1), // top-left
    isFilled(row - 1, col + 1), // top-right
    isFilled(row + 1, col - 1), // bottom-left
    isFilled(row + 1, col + 1), // bottom-right
  ];

  const occupiedCorners = corners.filter(Boolean).length;
  
  // 3-Corner Rule: 최소 3개 코너가 채워져 있어야 함
  if (occupiedCorners < 3) {
    if (debug) console.log(`[T-Spin] Only ${occupiedCorners} corners occupied (need 3+)`);
    return { isTSpin: false, isMini: false };
  }

  // 회전 상태에 따른 front/back 코너 정의
  // Front = 회전 방향으로 향하는 방향의 코너들
  // Back = 반대 방향의 코너들
  const getFrontBackCorners = (rot) => {
    switch(rot) {
      case 0: // North: front = top, back = bottom
        return { front: [corners[0], corners[1]], back: [corners[2], corners[3]] };
      case 1: // East: front = right, back = left
        return { front: [corners[1], corners[3]], back: [corners[0], corners[2]] };
      case 2: // South: front = bottom, back = top
        return { front: [corners[2], corners[3]], back: [corners[0], corners[1]] };
      case 3: // West: front = left, back = right
        return { front: [corners[0], corners[2]], back: [corners[1], corners[3]] };
      default: return { front: [], back: [] };
    }
  };

  const { front, back } = getFrontBackCorners(rotation);
  const frontOccupied = front.filter(Boolean).length;
  const backOccupied = back.filter(Boolean).length;

  // SRS test-5 (kickIndex === 4)는 항상 Full T-Spin
  if (kickIndex === 4) {
    if (debug) console.log('[T-Spin] SRS test-5 detected -> Full T-Spin');
    return { isTSpin: true, isMini: false };
  }

  // 라인 클리어 개수에 따른 처리
  // 2줄 이상 클리어: Full T-Spin만 인정
  if (cleared >= 2) {
    const isMiniByCorners = frontOccupied < 2;
    if (isMiniByCorners) {
      if (debug) console.log('[T-Spin] 2+ lines cleared but front < 2 -> Invalid');
      return { isTSpin: false, isMini: false };
    }
    if (debug) console.log('[T-Spin] 2+ lines cleared -> Full T-Spin');
    return { isTSpin: true, isMini: false };
  }

  // 1줄 클리어
  if (cleared === 1) {
    const isMiniByCorners = frontOccupied < 2;
    if (isMiniByCorners) {
      // Mini는 킥이 있었을 때만 인정
      if (!wasKicked) {
        if (debug) console.log('[T-Spin] 1 line, mini pattern, but no kick -> Invalid');
        return { isTSpin: false, isMini: false };
      }
      if (debug) console.log('[T-Spin] 1 line, mini pattern, with kick -> Mini T-Spin');
      return { isTSpin: true, isMini: true };
    }
    if (debug) console.log('[T-Spin] 1 line, full pattern -> Full T-Spin');
    return { isTSpin: true, isMini: false };
  }

  // 0줄 클리어 (TSD 0-clear 같은 경우)
  // Mini: front < 2 AND (kicked OR back < 2)
  // Full: front >= 2
  const isMiniByCorners = frontOccupied < 2;
  const isMini = isMiniByCorners && (wasKicked || backOccupied < 2);
  
  if (debug) {
    console.log(`[T-Spin] 0 lines: front=${frontOccupied}, back=${backOccupied}, kicked=${wasKicked} -> ${isMini ? 'Mini' : 'Full'}`);
  }
  
  return { isTSpin: true, isMini };
}


/**
 * T-Spin 액션 결정
 * @param {boolean} isTSpin - T-Spin 여부
 * @param {boolean} isMini - Mini T-Spin 여부
 * @param {number} cleared - 클리어된 라인 수
 * @returns {string} 액션 타입
 */
export function getTSpinAction(isTSpin, isMini, cleared) {
  if (!isTSpin) return 'none';

  // Mini T-Spin
  if (isMini) {
    switch (cleared) {
      case 0: return 'tsmzero';  // Mini 0-clear
      case 1: return 'tsm';       // Mini Single
      case 2: return 'double';    // Mini Double은 규칙상 미사용: 일반 더블로 안전 처리
      default: return 'tsm';
    }
  }

  // Full T-Spin
  switch (cleared) {
    case 0: return 'tszero';   // T-Spin 0-clear
    case 1: return 'tss';      // T-Spin Single
    case 2: return 'tsd';      // T-Spin Double (황금)
    case 3: return 'tst';      // T-Spin Triple
    case 4: return 'tetris';   // T-Spin Tetris (불가능하지만 혹시모함)
    default: return 'tss';
  }
}

/**
 * T-Spin Fin 감지 (특수한 배치 형태)
 * 일반적인 T-Spin보다 더 어려운 배치
 * @param {number[][]} board - 보드
 * @param {number} row - T-피스 행
 * @param {number} col - T-피스 열
 * @param {number} rotation - 회전 상태
 * @returns {boolean} T-Spin Fin 여부
 */
export function detectTSpinFin(board, row, col, rotation) {
  // Fin은 특정 회전 상태에서만 가능 (보통 1도 또는 3도)
  // 그리고 특정 모서리 패턴이어야 함
  if (rotation !== 1 && rotation !== 3) return false;

  const isFilled = (r, c) => r < 0 || r >= 20 || c < 0 || c >= 10 || board[r][c] !== 0;

  if (rotation === 1) {
    // 왼쪽 열림, 오른쪽이 "Fin" 모양 (한쪽만 열림)
    const leftFilled = isFilled(row - 1, col + 1) && isFilled(row + 1, col + 1);
    const rightOneOpen = !isFilled(row - 1, col - 1) || !isFilled(row + 1, col - 1);
    return leftFilled && rightOneOpen;
  }

  if (rotation === 3) {
    // 오른쪽 열림, 왼쪽이 "Fin" 모양
    const rightFilled = isFilled(row - 1, col - 1) && isFilled(row + 1, col - 1);
    const leftOneOpen = !isFilled(row - 1, col + 1) || !isFilled(row + 1, col + 1);
    return rightFilled && leftOneOpen;
  }

  return false;
}

/**
 * 모든 가능한 T-Spin 후보 찾기
 * @param {number[][]} board - 보드
 * @param {object[]} allMoves - 모든 가능한 배치 [{rotation, col, row, kicked}, ...]
 * @returns {object[]} T-Spin 후보 배열
 */
export function findTSpinCandidates(board, allMoves) {
  const candidates = [];

  for (const move of allMoves) {
    const { rotation, row, col, piece, wasKicked = false, wasRotated = false, kickIndex = 0 } = move;

    const boardForCheck = piece ? placePiece(board, piece, row, col) : board;
    const { centerR, centerC } = getTPivotFromPlacement(row, col, rotation);

    // T-Spin 확인
    const { isTSpin, isMini } = checkTSpin(
      boardForCheck,
      centerR,
      centerC,
      rotation,
      wasKicked,
      wasRotated,
      kickIndex,
      0,
    );
    
    if (isTSpin) {
      const isFin = detectTSpinFin(board, row, col, rotation);
      candidates.push({
        ...move,
        isTSpin: true,
        isMini,
        isFin
      });
    }
  }

  return candidates;
}
