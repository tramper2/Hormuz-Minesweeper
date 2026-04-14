/**
 * TouchController.js
 * 모바일 터치 제스처 처리
 * - Pinch Zoom (두 손가락 확대/축소)
 * - Pan (한 손가락 드래그)
 * - Tap (단일 터치 → 셀 열기)
 * - Long Press (500ms → 깃발 배치)
 */

const MIN_SCALE = 0.3;
const MAX_SCALE = 6.0;
const LONG_PRESS_DURATION = 400; // ms
const TAP_THRESHOLD = 10; // 이동 거리 임계값 (px)
const MOMENTUM_FRICTION = 0.92;
const MOMENTUM_MIN_VELOCITY = 0.5;

export class TouchController {
  /**
   * @param {HTMLElement} element - 터치 이벤트를 받을 요소
   * @param {Object} callbacks - { onTap, onLongPress, onViewChange }
   */
  constructor(element, callbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;

    // 뷰포트 상태
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;

    // 터치 상태
    this._touches = new Map();
    this._lastPinchDist = 0;
    this._lastPinchCenter = null;
    this._isPinching = false;
    this._isPanning = false;
    this._longPressTimer = null;
    this._tapStartPos = null;
    this._tapStartTime = 0;

    // 관성 스크롤
    this._velocity = { x: 0, y: 0 };
    this._lastPanPos = null;
    this._lastPanTime = 0;
    this._momentumRAF = null;

    // 마우스 상태
    this._mouseDown = false;
    this._mouseButton = -1;

    // Bound handlers
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onWheel = this._handleWheel.bind(this);
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this._attach();
  }

  _attach() {
    this.element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.element.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    // 데스크탑 마우스 이벤트
    this.element.addEventListener('mousedown', this._onMouseDown);
    this.element.addEventListener('mousemove', this._onMouseMove);
    this.element.addEventListener('mouseup', this._onMouseUp);
    this.element.addEventListener('contextmenu', this._onContextMenu);
    this.element.addEventListener('wheel', this._onWheel, { passive: false });
  }

