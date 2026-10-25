import React, { useState, useEffect, useRef, useCallback } from 'react';
import { telegraphAudio } from '../audio/telegraphAudio';
import {
  classifyPress,
  decodeMorse,
  formatMorseVisual,
  TimingDifficulty,
  TIMING_PRESETS,
} from '../game/morse';

interface TelegraphKeyProps {
  timingDifficulty?: TimingDifficulty;
  onLetterDecoded?: (letter: string, pattern: string) => void;
  onWordSpace?: () => void;
  externalActive?: boolean; // When an automated demo is playing
  disabled?: boolean;
  freeTapMode?: boolean; // In Lifeline mode, enables word silence
}

export const TelegraphKey: React.FC<TelegraphKeyProps> = ({
  timingDifficulty = TIMING_PRESETS.Standard,
  onLetterDecoded,
  onWordSpace,
  externalActive = false,
  disabled = false,
  freeTapMode = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<string>('');
  const [lastDecodedLetter, setLastDecodedLetter] = useState<string | null>(null);
  const [isInvalidPattern, setIsInvalidPattern] = useState(false);
  const [sparkActive, setSparkActive] = useState(false);

  // References to keep timing precise without React closure stalls
  const pressStartTimeRef = useRef<number | null>(null);
  const patternRef = useRef<string>('');
  const letterSilenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordSilenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const isKeyDownRef = useRef<boolean>(false);

  // Sync state with ref
  patternRef.current = currentPattern;

  // Clear silence timeouts
  const clearSilenceTimers = useCallback(() => {
    if (letterSilenceTimeoutRef.current) {
      clearTimeout(letterSilenceTimeoutRef.current);
      letterSilenceTimeoutRef.current = null;
    }
    if (wordSilenceTimeoutRef.current) {
      clearTimeout(wordSilenceTimeoutRef.current);
      wordSilenceTimeoutRef.current = null;
    }
  }, []);

  // Handle letter finalization when silence threshold is reached
  const finalizeCurrentLetter = useCallback(() => {
    const pattern = patternRef.current;
    if (!pattern) return;

    const decoded = decodeMorse(pattern);
    if (decoded === '?') {
      setIsInvalidPattern(true);
      setTimeout(() => setIsInvalidPattern(false), 500);
    } else {
      setLastDecodedLetter(decoded);
    }

    onLetterDecoded?.(decoded, pattern);
    setCurrentPattern('');
    patternRef.current = '';

    // If in free-tap Lifeline mode, schedule word space silence
    if (freeTapMode) {
      wordSilenceTimeoutRef.current = setTimeout(() => {
        onWordSpace?.();
      }, timingDifficulty.wordSilenceMs - timingDifficulty.letterSilenceMs);
    }
  }, [onLetterDecoded, onWordSpace, freeTapMode, timingDifficulty]);

  // Press Key Handler
  const handlePressDown = useCallback(() => {
    if (disabled) return;
    clearSilenceTimers();
    telegraphAudio.unlock();

    pressStartTimeRef.current = performance.now();
    setIsPressed(true);
    setSparkActive(true);
    telegraphAudio.startTone();
  }, [disabled, clearSilenceTimers]);

  // Release Key Handler
  const handlePressUp = useCallback(() => {
    if (!pressStartTimeRef.current) return;
    const duration = performance.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = null;

    setIsPressed(false);
    telegraphAudio.stopTone();
    setTimeout(() => setSparkActive(false), 120);

    const classification = classifyPress(duration, timingDifficulty);
    if (classification === 'bounce') {
      // Ignored bounce
      return;
    }

    const symbol = classification === 'dot' ? '.' : '-';
    const newPattern = patternRef.current + symbol;
    setCurrentPattern(newPattern);
    patternRef.current = newPattern;

    // Start letter silence timer
    clearSilenceTimers();
    letterSilenceTimeoutRef.current = setTimeout(() => {
      finalizeCurrentLetter();
    }, timingDifficulty.letterSilenceMs);
  }, [timingDifficulty, clearSilenceTimers, finalizeCurrentLetter]);

  // Global Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Prevent page scroll
        e.preventDefault();
        if (e.repeat) return; // Ignore key repeat while held
        if (!isKeyDownRef.current && !isMouseDownRef.current) {
          isKeyDownRef.current = true;
          handlePressDown();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isKeyDownRef.current) {
          isKeyDownRef.current = false;
          handlePressUp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePressDown, handlePressUp]);

  // Global blur / visibility cleanup
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isKeyDownRef.current || isMouseDownRef.current) {
        isKeyDownRef.current = false;
        isMouseDownRef.current = false;
        setIsPressed(false);
        telegraphAudio.stopTone();
        setSparkActive(false);
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleWindowBlur);
      clearSilenceTimers();
      telegraphAudio.stopTone();
    };
  }, [clearSilenceTimers]);

  const activeVisual = isPressed || externalActive;

  return (
    <div className="flex flex-col items-center justify-center select-none w-full max-w-xl mx-auto px-4">
      {/* Visual sound/tone indicator & Captions badge */}
      <div className="flex items-center gap-2 mb-2 text-xs font-serif tracking-widest text-[#d8b056]/80 uppercase">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-100 ${
            activeVisual
              ? 'bg-[#ffe066] shadow-[0_0_10px_#ffcf33] scale-125'
              : 'bg-[#5c4013]/60'
          }`}
          aria-hidden="true"
        />
        <span>{activeVisual ? 'CIRCUIT CLOSED (SOUND ACTIVE)' : 'CIRCUIT OPEN (STANDBY)'}</span>
      </div>

      {/* Tactile Telegraph Key Body */}
      <div
        className="relative w-full max-w-md h-52 sm:h-60 rounded-xl bg-gradient-to-b from-[#3a2013] via-[#24130a] to-[#170a04] border-2 border-[#5c371d] shadow-[0_12px_28px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,200,100,0.15)] flex flex-col items-center justify-center p-3 cursor-pointer group"
        onPointerDown={(e) => {
          e.preventDefault();
          isMouseDownRef.current = true;
          handlePressDown();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          if (isMouseDownRef.current) {
            isMouseDownRef.current = false;
            handlePressUp();
          }
        }}
        onPointerCancel={(e) => {
          e.preventDefault();
          if (isMouseDownRef.current) {
            isMouseDownRef.current = false;
            handlePressUp();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Telegraph Brass Key (Hold Spacebar or Click to Transmit)"
        data-testid="telegraph-key"
      >
        {/* Brass corner brackets & rivets on wooden base */}
        <div className="absolute top-2 left-2 brass-rivet" />
        <div className="absolute top-2 right-2 brass-rivet" />
        <div className="absolute bottom-2 left-2 brass-rivet" />
        <div className="absolute bottom-2 right-2 brass-rivet" />

        {/* Maker's Engraved Brass Plate */}
        <div className="absolute top-3 px-3 py-0.5 rounded-sm brass-plate text-[10px] tracking-widest text-[#241406] font-bold uppercase shadow-sm">
          Elliott Bros. · London · 1887
        </div>

        {/* Detailed SVG Telegraph Instrument */}
        <svg
          viewBox="0 0 400 170"
          className="w-full h-full max-h-48 overflow-visible"
        >
          <defs>
            {/* Linear gradients for brass, steel, and contacts */}
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffefab" />
              <stop offset="35%" stopColor="#d8a32d" />
              <stop offset="70%" stopColor="#966d15" />
              <stop offset="100%" stopColor="#e5bc4b" />
            </linearGradient>

            <linearGradient id="brassDarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c79524" />
              <stop offset="50%" stopColor="#7a550d" />
              <stop offset="100%" stopColor="#3d2803" />
            </linearGradient>

            <linearGradient id="knobGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3d3735" />
              <stop offset="40%" stopColor="#1a1817" />
              <stop offset="100%" stopColor="#080707" />
            </linearGradient>

            <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffe680" />
              <stop offset="70%" stopColor="#f39c12" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Wooden base bevel in SVG */}
          <rect
            x="30"
            y="135"
            width="340"
            height="18"
            rx="4"
            fill="#2c160b"
            stroke="#5c381c"
            strokeWidth="2"
          />

          {/* Rear Brass Binding Post Terminals (Wires In/Out) */}
          <rect x="55" y="115" width="16" height="22" rx="2" fill="url(#brassGrad)" stroke="#523807" />
          <circle cx="63" cy="115" r="10" fill="url(#brassGrad)" stroke="#523807" />
          <rect x="85" y="115" width="16" height="22" rx="2" fill="url(#brassGrad)" stroke="#523807" />
          <circle cx="93" cy="115" r="10" fill="url(#brassGrad)" stroke="#523807" />

          {/* Center Brass Trunnion (Pivot Stanchions) */}
          <path
            d="M 170 135 L 180 85 L 210 85 L 220 135 Z"
            fill="url(#brassDarkGrad)"
            stroke="#473206"
            strokeWidth="1.5"
          />
          <circle cx="195" cy="88" r="9" fill="url(#brassGrad)" stroke="#382504" />
          <circle cx="195" cy="88" r="3" fill="#1f1403" />

          {/* Lower Fixed Platinum Contact Post */}
          <rect x="298" y="120" width="14" height="16" rx="2" fill="url(#brassGrad)" stroke="#4a3205" />
          <circle cx="305" cy="119" r="4.5" fill="#e8eaed" stroke="#70757a" strokeWidth="0.8" />

          {/* Mechanical Return Spring */}
          <path
            d="M 155 135 Q 160 120 155 110 Q 150 100 155 90 Q 160 80 155 70"
            fill="none"
            stroke="url(#brassGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* PIVOTING LEVER ARM GROUP */}
          <g
            style={{
              transformOrigin: '195px 88px',
              transform: activeVisual ? 'rotate(6.5deg)' : 'rotate(0deg)',
              transition: activeVisual
                ? 'transform 0.05s ease-out'
                : 'transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Counter-lever & Rear Adjustment Thumb Screw */}
            <rect x="100" y="84" width="95" height="9" rx="2" fill="url(#brassGrad)" stroke="#4a3205" />
            <circle cx="120" cy="74" r="8" fill="url(#brassGrad)" stroke="#4a3205" />
            <rect x="117" y="74" width="6" height="14" fill="url(#brassDarkGrad)" />

            {/* Main Forward Brass Lever */}
            <path
              d="M 195 83 L 335 83 L 335 93 L 195 93 Z"
              fill="url(#brassGrad)"
              stroke="#4a3205"
              strokeWidth="1.2"
            />

            {/* Upper Contact Pin beneath lever */}
            <circle cx="305" cy="95" r="4" fill="#e8eaed" stroke="#70757a" strokeWidth="0.8" />

            {/* Heavy Ebonite / Polished Wood Finger Knob */}
            <path
              d="M 320 83 C 320 60, 310 50, 335 32 C 360 50, 350 60, 350 83 Z"
              fill="url(#knobGrad)"
              stroke="#2e2b2a"
              strokeWidth="1.5"
            />
            {/* Polished brass rim cap on top of knob */}
            <ellipse cx="335" cy="32" rx="14" ry="5" fill="url(#brassGrad)" stroke="#4a3205" />
            <ellipse cx="335" cy="30" rx="9" ry="3" fill="#ffeaa7" opacity="0.6" />
          </g>

          {/* Dynamic Electric Spark Glow at Contact Gap */}
          {(sparkActive || (activeVisual && Math.random() > 0.4)) && (
            <g transform="translate(305, 118)">
              <circle cx="0" cy="0" r="14" fill="url(#sparkGlow)" className="spark-active" />
              <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ffffff" strokeWidth="2" />
              <line x1="-8" y1="8" x2="8" y2="-8" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Visual Sparkle caption / hint */}
        <div className="absolute bottom-2 text-[11px] text-[#caa758]/75 font-serif italic tracking-wide">
          Press & Hold [SPACEBAR] or Key Pad
        </div>
      </div>

      {/* Morse Pattern Live Readout Plate */}
      <div className="mt-3 flex flex-col items-center min-h-[56px]">
        {/* Pattern Dots and Dashes */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg brass-plate-inset min-w-[180px] justify-center transition-all ${
            isInvalidPattern ? 'shake-wrong border-red-500' : ''
          }`}
        >
          {currentPattern ? (
            <span className="text-2xl font-bold tracking-widest text-[#f5cf53] drop-shadow-[0_0_8px_rgba(245,207,83,0.7)]">
              {formatMorseVisual(currentPattern)}
            </span>
          ) : lastDecodedLetter ? (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#bfa05d]">
                Decoded:
              </span>
              <span
                className={`text-2xl font-extrabold ${
                  lastDecodedLetter === '?' ? 'text-red-400' : 'text-[#ffe066]'
                } drop-shadow-[0_0_10px_rgba(255,224,102,0.8)]`}
              >
                {lastDecodedLetter}
              </span>
            </div>
          ) : (
            <span className="text-xs tracking-widest text-[#a88647]/70 italic">
              Tap Morse code...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
