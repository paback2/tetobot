import { getColumnHeights, countHoles, getBumpiness } from '../game/board.js';

/**
 * 상세한 보드 분석 메트릭 계산
 * @param {number[][]} board - 게임 보드
 * @returns {Object} 보드 분석 결과
 */
function analyzeBoard(board) {
  const heights = getColumnHeights(board);
  const holes = countHoles(board, heights);
  const bumpiness = getBumpiness(heights);
  const maxHeight = Math.max(...heights);
  const minHeight = Math.min(...heights);
  
  // 평균 높이
  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
  
  // 깊은 구멍 개수 (3칸 이상 깊이)
  let deepHoles = 0;
  for (let col = 0; col < 10; col++) {
    const startRow = 20 - heights[col];
    let holeDepth = 0;
    for (let row = startRow; row < 20; row++) {
      if (board[row][col] === 0) {
        holeDepth++;
      } else {
        if (holeDepth >= 3) deepHoles++;
        holeDepth = 0;
      }
    }
    if (holeDepth >= 3) deepHoles++;
  }
  
  // 행 채움도 분석 (클리어 가능성)
  let nearFullRows = 0;
  for (let row = 19; row >= Math.max(19 - maxHeight, 0); row--) {
    const filledCells = board[row].filter(cell => cell !== 0).length;
    if (filledCells >= 8) nearFullRows++; // 8칸 이상 차있는 행
  }
  
  // 우물 잠재력 (I-피스 배치 가능한 우물)
  let wellPotential = 0;
  for (let col = 0; col < 10; col++) {
    const leftWall = col === 0 || heights[col - 1] > heights[col];
    const rightWall = col === 9 || heights[col + 1] > heights[col];
    if (leftWall && rightWall && heights[col] < 18) {
      wellPotential += (18 - heights[col]); // 우물 깊이
    }
  }
  
  // 높이 분산도 (불균형 정도)
  let variance = 0;
  for (let h of heights) {
    variance += Math.pow(h - avgHeight, 2);
  }
  variance = Math.sqrt(variance / heights.length);
  
  return {
    heights,
    holes,
    deepHoles,
    bumpiness,
    maxHeight,
    minHeight,
    avgHeight,
    nearFullRows,
    wellPotential,
    variance
  };
}


const ACTION_SCORES = {
  none: 0,
  single: -80,
  double: 220,
  triple: 500,
  tetris: 1300,
  tsmzero: 80,
  tszero: 180,
  tsm: 550,
  tsm_double: 1800,
  tss: 1100,
  tsd: 4200,
  tst: 4700,
  tetris_pc: 14000,
  triple_pc: 10800,
  double_pc: 10400,
  single_pc: 10100,
  pc: 10000,
  tsd_pc: 17000,
  tst_pc: 16000,
};

// 모드별 점수 계산
export function evaluateBoard(board, lastAction, isB2B, b2bCount, mode) {
  const analysis = analyzeBoard(board);
  let score = 0;
  
  // 모드별 가중치 설정
  const weights = {
    safe: {
      holes: -120,
      deepHoles: -200,
      height: -6,
      bumpiness: -4,
      variance: -8,
      nearFullRows: 50
    },
    cheese: {
      holes: -150,
      deepHoles: -250,
      height: -8,
      bumpiness: -2,
      variance: -5,
      nearFullRows: 100
    },
    straight: {
      holes: -140,
      deepHoles: -180,
      height: -7,
      bumpiness: -5,
      variance: -10,
      nearFullRows: 80
    },
    danger: {
      holes: -200,
      deepHoles: -300,
      height: -10,
      bumpiness: -3,
      variance: -6,
      nearFullRows: 150
    }
  };
  
  const w = weights[mode] || weights.safe;
  
  // 모드별 최적화된 점수 계산
  score += analysis.holes * w.holes;
  score += analysis.deepHoles * w.deepHoles;
  score += analysis.maxHeight * w.height;
  score += analysis.bumpiness * w.bumpiness;
  score += analysis.variance * w.variance;
  score += analysis.nearFullRows * w.nearFullRows;
  
  // 우물 잠재력 보너스 (높음 = 좋음)
  score += analysis.wellPotential * 2;

  // 액션별 점수 (Cold Clear 계열처럼 액션 보상과 보드 페널티를 분리)
  score += ACTION_SCORES[lastAction] ?? 0;
  // Perfect Clear 보너스 (매우 높음)
  if (lastAction.includes("_pc") || lastAction === "pc") {
    score += 20000;  // 매우 높은 점수
    if (lastAction === "tsd_pc") score += 10000;  // TSD + PC 조합
    if (lastAction === "tst_pc") score += 8000;   // TST + PC 조합
  }

  // B2B 보너스
  // B2B 유지: T-Spin, Tetris, PC 동반 액션 모두 포함
  if (isB2B) {
    score += 450 + Math.min(1200, b2bCount * 75);
    if (lastAction === "tsd" || lastAction === "tst" || lastAction === "tsd_pc") score += 1100;
  }

  // 모드별 추가 점수
  if (mode === "safe") {
    // 안전 모드: PC 탐색 + T-Spin 극대화
    if (lastAction === "tsd") score += 1600;
    if (lastAction === "tst") score += 700;
    if (lastAction.includes("_pc") || lastAction === "pc") score += 4000;
  }

  if (mode === "cheese") {
    // 치즈 모드: 콤보 + 멀티플라이어 테트리스
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 3000;
    if (lastAction.includes("_pc")) score += 3000;  // PC도 중요
    if (lastAction === "single" || lastAction === "double" || lastAction === "triple") {
      score += 500; // 생존을 위한 예외 — 페널티 없음
    }
  }

  if (mode === "straight") {
    // 일자줄 모드: 테트리스↔TSD 교차
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 1000;
    if (lastAction === "tsd") score += 1800;
    if (lastAction.includes("_pc")) score += 4000;  // PC도 높음
  }

  if (mode === "danger") {
    // 위기 모드: 콤보 다운스택
    if (lastAction === "tsd") score += 5000;   // TSD 마무리
    if (lastAction === "tst" || lastAction === "tst_pc") score += 4000;   // TST 마무리
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 3500; // Tetris 마무리
    if (lastAction.includes("_pc")) score += 15000;  // PC로 대역이 공격 중단 (최고의 상황)
    if (lastAction === "single") score -= 3500; // Single 마무리 금지
    score += 1000; // 위기 탈출 시도 보너스
  }

  // 이유없는 B2B 끊기 페널티
  if (isB2B && (lastAction === "single" || lastAction === "double" || lastAction === "triple")) {
    if (mode !== "cheese" && mode !== "danger") {
      score -= 3000;
    }
  }

  return score;}