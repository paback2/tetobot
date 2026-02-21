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

  // 액션별 점수 (모드 무관)
  // 
  // Full T-Spin 점수표 (빈도와 효율성 기반, 미래 계획 장려):
  //   TSD (2줄): 5500 - 가장 효율적, 가장 흔한 T-Spin (황금 배치) - 상향
  //   TST (3줄): 4200 - 3줄 클리어 (상향)
  //   TSS (1줄): 4000 - 1줄이지만 매우 흔하고 실용적 (상향)
  //   TSF (2줄): 3500 - Fin 세팅 (한쪽 돌출), 기술적 가치 (상향)
  //
  // Mini T-Spin 점수표:
  //   TSM (1줄): 1500 - Mini 3칸 구멍 (상향)
  //
  // 퍼펙트 클리어 점수
  // 규칙: T-Spin = PC는 불가능 (회전 필요 지점과 PC 조건이 상충)
  // PC는 일반 클리어(Single/Double/Triple/Tetris)와 동시 발생 가능
  if (lastAction === "tetris_pc") score += 15000;
  else if (lastAction === "triple_pc") score += 10500;
  else if (lastAction === "double_pc") score += 10300;
  else if (lastAction === "single_pc") score += 10100;
  else if (lastAction === "pc") score += 10000;
  // T-Spin = PC 조합은 불가능 (제거)
  // 일반 T-Spin (점수 유지)
  else if (lastAction === "tsd") score += 5500;   // T-Spin Double (황금)
  else if (lastAction === "tsf") score += 3500;   // T-Spin Fin
  else if (lastAction === "tss") score += 4000;   // T-Spin Single
  else if (lastAction === "tst") score += 4200;   // T-Spin Triple
  else if (lastAction === "tsm") score += 1500;   // T-Spin Mini
  else if (lastAction === "tetris") score += 2000;

  // B2B 보너스
  // B2B 유지: T-Spin, Tetris, PC 동반 액션 모두 포함
  if (isB2B) {
    score += 500;
    // TSD 연속 보너스 (특별한 기술)
    if (lastAction === "tsd") score += 1000;
  }

  // 모드별 추가 점수
  if (mode === "safe") {
    // 안전 모드: PC 탐색 + T-Spin 극대화
    if (lastAction === "tsd") score += 500;
    if (lastAction === "tsf" || lastAction === "tsf_pc") score += 500;
  }

  if (mode === "cheese") {
    // 치즈 모드: 콤보 + 멀티플라이어 테트리스
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 3000;
    if (lastAction === "single" || lastAction === "double" || lastAction === "triple") {
      score += 500; // 생존을 위한 예외 — 페널티 없음
    }
  }

  if (mode === "straight") {
    // 일자줄 모드: 테트리스↔TSD 교차
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 1000;
    if (lastAction === "tsd") score += 1000;
  }

  if (mode === "danger") {
    // 위기 모드: 콤보 다운스택
    if (lastAction === "tsd") score += 5000;   // TSD 마무리
    if (lastAction === "tst" || lastAction === "tst_pc") score += 4000;   // TST 마무리
    if (lastAction === "tetris" || lastAction === "tetris_pc") score += 3500; // Tetris 마무리
    if (lastAction === "single") score -= 5000; // Single 마무리 금지
    score += 1000; // 위기 탈출 시도 보너스
  }

  // 이유없는 B2B 끊기 페널티
  if (isB2B && (lastAction === "single" || lastAction === "double" || lastAction === "triple")) {
    if (mode !== "cheese" && mode !== "danger") {
      score -= 3000;
    }
  }

  return score;
