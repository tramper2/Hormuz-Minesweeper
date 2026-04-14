/**
 * StartScreen.jsx
 * 게임 시작 화면 - 난이도 선택 + 시작 버튼
 */

import React, { useState } from 'react';
import { DIFFICULTY } from '../core/MinesweeperEngine.js';
import { useGameState, GAME_PHASE } from '../core/GameState.jsx';

const difficulties = [
  { key: 'EASY', icon: '🌊', ...DIFFICULTY.EASY },
  { key: 'MEDIUM', icon: '⚓', ...DIFFICULTY.MEDIUM },
  { key: 'HARD', icon: '💣', ...DIFFICULTY.HARD },
];

export default function StartScreen({ onStart }) {
  const { state, actions } = useGameState();
  const [selected, setSelected] = useState(state.difficulty);

  const handleStart = () => {
    actions.setDifficulty(selected);
    onStart?.(selected);
  };

  return (
    <div className="start-screen">
      {/* 배경 파티클 (CSS 기반) */}
      <div className="start-bg-particles" />

      <div className="animate-fade-in-up" style={{ zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
        {/* 로고 */}
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>⚓</div>
        <h1 className="start-title">HORMUZ<br />MINESWEEPER</h1>
        <p className="start-subtitle">Escort Mission</p>

        {/* 미션 설명 */}
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          maxWidth: '320px',
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}>
            🛢️ 호르무즈 해협에 기뢰가 설치되었습니다.<br />
            모든 기뢰를 제거하여 유조선의 안전한 통과를 도우세요!
          </p>
        </div>

        {/* 난이도 선택 */}
        <div className="difficulty-selector">
          {difficulties.map((d) => (
            <button
              key={d.key}
              className={`difficulty-option ${selected === d.key ? 'selected' : ''}`}
              onClick={() => setSelected(d.key)}
              id={`difficulty-${d.key.toLowerCase()}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>{d.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div className="difficulty-name">{d.name}</div>
                </div>
              </div>
              <div className="difficulty-desc">기뢰 {d.label}</div>
            </button>
          ))}
        </div>

        {/* 시작 버튼 */}
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          id="btn-start-game"
          style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem' }}
        >
          🚢 출항하기
        </button>

        {/* 조작 안내 */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          color: 'var(--color-text-muted)',
          fontSize: '0.7rem',
        }}>
          <div>👆 탭 = 오픈</div>
          <div>👆💨 길게 = 깃발</div>
          <div>🤏 핀치 = 줌</div>
        </div>
      </div>
    </div>
  );
}
