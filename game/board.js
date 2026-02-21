// 열(column)별 높이 계산
export function getColumnHeights(board) {
  const heights = new Array(10).fill(0);
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 20; row++) {
      if (board[row][col] !== 0) {
        heights[col] = 20 - row;
        break;
      }
    }
  }
  return heights;
}

// 구멍 개수 계산
export function countHoles(board, heights) {
  let holes = 0;
  for (let col = 0; col < 10; col++) {
    const startRow = 20 - heights[col];
    for (let row = startRow; row < 20; row++) {
      if (board[row][col] === 0) holes++;
    }
  }
  return holes;
}

// 울퉁불퉁함 계산
export function getBumpiness(heights) {
  let bumpiness = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }
  return bumpiness;
}

/**
 * 각 열의 우물 깊이 계산 (I-피스 배치 가능성)
 * @param {number[]} heights - 열별 높이
 * @returns {number[]} 각 열의 우물 깊이
 */
export function getWellDepths(heights) {
  const wellDepths = new Array(10).fill(0);
  for (let col = 0; col < 10; col++) {
    const leftHeight = col === 0 ? Infinity : heights[col - 1];
    const rightHeight = col === 9 ? Infinity : heights[col + 1];
    const wallHeight = Math.min(leftHeight, rightHeight);
    
    if (wallHeight > heights[col]) {
      wellDepths[col] = Math.min(wallHeight - heights[col], 18 - heights[col]);
    }
  }
  return wellDepths;
}

/**
 * 가장 최적의 배치 열 찾기
 * @param {number[]} heights - 열별 높이
 * @returns {number} 최적 배치 열 인덱스
 */
export function findBestColumn(heights) {
  const wellDepths = getWellDepths(heights);
  let bestCol = 0;
  let bestScore = -Infinity;
  
  for (let col = 0; col < 10; col++) {
    // 우물 깊이 우선, 높이가 낮은 것 우대
    const score = wellDepths[col] * 10 - heights[col];
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  
  return bestCol;
}

/**
 * 라인 클리어 가능성 평가 (0~1)
 * @param {number[][]} board - 게임 보드
 * @returns {number} 클리어 가능성 점수
 */
export function evaluateClearPotential(board) {
  let maxFilled = 0;
  for (let row = 19; row >= 0; row--) {
    const filledCells = board[row].filter(cell => cell !== 0).length;
    maxFilled = Math.max(maxFilled, filledCells);
  }
  return maxFilled / 10; // 0 ~ 1
}

// 피스를 보드에 놓을 수 있는지 확인
export function canPlace(board, piece, row, col) {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c] === 0) continue;
      const newRow = row + r;
      const newCol = col + c;
      if (newRow < 0 || newRow >= 20) return false;
      if (newCol < 0 || newCol >= 10) return false;
      if (board[newRow][newCol] !== 0) return false;
    }
  }
  return true;
}

// 피스를 보드에 놓기
export function placePiece(board, piece, row, col) {
  const newBoard = board.map(r => [...r]);
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c] === 0) continue;
      newBoard[row + r][col + c] = 1;
    }
  }
  return newBoard;
}

// 피스를 중력으로 떨어뜨리기
export function dropPiece(board, piece, col) {
  let row = 0;
  while (canPlace(board, piece, row + 1, col)) {
    row++;
  }
  if (!canPlace(board, piece, row, col)) return null;
  return { board: placePiece(board, piece, row, col), row };
}

// 라인 클리어
export function clearLines(board) {
  const newBoard = board.filter(row => row.some(cell => cell === 0));
  const cleared = 20 - newBoard.length;
  while (newBoard.length < 20) newBoard.unshift(new Array(10).fill(0));
  return { board: newBoard, cleared };
}

// dropRowOn 함수 (col에서 피스를 하드드롭했을 때의 row)
export function dropRowOn(board, piece, col) {
  let row = 0;
  while (canPlace(board, piece, row + 1, col)) {
    row++;
  }
  return canPlace(board, piece, row, col) ? row : -1;
}
