/**
 * Super Rotation System (SRS) 구현
 * Tetris Guideline 회전 및 킥 규칙
 */

// 피스 센터 위치 (PIECES의 각 회전 상태별)
const PIECE_CENTERS = {
  I: [
    { x: 1.5, y: -0.5 }, // 0도
    { x: -0.5, y: 0.5 }, // 90도
    { x: 1.5, y: -0.5 }, // 180도
    { x: -0.5, y: 0.5 }  // 270도
  ],
  O: [
    { x: 1, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 0 }
  ],
  T: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ],
  S: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ],
  Z: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ],
  J: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ],
  L: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ]
};

/**
 * SRS 킥 테이블 (I-piece와 다른 피스 구분)
 * @param {string} pieceType - 피스 타입
 * @param {number} fromRotation - 회전 시작 상태 (0-3)
 * @param {number} toRotation - 회전 목표 상태 (0-3)
 * @returns {Array} 시도할 킥 오프셋 배열 [dx, dy]
 */
export function getSRSKickTable(pieceType, fromRotation, toRotation) {
  // I-piece 킥 테이블
  if (pieceType === 'I') {
    const kickTable = {
      '0->1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
      '1->0': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
      '1->2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
      '2->1': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
      '2->3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
      '3->2': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
      '3->0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
      '0->3': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]]
    };
    return kickTable[`${fromRotation}->${toRotation}`] || [[0,0]];
  }

  // 다른 피스 (T, S, Z, J, L, O) 킥 테이블
  const kickTable = {
    '0->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '1->0': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '1->2': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '2->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '2->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    '3->2': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '3->0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '0->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]]
  };
  return kickTable[`${fromRotation}->${toRotation}`] || [[0,0]];
}

/**
 * 회전 시도 (SRS 킥 적용)
 * @param {number[][]} board - 게임 보드
 * @param {number[][]} piece - 현재 피스
 * @param {number[][]} nextPiece - 회전된 피스
 * @param {number} row - 현재 행
 * @param {number} col - 현재 열
 * @param {string} pieceType - 피스 타입
 * @param {number} fromRotation - 회전 시작 상태
 * @param {number} toRotation - 회전 목표 상태
 * @returns {object|null} {row, col, kicked: true/false} 또는 null
 */
export function attemptRotation(board, piece, nextPiece, row, col, pieceType, fromRotation, toRotation) {
  // canPlace 함수를 직접 정의하여 순환 의존성 제거
  const canPlace = (board, piece, r, c) => {
    for (let pr = 0; pr < piece.length; pr++) {
      for (let pc = 0; pc < piece[pr].length; pc++) {
        if (piece[pr][pc] === 0) continue;
        const newRow = r + pr;
        const newCol = c + pc;
        if (newRow < 0 || newRow >= 20) return false;
        if (newCol < 0 || newCol >= 10) return false;
        if (board[newRow][newCol] !== 0) return false;
      }
    }
    return true;
  };
  
  // 킥 테이블 가져오기
  const kickOffsets = getSRSKickTable(pieceType, fromRotation, toRotation);
  // 각 킥 오프셋 시도 (kickIndex 필요)
  for (let i = 0; i < kickOffsets.length; i++) {
    const [dx, dy] = kickOffsets[i];
    const newCol = col + dx;
    const newRow = row + dy;
    if (canPlace(board, nextPiece, newRow, newCol)) {
      // 첫 번째 오프셋 [0,0]은 킥이 아님
      const kicked = dx !== 0 || dy !== 0;
      return { row: newRow, col: newCol, kicked, kickIndex: i };
    }
  }
  return null; // 회전 불가
}

/**
 * 피스 센터 위치 가져오기
 * @param {string} pieceType - 피스 타입
 * @param {number} rotation - 회전 상태
 * @returns {object} {x, y} 센터 좌표
 */
export function getPieceCenter(pieceType, rotation) {
  const centers = PIECE_CENTERS[pieceType];
  if (centers && centers[rotation]) {
    return centers[rotation];
  }
  return { x: 1, y: 1 };
}

/**
 * 모든 가능한 회전 상태 생성
 * @param {object} rotations - PIECES[pieceType] (모든 회전 상태)
 * @returns {number[]} 사용 가능한 회전 인덱스
 */
export function getValidRotations(rotations) {
  return Array.from({ length: rotations.length }, (_, i) => i);
}
