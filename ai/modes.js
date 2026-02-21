import { getColumnHeights, countHoles } from "../game/board.js";

// 방해줄 종류 감지
function detectGarbageType(board) {
  const garbageRows = [];
  for (let row = 19; row >= 0; row--) {
    const hasGarbage = board[row].some(cell => cell === 8);
    if (hasGarbage) garbageRows.push(board[row]);
  }
  if (garbageRows.length === 0) return "none";

  const holeColumns = garbageRows.map(row => row.indexOf(0));
  const uniqueColumns = new Set(holeColumns);

  if (uniqueColumns.size >= 3) return "cheese";
  return "straight";
}

// 현재 모드 판단
export function detectMode(board) {
  const heights = getColumnHeights(board);
  const maxHeight = Math.max(...heights);
  const holes = countHoles(board, heights);
  const garbageType = detectGarbageType(board);

  if (maxHeight >= 15 || holes >= 6) return "danger";
  if (garbageType === "cheese") return "cheese";
  if (garbageType === "straight") return "straight";
  return "safe";
}
