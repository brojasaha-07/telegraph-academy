import React, { useMemo } from 'react';
import { MORSE_TABLE, formatMorseVisual } from '../game/morse';

interface TickerTapeProps {
  message: string;
  currentIndex: number;
  lastFeedback: 'correct' | 'wrong' | null;
  speedPxPerSec: number;
  isPaused: boolean;
  onTimeout: () => void;
  showHint?: boolean;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  message,
  currentIndex,
  lastFeedback,
  isPaused,
  showHint = false,
}) => {
  const chars = useMemo(() => message.split(''), [message]);
  const activeChar = chars[currentIndex] || '';
  const activeMorse = activeChar && activeChar !== ' ' ? MORSE_TABLE[activeChar] : '';

  // Calculate precise layout metrics for each character tile
  const tileMetrics = useMemo(() => {
    let currentX = 0;
    const gap = 6; // px between adjacent tiles
    return chars.map((char) => {
      const isSpace = char === ' ';
      const morse = !isSpace ? (MORSE_TABLE[char] || '') : '';
      const symbolCount = morse.length;
      // Adaptive tile width: generous spacing for long 4-5 symbol codes, compact for 1-2
      const width = isSpace ? 34 : Math.max(56, symbolCount * 18 + 10);
      const center = currentX + width / 2;
      currentX += width + gap;
      return { char, isSpace, morse, width, center };
    });
  }, [chars]);

  const activeCenter = tileMetrics[currentIndex]?.center ?? 0;
  const activeTileWidth = tileMetrics[currentIndex]?.width ?? 56;

  return (
    <div className="w-full max-w-4xl mx-auto my-1 sm:my-2 px-2">
      {/* Brass Ticker Enclosure */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#382012] via-[#211208] to-[#120803] p-2.5 sm:p-3 border-2 border-[#663e1f] shadow-[0_10px_24px_rgba(0,0,0,0.85)]">
        {/* Enclosure corner rivets */}
        <div className="absolute top-1.5 left-1.5 brass-rivet" />
        <div className="absolute top-1.5 right-1.5 brass-rivet" />
        <div className="absolute bottom-1.5 left-1.5 brass-rivet" />
        <div className="absolute bottom-1.5 right-1.5 brass-rivet" />

        {/* Header: Telegraph Line Header & Dispatch Banner */}
        <div className="flex items-center justify-between mb-2 px-2 text-xs font-serif">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="tracking-widest text-[#d8b056] font-bold uppercase text-[10px] sm:text-xs">
              INCOMING WIRE TAPE · GWR DISPATCH RIBBON
            </span>
          </div>

          {/* Hint indicator badge if hint is active */}
          {showHint && activeMorse && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/60 text-[#ffd875] text-[11px] font-bold animate-pulse">
              <span>HINT: {activeChar} =</span>
              <span className="font-mono text-xs">{formatMorseVisual(activeMorse)}</span>
            </div>
          )}
        </div>

        {/* Ticker tape track slot (pure relative container, no flex) */}
        <div className="relative w-full h-18 sm:h-20 bg-[#120804] border-2 border-[#523315] rounded-md overflow-hidden shadow-inner">
          {/* Mechanical Left & Right Paper Guide Rollers */}
          <div className="absolute left-0 top-0 bottom-0 w-8 z-30 pointer-events-none bg-gradient-to-r from-[#211107] via-[#3b200e] to-transparent border-r border-[#6e461f]/50 flex items-center justify-center">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#e0ad36] via-[#7d5612] to-[#e0ad36] rounded-full shadow" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 z-30 pointer-events-none bg-gradient-to-l from-[#211107] via-[#3b200e] to-transparent border-l border-[#6e461f]/50 flex items-center justify-center">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#e0ad36] via-[#7d5612] to-[#e0ad36] rounded-full shadow" />
          </div>

          {/* Central Brass Reading Aperture / Marker (dead-center) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-center">
            {/* Top pointer chevron */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#f3cf55] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            <div
              className="h-14 sm:h-16 rounded border-2 border-[#f5cf53] shadow-[0_0_14px_rgba(245,207,83,0.6),inset_0_0_8px_rgba(245,207,83,0.3)] bg-amber-400/10 my-0.5 transition-all duration-200"
              style={{
                width: `${activeTileWidth + 6}px`,
              }}
            />
            {/* Bottom pointer chevron */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#f3cf55] filter drop-shadow-[0_-1px_2px_rgba(0,0,0,0.8)]" />
          </div>

          {/* Scrolling Paper Strip (anchored at center 50%) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-transform duration-300 ease-out z-10 will-change-transform"
            style={{
              // Center the current active character at the exact middle of the reading aperture
              transform: `translateX(-${activeCenter}px)`,
            }}
          >
            {chars.map((char, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isSpace = char === ' ';
              const morsePattern = char !== ' ' ? MORSE_TABLE[char] || '' : '';
              const metrics = tileMetrics[index] || { width: 56 };

              if (isSpace) {
                return (
                  <div
                    key={index}
                    className="h-14 sm:h-16 flex items-center justify-center text-[#7a5933] text-sm select-none shrink-0"
                    style={{ width: `${metrics.width}px` }}
                  >
                    ␣
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`h-14 sm:h-16 rounded flex flex-col items-center justify-center transition-all duration-200 select-none shrink-0 px-1 overflow-hidden ${
                    isPast
                      ? 'bg-[#dec899] text-[#2c1d11] opacity-65 line-through'
                      : isCurrent
                      ? lastFeedback === 'correct'
                        ? 'bg-[#ffeaa7] text-[#1a1107] scale-105 shadow-[0_0_18px_#f1c40f] border-2 border-[#f1c40f]'
                        : lastFeedback === 'wrong'
                        ? 'bg-red-200 text-red-950 shake-wrong border-2 border-red-600 shadow-[0_0_18px_rgba(192,57,43,0.8)]'
                        : 'bg-[#f7f0da] text-[#1a1007] shadow-md border-2 border-[#caa758]'
                      : 'bg-[#ede3c5] text-[#3d2a1a] opacity-90 border border-[#bda268]'
                  }`}
                  style={{
                    width: `${metrics.width}px`,
                    fontFamily: '"Special Elite", monospace',
                  }}
                >
                  {/* The Letter */}
                  <span className="text-xl sm:text-2xl font-black leading-none mb-1">
                    {char}
                  </span>

                  {/* Morse Code Dots and Dashes glyphs directly underneath */}
                  <div
                    className={`flex items-center justify-center gap-1 shrink-0 flex-nowrap ${
                      isCurrent
                        ? 'text-[#7d4e10]'
                        : isPast
                        ? 'text-[#614528]/60'
                        : 'text-[#6e4e2a]'
                    }`}
                  >
                    {morsePattern.split('').map((symbol, sIdx) => {
                      if (symbol === '.') {
                        return (
                          <span
                            key={sIdx}
                            className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"
                          />
                        );
                      }
                      if (symbol === '-') {
                        return (
                          <span
                            key={sIdx}
                            className="inline-block w-3 sm:w-3.5 h-1.5 rounded-full bg-current shrink-0"
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tape Footer: Target Letter Info & Status */}
        <div className="flex items-center justify-between mt-2 px-2 text-xs font-serif text-[#caa758]">
          <div className="flex items-center gap-2">
            <span className="text-[#a88235] uppercase tracking-wider text-[11px]">
              TARGET CHAR:
            </span>
            <span className="font-bold text-[#ffd875] text-sm uppercase">
              {activeChar || 'DONE'}
            </span>
            {activeMorse && (
              <span className="text-xs font-mono bg-[#1c0f06] px-2 py-0.5 rounded border border-[#694212] text-[#ffd875]">
                {formatMorseVisual(activeMorse)}
              </span>
            )}
          </div>

          <div className="text-[11px] italic text-[#d4af37]/80">
            {isPaused ? 'TRANSMISSION PAUSED [ESC]' : 'TRANSMITTING...'}
          </div>
        </div>
      </div>
    </div>
  );
};
