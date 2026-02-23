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




function getColumnTransitions(board) {
  let transitions = 0;
  for (let col = 0; col < 10; col++) {
    let prevFilled = true; // top wall
    for (let row = 0; row < 20; row++) {
      const filled = board[row][col] !== 0;
      if (filled !== prevFilled) transitions++;
      prevFilled = filled;
    }
    if (!prevFilled) transitions++; // bottom wall
  }
  return transitions;
}

function getRowTransitions(board) {
  let transitions = 0;
  for (let row = 0; row < 20; row++) {
    let prevFilled = true; // left wall
    for (let col = 0; col < 10; col++) {
      const filled = board[row][col] !== 0;
      if (filled !== prevFilled) transitions++;
      prevFilled = filled;
    }
    if (!prevFilled) transitions++; // right wall
  }
  return transitions;
}

function getAttackValue(action, isB2B, b2bCount) {
  const attackTable = {
    single: 0,
    double: 1,
    triple: 2,
    tetris: 4,
    tsm: 0,
    tss: 2,
    tsd: 4,
    tst: 6,
    tetris_pc: 10,
    triple_pc: 8,
    double_pc: 7,
    single_pc: 6,
    pc: 10,
    tsd_pc: 12,
    tst_pc: 13,
  };

  let attack = attackTable[action] ?? 0;
  const b2bEligible = ['tetris', 'tss', 'tsd', 'tst', 'tetris_pc', 'tsd_pc', 'tst_pc'].includes(action);
  if (isB2B && b2bEligible) {
    attack += 1 + Math.floor(Math.max(0, b2bCount) / 2);
  }
  return attack;
}

function getHoleDepthPenalty(board, heights) {
  let penalty = 0;
  for (let col = 0; col < 10; col++) {
    const startRow = 20 - heights[col];
    let cover = 0;
    for (let row = startRow; row < 20; row++) {
      if (board[row][col] !== 0) {
        cover++;
      } else {
        penalty += cover;
      }
    }
  }
  return penalty;
}

const ACTION_SCORES = {
  none: 0,
  single: -40,
  double: 160,
  triple: 420,
  tetris: 1300,
  tsmzero: 60,
  tszero: 120,
  tsm: 450,
  tsm_double: 2600,
  tss: 1400,
  tsd: 4300,
  tst: 5600,
  tetris_pc: 14500,
  triple_pc: 11200,
  double_pc: 10800,
  single_pc: 10400,
  pc: 11000,
  tsd_pc: 17800,
  tst_pc: 18600,
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
      nearFullRows: 50,
      colTransitions: -6,
      rowTransitions: -7,
      holeDepthPenalty: -20,
    },
    cheese: {
      holes: -150,
      deepHoles: -250,
      height: -8,
      bumpiness: -2,
      variance: -5,
      nearFullRows: 100,
      colTransitions: -4,
      rowTransitions: -5,
      holeDepthPenalty: -26,
    },
    straight: {
      holes: -140,
      deepHoles: -180,
      height: -7,
      bumpiness: -5,
      variance: -10,
      nearFullRows: 80,
      colTransitions: -7,
      rowTransitions: -8,
      holeDepthPenalty: -22,
    },
    danger: {
      holes: -200,
      deepHoles: -300,
      height: -10,
      bumpiness: -3,
      variance: -6,
      nearFullRows: 150,
      colTransitions: -5,
      rowTransitions: -6,
      holeDepthPenalty: -30,
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

  const colTransitions = getColumnTransitions(board);
  const rowTransitions = getRowTransitions(board);
  const holeDepthPenalty = getHoleDepthPenalty(board, analysis.heights);
  score += colTransitions * (w.colTransitions ?? -5);
  score += rowTransitions * (w.rowTransitions ?? -6);
  score += holeDepthPenalty * (w.holeDepthPenalty ?? -20);
  
  // 우물 잠재력 보너스 (높음 = 좋음)
  score += analysis.wellPotential * 2;

  // 액션별 점수 (Cold Clear 계열처럼 액션 보상과 보드 페널티를 분리)
  score += ACTION_SCORES[lastAction] ?? 0;
  // 공격량 기반 보너스(cold-clear 계열 의사결정 반영)
  const attack = getAttackValue(lastAction, isB2B, b2bCount);
  score += attack * 320;

  // Perfect Clear 보너스 (매우 높음)
  if (lastAction.includes("_pc") || lastAction === "pc") {
    score += 4500;
    if (lastAction === "tsd_pc") score += 1800;
    if (lastAction === "tst_pc") score += 1400;
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
    if (lastAction.includes("_pc") || lastAction === "pc") score += 900;
  }

  if (mode === "cheese") {
    // 치즈 모드: 콤보 + 멀티플라이어 테트리스
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 3000;
    if (lastAction.includes("_pc")) score += 900;
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