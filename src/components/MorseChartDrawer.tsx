import React, { useEffect } from 'react';
import { MORSE_TABLE, formatMorseVisual } from '../game/morse';
import { telegraphAudio } from '../audio/telegraphAudio';

interface MorseChartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  learnedLetters: Set<string>;
  onPlayPattern?: (letter: string, pattern: string) => void;
  allUnlocked?: boolean; // For Lifeline mode where all are available
}

export const MorseChartDrawer: React.FC<MorseChartDrawerProps> = ({
  isOpen,
  onClose,
  learnedLetters,
  onPlayPattern,
  allUnlocked = false,
}) => {
  // Listen for 'C' shortcut to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        // Only if not in an input or textarea
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const digits = '1234567890'.split('');

  const handleHearLetter = (char: string, pattern: string) => {
    if (onPlayPattern) {
      onPlayPattern(char, pattern);
    } else {
      telegraphAudio.unlock();
      telegraphAudio.playSequence(pattern);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Morse Code Reference Codex"
    >
      {/* Click outside to close backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Brass and Mahogany Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-gradient-to-b from-[#2e180d] via-[#1c0e07] to-[#120803] border-l-2 border-[#80551e] shadow-[0_0_35px_rgba(0,0,0,0.9)] flex flex-col z-10 overflow-hidden">
        {/* Drawer Header with Engraved Brass Plaque */}
        <div className="p-4 border-b border-[#5c3c16] flex items-center justify-between bg-gradient-to-r from-[#2e180d] to-[#3d2012]">
          <div className="flex items-center gap-2">
            <div className="brass-rivet" />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#f7d774] tracking-wide">
                Morse Code Codex
              </h2>
              <p className="text-[11px] text-[#caa758]/80 italic">
                Standard International Continental Code [C to close]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full brass-button flex items-center justify-center font-bold text-sm"
            aria-label="Close Reference Codex"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Letters Section */}
          <div>
            <div className="flex items-center justify-between pb-1 mb-3 border-b border-[#5c3e1a]">
              <span className="text-xs uppercase tracking-widest text-[#caa758] font-bold">
                Alphabet (A–Z)
              </span>
              <span className="text-[10px] text-[#9c7d37]">
                Tap letter to hear tone
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {alphabet.map((letter) => {
                const pattern = MORSE_TABLE[letter] || '';
                const isLearned = allUnlocked || learnedLetters.has(letter);

                return (
                  <button
                    key={letter}
                    onClick={() => handleHearLetter(letter, pattern)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-md border transition-all text-left group ${
                      isLearned
                        ? 'bg-gradient-to-b from-[#382012] to-[#211107] border-[#8a5f22] hover:border-[#ffd875] hover:shadow-[0_0_8px_rgba(245,207,83,0.3)] cursor-pointer'
                        : 'bg-[#1a0f08]/60 border-[#3d250f] opacity-45 cursor-pointer'
                    }`}
                    title={
                      isLearned
                        ? `Letter ${letter}: ${pattern}`
                        : `Letter ${letter}: ${pattern} (Not yet learned)`
                    }
                  >
                    <span
                      className={`text-lg font-bold font-serif ${
                        isLearned ? 'text-[#ffea9f]' : 'text-[#856c45]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold tracking-wider ${
                        isLearned ? 'text-[#ffd875]' : 'text-[#6e5632]'
                      }`}
                    >
                      {formatMorseVisual(pattern)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Digits Section */}
          <div>
            <div className="flex items-center justify-between pb-1 mb-3 border-b border-[#5c3e1a]">
              <span className="text-xs uppercase tracking-widest text-[#caa758] font-bold">
                Numerals (0–9)
              </span>
              <span className="text-[10px] text-[#9c7d37]">Railway standard</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {digits.map((digit) => {
                const pattern = MORSE_TABLE[digit] || '';
                return (
                  <button
                    key={digit}
                    onClick={() => handleHearLetter(digit, pattern)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md border bg-gradient-to-b from-[#24140a] to-[#170c06] border-[#5c3c17] hover:border-[#ffd875] transition-all text-left"
                  >
                    <span className="text-base font-bold font-serif text-[#ebd18c]">
                      {digit}
                    </span>
                    <span className="text-xs font-mono text-[#d4af37]">
                      {formatMorseVisual(pattern)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer hint */}
        <div className="p-3 bg-[#170a04] border-t border-[#4a2e12] flex items-center justify-between text-xs text-[#b89140]">
          <span>Learned: {allUnlocked ? '26 of 26' : `${learnedLetters.size} of 26`}</span>
          <span>Shortcut: Press [C]</span>
        </div>
      </div>
    </div>
  );
};
