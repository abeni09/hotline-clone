import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type CardType = 'black' | 'red' | 'fire';
export type HistoryEntry = CardType | [CardType, CardType]; // Can be a single card or a pair for HRM

export interface SpinResult {
  cards: CardType[];
  win: boolean;
}

export interface GameContextType {
  cardSet1: CardType[];
  cardSet2: CardType[] | null;
  isAnimating: boolean;
  hrm: boolean;
  highlightWinner: boolean;
  history: HistoryEntry[];
  canvasSize: { width: number; height: number };
  betAmount: number;
  setBetAmount: (amount: number) => void;
  winAmount: number | null;
  toggleHRM: () => void;
  startSpin: (betType: CardType) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
const generateCardSet = (count: number): CardType[] => {
  const cards: CardType[] = [];
  const randomCenter = Math.floor(Math.random() * 13);
  let cardOrder = ['black', 'red'];
  

  for (let i = 0; i < count; i++) {
    if (i === randomCenter) {
      cards.push('fire');
      cardOrder = cardOrder.reverse();
    } else {
      cards.push(cardOrder[i % 2] as CardType);
    }
  }
  return cards;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [betAmount, setBetAmount] = useState<number>(1);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [cardSet1, setCardSet1] = useState<CardType[]>(generateCardSet(13));
  const [cardSet2, setCardSet2] = useState<CardType[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightWinner, setHighlightWinner] = useState(false);
  const [hrm, setHRM] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1860, height: 496 });
  

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleHRM = useCallback(() => {
    if (!isAnimating) setHRM((prev) => !prev);
  }, [isAnimating]);

  // Effect to update cardSet2 when HRM mode changes
  useEffect(() => {
    // This effect handles updating cardSet2 when HRM is toggled by the user.
    // It should not interfere with card sets determined by an active spin.
    if (!isAnimating) { // Only update if not in the middle of a spin animation
      const cardCount = window.innerWidth > 768 ? 13 : 9;
      const adjustedCount = cardCount % 2 === 0 ? cardCount - 1 : cardCount;

      if (hrm) {
        setCardSet2(generateCardSet(adjustedCount));
      } else {
        setCardSet2(null);
      }
    }
    // Only re-run this effect if 'hrm' itself changes. 'isAnimating' changes are handled by startSpin.
  }, [hrm]);

  const ANIMATION_DURATION_MS = 2500; // Duration for the main visual spin animation
  const ROW2_STOP_DELAY_MS_FOR_CONTEXT = 500; // Must match CardCanvas.ROW2_STOP_DELAY_MS

const startSpin = useCallback((betType: CardType) => {
    if (isAnimating) return;

    const cardCount = window.innerWidth > 768 ? 13 : 9;
    const adjustedCount = cardCount % 2 === 0 ? cardCount - 1 : cardCount;

    const newSet1 = generateCardSet(adjustedCount);
    const newSet2 = hrm ? generateCardSet(adjustedCount) : null;

    // Reset states for the new spin
    setWinAmount(null);
    setHighlightWinner(false);

    // Set the final card sets immediately so CardCanvas knows the target
    setCardSet1(newSet1);
    setCardSet2(newSet2);
    
    // Start the animation phase
    setIsAnimating(true);

    // This timeout handles the end of the primary animation phase
    setTimeout(() => {
      setIsAnimating(false); // Signal CardCanvas to stop main animation (and start its row 2 delay if HRM)
      setHighlightWinner(true);
    }, ANIMATION_DURATION_MS);

    // This timeout handles updating game state (win, history) after ALL visual animations are expected to be complete
    const finalLogicDelay = hrm ? ANIMATION_DURATION_MS + ROW2_STOP_DELAY_MS_FOR_CONTEXT : ANIMATION_DURATION_MS;

    setTimeout(() => {
      const centerCard1 = newSet1[Math.floor(adjustedCount / 2)];
      let currentWin = 0;
      let newHistoryEntry: HistoryEntry = centerCard1;

      if (hrm && newSet2) {
        const centerCard2 = newSet2[Math.floor(adjustedCount / 2)];
        if (centerCard1 === betType && centerCard2 === betType) {
          currentWin = betAmount * (betType === 'fire' ? 1056 : 4.125);
        }
        newHistoryEntry = [centerCard1, centerCard2];
      } else {
        if (centerCard1 === betType) {
          currentWin = betAmount * (betType === 'fire' ? 32 : 2);
        }
      }
      
      setWinAmount(currentWin > 0 ? currentWin : 0);
      setHistory((prev) => [newHistoryEntry, ...prev.slice(0, 19)]);
    }, finalLogicDelay);
  }, [isAnimating, hrm, betAmount]); // Added betAmount to dependencies

  return (
    <GameContext.Provider
      value={{
        cardSet1,
        cardSet2,
        isAnimating,
        highlightWinner,
        hrm,
        history,
        betAmount,
        setBetAmount,
        winAmount,
        toggleHRM,
        startSpin,
        canvasSize,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within GameProvider');
  return context;
};
