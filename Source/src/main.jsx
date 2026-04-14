/**
 * main.jsx
 * 앱 진입점
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameProvider } from './core/GameState.jsx';
import App from './components/App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);
