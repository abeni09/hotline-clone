import React, { useState } from 'react';
import './HistoryDropdown.css';
import { useGameContext, type HistoryEntry } from '../GameContext';

const HistoryDropdown: React.FC = () => {
  const { history }: { history: HistoryEntry[] } = useGameContext();
  const [expanded, setExpanded] = useState(false);

  // Show last 10 when collapsed
  const visibleHistory = expanded ? history : history.slice(-10);

  return (
    <div className="history-dropdown-container">

      <div className="history-wrapper">
        <div className="history-items">
          {visibleHistory.map((entry, index) => {
            if (Array.isArray(entry)) {
              // HRM Pair
              return (
                <div key={index} className="history-item-pair" title={`${entry[0]} & ${entry[1]}`}>
                  <div className={`history-item card-${entry[0]}`}>
                  </div>
                  <div className={`history-item card-${entry[1]}`}>
                  </div>
                </div>
              );
            } else {
              // Single Card
              return (
                <div
                  key={index}
                  className={`history-item card-${entry}`}
                  title={entry}
                >
                </div>
              );
            }
          })}
        </div>
      <button
          className="history-toggle-button"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <img src="https://turbo.spribegaming.com/icon-rounds-history.28821710fef20c17.svg" alt="history" />
          <img
            src="https://turbo.spribegaming.com/icon-dd-arrow.e394e8c554623388.svg"
            alt="history"
            style={{ transform: expanded ? 'rotate(180deg)' : '' }}
          />
        </button>
      </div>
    </div>
  );
};

export default HistoryDropdown;
