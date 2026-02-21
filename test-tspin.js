import { checkTSpin, getTSpinAction } from './ai/tspin.js';

// T-Spin을 위한 올바른 보드 구성
const board = Array.from({ length: 20 }, () => new Array(10).fill(0));

// 바닥에 기본 라인
for (let c = 0; c < 10; c++) {
  board[19][c] = 1;
}

// 두 번째 줄 (일부 구멍)
for (let c = 0; c < 10; c++) {
  if (c !== 4) board[18][c] = 1; // 열 4만 비우기
}

// 세 번째 줄 (일부 구멍)
for (let c = 0; c < 10; c++) {
  if (c !== 4) board[17][c] = 1; // 열 4만 비우기
}

// 네 번째 줄 (일부 구멍)
for (let c = 0; c < 10; c++) {
  if (c !== 4) board[16][c] = 1; // 열 4만 비우기
}

console.log("T-Spin 우물 보드:");
console.log("행 19:", board[19].map(c => c ? '█' : '□').join(''));
console.log("행 18:", board[18].map(c => c ? '█' : '□').join(''));
console.log("행 17:", board[17].map(c => c ? '█' : '□').join(''));
console.log("행 16:", board[16].map(c => c ? '█' : '□').join(''));

// T-피스 회전 1 배치:
// [[1, 0],
//  [1, 1],
//  [1, 0]]
//
// 이를 (row=16, col=4)에 놓으면:
// (16, 4) = 1, (16, 5) = 0
// (17, 4) = 1, (17, 5) = 1
// (18, 4) = 1, (18, 5) = 0
//
// 3x3 바운딩 박스 (중심 기준 ±1):
// (15, 3)~(15, 5): 모두 0
// (16, 3)~(16, 5): █□□
// (17, 3)~(17, 5): ███
//
// 4개 모서리:
// A: (15, 3) = 0 (벽, 채워짐)
// B: (15, 5) = 0 (벽, 채워짐)
// C: (17, 3) = 1 (채워짐)
// D: (17, 5) = 1 (채워짐)
// → 3개 이상 채워짐 ✓

console.log("\n--- T-Spin 체크 (올바른 중심 좌표) ---");
// T-피스 회전 1: [[1, 0], [1, 1], [1, 0]]
// row=16, col=4에 배치되면 중심은? bounding box 기반이므로:
// 회전 1의 중심은 (row+1, col) = (17, 4)

console.log("회전 1 (중심: 17, 4):");
const result1Correct = checkTSpin(board, 17, 4, 1, false);
console.log("결과:", result1Correct);

console.log("\n회전 1 킥됨 (중심: 17, 4):");
const result1KickedCorrect = checkTSpin(board, 17, 4, 1, true);
console.log("결과:", result1KickedCorrect);

// 회전 0: [[0,1,0], [1,1,1]]로 테스트
// row=17, col=4에 배치되면 중심은 (row+1, col+1) = (18, 5)

console.log("\n회전 0 (중심: 18, 5):");
const result0Correct = checkTSpin(board, 18, 5, 0, false);
console.log("결과:", result0Correct);

