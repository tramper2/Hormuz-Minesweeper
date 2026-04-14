/**
 * MissileStrike.js
 * 미사일 공습 이벤트 관리
 * 일정 시간마다 랜덤 위치에 미사일 경보 → 카운트다운 → 영역 리셋
 */

import { GRID_SIZE } from '../core/MaskLoader.js';

const MISSILE_INTERVAL_MIN = 45000; // 최소 45초
const MISSILE_INTERVAL_MAX = 90000; // 최대 90초
const WARNING_DURATION = 5000; // 경보 5초
const STRIKE_RADIUS = 4; // 9×9 영역

export class MissileStrikeManager {
  /**
   * @param {MinesweeperEngine} engine
   * @param {boolean[][]} seaMask
   * @param {Object} callbacks - { onWarning, onStrike, onClear }
   */
  constructor(engine, seaMask, callbacks = {}) {
    this.engine = engine;
    this.seaMask = seaMask;
    this.callbacks = callbacks;
    this._timer = null;
    this._warningTimer = null;
    this._active = false;
    this._currentTarget = null;
  }

  /** 미사일 이벤트 시작 */
  start() {
    this._active = true;
    this._scheduleNext();
  }

  /** 미사일 이벤트 중지 */
  stop() {
    this._active = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._warningTimer) {
      clearTimeout(this._warningTimer);
      this._warningTimer = null;
    }
    this._currentTarget = null;
  }

  /** 다음 미사일 스케줄 */
  _scheduleNext() {
    if (!this._active) return;

    const delay = MISSILE_INTERVAL_MIN +
      Math.random() * (MISSILE_INTERVAL_MAX - MISSILE_INTERVAL_MIN);

    this._timer = setTimeout(() => {
      if (!this._active || this.engine.gameOver) return;
      this._triggerWarning();
    }, delay);
  }

  /** 미사일 경보 발동 */
  _triggerWarning() {
    // 바다 영역 중 랜덤 위치 선택
    let targetX, targetY;
    let attempts = 0;
    do {
      targetX = STRIKE_RADIUS + Math.floor(Math.random() * (GRID_SIZE - STRIKE_RADIUS * 2));
      targetY = STRIKE_RADIUS + Math.floor(Math.random() * (GRID_SIZE - STRIKE_RADIUS * 2));
      attempts++;
    } while (!this.seaMask[targetY][targetX] && attempts < 100);

    this._currentTarget = { x: targetX, y: targetY, radius: STRIKE_RADIUS };

    // 경보 콜백
    this.callbacks.onWarning?.(this._currentTarget);

    // 카운트다운 후 공습 실행
    this._warningTimer = setTimeout(() => {
      if (!this._active || this.engine.gameOver) return;
      this._executeStrike();
    }, WARNING_DURATION);
  }

  /** 공습 실행 */
  _executeStrike() {
    if (!this._currentTarget) return;

    const { x, y, radius } = this._currentTarget;
    const affected = this.engine.missileStrike(x, y, radius);

    this.callbacks.onStrike?.({
      target: this._currentTarget,
      affectedCells: affected,
    });

    this._currentTarget = null;

    // 1초 후 경보 해제
    setTimeout(() => {
      this.callbacks.onClear?.();
    }, 1000);

    // 다음 미사일 스케줄
    this._scheduleNext();
  }

  /** 현재 타겟 */
  get currentTarget() {
    return this._currentTarget;
  }
}
