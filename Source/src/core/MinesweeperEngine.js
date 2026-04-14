/**
 * MinesweeperEngine.js
 * 지뢰찾기 핵심 게임 로직
 * - 기뢰 배치 (바다 셀에만)
 * - 인접 기뢰 수 계산
 * - 셀 열기 (Flood Fill)
 * - 깃발 토글
 * - 승리/패배 판정
 */

import { GRID_SIZE } from './MaskLoader.js';

// 셀 상태 상수
export const CELL_STATE = {
  CLOSED: 0,
  OPENED: 1,
  FLAGGED: 2,
};

// 8방향 오프셋
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// 난이도별 기뢰 비율
export const DIFFICULTY = {
  EASY: { name: '초급', density: 0.10, label: '10%' },
  MEDIUM: { name: '중급', density: 0.15, label: '15%' },
  HARD: { name: '고급', density: 0.20, label: '20%' },
};

export class MinesweeperEngine {
  /**
   * @param {boolean[][]} seaMask - 200×200 바다 마스크
   * @param {number} seaCellCount - 바다 셀 총 개수
   * @param {string} difficulty - DIFFICULTY 키
   */
  constructor(seaMask, seaCellCount, difficulty = 'MEDIUM') {
    this.size = GRID_SIZE;
    this.seaMask = seaMask;
    this.seaCellCount = seaCellCount;
    this.difficulty = DIFFICULTY[difficulty] || DIFFICULTY.MEDIUM;

    // 기뢰 수 계산
    this.totalMines = Math.floor(seaCellCount * this.difficulty.density);

    // 데이터 배열 (Flat array for performance)
    // mines[y * size + x] = true if mine
    this.mines = new Uint8Array(this.size * this.size);
    // adjacentCounts[y * size + x] = 인접 기뢰 수 (0-8)
    this.adjacentCounts = new Uint8Array(this.size * this.size);
    // cellStates[y * size + x] = CELL_STATE
    this.cellStates = new Uint8Array(this.size * this.size);

    this.flagCount = 0;
    this.openedCount = 0;
    this.safeCellCount = seaCellCount - this.totalMines;
    this.gameOver = false;
    this.won = false;
    this.firstClick = true;

    // 초기 상태: 육지 셀은 OPENED로 표시 (클릭 불가 처리)
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!seaMask[y][x]) {
          this.cellStates[y * this.size + x] = CELL_STATE.OPENED;
        }
      }
    }
  }

  /**
   * 기뢰 배치 (첫 클릭 위치 주변 제외)
   * @param {number} safeX - 첫 클릭 X
   * @param {number} safeY - 첫 클릭 Y
   */
  placeMines(safeX, safeY) {
    // 안전 영역: 첫 클릭 위치와 주변 8칸
    const safeSet = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = safeY + dy;
        const nx = safeX + dx;
        if (ny >= 0 && ny < this.size && nx >= 0 && nx < this.size) {
          safeSet.add(ny * this.size + nx);
        }
      }
    }

    // 배치 가능한 바다 셀 수집
    const candidates = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const idx = y * this.size + x;
        if (this.seaMask[y][x] && !safeSet.has(idx)) {
          candidates.push(idx);
        }
      }
    }

    // Fisher-Yates 셔플 후 앞에서 totalMines개 선택
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const mineCount = Math.min(this.totalMines, candidates.length);
    for (let i = 0; i < mineCount; i++) {
      this.mines[candidates[i]] = 1;
    }
    this.totalMines = mineCount;
    this.safeCellCount = this.seaCellCount - this.totalMines;

    // 인접 기뢰 수 계산
    this._calculateAdjacent();
  }

  /** 인접 기뢰 수 계산 */
  _calculateAdjacent() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.seaMask[y][x]) continue;
        const idx = y * this.size + x;
        let count = 0;
        for (const [dy, dx] of DIRECTIONS) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < this.size && nx >= 0 && nx < this.size) {
            if (this.mines[ny * this.size + nx]) count++;
          }
        }
        this.adjacentCounts[idx] = count;
      }
    }
  }

  /**
   * 셀 열기
   * @param {number} x
   * @param {number} y
   * @returns {{type: string, cells?: Array, gameOver?: boolean}}
   */
  openCell(x, y) {
    if (this.gameOver) return { type: 'noop' };
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return { type: 'noop' };
    if (!this.seaMask[y][x]) return { type: 'noop' };

    const idx = y * this.size + x;
    if (this.cellStates[idx] === CELL_STATE.OPENED) return { type: 'noop' };
    if (this.cellStates[idx] === CELL_STATE.FLAGGED) return { type: 'noop' };

    // 첫 클릭: 기뢰 배치
    if (this.firstClick) {
      this.placeMines(x, y);
      this.firstClick = false;
    }

    // 기뢰 밟음
    if (this.mines[idx]) {
      this.cellStates[idx] = CELL_STATE.OPENED;
      this.gameOver = true;
      this.won = false;
      return { type: 'mine', x, y, gameOver: true };
    }

    // Flood Fill로 빈 셀 열기
    const opened = [];
    this._floodFill(x, y, opened);

    // 승리 체크
    if (this.openedCount >= this.safeCellCount) {
      this.gameOver = true;
      this.won = true;
      return { type: 'win', cells: opened };
    }

    return { type: 'open', cells: opened };
  }

  /** Flood Fill: 빈 셀(인접 기뢰 0)인 경우 연쇄적으로 열기 */
  _floodFill(x, y, opened) {
    const stack = [[x, y]];

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      const cidx = cy * this.size + cx;

      if (cx < 0 || cx >= this.size || cy < 0 || cy >= this.size) continue;
      if (!this.seaMask[cy][cx]) continue;
      if (this.cellStates[cidx] !== CELL_STATE.CLOSED) continue;
      if (this.mines[cidx]) continue;

      this.cellStates[cidx] = CELL_STATE.OPENED;
      this.openedCount++;
      opened.push({ x: cx, y: cy, count: this.adjacentCounts[cidx] });

      // 인접 기뢰가 0이면 주변 셀도 열기
      if (this.adjacentCounts[cidx] === 0) {
        for (const [dy, dx] of DIRECTIONS) {
          stack.push([cx + dx, cy + dy]);
        }
      }
    }
  }

  /**
   * 깃발 토글
   * @param {number} x
   * @param {number} y
   * @returns {{type: string, flagged: boolean}}
   */
  toggleFlag(x, y) {
    if (this.gameOver) return { type: 'noop' };
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return { type: 'noop' };
    if (!this.seaMask[y][x]) return { type: 'noop' };

    const idx = y * this.size + x;
    if (this.cellStates[idx] === CELL_STATE.OPENED) return { type: 'noop' };

    if (this.cellStates[idx] === CELL_STATE.FLAGGED) {
      this.cellStates[idx] = CELL_STATE.CLOSED;
      this.flagCount--;
      return { type: 'flag', flagged: false, x, y };
    } else {
      this.cellStates[idx] = CELL_STATE.FLAGGED;
      this.flagCount++;
      return { type: 'flag', flagged: true, x, y };
    }
  }

  /**
   * 에어드랍: 영역 내 기뢰 안전 제거
   * @param {number} cx - 중심 X
   * @param {number} cy - 중심 Y
   * @param {number} radius - 반경 (예: 2 → 5×5 영역)
   * @returns {Array} 열린 셀 목록
   */
  airdrop(cx, cy, radius = 2) {
    const opened = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) continue;
        if (!this.seaMask[ny][nx]) continue;
        const idx = ny * this.size + nx;

        // 기뢰 제거
        if (this.mines[idx]) {
          this.mines[idx] = 0;
          this.totalMines--;
          this.safeCellCount++;
        }

        // 깃발 제거
        if (this.cellStates[idx] === CELL_STATE.FLAGGED) {
          this.flagCount--;
        }

        // 셀 열기
        if (this.cellStates[idx] !== CELL_STATE.OPENED) {
          this.cellStates[idx] = CELL_STATE.OPENED;
          this.openedCount++;
        }
      }
    }

    // 인접 카운트 재계산 (영향 범위 확대)
    this._recalculateArea(cx, cy, radius + 1);

    // 변경된 셀 수집
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && this.seaMask[ny][nx]) {
          opened.push({ x: nx, y: ny, count: this.adjacentCounts[ny * this.size + nx] });
        }
      }
    }

    // 승리 체크
    if (this.openedCount >= this.safeCellCount) {
      this.gameOver = true;
      this.won = true;
    }

    return opened;
  }

  /** 특정 영역 인접 카운트 재계산 */
  _recalculateArea(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) continue;
        if (!this.seaMask[ny][nx]) continue;
        const idx = ny * this.size + nx;
        let count = 0;
        for (const [ddy, ddx] of DIRECTIONS) {
          const nnx = nx + ddx;
          const nny = ny + ddy;
          if (nnx >= 0 && nnx < this.size && nny >= 0 && nny < this.size) {
            if (this.mines[nny * this.size + nnx]) count++;
          }
        }
        this.adjacentCounts[idx] = count;
      }
    }
  }

  /**
   * 미사일 공습: 영역 셀 닫기 (초기화)
   * @param {number} cx - 중심 X
   * @param {number} cy - 중심 Y
   * @param {number} radius - 반경
   * @returns {Array} 영향 받은 셀 목록
   */
  missileStrike(cx, cy, radius = 3) {
    const affected = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) continue;
        if (!this.seaMask[ny][nx]) continue;
        const idx = ny * this.size + nx;

        if (this.cellStates[idx] === CELL_STATE.OPENED && !this.mines[idx]) {
          this.cellStates[idx] = CELL_STATE.CLOSED;
          this.openedCount--;
          affected.push({ x: nx, y: ny });
        } else if (this.cellStates[idx] === CELL_STATE.FLAGGED) {
          this.cellStates[idx] = CELL_STATE.CLOSED;
          this.flagCount--;
          affected.push({ x: nx, y: ny });
        }
      }
    }
    return affected;
  }

  /** 셀 정보 조회 */
  getCell(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
    const idx = y * this.size + x;
    return {
      isSea: this.seaMask[y][x],
      isMine: !!this.mines[idx],
      state: this.cellStates[idx],
      adjacentMines: this.adjacentCounts[idx],
    };
  }

  /** 남은 기뢰 수 (추정) */
  get remainingMines() {
    return this.totalMines - this.flagCount;
  }

  /** 진행률 */
  get progress() {
    return this.safeCellCount > 0 ? this.openedCount / this.safeCellCount : 0;
  }
}
