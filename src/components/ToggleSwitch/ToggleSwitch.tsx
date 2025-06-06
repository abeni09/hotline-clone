import React from 'react';
import { useGameContext } from '../GameContext';
import './ToggleSwitch.css';

const ToggleSwitch: React.FC = () => {
  const { hrm, toggleHRM, isAnimating } = useGameContext();

  return (
    <div className="toggle-switch">
      <label className="switch-label">
        <label className="switch">
          <input type="checkbox" checked={hrm} onChange={toggleHRM} disabled={isAnimating} />
          <span className="slider round" />
        </label>
      </label>
      <span className="label-text">High Risk Mode</span>
    </div>
  );
};

export default ToggleSwitch;
