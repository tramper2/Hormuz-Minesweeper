/**
 * AirDrop.js
 * 에어드랍 리워드 시스템
 * 광고 시청(또는 게임 진행)으로 범위 지뢰 제거 아이템 획득
 */

export const AIRDROP_RADIUS = 2; // 5×5 영역

/**
 * 에어드랍 실행
 * @param {MinesweeperEngine} engine
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @returns {Object} { opened, minesRemoved }
 */
export function executeAirdrop(engine, centerX, centerY, radius = AIRDROP_RADIUS) {
  // 제거 전 기뢰 수 기록
  const prevMines = engine.totalMines;

  const opened = engine.airdrop(centerX, centerY, radius);

  const minesRemoved = prevMines - engine.totalMines;

  return {
    opened,
    minesRemoved,
    centerX,
    centerY,
    radius,
  };
}

/**
 * 리워드 적립 계산
 * 게임 진행 중 일정 셀 수를 열 때마다 리워드 포인트 적립
 * @param {number} openedCount - 열린 셀 수
 * @param {number} lastRewardAt - 마지막 리워드 시점의 열린 셀 수
 * @param {number} threshold - 리워드 간격 (기본 500셀)
 * @returns {{ earned: boolean, nextRewardAt: number }}
 */
export function checkRewardEligibility(openedCount, lastRewardAt = 0, threshold = 500) {
  if (openedCount - lastRewardAt >= threshold) {
    return {
      earned: true,
      nextRewardAt: openedCount,
    };
  }
  return {
    earned: false,
    nextRewardAt: lastRewardAt,
  };
}
