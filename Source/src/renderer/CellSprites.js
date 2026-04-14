/**
 * CellSprites.js
 * 셀 타입별 그래픽을 Canvas로 생성하여 PixiJS 텍스처로 캐싱
 */

import * as PIXI from 'pixi.js';

const CELL_PX = 32; // 셀 크기 (픽셀)

// 숫자별 색상
const NUM_COLORS = {
  1: '#4fc3f7',
  2: '#81c784',
  3: '#ff8a65',
  4: '#ba68c8',
  5: '#e57373',
  6: '#4dd0e1',
  7: '#f06292',
  8: '#90a4ae',
};

/**
 * 셀 텍스처 아틀라스 생성
 * @returns {Object} 텍스처 맵
 */
export function createCellTextures() {
  const textures = {};

  // 닫힌 셀
  textures.closed = _createTexture((ctx) => {
    const grad = ctx.createLinearGradient(0, 0, CELL_PX, CELL_PX);
    grad.addColorStop(0, '#1a3a5c');
    grad.addColorStop(1, '#0f2844');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);

    // 하이라이트 엣지
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CELL_PX - 1, CELL_PX - 1);

    // 내부 미묘한 패턴
    ctx.fillStyle = 'rgba(0,180,255,0.03)';
    ctx.beginPath();
    ctx.arc(CELL_PX / 2, CELL_PX / 2, CELL_PX / 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 열린 셀 (빈 셀)
  textures.opened = _createTexture((ctx) => {
    ctx.fillStyle = '#0b1a2e';
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0.5, 0.5, CELL_PX - 1, CELL_PX - 1);
  });

  // 숫자 셀 (1~8)
  for (let num = 1; num <= 8; num++) {
    textures[`num_${num}`] = _createTexture((ctx) => {
      ctx.fillStyle = '#0b1a2e';
      ctx.fillRect(0, 0, CELL_PX, CELL_PX);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0.5, 0.5, CELL_PX - 1, CELL_PX - 1);

      ctx.fillStyle = NUM_COLORS[num];
      ctx.font = `bold ${CELL_PX * 0.55}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), CELL_PX / 2, CELL_PX / 2 + 1);
    });
  }

  // 기뢰
  textures.mine = _createTexture((ctx) => {
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);

    // 기뢰 본체
    const cx = CELL_PX / 2;
    const cy = CELL_PX / 2;
    const r = CELL_PX * 0.28;

    // 외곽 glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.5);
    glow.addColorStop(0, 'rgba(255,59,92,0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 기뢰 몸체
    ctx.fillStyle = '#ff3b5c';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 가시
    ctx.strokeStyle = '#ff3b5c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);
      ctx.lineTo(cx + Math.cos(angle) * r * 1.4, cy + Math.sin(angle) * r * 1.4);
      ctx.stroke();
    }

    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 깃발
  textures.flag = _createTexture((ctx) => {
    const grad = ctx.createLinearGradient(0, 0, CELL_PX, CELL_PX);
    grad.addColorStop(0, '#1a3a5c');
    grad.addColorStop(1, '#0f2844');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CELL_PX - 1, CELL_PX - 1);

    const cx = CELL_PX / 2;

    // 깃대
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, CELL_PX * 0.75);
    ctx.lineTo(cx, CELL_PX * 0.18);
    ctx.stroke();

    // 깃발 (삼각형)
    ctx.fillStyle = '#ffb800';
    ctx.beginPath();
    ctx.moveTo(cx, CELL_PX * 0.18);
    ctx.lineTo(cx + CELL_PX * 0.3, CELL_PX * 0.32);
    ctx.lineTo(cx, CELL_PX * 0.45);
    ctx.closePath();
    ctx.fill();

    // 받침대
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - CELL_PX * 0.15, CELL_PX * 0.78);
    ctx.lineTo(cx + CELL_PX * 0.15, CELL_PX * 0.78);
    ctx.stroke();
  });

  // 육지 (비활성)
  textures.land = _createTexture((ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);
  });

  // 에어드랍 대상 셀 (하이라이트)
  textures.airdropTarget = _createTexture((ctx) => {
    ctx.fillStyle = 'rgba(0,230,138,0.15)';
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);
    ctx.strokeStyle = 'rgba(0,230,138,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CELL_PX - 2, CELL_PX - 2);
  });

  // 미사일 타겟 셀 (경고)
  textures.missileTarget = _createTexture((ctx) => {
    ctx.fillStyle = 'rgba(255,59,92,0.2)';
    ctx.fillRect(0, 0, CELL_PX, CELL_PX);
    ctx.strokeStyle = 'rgba(255,59,92,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(1, 1, CELL_PX - 2, CELL_PX - 2);
  });

  return textures;
}

/**
 * Canvas로 텍스처 생성 헬퍼
 */
function _createTexture(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = CELL_PX;
  canvas.height = CELL_PX;
  const ctx = canvas.getContext('2d');
  drawFn(ctx);
  return PIXI.Texture.from(canvas);
}

export { CELL_PX };
