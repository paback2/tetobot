import { getColumnHeights, countHoles, getBumpiness } from '../game/board.js';

// 모드별 점수 계산
export function evaluateBoard(board, lastAction, isB2B, b2bCount, mode) {
  const heights = getColumnHeights(board);
  const holes = countHoles(board, heights);
  const bumpiness = getBumpiness(heights);
  const maxHeight = Math.max(...heights);
  let score = 0;

  // 기본 페널티
  score -= holes * 100;
  score -= maxHeight * 5;
  score -= bumpiness * 3;

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
}
