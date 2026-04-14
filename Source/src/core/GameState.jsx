/**
 * GameState.js
 * React Context 기반 게임 상태 관리
 */

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';

// 게임 상태 상수
export const GAME_PHASE = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost',
};

// 초기 상태
const initialState = {
  phase: GAME_PHASE.LOADING,
  difficulty: 'MEDIUM',
  timer: 0,
  totalMines: 0,
  remainingMines: 0,
  flagCount: 0,
  openedCount: 0,
  safeCellCount: 0,
  progress: 0,
  airdropCount: 1, // 게임당 에어드랍 리워드 (기본 1회)
  missileWarning: null, // { x, y, radius, countdown }
  toasts: [],
};

// 액션 타입
const ACTION = {
  SET_PHASE: 'SET_PHASE',
  SET_DIFFICULTY: 'SET_DIFFICULTY',
  UPDATE_GAME_STATS: 'UPDATE_GAME_STATS',
  TICK_TIMER: 'TICK_TIMER',
  RESET_TIMER: 'RESET_TIMER',
  SET_MISSILE_WARNING: 'SET_MISSILE_WARNING',
  CLEAR_MISSILE_WARNING: 'CLEAR_MISSILE_WARNING',
  ADD_AIRDROP: 'ADD_AIRDROP',
  USE_AIRDROP: 'USE_AIRDROP',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  RESET_GAME: 'RESET_GAME',
};

function gameReducer(state, action) {
  switch (action.type) {
    case ACTION.SET_PHASE:
      return { ...state, phase: action.payload };

    case ACTION.SET_DIFFICULTY:
      return { ...state, difficulty: action.payload };

    case ACTION.UPDATE_GAME_STATS:
      return { ...state, ...action.payload };

    case ACTION.TICK_TIMER:
      return { ...state, timer: state.timer + 1 };

    case ACTION.RESET_TIMER:
      return { ...state, timer: 0 };

    case ACTION.SET_MISSILE_WARNING:
      return { ...state, missileWarning: action.payload };

    case ACTION.CLEAR_MISSILE_WARNING:
      return { ...state, missileWarning: null };

    case ACTION.ADD_AIRDROP:
      return { ...state, airdropCount: state.airdropCount + 1 };

    case ACTION.USE_AIRDROP:
      return { ...state, airdropCount: Math.max(0, state.airdropCount - 1) };

    case ACTION.ADD_TOAST: {
      const id = Date.now() + Math.random();
      return {
        ...state,
        toasts: [...state.toasts, { id, ...action.payload }],
      };
    }

    case ACTION.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };

    case ACTION.RESET_GAME:
      return {
        ...initialState,
        phase: GAME_PHASE.MENU,
        difficulty: state.difficulty,
      };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef(null);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      dispatch({ type: ACTION.TICK_TIMER });
    }, 1000);
  }, []);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 토스트 표시
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    dispatch({ type: ACTION.ADD_TOAST, payload: { message, type } });
    setTimeout(() => {
      dispatch({ type: ACTION.REMOVE_TOAST, payload: id });
    }, duration);
  }, []);

  const actions = {
    setPhase: (phase) => dispatch({ type: ACTION.SET_PHASE, payload: phase }),
    setDifficulty: (d) => dispatch({ type: ACTION.SET_DIFFICULTY, payload: d }),
    updateGameStats: (stats) => dispatch({ type: ACTION.UPDATE_GAME_STATS, payload: stats }),
    tickTimer: () => dispatch({ type: ACTION.TICK_TIMER }),
    resetTimer: () => dispatch({ type: ACTION.RESET_TIMER }),
    setMissileWarning: (w) => dispatch({ type: ACTION.SET_MISSILE_WARNING, payload: w }),
    clearMissileWarning: () => dispatch({ type: ACTION.CLEAR_MISSILE_WARNING }),
    addAirdrop: () => dispatch({ type: ACTION.ADD_AIRDROP }),
    useAirdrop: () => dispatch({ type: ACTION.USE_AIRDROP }),
    showToast,
    startTimer,
    stopTimer,
    resetGame: () => {
      stopTimer();
      dispatch({ type: ACTION.RESET_GAME });
    },
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameState must be used within GameProvider');
  return context;
}

export { ACTION };
