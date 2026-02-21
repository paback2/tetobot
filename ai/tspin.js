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
 * @param {boolean} debug - 디버그 모드 (로깅 활성화)
 * @returns {{isTSpin: boolean, isMini: boolean}} T-Spin 여부 및 미니 여부
 */
export function checkTSpin(board, row, col, rotation, wasKicked = false, debug = false) {
  // 3-Corner Rule: T-피스 3x3 경계 4개 모서리 확인
  // 피스 중심(row, col)을 기준으로 ±1 범위
  const corners = {
    A: { row: row - 1, col: col - 1 }, // 좌상
    B: { row: row - 1, col: col + 1 }, // 우상
    C: { row: row + 1, col: col - 1 }, // 좌하
    D: { row: row + 1, col: col + 1 }  // 우하
  };

  // 벽이나 블록으로 채워진 모서리 개수
  const isFilled = (r, c) => r < 0 || r >= 20 || c < 0 || c >= 10 || board[r][c] !== 0;

  let filledCorners = 0;
  const filledList = [];
  
  for (const [name, pos] of Object.entries(corners)) {
    if (isFilled(pos.row, pos.col)) {
      filledCorners++;
      filledList.push(name);
    }
  }

  // T-Spin 필수 조건: 3개 이상 모서리가 채워져 있어야 함
  if (filledCorners < 3) {
    return { isTSpin: false, isMini: false };
  }

  // Full T-Spin vs Mini T-Spin 판별
  // 킥된 회전이 아니면 Mini T-Spin (= 드롭으로만 배치)
  if (!wasKicked) {
    return { isTSpin: true, isMini: true };
  }

  // 킥된 회전: 회전 상태에 따라 미니 여부 판별
  // 각 회전 상태에서 "열린 쪽" 확인 (한 귀퉁이가 안 막혀있으면 Mini)
  let isMini = false;
  
  switch (rotation) {
    case 0: // ▲ (위쪽에 돌출) - 아래쪽 두 모서리 확인
      // C 또는 D가 열려있으면 Mini
      isMini = !isFilled(row + 1, col - 1) || !isFilled(row + 1, col + 1);
      break;
    case 1: // ◀ (왼쪽에 돌출) - 오른쪽 모서리 확인
      // B 또는 D가 열려있으면 Mini
      isMini = !isFilled(row - 1, col + 1) || !isFilled(row + 1, col + 1);
      break;
    case 2: // ▼ (아래쪽에 돌출) - 위쪽 모서리 확인
      // A 또는 B가 열려있으면 Mini
      isMini = !isFilled(row - 1, col - 1) || !isFilled(row - 1, col + 1);
      break;
    case 3: // ▶ (오른쪽에 돌출) - 왼쪽 모서리 확인
      // A 또는 C가 열려있으면 Mini
      isMini = !isFilled(row - 1, col - 1) || !isFilled(row + 1, col - 1);
      break;
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
    const { isTSpin, isMini } = checkTSpin(board, row, col, rotation, kicked);
    
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

