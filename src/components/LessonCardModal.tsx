import React, { useState } from 'react';
import {
  GAME_LEVELS,
  getLearnedLetters,
  MORSE_TABLE,
  formatMorseVisual,
} from '../game/morse';
import { telegraphAudio } from '../audio/telegraphAudio';

interface LessonCardModalProps {
  levelNumber: number;
  onStartLevel: () => void;
  onHearLetter: (letter: string, pattern: string) => void;
}

export const LessonCardModal: React.FC<LessonCardModalProps> = ({
  levelNumber,
  onStartLevel,
  onHearLetter,
}) => {
  const levelConfig =
    GAME_LEVELS.find((l) => l.level === levelNumber) || GAME_LEVELS[0];
  const [letter1, letter2] = levelConfig.newLetters;
  const pattern1 = MORSE_TABLE[letter1] || '';
  const pattern2 = MORSE_TABLE[letter2] || '';

  // 3-times practice tracker
  const [practiceProgress, setPracticeProgress] = useState<Record<string, number>>({
    [letter1]: 0,
    [letter2]: 0,
  });

  // Learned letters prior to this level
  const previousLearned = Array.from(getLearnedLetters(levelNumber - 1));

  const handleSimulatePractice = (letter: string) => {
    setPracticeProgress((prev) => ({
      ...prev,
      [letter]: Math.min(3, (prev[letter] || 0) + 1),
    }));
  };

  const isPracticeDone =
    (practiceProgress[letter1] || 0) >= 3 && (practiceProgress[letter2] || 0) >= 3;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Lesson ${levelNumber}: Letters ${letter1} and ${letter2}`}
    >
      {/* Parchment Document Card */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto parchment-sheet rounded-xl p-5 sm:p-7 border-4 border-[#8c6527] shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex flex-col">
        {/* Brass Header Badge */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#b58b45]">
          <div className="flex items-center gap-2">
            <div className="brass-rivet" />
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8c591c] font-bold">
                Level {levelNumber} of 13 · {levelConfig.stationName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#2e1708] tracking-tight">
                {levelConfig.title}
              </h2>
            </div>
          </div>
          <div className="px-3 py-1 rounded bg-[#e8dcba] border border-[#a87f3b] text-xs font-serif font-bold text-[#472c10] shadow-inner">
            1887 GWR
          </div>
        </div>

        {/* Story Briefing */}
        <div className="p-3 mb-5 rounded-lg bg-[#ede1be]/80 border border-[#b89146]/60 text-xs sm:text-sm font-serif italic text-[#382210] leading-relaxed shadow-sm">
          "{levelConfig.storyContext}"
        </div>

        {/* The 2 New Letters Exhibition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Letter 1 */}
          <div className="flex flex-col items-center p-4 rounded-xl bg-[#f2e6c7] border-2 border-[#a87928] shadow-sm">
            <span className="text-5xl font-black font-serif text-[#291708] mb-1">
              {letter1}
            </span>
            <div className="text-xl font-mono font-bold tracking-widest text-[#8c5a1a] mb-2 px-3 py-0.5 rounded bg-[#e6d6ab] border border-[#bfa161]">
              {formatMorseVisual(pattern1)}
            </div>

            <button
              onClick={() => onHearLetter(letter1, pattern1)}
              className="px-3 py-1.5 rounded text-xs font-bold brass-button uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              🔊 Hear It ({pattern1})
            </button>

            {/* Practice counter */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-[#5e3c15] uppercase font-semibold">
                Practice (3x):
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`w-3 h-3 rounded-full border border-[#8a5b1f] ${
                      (practiceProgress[letter1] || 0) >= step
                        ? 'bg-[#d49d28] shadow-[0_0_6px_#f1c40f]'
                        : 'bg-[#ddcfa3]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => handleSimulatePractice(letter1)}
              className="mt-1 text-[11px] underline text-[#8c591c] hover:text-[#52330f] cursor-pointer"
            >
              + Practice Tap
            </button>
          </div>

          {/* Letter 2 */}
          <div className="flex flex-col items-center p-4 rounded-xl bg-[#f2e6c7] border-2 border-[#a87928] shadow-sm">
            <span className="text-5xl font-black font-serif text-[#291708] mb-1">
              {letter2}
            </span>
            <div className="text-xl font-mono font-bold tracking-widest text-[#8c5a1a] mb-2 px-3 py-0.5 rounded bg-[#e6d6ab] border border-[#bfa161]">
              {formatMorseVisual(pattern2)}
            </div>

            <button
              onClick={() => onHearLetter(letter2, pattern2)}
              className="px-3 py-1.5 rounded text-xs font-bold brass-button uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              🔊 Hear It ({pattern2})
            </button>

            {/* Practice counter */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-[#5e3c15] uppercase font-semibold">
                Practice (3x):
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`w-3 h-3 rounded-full border border-[#8a5b1f] ${
                      (practiceProgress[letter2] || 0) >= step
                        ? 'bg-[#d49d28] shadow-[0_0_6px_#f1c40f]'
                        : 'bg-[#ddcfa3]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => handleSimulatePractice(letter2)}
              className="mt-1 text-[11px] underline text-[#8c591c] hover:text-[#52330f] cursor-pointer"
            >
              + Practice Tap
            </button>
          </div>
        </div>

        {/* Previously learned letters */}
        {previousLearned.length > 0 && (
          <div className="mb-5 pt-3 border-t border-[#bfa161]/60">
            <span className="text-[11px] uppercase tracking-wider text-[#6e4619] font-bold block mb-1">
              Previously Mastered Signals ({previousLearned.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {previousLearned.map((l) => (
                <span
                  key={l}
                  className="px-2 py-0.5 rounded bg-[#e8dcba] border border-[#ba964c] text-xs font-bold font-serif text-[#3b230d]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto pt-3 border-t-2 border-[#b58b45] flex items-center justify-between gap-3">
          <span className="text-xs text-[#70491a] italic">
            {isPracticeDone
              ? 'Letters practiced! The line awaits.'
              : 'Listen, practice, or proceed immediately.'}
          </span>
          <button
            onClick={onStartLevel}
            data-start="true"
            className="px-6 py-2.5 rounded-lg brass-button font-serif font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Transmit Telegram →
          </button>
        </div>
      </div>
    </div>
  );
};
