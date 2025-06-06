import React, { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../GameContext';
import type { CardType } from '../GameContext'; // Type-only import
import './CardCanvas.css';

// Helper function to generate cards for the spinning animation
const generateSpinningCards = (length: number): CardType[] => {
  const cards: CardType[] = [];
  const possibleCards: CardType[] = ['red', 'black']; // No fire during spin animation for simplicity
  for (let i = 0; i < length; i++) {
    cards.push(possibleCards[Math.floor(Math.random() * possibleCards.length)]);
  }
  return cards;
};

const SPIN_STRIP_MULTIPLIER = 15; // How many "screens" of cards in the spinning strip
const REEL_ANIMATION_SPEED = 300; // Pixels per frame, adjust for desired speed
const ROW2_SUSPENSE_OFFSET_Y = 17; // Pixels higher for row 2 on final draw
const ROW2_STOP_DELAY_MS = 500; // Milliseconds to delay row 2 stop for suspense

const CardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    cardSet1,
    cardSet2,
    hrm,
    isAnimating,
    highlightWinner,
    canvasSize,
  } = useGameContext();

  const animationFrameIdRef = useRef<number | null>(null);
  const animationOffset1Ref = useRef(0);
  const animationOffset2Ref = useRef(0);
  const activeSpinningSet1Ref = useRef<CardType[]>([]); 
  const activeSpinningSet2Ref = useRef<CardType[] | null>(null);
  const isRow2DelayedStopActiveRef = useRef(false);
  const row2StopTimeoutIdRef = useRef<number | null>(null);

  // Card dimensions and drawing properties
  const cardWidth = 60;
  const cardHeight = 150; // Allocated space for card + internal margins
  const cardGap = 8;
  const cardDrawMarginTop = 10;
  const cardDrawMarginBottom = 10;
  const actualDrawableCardHeight = cardHeight - (cardDrawMarginTop + cardDrawMarginBottom);

  const drawStrip = useCallback((
    ctx: CanvasRenderingContext2D,
    sourceCards: CardType[], 
    yPos: number,
    shouldHighlightFinal: boolean,
    numVisibleCards: number, 
    pixelOffset: number,
    isCurrentlyAnimating: boolean
  ) => {
    if (!sourceCards || sourceCards.length === 0 || numVisibleCards === 0) return;

    const totalVisibleWidth = numVisibleCards * (cardWidth + cardGap) - (numVisibleCards > 0 ? cardGap : 0);
    const viewportStartX = (canvasSize.width - totalVisibleWidth) / 2;
    const centerVisibleIndex = Math.floor(numVisibleCards / 2);
    const singleCardWithGapWidth = cardWidth + cardGap;

    for (let i = 0; i < numVisibleCards; i++) {
      let cardToDraw: CardType;
      const currentCardSlotX = viewportStartX + i * singleCardWithGapWidth;

      if (isCurrentlyAnimating) {
        const effectiveOffsetIndex = Math.floor(pixelOffset / singleCardWithGapWidth);
        const sourceCardIndex = (effectiveOffsetIndex + i + sourceCards.length) % sourceCards.length;
        cardToDraw = sourceCards[sourceCardIndex];
        ctx.fillStyle = cardToDraw === 'fire' ? '#FF4500' : cardToDraw === 'red' ? '#e20631' : '#0a2035';
        ctx.fillRect(currentCardSlotX, yPos + cardDrawMarginTop, cardWidth, actualDrawableCardHeight);
      } else { // Final draw
        if (i < sourceCards.length) { // sourceCards is cardSet1 or cardSet2
            cardToDraw = sourceCards[i]; 
            ctx.fillStyle = cardToDraw === 'fire' ? '#FF4500' : cardToDraw === 'red' ? '#e20631' : '#0a2035';
            ctx.fillRect(currentCardSlotX, yPos + cardDrawMarginTop, cardWidth, actualDrawableCardHeight);

            if (shouldHighlightFinal && i === centerVisibleIndex) {
                ctx.strokeStyle = 'gold';
                ctx.lineWidth = 4;
                ctx.strokeRect(currentCardSlotX - 2, yPos + cardDrawMarginTop - 2, cardWidth + 4, actualDrawableCardHeight + 4);
            }
        }
      }
    }
  }, [canvasSize.width, isAnimating]);

  // Renamed drawCanvas to internalPerformDraw to avoid confusion with its previous signature
  // This function now reads context/refs directly to determine drawing state.
  const internalPerformDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const isContextAnimating = isAnimating; // from useGameContext()
    const shouldShowHighlight = highlightWinner; // from useGameContext()

    const yPosRow1 = 20;
    // Row 2 Y position: apply suspense offset only if row 2 is fully stopped
    const yPosRow2 = (!isContextAnimating && !isRow2DelayedStopActiveRef.current && hrm) 
                   ? (138 - ROW2_SUSPENSE_OFFSET_Y) 
                   : 138;

    // Draw Row 1
    if (isContextAnimating) { // Row 1 is spinning
      if (activeSpinningSet1Ref.current && activeSpinningSet1Ref.current.length > 0 && cardSet1 && cardSet1.length > 0) {
        drawStrip(ctx, activeSpinningSet1Ref.current, yPosRow1, false, cardSet1.length, animationOffset1Ref.current, true);
      }
    } else { // Row 1 is stopped
      if (cardSet1 && cardSet1.length > 0) {
        drawStrip(ctx, cardSet1, yPosRow1, shouldShowHighlight, cardSet1.length, 0, false);
      }
    }

    // Draw Row 2 (if HRM)
    if (hrm) {
      if (isContextAnimating || isRow2DelayedStopActiveRef.current) { // Row 2 is spinning (either main or delayed)
        if (activeSpinningSet2Ref.current && activeSpinningSet2Ref.current.length > 0 && cardSet2 && cardSet2.length > 0) {
          drawStrip(ctx, activeSpinningSet2Ref.current, yPosRow2, false, cardSet2.length, animationOffset2Ref.current, true);
        }
      } else { // Row 2 is stopped
        if (cardSet2 && cardSet2.length > 0) {
          drawStrip(ctx, cardSet2, yPosRow2, shouldShowHighlight, cardSet2.length, 0, false);
        }
      }
    }
  }, [isAnimating, highlightWinner, cardSet1, cardSet2, hrm, canvasSize.width, canvasSize.height, drawStrip]);

  useEffect(() => {
    // Cleanup previous frame and timeout
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (row2StopTimeoutIdRef.current) clearTimeout(row2StopTimeoutIdRef.current);

    if (isAnimating) { // MAIN SPINNING PHASE (isAnimating from context is true)
      isRow2DelayedStopActiveRef.current = false; // Reset delayed stop flag

      // Initialize/reset spinning sets and offsets for both reels
      if (cardSet1 && cardSet1.length > 0) {
        activeSpinningSet1Ref.current = generateSpinningCards(cardSet1.length * SPIN_STRIP_MULTIPLIER);
      } else { activeSpinningSet1Ref.current = []; }
      animationOffset1Ref.current = 0;

      if (hrm && cardSet2 && cardSet2.length > 0) {
        activeSpinningSet2Ref.current = generateSpinningCards(cardSet2.length * SPIN_STRIP_MULTIPLIER);
        animationOffset2Ref.current = 0;
      } else { activeSpinningSet2Ref.current = null; }

      const animateBothReelsFn = () => {
        if (!isAnimating) { // Context isAnimating flipped to false during this loop
          // Transition to delayed stop for row 2 or full stop
          // This logic is now handled by the main useEffect's 'else' branch upon re-render
          if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
          return; 
        }

        animationOffset1Ref.current = (animationOffset1Ref.current + REEL_ANIMATION_SPEED) % ((activeSpinningSet1Ref.current.length || 1) * (cardWidth + cardGap));
        if (hrm && activeSpinningSet2Ref.current) {
          const strip2PixelLength = (activeSpinningSet2Ref.current.length || 1) * (cardWidth + cardGap);
          animationOffset2Ref.current = (animationOffset2Ref.current - REEL_ANIMATION_SPEED + strip2PixelLength) % strip2PixelLength;
        }
        internalPerformDraw();
        animationFrameIdRef.current = requestAnimationFrame(animateBothReelsFn);
      };
      animationFrameIdRef.current = requestAnimationFrame(animateBothReelsFn);

    } else { // STOPPING SEQUENCE (isAnimating from context is false)
      // Row 1 is considered stopped. Row 2 might continue for a delay.
      if (hrm && cardSet2 && cardSet2.length > 0) { // Only apply delay if HRM and row 2 exists
        isRow2DelayedStopActiveRef.current = true;

        const animateRow2DelayedFn = () => {
          if (!isRow2DelayedStopActiveRef.current) { // Delayed stop period is over
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            internalPerformDraw(); // Final draw for row 2
            return;
          }
          if (activeSpinningSet2Ref.current) { // Continue spinning row 2
            const strip2PixelLength = (activeSpinningSet2Ref.current.length || 1) * (cardWidth + cardGap);
            animationOffset2Ref.current = (animationOffset2Ref.current - REEL_ANIMATION_SPEED + strip2PixelLength) % strip2PixelLength;
          }
          internalPerformDraw(); // Draw row 1 stopped, row 2 spinning
          animationFrameIdRef.current = requestAnimationFrame(animateRow2DelayedFn);
        };
        animationFrameIdRef.current = requestAnimationFrame(animateRow2DelayedFn);

        row2StopTimeoutIdRef.current = window.setTimeout(() => {
          isRow2DelayedStopActiveRef.current = false; // Signal to stop row 2 animation
        }, ROW2_STOP_DELAY_MS);

      } else { // Not HRM or no row 2, so just ensure final state is drawn
        isRow2DelayedStopActiveRef.current = false;
        internalPerformDraw();
      }
    }

    return () => { // Cleanup on unmount or before re-run
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (row2StopTimeoutIdRef.current) clearTimeout(row2StopTimeoutIdRef.current);
    };
  }, [isAnimating, cardSet1, cardSet2, hrm, internalPerformDraw]); // internalPerformDraw is a dep

  return (
    <div className="canvas-container">
      <img
        src="https://turbo.spribegaming.com/hotline-arrow.a800958d881c40fb.svg"
        alt="down arrow"
        className="center-arrow"
      />
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height='248px'
        style={{
          touchAction: 'none',
          width: canvasSize.width,
          height: canvasSize.height/4,
          cursor: 'inherit',
        }}
      />
      <img
        src="https://turbo.spribegaming.com/hotline-arrow.a800958d881c40fb.svg"
        style={{ transform: 'rotate(180deg)' }}
        alt="up arrow"
        className="center-arrow"
      />
    </div>

  );
};

export default CardCanvas;
