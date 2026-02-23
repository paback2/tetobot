import { checkTSpin } from './ai/tspin.js';

// T-Spin이 일어나지 않는 보드 상황들 테스트

console.log('=== T-Spin 감지 정확도 테스트 ===\n');

// 테스트 1: T-Spin이 아닌 경우 (단순 배치)
function createEmptyBoard() {
  return Array(20).fill(0).map(() => Array(10).fill(0));
}

function boardWithBottomLine(extraRows = []) {
  const board = createEmptyBoard();
  // 가장 아래 행 채우기
  for (let row = 19; row >= 19 - extraRows.length; row--) {
    for (let col = 0; col < 10; col++) {
      board[row][col] = 1;
    }
  }
  return board;
}

// Test 1: 코너가 3개 차 있지만 T-piece이 아닌 경우
const test1 = createEmptyBoard();
test1[19][4] = 1;  // 좌하
test1[19][6] = 1;  // 우하
test1[18][5] = 1;  // 중앙
const result1 = checkTSpin(test1, 18, 4, 0, false);
console.log('테스트 1 - 코너 3개만 찬 경우 (T-Spin 아님):');
console.log(`  위치: (18,4) 회전: 0`)
console.log(`  결과: isTSpin=${result1.isTSpin}, isMini=${result1.isMini}`);
console.log(`  기대값: isTSpin=true or false, isMini=?, 하지만 "확실한" T-Spin이 아님\n`);

// Test 2: 명확한 스핀 우물 (TSD 가능한 상태)
const test2 = createEmptyBoard();
// 왼쪽 우물 (TSD 가능)
test2[19][0] = 1;
test2[19][1] = 1;
test2[19][2] = 1;
test2[19][3] = 1;
test2[19][4] = 1;
test2[19][5] = 1;
test2[19][6] = 1;
test2[19][7] = 1;
test2[19][8] = 1;
test2[19][9] = 1;  // 맨 아래 row 가득
test2[18][0] = 1;
test2[18][1] = 1;
test2[18][3] = 1;  // col 2 비어있음 (우물)
test2[18][4] = 1;
test2[18][5] = 1;
test2[18][6] = 1;
test2[18][7] = 1;
test2[18][8] = 1;
test2[18][9] = 1;

const result2 = checkTSpin(test2, 18, 1, 2, false);  // T-spin 회전: 2 (남쪽)
console.log('테스트 2 - 명확한 TSD 우물:');
console.log(`  위치: (18,1) 회전: 2`);
console.log(`  결과: isTSpin=${result2.isTSpin}, isMini=${result2.isMini}`);
console.log(`  기대값: isTSpin=true, isMini=false (Full T-Spin)\n`);

// Test 3: Mini T-Spin (정확한 배치)
const test3 = createEmptyBoard();
// 아래에서 위쪽이 비어있는 우물
test3[19][0] = 1;
test3[19][1] = 1;
test3[19][2] = 1;
test3[19][3] = 1;
test3[19][4] = 1;
test3[19][5] = 1;
test3[19][6] = 1;
test3[19][7] = 1;
test3[19][8] = 1;
test3[19][9] = 1;
test3[18][0] = 1;
test3[18][1] = 1;
test3[18][2] = 1;
test3[18][3] = 1;
test3[18][4] = 1;
test3[18][6] = 1;  // col 5 비어있음
test3[18][7] = 1;
test3[18][8] = 1;
test3[18][9] = 1;
test3[17][5] = 1;  // 위에 블록 추가

// Rotation 0 (North) - 아래 우물: T가 위쪽에서 떨어져 우물로 들어감
const result3 = checkTSpin(test3, 17, 4, 0, false);
console.log('테스트 3 - Mini T-Spin 후보:');
console.log(`  위치: (17,4) 회전: 0`);
console.log(`  결과: isTSpin=${result3.isTSpin}, isMini=${result3.isMini}`);
console.log(`  기대값: isTSpin=true, isMini=true (Mini)\n`);

// Test 4: 실제 게임에서 T-Spin이 아닌 경우
// (3개 코너만 찰 수 있지만 회전으로 배치되지 않은 경우)
const test4 = createEmptyBoard();
test4[19][4] = 1;
test4[19][5] = 1;
test4[19][6] = 1;
test4[18][4] = 1;
test4[18][6] = 1;
// 이 상태에서 T-Piece을 (18,5)에 놓으면? 코너 3개-4개가 찰 수 있지만
// 실제로는 단순 배치일 수 있음
const result4 = checkTSpin(test4, 18, 4, 0, false);
console.log('테스트 4 - 단순 배치 (T-Spin 아님):');
console.log(`  위치: (18,4) 회전: 0`);
console.log(`  결과: isTSpin=${result4.isTSpin}, isMini=${result4.isMini}`);
console.log(`  분석: 3개 코너가 차 있으면 현재 코드는 T-Spin이라고 판단\n`);

console.log('=== 결론 ===');
console.log('현재 문제: 3개 코너만 찰 때도 T-Spin이라고 판단');
console.log('해결: 더 엄격한 조건 필요');
console.log('  - 회전 상태가 실제 T-Spin 형태인지 확인');
console.log('  - Mini 코너 조건을 더 정확히 적용');
console.log('  - Line clear와 함께 감지된 경우만 확인');