  destroy() {
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);
    this.element.removeEventListener('touchcancel', this._onTouchEnd);
    this.element.removeEventListener('mousedown', this._onMouseDown);
    this.element.removeEventListener('mousemove', this._onMouseMove);
    this.element.removeEventListener('mouseup', this._onMouseUp);
    this.element.removeEventListener('contextmenu', this._onContextMenu);
    this.element.removeEventListener('wheel', this._onWheel);
    this._clearLongPress();
    this._stopMomentum();
  }

  /** 뷰포트를 특정 위치로 설정 */
  setView(offsetX, offsetY, scale) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    this._notifyViewChange();
  }

  /** 화면 좌표를 게임 좌표로 변환 */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }

  /** 게임 좌표를 화면 좌표로 변환 */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY,
    };
  }

  // === Touch Handlers ===

  _handleTouchStart(e) {
    e.preventDefault();
    this._stopMomentum();

    for (const touch of e.changedTouches) {
      this._touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }

    if (this._touches.size === 1) {
      // 단일 터치: 탭 또는 팬 준비
      const touch = e.changedTouches[0];
      this._tapStartPos = { x: touch.clientX, y: touch.clientY };
      this._tapStartTime = Date.now();
      this._lastPanPos = { x: touch.clientX, y: touch.clientY };
      this._lastPanTime = Date.now();
      this._isPanning = false;

      // 롱프레스 타이머
      this._longPressTimer = setTimeout(() => {
        if (!this._isPinching && this._tapStartPos) {
          const worldPos = this.screenToWorld(this._tapStartPos.x, this._tapStartPos.y);
          this.callbacks.onLongPress?.(worldPos.x, worldPos.y);
          this._tapStartPos = null; // 탭 취소
        }
      }, LONG_PRESS_DURATION);
    } else if (this._touches.size === 2) {
      // 핀치 줌 시작
      this._clearLongPress();
      this._isPinching = true;
      this._tapStartPos = null;
      const points = [...this._touches.values()];
      this._lastPinchDist = this._getDistance(points[0], points[1]);
      this._lastPinchCenter = this._getMidpoint(points[0], points[1]);
    }
  }

  _handleTouchMove(e) {
    e.preventDefault();

    for (const touch of e.changedTouches) {
      if (this._touches.has(touch.identifier)) {
        this._touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    }

    if (this._touches.size === 2 && this._isPinching) {
      // 핀치 줌
      const points = [...this._touches.values()];
      const dist = this._getDistance(points[0], points[1]);
      const center = this._getMidpoint(points[0], points[1]);

      if (this._lastPinchDist > 0) {
        const zoomFactor = dist / this._lastPinchDist;
        this._zoomAt(center.x, center.y, zoomFactor);
      }

      // 핀치 중 팬
      if (this._lastPinchCenter) {
        const dx = center.x - this._lastPinchCenter.x;
        const dy = center.y - this._lastPinchCenter.y;
        this.offsetX += dx;
        this.offsetY += dy;
        this._notifyViewChange();
      }

      this._lastPinchDist = dist;
      this._lastPinchCenter = center;
    } else if (this._touches.size === 1 && !this._isPinching) {
      // 단일 터치 이동 (팬)
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._lastPanPos.x;
      const dy = touch.clientY - this._lastPanPos.y;

      // 이동 거리가 임계값을 넘으면 팬으로 전환
      if (this._tapStartPos) {
        const totalDx = touch.clientX - this._tapStartPos.x;
        const totalDy = touch.clientY - this._tapStartPos.y;
        if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > TAP_THRESHOLD) {
          this._isPanning = true;
          this._clearLongPress();
          this._tapStartPos = null;
        }
      }

      if (this._isPanning) {
        const now = Date.now();
        const dt = now - this._lastPanTime;
        if (dt > 0) {
          this._velocity.x = dx / dt * 16;
          this._velocity.y = dy / dt * 16;
        }
        this._lastPanTime = now;

        this.offsetX += dx;
        this.offsetY += dy;
        this._notifyViewChange();
      }

      this._lastPanPos = { x: touch.clientX, y: touch.clientY };
    }
  }

  _handleTouchEnd(e) {
    for (const touch of e.changedTouches) {
      this._touches.delete(touch.identifier);
    }

    if (this._touches.size < 2) {
      this._isPinching = false;
      this._lastPinchDist = 0;
      this._lastPinchCenter = null;
    }

    if (this._touches.size === 0) {
      this._clearLongPress();

      // 탭 감지
      if (this._tapStartPos && !this._isPanning) {
        const elapsed = Date.now() - this._tapStartTime;
        if (elapsed < LONG_PRESS_DURATION) {
          const worldPos = this.screenToWorld(this._tapStartPos.x, this._tapStartPos.y);
          this.callbacks.onTap?.(worldPos.x, worldPos.y);
        }
      }

      // 관성 스크롤
      if (this._isPanning) {
        this._startMomentum();
      }

      this._tapStartPos = null;
      this._isPanning = false;
    }
  }

  _handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    this._zoomAt(e.clientX, e.clientY, zoomFactor);
  }

  // === Mouse Handlers (데스크탑) ===

  _handleMouseDown(e) {
    e.preventDefault();
    this._stopMomentum();
    this._mouseDown = true;
    this._mouseButton = e.button;

    this._tapStartPos = { x: e.clientX, y: e.clientY };
    this._tapStartTime = Date.now();
    this._lastPanPos = { x: e.clientX, y: e.clientY };
    this._lastPanTime = Date.now();
    this._isPanning = false;

    // 좌클릭: 롱프레스 타이머 (깃발용)
    if (e.button === 0) {
      this._longPressTimer = setTimeout(() => {
        if (this._tapStartPos) {
          const worldPos = this.screenToWorld(this._tapStartPos.x, this._tapStartPos.y);
          this.callbacks.onLongPress?.(worldPos.x, worldPos.y);
          this._tapStartPos = null;
        }
      }, LONG_PRESS_DURATION);
    }
  }

  _handleMouseMove(e) {
    if (!this._mouseDown) return;

    const dx = e.clientX - this._lastPanPos.x;
    const dy = e.clientY - this._lastPanPos.y;

    // 이동 거리 임계값 초과 시 팬 모드
    if (this._tapStartPos) {
      const totalDx = e.clientX - this._tapStartPos.x;
      const totalDy = e.clientY - this._tapStartPos.y;
      if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > TAP_THRESHOLD) {
        this._isPanning = true;
        this._clearLongPress();
        this._tapStartPos = null;
      }
    }

    if (this._isPanning) {
      const now = Date.now();
      const dt = now - this._lastPanTime;
      if (dt > 0) {
        this._velocity.x = dx / dt * 16;
        this._velocity.y = dy / dt * 16;
      }
      this._lastPanTime = now;

      this.offsetX += dx;
      this.offsetY += dy;
      this._notifyViewChange();
    }

    this._lastPanPos = { x: e.clientX, y: e.clientY };
  }

  _handleMouseUp(e) {
    if (!this._mouseDown) return;
    this._mouseDown = false;
    this._clearLongPress();

    if (this._tapStartPos && !this._isPanning) {
      const elapsed = Date.now() - this._tapStartTime;

      if (e.button === 2) {
        // 우클릭 → 깃발
        const worldPos = this.screenToWorld(this._tapStartPos.x, this._tapStartPos.y);
        this.callbacks.onLongPress?.(worldPos.x, worldPos.y);
      } else if (e.button === 0 && elapsed < LONG_PRESS_DURATION) {
        // 좌클릭 → 셀 오픈
        const worldPos = this.screenToWorld(this._tapStartPos.x, this._tapStartPos.y);
        this.callbacks.onTap?.(worldPos.x, worldPos.y);
      }
    }

    // 관성 스크롤
    if (this._isPanning) {
      this._startMomentum();
    }

    this._tapStartPos = null;
    this._isPanning = false;
    this._mouseButton = -1;
  }

  // === Helpers ===

  _zoomAt(screenX, screenY, factor) {
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.scale * factor));
    const ratio = newScale / this.scale;

    this.offsetX = screenX - (screenX - this.offsetX) * ratio;
    this.offsetY = screenY - (screenY - this.offsetY) * ratio;
    this.scale = newScale;

    this._notifyViewChange();
  }

  _getDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _getMidpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  _clearLongPress() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }

  _startMomentum() {
    const step = () => {
      this._velocity.x *= MOMENTUM_FRICTION;
      this._velocity.y *= MOMENTUM_FRICTION;

      if (Math.abs(this._velocity.x) < MOMENTUM_MIN_VELOCITY &&
          Math.abs(this._velocity.y) < MOMENTUM_MIN_VELOCITY) {
        this._stopMomentum();
        return;
      }

      this.offsetX += this._velocity.x;
      this.offsetY += this._velocity.y;
      this._notifyViewChange();
      this._momentumRAF = requestAnimationFrame(step);
    };
    this._momentumRAF = requestAnimationFrame(step);
  }

  _stopMomentum() {
    if (this._momentumRAF) {
      cancelAnimationFrame(this._momentumRAF);
      this._momentumRAF = null;
    }
    this._velocity.x = 0;
    this._velocity.y = 0;
  }

  _notifyViewChange() {
    this.callbacks.onViewChange?.({
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      scale: this.scale,
    });
  }
}
