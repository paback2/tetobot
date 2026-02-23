import { PIECES } from '../game/pieces.js';
import { placePiece } from '../game/board.js';


/**
 * 배치 좌표(좌상단)와 회전 상태에서 T 피벗 좌표를 계산한다.
 * PIECES의 trim된 회전 매트릭스 기준 보정값을 사용한다.
 */
export function getTPivotFromPlacement(row, col, rotation) {
  switch (rotation) {
    case 1:
      return { centerR: row + 1, centerC: col + 1 };
    case 2:
      return { centerR: row, centerC: col + 1 };
    case 3:
      return { centerR: row + 1, centerC: col };
    case 0:
    default:
      return { centerR: row + 1, centerC: col + 1 };
  }
}

/**
 * Tetris Guideline T-Spin 감지
 * 3-Corner Rule과 Kick 정보를 사용하여 T-Spin 판별
 *
 * @param {number[][]} board - 피스 배치 전 보드
 * @param {number} row - T-피스 배치 행
 * @param {number} col - T-피스 배치 열
 * @param {number} rotation - T-피스 회전 상태 (0-3)
 * @param {boolean} wasKicked - 이 배치가 킥된 회전 결과인지 여부
 * @param {boolean} wasRotated - 마지막 동작이 회전인지 여부
 * @param {boolean} debug - 디버그 모드 (로깅 활성화)
 * @returns {{isTSpin: boolean, isMini: boolean}} T-Spin 여부 및 미니 여부
 */
export function checkTSpin(board, row, col, rotation, wasKicked = false, wasRotated = false, kickIndex = 0, cleared = 0, debug = false) {
  // Guideline 기본 조건: 마지막 입력이 회전이어야 한다.
  if (!wasRotated) {
    if (debug) console.log('[T-Spin] Last action was not a rotation');
    return { isTSpin: false, isMini: false };
  }

  const corners = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  const isFilled = (r, c) => r < 0 || r >= 20 || c < 0 || c >= 10 || board[r][c] !== 0;

  let occupied = 0;
  for (const [dx, dy] of corners) {
    if (isFilled(row + dx, col + dy)) occupied++;
  }

  if (occupied < 3) {
    if (debug) console.log('[T-Spin] Less than 3 occupied corners');
    return { isTSpin: false, isMini: false };
  }

  // 회전 방향 기준 앞쪽(front) 두 코너 점유로 mini/full 구분
  const frontCornersByRotation = {
    0: [[-1, -1], [-1, 1]],
    1: [[-1, 1], [1, 1]],
    2: [[1, -1], [1, 1]],
    3: [[-1, -1], [1, -1]],
  };

  const frontCorners = frontCornersByRotation[rotation] || frontCornersByRotation[0];
  let frontOccupied = 0;
  for (const [dx, dy] of frontCorners) {
    if (isFilled(row + dx, col + dy)) frontOccupied++;
  }

  // SRS test-5는 Full 처리
  if (kickIndex === 4) {
    return { isTSpin: true, isMini: false };
  }


  // 킥 없이 정면 2코너가 모두 찬 경우는 과대 판정을 줄이기 위해 일반 라인클리어로 처리한다.
  // (실전에서 보고된 "미니인데 싱글/풀로 분류" 오탐 억제)
  if (!wasKicked && frontOccupied === 2) {
    return { isTSpin: false, isMini: false };
  }

  // 기본 front-corner 규칙을 우선 적용한다.
  // 앞쪽 두 코너가 모두 차 있으면 Full, 아니면 Mini.
  // (SRS test-5는 위에서 Full로 강제 처리)
  return { isTSpin: true, isMini: frontOccupied < 2 };
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
      case 2: return 'tsm_double'; // Mini Double (Full 취급)
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
