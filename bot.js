import { detectMode } from './ai/modes.js';
import { evaluateBoard } from './ai/scoring.js';
import { findBestMoveAdvanced } from './ai/moves-advanced.js';
import { findBestMoveWithHold } from './ai/moves.js';
import { getColumnHeights, countHoles, performHold } from './game/board.js';

// ============================================
// 게임 상태 관리
// ============================================

/**
 * 게임 상태 객체
 */
class GameState {
  constructor() {
    this.board = Array.from({ length: 20 }, () => new Array(10).fill(0));
    this.currentPiece = null;
    this.heldPiece = null;
    this.canHold = true; // 현재 턴에서 홀드를 사용할 수 있는지 여부
    this.pieceQueue = [];
    this.isB2B = false;
    this.combo = 0;
    this.score = 0;
  }

  /**
   * 게임 상태 초기화
   */
  reset() {
    this.board = Array.from({ length: 20 }, () => new Array(10).fill(0));
    this.currentPiece = null;
    this.heldPiece = null;
    this.canHold = true;
    this.pieceQueue = [];
    this.isB2B = false;
    this.combo = 0;
    this.score = 0;
  }

  /**
   * 홀드 기능 실행
   * @returns {boolean} 홀드 성공 여부
   */
  performHoldAction() {
    if (!this.canHold) return false;
    if (this.currentPiece === null) return false;

    const { newCurrent, newHeld } = performHold(this.currentPiece, this.heldPiece);

    if (newCurrent === null && this.pieceQueue.length > 0) {
      // 홀드 박스가 비어있었으므로 다음 피스 사용
      this.heldPiece = newHeld;
      this.currentPiece = this.pieceQueue.shift();
    } else if (newCurrent !== null) {
      // 홀드된 피스와 교환
      this.heldPiece = newHeld;
      this.currentPiece = newCurrent;
    }

    // 7-bag 순서를 깨지 않도록 큐는 그대로 유지한다.

    this.canHold = false; // 이 턴에서 홀드 사용 완료
    return true;
  }

  /**
   * 새 턴 시작 (홀드 기능 리셋)
   */
  startNewTurn() {
    this.canHold = true; // 다음 턴에서 홀드 사용 가능
  }

  /**
   * 최적의 움직임 찾기 (Cold Clear 2 Deep Beam Search)
   * @returns {object} 최적 움직임 정보
   */
  findBestMove() {
    if (this.currentPiece === null) {
      return null;
    }

    // 7-bag 보존: queue는 있는 그대로 탐색에 사용
    const pieces = [this.currentPiece, ...this.pieceQueue];
    const mode = detectMode(this.board);

    // cold-clear-2/cobra-tetrio-movegen 스타일: hold, perfect clear, tspin, beam/depth 모두 지원
    // findBestMoveWithHold(board, pieces, heldPiece, canHold, isB2B, mode)
    const move = findBestMoveWithHold(this.board, pieces, this.heldPiece, this.canHold, this.isB2B, mode);

    // usedHold가 true면 자동으로 performHoldAction 호출 (상태 동기화)
    if (move && move.usedHold) {
      this.performHoldAction();
    }
    return move;
  }

  /**
   * 게임 모드 감지
   * @returns {string} 감지된 모드 (safe, cheese, straight, danger)
   */
  detectMode() {
    return detectMode(this.board);
  }

  /**
   * 보드 상태 출력
   */
  printBoard() {
    console.log("=== 게임 상태 ===");
    console.log("현재 피스:", this.currentPiece);
    console.log("홀드된 피스:", this.heldPiece);
    console.log("홀드 사용 가능:", this.canHold);
    console.log("Back-to-Back:", this.isB2B);
    console.log("점수:", this.score);
    console.log("보드:");
    for (let row = 0; row < 20; row++) {
      console.log(this.board[row].map(cell => cell === 0 ? '.' : '#').join(''));
    }
  }
}

// ============================================
// 테스트
// ============================================

console.log("--- 홀드 기능 테스트 ---");
const gameState = new GameState();
gameState.currentPiece = "T";
gameState.heldPiece = null;
gameState.pieceQueue = ["I", "O", "S"];

console.log("초기 상태:");
console.log("  현재:", gameState.currentPiece);
console.log("  홀드:", gameState.heldPiece);

const holdSuccess1 = gameState.performHoldAction();
console.log("\n첫 홀드 사용 후:");
console.log("  성공:", holdSuccess1);
console.log("  현재:", gameState.currentPiece);
console.log("  홀드:", gameState.heldPiece);
console.log("  홀드 가능:", gameState.canHold);

const holdSuccess2 = gameState.performHoldAction();
console.log("\n같은 턴에서 두 번째 홀드 시도:");
console.log("  성공:", holdSuccess2);
console.log("  현재:", gameState.currentPiece);
console.log("  홀드:", gameState.heldPiece);

gameState.startNewTurn();
console.log("\n새 턴 시작 후:");
console.log("  홀드 가능:", gameState.canHold);

const holdSuccess3 = gameState.performHoldAction();
console.log("\n다음 턴에서 홀드 사용:");
console.log("  성공:", holdSuccess3);
console.log("  현재:", gameState.currentPiece);
console.log("  홀드:", gameState.heldPiece);
console.log("  홀드 가능:", gameState.canHold);

console.log("\n--- 모드 감지 테스트 ---");
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

const bestI = findBestMoveAdvanced(emptyBoard, ["I", "T", "J"], false, "safe");
console.log("I, T, J 순서일 때 I피스 최적 배치:", bestI);

const bestT = findBestMoveAdvanced(emptyBoard, ["T", "S", "Z"], true, "safe");
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
const tsdResult = findBestMoveAdvanced(tsdSetupBoard, ["S", "T"], false, "safe");
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
const clearTResult = findBestMoveAdvanced(clearTSpinBoard, ["T", "O"], true, "safe");
console.log("결과:", clearTResult);

// 내보내기
export { GameState };
