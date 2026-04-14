/**
 * GameOverModal.jsx
 * 게임 종료 모달 (승리/패배)
 */

import React from 'react';
import { useGameState, GAME_PHASE } from '../core/GameState.jsx';

export default function GameOverModal({ onRestart, onHome }) {
  const { state } = useGameState();

  const isWin = state.phase === GAME_PHASE.WON;

  // 타이머 포맷
  const minutes = Math.floor(state.timer / 60);
  const seconds = state.timer % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in-scale" style={{ textAlign: 'center' }}>
        {/* 결과 아이콘 */}
        <div style={{
          fontSize: '3.5rem',
          marginBottom: '8px',
          animation: 'float 3s ease-in-out infinite',
        }}>
          {isWin ? '🛢️' : '💥'}
        </div>

        {/* 제목 */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: isWin ? 'var(--color-accent-gold)' : 'var(--color-accent-danger)',
          marginBottom: '4px',
        }}>
          {isWin ? 'ESCORT COMPLETE!' : 'MISSION FAILED'}
        </h2>

        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '16px',
        }}>
          {isWin
            ? '유조선이 안전하게 해협을 통과했습니다!'
            : '기뢰에 의해 작전이 실패했습니다.'}
        </p>

        {/* 결과 통계 */}
        <div className="result-stats">
          <div className="result-stat-card">
            <div className="result-stat-value">{timeStr}</div>
            <div className="result-stat-label">소요 시간</div>
          </div>
          <div className="result-stat-card">
            <div className="result-stat-value">{state.openedCount}</div>
            <div className="result-stat-label">탐색 셀</div>
          </div>
          <div className="result-stat-card">
            <div className="result-stat-value">{state.flagCount}</div>
            <div className="result-stat-label">설치 깃발</div>
          </div>
          <div className="result-stat-card">
            <div className="result-stat-value">{Math.round(state.progress * 100)}%</div>
            <div className="result-stat-label">진행률</div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="result-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onRestart}
            id="btn-restart"
            style={{ width: '100%' }}
          >
            🔄 다시 도전
          </button>

          <button
            className="btn btn-secondary"
            onClick={onHome}
            id="btn-home"
            style={{ width: '100%' }}
          >
            🏠 메인으로
          </button>
        </div>
      </div>
    </div>
  );
}
