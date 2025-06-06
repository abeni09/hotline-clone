import React from 'react';
import CardCanvas from './components/CardCanvas/CardCanvas';
import BetButtons from './components/BetButtons/BetButtons';
import BetControls from './components/BetAmountControls/BetAmountControls';
import ToggleSwitch from './components/ToggleSwitch/ToggleSwitch';
import { GameProvider, useGameContext } from './components/GameContext';
import HistoryDropdown from './components/HistoryDropdown/HistoryDropdown';
import './styles/App.css';

const AppContent: React.FC = () => {
  const { winAmount } = useGameContext();

  return (
    <div className="app-container">

      <div className="canvas-wrapper">
        <HistoryDropdown />
        <CardCanvas />
      </div>

      {/* Win/Loss Message Display */}
      {/* <div className="win-message">
        {winAmount === null && "Spin to Win!"}
        {winAmount !== null && winAmount === 0 && "No Win. Try Again!"}
        {winAmount !== null && winAmount > 0 && `You Won: $${winAmount.toFixed(2)}`}
      </div> */}
      <ToggleSwitch />

      <div className="bottom-panel">
        <BetControls />
        <BetButtons />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
