import { getColumnHeights, countHoles } from "../game/board.js";

/**
 * 보드 분석: 방해줄 종류 감지
 * @param {number[][]} board - 게임 보드
 * @returns {string} 방해줄 종류: "none", "cheese", "straight"
 */
function detectGarbageType(board) {
  const garbageRows = [];
  for (let row = 19; row >= 0; row--) {
    const hasGarbage = board[row].some(cell => cell === 8);
    if (hasGarbage) garbageRows.push({ row, data: board[row] });
  }
  
  if (garbageRows.length === 0) return "none";

  // 방해줄의 구멍 패턴 분석
  let totalHoleColumns = 0;
  let holePatterns = new Map();
  
  garbageRows.forEach(({ data }) => {
    for (let col = 0; col < 10; col++) {
      if (data[col] === 0) {
        holePatterns.set(col, (holePatterns.get(col) || 0) + 1);
        totalHoleColumns++;
      }
    }
  });
  
  const uniqueColumns = holePatterns.size;
  const consistentHoles = [...holePatterns.values()].filter(count => count === garbageRows.length).length;

  // 일자줄(Straight): 구멍이 일관되게 같은 위치 (1~2개 열)
  if (consistentHoles >= 1 && uniqueColumns <= 2) return "straight";
  
  // 치즈(Cheese): 구멍이 여러 위치에 분산 (3개 이상 열)
  if (uniqueColumns >= 3) return "cheese";
  
  return "straight";
}

/**
 * 현재 게임 모드 판단
 * @param {number[][]} board - 게임 보드
 * @returns {string} 모드: "safe", "cheese", "straight", "danger"
 */
export function detectMode(board) {
  const heights = getColumnHeights(board);
  const maxHeight = Math.max(...heights);
  const minHeight = Math.min(...heights);
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
  const holes = countHoles(board, heights);
  
  // 높이 분산도 계산 (불균형 정도)
  let variance = 0;
  for (let h of heights) {
    variance += Math.pow(h - avgHeight, 2);
  }
  variance = Math.sqrt(variance / heights.length);
  
  const garbageType = detectGarbageType(board);

  // 위험 모드: 매우 높거나 구멍 많음
  // 조건: 최대높이 >= 15 또는 구멍 >= 6 또는 (높이 >= 14 AND 분산도 > 4)
  if (maxHeight >= 15 || holes >= 6 || (maxHeight >= 14 && variance > 4)) {
    return "danger";
  }
  
  // 방해줄에 따른 모드 선택
  if (garbageType === "cheese") return "cheese";
  if (garbageType === "straight") return "straight";
  
  // 방해줄이 없을 때: 높이와 분산도로 판단
  // 높이가 낮고 균형잡혀 있으면 "safe"
  if (maxHeight <= 8 && variance < 3) return "safe";
  
  // 중간 수준의 위험성
  if (maxHeight <= 12 && holes <= 3) return "safe";
  
  // 기본값
  return "safe";
}
