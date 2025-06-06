import React from 'react';
import { useGameContext } from '../GameContext';
import './BetButtons.css';

const BetButtons: React.FC = () => {
  const { startSpin, isAnimating, hrm } = useGameContext();

  const STANDARD_RED_BLACK_MULTIPLIER = 2;
  const STANDARD_FIRE_MULTIPLIER = 32;
  const HRM_RED_BLACK_MULTIPLIER = 4.125;
  const HRM_FIRE_MULTIPLIER = 1056;

  return (
    <div className="bet-buttons">
      <button
        className="bet-button red"
        disabled={isAnimating}
        onClick={() => startSpin('red')}
      >
        RED <br/>
        x{hrm ? HRM_RED_BLACK_MULTIPLIER : STANDARD_RED_BLACK_MULTIPLIER}
      </button>
      <button
        className="bet-button fire"
        disabled={isAnimating}
        onClick={() => startSpin('fire')}
      >
        <img src="https://turbo.spribegaming.com/assets/icons/icon-hot.svg" alt="hot" />
        <br />
        x{hrm ? HRM_FIRE_MULTIPLIER : STANDARD_FIRE_MULTIPLIER}
      </button>
      <button
        className="bet-button black"
        disabled={isAnimating}
        onClick={() => startSpin('black')}
      >
        BLACK <br/>
        x{hrm ? HRM_RED_BLACK_MULTIPLIER : STANDARD_RED_BLACK_MULTIPLIER}
      </button>
    </div>
  );
};

export default BetButtons;
