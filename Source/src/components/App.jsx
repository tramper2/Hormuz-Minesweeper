/**
 * App.jsx
 * 메인 앱 컴포넌트 - 게임 플로우 관리
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState, GAME_PHASE } from '../core/GameState.jsx';
import { loadMask, GRID_SIZE } from '../core/MaskLoader.js';
import { MinesweeperEngine, CELL_STATE } from '../core/MinesweeperEngine.js';
import { MissileStrikeManager } from '../gimmicks/MissileStrike.js';
import { executeAirdrop, checkRewardEligibility } from '../gimmicks/AirDrop.js';
import { playTankerEnding } from '../effects/TankerEnding.js';
import GridRenderer from '../renderer/GridRenderer.jsx';
import StartScreen from './StartScreen.jsx';
import GameHUD from './GameHUD.jsx';
import GameOverModal from './GameOverModal.jsx';

export default function App() {
  const { state, actions } = useGameState();
  const [engine, setEngine] = useState(null);
  const [seaMask, setSeaMask] = useState(null);
  const [seaCellCount, setSeaCellCount] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const [airdropMode, setAirdropMode] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [missileTarget, setMissileTarget] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('마스크 데이터 로딩...');

  const missileManagerRef = useRef(null);
  const lastRewardRef = useRef(0);
  const endingContainerRef = useRef(null);
  const touchControllerRef = useRef(null);

  // 초기 마스크 로딩
  useEffect(() => {
    async function init() {
      try {
        setLoadingText('해협 지형 분석 중...');
        setLoadingProgress(30);

        const { grid, seaCellCount: count } = await loadMask(`${import.meta.env.BASE_URL}images/hormumaskj.png`);
        setSeaMask(grid);
        setSeaCellCount(count);

        setLoadingProgress(100);
        setLoadingText('준비 완료!');

        setTimeout(() => {
          actions.setPhase(GAME_PHASE.MENU);
        }, 500);
      } catch (err) {
        console.error('마스크 로딩 실패:', err);
        setLoadingText('로딩 실패. 새로고침 해주세요.');
      }
    }
    init();
  }, []);

  // 게임 시작
  const handleStart = useCallback((difficulty) => {
    if (!seaMask) return;

    const newEngine = new MinesweeperEngine(seaMask, seaCellCount, difficulty);
    setEngine(newEngine);
    setAirdropMode(false);
    setFlagMode(false);
    setMissileTarget(null);
    lastRewardRef.current = 0;

    actions.setPhase(GAME_PHASE.PLAYING);
    actions.resetTimer();
    actions.startTimer();
    actions.updateGameStats({
      totalMines: newEngine.totalMines,
      remainingMines: newEngine.totalMines,
      flagCount: 0,
      openedCount: 0,
      safeCellCount: newEngine.safeCellCount,
      progress: 0,
      airdropCount: 1,
    });

    // 미사일 매니저 시작
    const missileManager = new MissileStrikeManager(newEngine, seaMask, {
      onWarning: (target) => {
        setMissileTarget(target);
        actions.setMissileWarning(target);
        actions.showToast('🚀 미사일 경보! 구역이 곧 초기화됩니다!', 'danger');
      },
      onStrike: ({ affectedCells }) => {
        setRenderKey((k) => k + 1);
        _syncStats(newEngine);
      },
      onClear: () => {
        setMissileTarget(null);
        actions.clearMissileWarning();
      },
    });
    missileManagerRef.current = missileManager;
    missileManager.start();

    setRenderKey((k) => k + 1);
  }, [seaMask, seaCellCount, actions]);

  // 게임 통계 동기화
  const _syncStats = useCallback((eng) => {
    actions.updateGameStats({
      remainingMines: eng.remainingMines,
      flagCount: eng.flagCount,
      openedCount: eng.openedCount,
      progress: eng.progress,
    });
  }, [actions]);

  // 셀 탭 핸들러
  const handleCellTap = useCallback((x, y) => {
    if (!engine || engine.gameOver) return;

    // 에어드랍 모드
    if (airdropMode && state.airdropCount > 0) {
      const result = executeAirdrop(engine, x, y);
      actions.useAirdrop();
      setAirdropMode(false);
      actions.showToast(
        `📦 에어드랍! ${result.minesRemoved}개 기뢰 제거`,
        'info'
      );
      _syncStats(engine);
      setRenderKey((k) => k + 1);

      if (engine.won) {
        _handleWin();
      }
      return;
    }

    // 깃발 모드: 탭으로 깃발 배치
    if (flagMode) {
      const result = engine.toggleFlag(x, y);
      if (result.type === 'flag') {
        _syncStats(engine);
        setRenderKey((k) => k + 1);
      }
      return;
    }

    // 일반 셀 오픈
    const result = engine.openCell(x, y);

    if (result.type === 'mine') {
      _handleLose();
    } else if (result.type === 'win') {
      _handleWin();
    } else if (result.type === 'open') {
      _syncStats(engine);

      // 리워드 체크
      const reward = checkRewardEligibility(
        engine.openedCount,
        lastRewardRef.current
      );
      if (reward.earned) {
        lastRewardRef.current = reward.nextRewardAt;
        actions.addAirdrop();
        actions.showToast('📦 에어드랍 획득! (+1)', 'info');
      }
    }

    setRenderKey((k) => k + 1);
  }, [engine, airdropMode, flagMode, state.airdropCount, actions, _syncStats]);

  // 셀 롱프레스 핸들러 (깃발)
  const handleCellLongPress = useCallback((x, y) => {
    if (!engine || engine.gameOver) return;

    const result = engine.toggleFlag(x, y);
    if (result.type === 'flag') {
      _syncStats(engine);
      setRenderKey((k) => k + 1);
    }
  }, [engine, _syncStats]);

  // 승리 처리
  const _handleWin = useCallback(() => {
    actions.stopTimer();
    missileManagerRef.current?.stop();
    _syncStats(engine);

    // 유조선 엔딩 연출
    if (endingContainerRef.current) {
      playTankerEnding(endingContainerRef.current, () => {
        actions.setPhase(GAME_PHASE.WON);
      });
    } else {
      actions.setPhase(GAME_PHASE.WON);
    }
  }, [engine, actions, _syncStats]);

  // 패배 처리
  const _handleLose = useCallback(() => {
    actions.stopTimer();
    missileManagerRef.current?.stop();
    _syncStats(engine);
    actions.setPhase(GAME_PHASE.LOST);
  }, [engine, actions, _syncStats]);

  // 일시정지
  const handlePause = useCallback(() => {
    if (state.phase === GAME_PHASE.PLAYING) {
      actions.stopTimer();
      actions.setPhase(GAME_PHASE.PAUSED);
    }
  }, [state.phase, actions]);

  // 일시정지 해제
  const handleResume = useCallback(() => {
    if (state.phase === GAME_PHASE.PAUSED) {
      actions.startTimer();
      actions.setPhase(GAME_PHASE.PLAYING);
    }
  }, [state.phase, actions]);

  // 재시작
  const handleRestart = useCallback(() => {
    missileManagerRef.current?.stop();
    handleStart(state.difficulty);
  }, [handleStart, state.difficulty]);

  // 메인으로
  const handleHome = useCallback(() => {
    missileManagerRef.current?.stop();
    actions.stopTimer();
    setEngine(null);
    actions.resetGame();
  }, [actions]);

  // 깃발 모드 토글
  const handleFlagMode = useCallback(() => {
    setFlagMode((prev) => {
      if (!prev) setAirdropMode(false); // 상호 배제
      return !prev;
    });
  }, []);

  // 에어드랍 모드 토글
  const handleAirdropMode = useCallback(() => {
    if (state.airdropCount <= 0) {
      actions.showToast('에어드랍이 없습니다', 'danger');
      return;
    }
    setAirdropMode((prev) => {
      if (!prev) setFlagMode(false); // 상호 배제
      return !prev;
    });
    if (!airdropMode) {
      actions.showToast('맵에서 제거할 위치를 터치하세요', 'info');
    }
  }, [state.airdropCount, airdropMode, actions]);

  // 뷰 준비 콜백
  const handleViewReady = useCallback(({ touchController }) => {
    touchControllerRef.current = touchController;
  }, []);

  return (
    <div id="app-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 로딩 화면 */}
      {state.phase === GAME_PHASE.LOADING && (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-text">{loadingText}</div>
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 시작 화면 */}
      {state.phase === GAME_PHASE.MENU && (
        <StartScreen onStart={handleStart} />
      )}

      {/* 게임 플레이 */}
      {(state.phase === GAME_PHASE.PLAYING ||
        state.phase === GAME_PHASE.PAUSED ||
        state.phase === GAME_PHASE.WON ||
        state.phase === GAME_PHASE.LOST) && engine && (
        <>
          <GridRenderer
            key={`grid-${state.difficulty}`}
            engine={engine}
            seaMask={seaMask}
            onCellTap={handleCellTap}
            onCellLongPress={handleCellLongPress}
            onViewReady={handleViewReady}
            missileTarget={missileTarget}
            airdropTarget={airdropMode ? { active: true } : null}
          />

          <GameHUD
            onPause={handlePause}
            onAirdropMode={handleAirdropMode}
            airdropMode={airdropMode}
            onFlagMode={handleFlagMode}
            flagMode={flagMode}
          />

          {/* 엔딩 연출 컨테이너 */}
          <div ref={endingContainerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        </>
      )}

      {/* 일시정지 모달 */}
      {state.phase === GAME_PHASE.PAUSED && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in-scale" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏸️</div>
            <h2 style={{ marginBottom: '16px' }}>일시정지</h2>
            <div className="result-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleResume}
                id="btn-resume"
                style={{ width: '100%' }}
              >
                ▶️ 계속하기
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleRestart}
                id="btn-restart-pause"
                style={{ width: '100%' }}
              >
                🔄 다시 시작
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleHome}
                id="btn-home-pause"
                style={{ width: '100%' }}
              >
                🏠 메인으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리/패배 모달 */}
      {(state.phase === GAME_PHASE.WON || state.phase === GAME_PHASE.LOST) && (
        <GameOverModal
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
