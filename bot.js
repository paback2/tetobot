import { detectMode } from './ai/modes.js';
import { evaluateBoard } from './ai/scoring.js';
import { findBestMove } from './ai/moves.js';
import { getColumnHeights, countHoles } from './game/board.js';

// ============================================
// 테스트
// ============================================

console.log("--- 모드 감지 테스트 ---");
const testBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));

testBoard[19] = [8,8,8,0,8,8,8,8,8,8];
testBoard[18] = [8,8,8,8,8,0,8,8,8,8];
testBoard[17] = [8,0,8,8,8,8,8,8,8,8];

const mode = detectMode(testBoard);
const heights = getColumnHeights(testBoard);
const holes = countHoles(testBoard, heights);

console.log("현재 모드:", mode);
console.log("최대 높이:", Math.max(...heights));
console.log("구멍 개수:", holes);
console.log("방해줄 종류:", detectMode(testBoard));


console.log("\n--- 점수 계산 테스트 ---");

// 안전 모드에서 TSD
const score1 = evaluateBoard(testBoard, "tsd", true, 3, "safe");
console.log("안전모드 TSD (B2B 3연속):", score1);

// 치즈 모드에서 싱글 (예외 허용)
const score2 = evaluateBoard(testBoard, "single", false, 0, "cheese");
console.log("치즈모드 싱글 (예외):", score2);

// 안전 모드에서 이유없이 싱글 (페널티)
const score3 = evaluateBoard(testBoard, "single", true, 2, "safe");
console.log("안전모드 이유없는 싱글 (페널티):", score3);

// 위기 모드에서 TSD 마무리
const score4 = evaluateBoard(testBoard, "tsd", false, 0, "danger");
console.log("위기모드 TSD 마무리:", score4);


console.log("\n--- 피스 배치 테스트 ---");

const emptyBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));

const bestI = findBestMove(emptyBoard, "I", false, "safe");
console.log("I피스 최적 배치:", bestI);

const bestT = findBestMove(emptyBoard, "T", true, "safe");
console.log("T피스 최적 배치:", bestT);


console.log("\n--- T-Spin 감지 테스트 ---");

// TSD 세팅 보드 (더 명확한 T-Spin 구멍)
const tsdBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));
// 아래쪽만 채우고 T-Spin 구멍 만들기
tsdBoard[19] = [1,1,1,1,1,1,1,1,1,1];
tsdBoard[18] = [1,1,1,1,1,0,0,1,1,1];
tsdBoard[17] = [1,1,1,1,1,1,0,1,1,1];
tsdBoard[16] = [1,1,1,1,1,0,0,1,1,1];
tsdBoard[15] = [1,1,1,1,1,0,0,0,1,1];

console.log("TSD 세팅 보드에서 T피스 최적 배치:");
const bestT2 = findBestMove(tsdBoard, "T", true, "safe");
console.log(bestT2);
