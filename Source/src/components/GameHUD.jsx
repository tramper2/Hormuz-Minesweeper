/**
 * GameHUD.jsx
 * 게임 중 상단 HUD + 하단 액션 바
 */

import React from 'react';
import { useGameState } from '../core/GameState.jsx';

export default function GameHUD({
  onPause,
  onAirdropMode,
  airdropMode,
}) {
  const { state } = useGameState();

  // 타이머 포맷 (mm:ss)
  const minutes = Math.floor(state.timer / 60);
  const seconds = state.timer % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // 진행률
  const progressPercent = Math.round(state.progress * 100);

  return (
    <>
      {/* 상단 HUD */}
      <div className="game-hud">
        <div className="hud-bar">
          {/* 남은 기뢰 */}
          <div className="hud-stat">
            <span className="hud-stat-label">💣 기뢰</span>
            <span className="hud-stat-value" style={{
              color: state.remainingMines < 10 ? 'var(--color-accent-success)' : 'var(--color-text-primary)',
            }}>
              {state.remainingMines}
            </span>
          </div>

          {/* 타이머 */}
          <div className="hud-stat">
            <span className="hud-stat-label">⏱️ 시간</span>
            <span className="hud-stat-value">{timeStr}</span>
          </div>

          {/* 진행률 */}
          <div className="hud-stat">
            <span className="hud-stat-label">📊 진행</span>
            <span className="hud-stat-value" style={{
              color: progressPercent > 80 ? 'var(--color-accent-success)' : 'var(--color-text-primary)',
            }}>
              {progressPercent}%
            </span>
          </div>

          {/* 일시정지 */}
          <button
            className="btn btn-icon btn-secondary"
            onClick={onPause}
            id="btn-pause"
            style={{ width: '36px', height: '36px', fontSize: '1rem' }}
          >
            ⏸
          </button>
        </div>
      </div>

      {/* 하단 액션 바 */}
      <div className="game-bottom-bar">
        <div className="bottom-actions">
          {/* 에어드랍 아이템 */}
          <button
            className={`item-btn ${airdropMode ? 'selected' : ''}`}
            onClick={onAirdropMode}
            id="btn-airdrop"
            style={{
              borderColor: airdropMode ? 'var(--color-accent-success)' : undefined,
              background: airdropMode ? 'rgba(0,230,138,0.15)' : undefined,
            }}
          >
            <span className="item-btn-icon">📦</span>
            <span className="item-btn-label">에어드랍</span>
            {state.airdropCount > 0 && (
              <span className="item-btn-badge">{state.airdropCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* 미사일 경보 오버레이 */}
      {state.missileWarning && (
        <div className="missile-warning">
          <div className="missile-warning-text">
            🚀 미사일 경보!
          </div>
          <div style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
            marginTop: '8px',
          }}>
            해당 구역이 곧 초기화됩니다
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          {toast.message}
        </div>
      ))}
    </>
  );
}
