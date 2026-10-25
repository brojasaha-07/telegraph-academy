import React, { useState, useEffect, useRef } from 'react';
import { SophiaAvatar, SophiaPose } from './SophiaAvatar';

interface SophiaGameplayBubbleProps {
  streak: number;
  trainProgress: number; // 0 to 1
  isTension: boolean; // train near gorge (<25% remaining)
  mistakes: Record<string, number>;
  isPaused: boolean;
  reducedMotion?: boolean;
}

export const SophiaGameplayBubble: React.FC<SophiaGameplayBubbleProps> = ({
  streak,
  trainProgress: _trainProgress,
  isTension,
  mistakes,
  isPaused,
  reducedMotion = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentPose, setCurrentPose] = useState<SophiaPose>('cheering');

  const lastReactionTimeRef = useRef<number>(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const celebratedStreaksRef = useRef<Set<number>>(new Set());
  const warnedMistakeLettersRef = useRef<Set<string>>(new Set());
  const warnedTensionRef = useRef<boolean>(false);

  // Trigger reaction respecting the 20-second throttle
  const triggerReaction = (text: string, pose: SophiaPose) => {
    const now = Date.now();
    if (now - lastReactionTimeRef.current < 20000) {
      return; // rate limited to at most once per 20s
    }
    lastReactionTimeRef.current = now;
    setCurrentText(text);
    setCurrentPose(pose);
    setIsVisible(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3200);
  };

  // Check 10-streak
  useEffect(() => {
    if (isPaused) return;
    if (streak >= 10 && !celebratedStreaksRef.current.has(10)) {
      celebratedStreaksRef.current.add(10);
      triggerReaction(
        "Magnificent rhythm, apprentice! 10 perfect signals in a row! The wire is singing!",
        'cheering'
      );
    }
  }, [streak, isPaused]);

  // Check Train Proximity Tension
  useEffect(() => {
    if (isPaused) return;
    if (isTension && !warnedTensionRef.current) {
      warnedTensionRef.current = true;
      triggerReaction(
        "Hurry, apprentice! The 9:15 Express is bearing down on the gorge! Send the signal!",
        'worried'
      );
    }
  }, [isTension, isPaused]);

  // Check 3 mistakes on the same letter
  useEffect(() => {
    if (isPaused) return;
    Object.entries(mistakes).forEach(([letter, count]) => {
      if (count >= 3 && !warnedMistakeLettersRef.current.has(letter)) {
        warnedMistakeLettersRef.current.add(letter);
        triggerReaction(
          `Mind letter '${letter}'! Press 'C' or tap the Codex book to inspect its pattern.`,
          'pointing'
        );
      }
    });
  }, [mistakes, isPaused]);

  // Cleanup hide timer
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-2 left-2 sm:bottom-4 sm:left-4 z-40 pointer-events-none flex items-end gap-2 transition-all duration-300 ${
        reducedMotion ? '' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'
      }`}
      aria-live="polite"
    >
      {/* Sophia Avatar */}
      <div className="flex-shrink-0 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
        <SophiaAvatar pose={currentPose} size="md" reducedMotion={reducedMotion} />
      </div>

      {/* Compact Speech Bubble */}
      <div className="relative parchment-sheet rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 border-2 border-[#8c6527] shadow-xl text-[#291708] max-w-xs mb-3">
        <div className="brass-rivet absolute -top-1 -left-1" />
        <div className="brass-rivet absolute -top-1 -right-1" />
        {/* Tail */}
        <div className="absolute -left-2.5 bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-[#8c6527]" />
        <div className="absolute -left-1.5 bottom-3 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-[#f3ebcb]" />

        <div className="text-[10px] uppercase font-bold tracking-wider text-[#7a4816] mb-0.5">
          Sophia · Station Master
        </div>
        <p className="text-xs font-serif italic text-[#381e0b] leading-snug">
          "{currentText}"
        </p>
      </div>
    </div>
  );
};
