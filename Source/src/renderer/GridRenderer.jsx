/**
 * GridRenderer.jsx
 * PixiJS 기반 40,000셀 렌더링 엔진
 * - 뷰포트에 보이는 셀만 렌더링 (가상화)
 * - 배경 맵 이미지
 * - 물결 쉐이더
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { GRID_SIZE } from '../core/MaskLoader.js';
import { CELL_STATE } from '../core/MinesweeperEngine.js';
import { createCellTextures, CELL_PX } from './CellSprites.js';
import { WaterFilter } from './WaterShader.js';
import { TouchController } from '../input/TouchController.js';

const WORLD_SIZE = GRID_SIZE * CELL_PX; // 200 * 32 = 6400px

export default function GridRenderer({
  engine,
  seaMask,
  onCellTap,
  onCellLongPress,
  onViewReady,
  missileTarget,
  airdropTarget,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const touchRef = useRef(null);
  const gridContainerRef = useRef(null);
  const spritesRef = useRef(null);
  const texturesRef = useRef(null);
  const waterFilterRef = useRef(null);
  const bgSpriteRef = useRef(null);

  // PixiJS 앱 초기화
  useEffect(() => {
    if (!containerRef.current || !engine) return;

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0a1628,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    containerRef.current.appendChild(app.view);
    appRef.current = app;

    // 텍스처 생성
    const textures = createCellTextures();
    texturesRef.current = textures;

    // 메인 컨테이너
    const gridContainer = new PIXI.Container();
    gridContainerRef.current = gridContainer;
    app.stage.addChild(gridContainer);

    // 배경 맵 이미지 로드
    const bgTexture = PIXI.Texture.from(`${import.meta.env.BASE_URL}images/hormumap.jpg`);
    const bgSprite = new PIXI.Sprite(bgTexture);
    bgSprite.width = WORLD_SIZE;
    bgSprite.height = WORLD_SIZE;
    bgSprite.alpha = 0.4;
    gridContainer.addChild(bgSprite);
    bgSpriteRef.current = bgSprite;

    // 물결 쉐이더
    const waterFilter = new WaterFilter(0.6);
    waterFilterRef.current = waterFilter;
    gridContainer.filters = [waterFilter];

    // 스프라이트 풀 (가상화: 보이는 셀만 렌더링)
    const spritePool = [];
    spritesRef.current = spritePool;

    // 터치 컨트롤러
    const touchController = new TouchController(app.view, {
      onTap: (worldX, worldY) => {
        const cellX = Math.floor(worldX / CELL_PX);
        const cellY = Math.floor(worldY / CELL_PX);
        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
          onCellTap?.(cellX, cellY);
        }
      },
      onLongPress: (worldX, worldY) => {
        const cellX = Math.floor(worldX / CELL_PX);
        const cellY = Math.floor(worldY / CELL_PX);
        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
          onCellLongPress?.(cellX, cellY);
        }
      },
      onViewChange: (view) => {
        gridContainer.position.set(view.offsetX, view.offsetY);
        gridContainer.scale.set(view.scale);
      },
    });
    touchRef.current = touchController;

    // 초기 뷰: 맵 중앙에 맞추기
    const initScale = Math.min(
      window.innerWidth / WORLD_SIZE,
      window.innerHeight / WORLD_SIZE
    ) * 1.5;
    const initOffsetX = (window.innerWidth - WORLD_SIZE * initScale) / 2;
    const initOffsetY = (window.innerHeight - WORLD_SIZE * initScale) / 2;
    touchController.setView(initOffsetX, initOffsetY, initScale);

    onViewReady?.({ touchController });

    // 렌더 루프
    app.ticker.add((delta) => {
      // 물결 쉐이더 업데이트
      waterFilter.update(delta);

      // 가상화 렌더링
      _renderVisibleCells(
        app, gridContainer, spritePool, textures, engine, seaMask,
        touchController, missileTarget, airdropTarget
      );
    });

    // 리사이즈
    const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      waterFilter.updateResolution(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      touchController.destroy();
      app.destroy(true, { children: true, texture: false });
    };
  }, [engine, seaMask]);

  // 미사일/에어드랍 타겟 변경 시 리렌더 트리거를 위해 ref 업데이트
  useEffect(() => {
    // 이 effect는 missileTarget/airdropTarget이 변경될 때 트리거
    // ticker 루프에서 참조하므로 별도 처리 불필요
  }, [missileTarget, airdropTarget]);

  return (
    <div
      ref={containerRef}
      className="game-canvas-container"
      id="game-canvas"
    />
  );
}

// 뷰포트에 보이는 셀만 렌더링
let _lastRenderedKey = '';

function _renderVisibleCells(
  app, gridContainer, spritePool, textures, engine, seaMask,
  touchController, missileTarget, airdropTarget
) {
  if (!engine || !seaMask) return;

  const scale = touchController.scale;
  const offsetX = touchController.offsetX;
  const offsetY = touchController.offsetY;

  const screenW = app.renderer.width / app.renderer.resolution;
  const screenH = app.renderer.height / app.renderer.resolution;

  // 화면에 보이는 셀 범위 계산
  const cellSize = CELL_PX * scale;
  const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
  const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
  const endCol = Math.min(GRID_SIZE - 1, Math.ceil((screenW - offsetX) / cellSize));
  const endRow = Math.min(GRID_SIZE - 1, Math.ceil((screenH - offsetY) / cellSize));

  // 변경 감지 키 (성능 최적화: 같은 뷰면 스킵)
  const renderKey = `${startCol},${startRow},${endCol},${endRow},${engine.openedCount},${engine.flagCount}`;
  if (renderKey === _lastRenderedKey) return;
  _lastRenderedKey = renderKey;

  // 기존 스프라이트 정리 (배경 제외)
  while (gridContainer.children.length > 1) {
    const child = gridContainer.children[gridContainer.children.length - 1];
    gridContainer.removeChild(child);
    child.destroy();
  }
  spritePool.length = 0;

  // 보이는 셀 렌더링
  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      if (!seaMask[y][x]) continue; // 육지 스킵

      const idx = y * GRID_SIZE + x;
      const state = engine.cellStates[idx];
      let texture;

      if (state === CELL_STATE.CLOSED) {
        texture = textures.closed;
      } else if (state === CELL_STATE.FLAGGED) {
        texture = textures.flag;
      } else if (state === CELL_STATE.OPENED) {
        if (engine.mines[idx]) {
          texture = textures.mine;
        } else {
          const count = engine.adjacentCounts[idx];
          texture = count > 0 ? textures[`num_${count}`] : textures.opened;
        }
      }

      if (texture) {
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x * CELL_PX;
        sprite.y = y * CELL_PX;
        sprite.width = CELL_PX;
        sprite.height = CELL_PX;
        gridContainer.addChild(sprite);
        spritePool.push(sprite);
      }

      // 미사일 타겟 오버레이
      if (missileTarget) {
        const { x: mx, y: my, radius } = missileTarget;
        if (Math.abs(x - mx) <= radius && Math.abs(y - my) <= radius) {
          const overlay = new PIXI.Sprite(textures.missileTarget);
          overlay.x = x * CELL_PX;
          overlay.y = y * CELL_PX;
          overlay.width = CELL_PX;
          overlay.height = CELL_PX;
          gridContainer.addChild(overlay);
        }
      }

      // 에어드랍 타겟 오버레이
      if (airdropTarget) {
        const { x: ax, y: ay, radius } = airdropTarget;
        if (Math.abs(x - ax) <= radius && Math.abs(y - ay) <= radius) {
          const overlay = new PIXI.Sprite(textures.airdropTarget);
          overlay.x = x * CELL_PX;
          overlay.y = y * CELL_PX;
          overlay.width = CELL_PX;
          overlay.height = CELL_PX;
          gridContainer.addChild(overlay);
        }
      }
    }
  }
}
