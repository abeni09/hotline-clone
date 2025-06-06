import React from 'react';
import './BetAmountControls.css';
import { useGameContext } from '../GameContext';

const BetControls: React.FC = () => {
  const { isAnimating, betAmount, setBetAmount } = useGameContext();

  const handleDecrease = () => {
    if (isAnimating) return;
    setBetAmount(Math.max(1, betAmount - 1));
  };

  const handleIncrease = () => {
    if (isAnimating) return;
    setBetAmount(betAmount + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setBetAmount(value);
    }
  };

  return (
    <div className="bet-controls">
        <div className="bet-amount-controls">
            <label>Bet USD</label>
            <input
                className="bet-input"
                type="number"
                value={betAmount}
                onChange={handleInputChange}
                disabled={isAnimating}
                min={1}
            />
        </div>
      <button className="bet-button" onClick={handleDecrease} disabled={isAnimating}>-</button>
      <button className="bet-button" onClick={handleIncrease} disabled={isAnimating}>+</button>
    </div>
  );
};

export default BetControls;
