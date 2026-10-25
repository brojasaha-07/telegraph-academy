import React from 'react';
import { calculateStars } from '../game/morse';
import { SophiaAvatar } from './SophiaAvatar';

export interface StationMasterResponse {
  comment: string;
  nextMessage: string;
  storyBeat: string;
  fallback?: boolean;
}

interface LevelSummaryModalProps {
  levelNumber: number;
  isSuccess: boolean;
  score: number;
  accuracy: number;
  bestStreak: number;
  wpm: number;
  mistakes: Record<string, number>;
  stationMasterData: StationMasterResponse | null;
  isLoadingCoach: boolean;
  onRetry: () => void;
  onNextLevel: () => void;
  onReturnToOffice: () => void;
  isGameComplete: boolean;
}

export const LevelSummaryModal: React.FC<LevelSummaryModalProps> = ({
  levelNumber,
  isSuccess,
  score,
  accuracy,
  bestStreak,
  wpm,
  mistakes,
  stationMasterData,
  isLoadingCoach,
  onRetry,
  onNextLevel,
  onReturnToOffice,
  isGameComplete,
}) => {
  const mistakeEntries = Object.entries(mistakes);
  const totalMistakes = mistakeEntries.reduce((acc, [, count]) => acc + count, 0);
  const stars = calculateStars(accuracy, totalMistakes);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={isSuccess ? 'Dispatch Success Report' : 'The Line Went Dead'}
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto parchment-sheet rounded-xl p-6 sm:p-8 border-4 border-[#8c6527] shadow-[0_18px_45px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Brass Header Badge */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#b58b45]">
          <div className="flex items-center gap-2">
            <div className="brass-rivet" />
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8c591c] font-bold">
                Level {levelNumber} Dispatch Report
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#2e1708]">
                {isGameComplete
                  ? 'Salvation at Ravenscar Gorge!'
                  : isSuccess
                  ? 'Wire Successfully Transmitted'
                  : 'The Line Went Dead'}
              </h2>
            </div>
          </div>
          <div className="text-xs font-serif font-bold text-[#5c3c16] px-3 py-1 rounded bg-[#ecdcb6] border border-[#a87f3b]">
            {isSuccess ? 'CONFIRMED' : 'LINE LOST'}
          </div>
        </div>

        {/* Failure message if line went dead */}
        {!isSuccess && (
          <div className="p-4 mb-5 rounded-lg bg-red-100 border-2 border-red-800 text-red-950 font-serif text-sm leading-relaxed shadow-inner">
            <p className="font-bold mb-1">The ticker tape ran out before the wire was completed!</p>
            <p className="text-xs text-red-900">
              Down the line, the signal box did not receive the emergency warning in time. Return to the brass key and strike with sharper rhythm!
            </p>
          </div>
        )}

        {/* Victory Celebration for Level 13 finale */}
        {isGameComplete && (
          <div className="p-4 mb-5 rounded-lg bg-[#efe4c2] border-2 border-[#b88c2b] shadow-md text-[#2b1807]">
            <p className="font-serif font-black text-base text-[#805510] mb-1">
              🏆 HERO OF THE 9:15 EXPRESS
            </p>
            <p className="text-xs sm:text-sm font-serif italic leading-relaxed">
              "The points slammed shut! The runaway locomotive hurtled off the main gorge track straight into the safety sand drag buffer, grinding into a mountain of dust! All 300 souls aboard are saved. The Board of Directors presents you with the Golden Telegraph Key of Victoria!"
            </p>
          </div>
        )}

        {/* Mastery Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="flex flex-col items-center p-2 rounded bg-[#f2e7cc] border border-[#bfa264]">
            <span className="text-[10px] uppercase font-bold text-[#734a1a]">Points</span>
            <span className="text-xl font-bold font-serif text-[#291608] tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded bg-[#f2e7cc] border border-[#bfa264]">
            <span className="text-[10px] uppercase font-bold text-[#734a1a]">Accuracy</span>
            <span className="text-xl font-bold font-serif text-[#291608] tabular-nums">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded bg-[#f2e7cc] border border-[#bfa264]">
            <span className="text-[10px] uppercase font-bold text-[#734a1a]">Best Streak</span>
            <span className="text-xl font-bold font-serif text-[#291608] tabular-nums">{bestStreak}</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded bg-[#f2e7cc] border border-[#bfa264]">
            <span className="text-[10px] uppercase font-bold text-[#734a1a]">Cadence</span>
            <span className="text-xl font-bold font-serif text-[#291608] tabular-nums">{wpm} WPM</span>
          </div>
        </div>

        {/* Star Rating (Brass Stars) */}
        {isSuccess && (
          <div className="flex items-center justify-center gap-3 mb-5 py-2 rounded-lg bg-[#efe3be] border border-[#c2a666]">
            <span className="text-xs font-serif uppercase tracking-widest text-[#734a1a] font-bold">
              Operator Distinction:
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${
                    star <= stars
                      ? 'text-[#d4a028] drop-shadow-[0_0_8px_#f5cf53]'
                      : 'text-[#ab976a] opacity-40'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Troublesome Letters Report */}
        {mistakeEntries.length > 0 && (
          <div className="mb-5 p-3 rounded-md bg-[#eee1be] border border-[#b8954f]">
            <span className="text-xs font-serif uppercase tracking-wider text-[#6b451a] font-bold block mb-1">
              Troublesome Signals Recorded:
            </span>
            <div className="flex flex-wrap gap-2">
              {mistakeEntries.map(([letter, count]) => (
                <span
                  key={letter}
                  className="px-2 py-0.5 rounded bg-[#f7efd7] border border-[#c29c54] text-xs font-serif font-bold text-[#8a2214]"
                >
                  '{letter}': {count} {count === 1 ? 'slip' : 'slips'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Station Master Miss Sophia Hartwell's Victorian Critique via Gemini Coach */}
        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-b from-[#2b160b] to-[#1a0c06] text-[#ffea9f] border-2 border-[#b88c2b] shadow-inner flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="flex-shrink-0">
              <SophiaAvatar
                pose={isSuccess ? (accuracy >= 90 ? 'cheering' : 'waving') : 'worried'}
                size="md"
              />
            </div>

            <div className="flex-1 w-full relative parchment-sheet p-3.5 sm:p-4 rounded-xl border border-[#b88c2b] text-[#291708] shadow-md">
              {/* Rivets */}
              <div className="absolute top-1 left-1 brass-rivet" />
              <div className="absolute top-1 right-1 brass-rivet" />

              <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#b88c2b]/40">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] uppercase tracking-widest font-serif font-bold text-[#7a4816]">
                  Miss Sophia Hartwell · Station Master
                </span>
              </div>

              {isLoadingCoach ? (
                <div className="flex items-center gap-2 py-2 text-xs font-serif italic text-[#633a10]">
                  <span className="w-3.5 h-3.5 border-2 border-[#8c591c] border-t-transparent rounded-full animate-spin" />
                  <span>Receiving telegraph critique from Miss Sophia...</span>
                </div>
              ) : stationMasterData ? (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-serif italic text-[#381e0b] leading-relaxed">
                    "{stationMasterData.comment}"
                  </p>
                  <div className="pt-2 border-t border-[#b88c2b]/30 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#6b4216] gap-1 font-serif">
                    <span>
                      <strong>Story update:</strong> {stationMasterData.storyBeat}
                    </span>
                    {stationMasterData.nextMessage && !isGameComplete && (
                      <span className="font-mono text-[10px] bg-[#e4d3a8] px-2 py-0.5 rounded text-amber-950 font-bold border border-[#bfa264]">
                        Next Wire: {stationMasterData.nextMessage}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-serif italic text-[#633a10]">
                  "Signal received down the line! Prepare your key for the next block post dispatch."
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="mt-auto pt-3 border-t-2 border-[#b58b45] flex items-center justify-between gap-3">
          <button
            onClick={onReturnToOffice}
            className="px-4 py-2 rounded-lg bg-[#ebdcb5] border border-[#a87e38] text-[#543615] font-serif font-bold text-xs uppercase hover:bg-[#f2e6c7] cursor-pointer"
          >
            ⌂ Station Office
          </button>

          {!isSuccess ? (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 rounded-lg brass-button font-serif font-bold text-sm uppercase tracking-wider shadow cursor-pointer flex items-center gap-1.5"
            >
              <span>Retry Wire</span>
              <span className="text-base font-sans">↺</span>
            </button>
          ) : isGameComplete ? (
            <button
              onClick={onNextLevel}
              data-start="true"
              className="px-6 py-2.5 rounded-lg brass-button font-serif font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer flex items-center gap-2"
            >
              <span>View Paddington Certificate 🏆</span>
              <span>→</span>
            </button>
          ) : (
            <button
              onClick={onNextLevel}
              data-start="true"
              className="px-6 py-2.5 rounded-lg brass-button font-serif font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer flex items-center gap-2"
            >
              Next Telegram →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
