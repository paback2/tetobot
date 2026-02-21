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


console.log("\n--- 피스 배치 테스트 (Lookahead) ---");

const emptyBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));

// 이제 pieces 인자는 배열이어야 함
const bestI = findBestMove(emptyBoard, ["I", "T", "J"], false, "safe");
console.log("I, T, J 순서일 때 I피스 최적 배치:", bestI);

const bestT = findBestMove(emptyBoard, ["T", "S", "Z"], true, "safe");
console.log("T, S, Z 순서일 때 T피스 최적 배치:", bestT);


console.log("\n--- T-Spin 감지 테스트 (Lookahead) ---");

// TSD를 위해 한 수를 희생해야 하는 시나리오
const tsdSetupBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));
tsdSetupBoard[19] = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
tsdSetupBoard[18] = [1, 1, 1, 0, 0, 1, 1, 1, 1, 1];
tsdSetupBoard[17] = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1];

// 현재 조각: S, 다음 조각: T
// S를 오른쪽에 쌓아 T-Spin Double 각을 만들어야 함
console.log("\nTSD 셋업 테스트 (S 다음 T):");
const tsdResult = findBestMove(tsdSetupBoard, ["S", "T"], false, "safe");
console.log("S조각 배치 결과:", tsdResult);
// 예상 결과: S를 오른쪽에 세워서 놓아 TSD 각을 완성해야 함
// { rotation: 1, col: 4, ... } 와 유사한 결과가 나와야 함


// 명확한 T-Spin 우물 테스트
const clearTSpinBoard = Array.from({ length: 20 }, () => new Array(10).fill(0));
// 바닥에 여러 줄
for (let r = 17; r <= 19; r++) {
  for (let c = 0; c < 10; c++) {
    if (c !== 4) clearTSpinBoard[r][c] = 1;
  }
}
console.log("\n명확한 T-Spin 우물 테스트 (T 다음 O):");
const clearTResult = findBestMove(clearTSpinBoard, ["T", "O"], true, "safe");
console.log("결과:", clearTResult);
