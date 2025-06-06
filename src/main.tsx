import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { GameProvider } from './components/GameContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
  <GameProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </GameProvider>
</React.StrictMode>

);
