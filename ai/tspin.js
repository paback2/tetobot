import { PIECES } from '../game/pieces.js';
import { canPlace } from '../game/board.js';

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
export function checkTSpin(board, row, col, rotation, wasKicked = false, wasRotated = false, kickIndex = 0, debug = false) {
  // 가이드라인 기준: "마지막 입력이 회전"이면 T-Spin 가능.
  // 실제 킥이 없더라도(킥 인덱스 0) T-Spin 자체는 성립할 수 있다.
  if (!wasRotated) {
    if (debug) console.log('[T-Spin] Last action was not a rotation, not a T-Spin');
    return { isTSpin: false, isMini: false };
  }

  // 가장자리 오탐 방지: 가장자리에서 회전 + 코너 규칙이 약하면 배제
  if ((col <= 0 || col >= 8) && !wasKicked && kickIndex === 0) {
    if (debug) console.log('[T-Spin] Edge position with no real kick, not a T-Spin');
    return { isTSpin: false, isMini: false };
  }

  // 4개 대각선 코너
  const corners = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  const isFilled = (r, c) => r < 0 || r >= 20 || c < 0 || c >= 10 || board[r][c] !== 0;
  let occupied = 0;
  for (const [dx, dy] of corners) {
    if (isFilled(row + dx, col + dy)) occupied++;
  }
  if (occupied < 3) {
    if (debug) console.log('[T-Spin] Less than 3 corners, not a T-Spin');
    return { isTSpin: false, isMini: false };
  }

  // mini/full 구분
  // 4번째 킥(특수 SRS)은 무조건 Full
  if (kickIndex === 4) return { isTSpin: true, isMini: false };

  // 가이드라인 기반에 가깝게 전면(front) 코너 점유를 우선 사용:
  // 전면 2코너가 모두 막히면 Full, 그렇지 않으면 Mini로 본다.
  // (180회전 미사용 전제)
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

  // 킥 기반 보정:
  // SRS 3/4번 킥은 특수 벽킥으로 Full 경향이 매우 강함.
  if (kickIndex === 3 || kickIndex === 4) return { isTSpin: true, isMini: false };

  // 무킥(0번) 회전은 오탐 방지를 위해 Mini로 강하게 분류.
  // 실제 Full로 인정되는 예외 패턴도 있으나, 엔진의 안정성을 위해 보수적으로 처리한다.
  if (!wasKicked && kickIndex === 0) {
    return { isTSpin: true, isMini: true };
  }

  // 1/2번 킥은 front corner 점유로 mini/full 분류
  if ((kickIndex === 1 || kickIndex === 2) && frontOccupied < 2) {
    return { isTSpin: true, isMini: true };
  }

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
    const { rotation, row, col, kicked } = move;
    
    // T-Spin 확인
    const { isTSpin, isMini } = checkTSpin(board, row, col, rotation, kicked, true, move.kickIndex || 0);
    
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
