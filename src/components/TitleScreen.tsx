import React, { useEffect } from 'react';
import { Volume2, VolumeX, Settings, BookOpen, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  currentLevel: number;
  highestLevelReached: number;
  onStartGame: () => void;
  onOpenLifeline: () => void;
  onOpenSettings: () => void;
  onOpenCodex: () => void;
  onOpenManual: () => void;
  onOpenStationMaster: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentLevel,
  highestLevelReached,
  onStartGame,
  onOpenLifeline,
  onOpenSettings,
  onOpenCodex,
  onOpenManual,
  onOpenStationMaster,
  isMuted,
  onToggleMute,
}) => {
  // Enter or Space starts game from title screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-between min-h-[92vh] max-w-4xl mx-auto px-4 py-6 text-center select-none">
      {/* Top utility row */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title={isMuted ? 'Unmute [M]' : 'Mute [M]'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-900" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onOpenCodex}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg brass-plate text-xs font-serif font-bold text-[#241306] hover:scale-105 transition-transform cursor-pointer shadow"
            aria-label="Open Morse Codex [C]"
            title="Codex [C]"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Codex [C]</span>
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
          aria-label="Apparatus Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Title Centerpiece */}
      <div className="flex flex-col items-center my-auto py-6">
        {/* Crest & Crown Insignia */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-[#ffd875]" />
          <div className="flex items-center gap-1 text-[#ffd875] text-xs font-serif tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-[#f5cf53]" />
            <span>Great Western Railway Telegraphic Service</span>
            <Sparkles className="w-4 h-4 text-[#f5cf53]" />
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-[#ffd875]" />
        </div>

        {/* Large Engraved Brass Plaque */}
        <div className="relative px-8 sm:px-14 py-6 sm:py-8 rounded-2xl brass-plate border-2 border-[#fff3b8] shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-xl mx-auto">
          {/* Authentic Corner Rivets */}
          <div className="absolute top-2.5 left-2.5 brass-rivet" />
          <div className="absolute top-2.5 right-2.5 brass-rivet" />
          <div className="absolute bottom-2.5 left-2.5 brass-rivet" />
          <div className="absolute bottom-2.5 right-2.5 brass-rivet" />

          {/* Sub-plate: Est. 1887 */}
          <div className="inline-block px-4 py-0.5 rounded-sm bg-[#1f1106] text-[#ffea9f] font-serif text-xs uppercase tracking-widest border border-[#7a550d] mb-2 shadow-inner">
            Est. 1887 · Victoria Era
          </div>

          <h1
            className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-[#1c0f04] uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Telegraph
            <span className="block text-3xl sm:text-5xl text-[#3b2108] tracking-wider mt-1">
              Academy
            </span>
          </h1>

          <div className="w-3/4 h-1 mx-auto my-3 bg-gradient-to-r from-transparent via-[#5c3e0e] to-transparent" />

          <p className="text-sm sm:text-base font-serif italic text-[#2c1706] font-medium leading-relaxed max-w-md mx-auto">
            "Learn the language of the wire. Save the 9:15 Express."
          </p>
        </div>

        {/* Action Menu Plaques */}
        <div className="flex flex-wrap items-center gap-3 mt-8 w-full max-w-xl justify-center">
          <button
            onClick={onStartGame}
            data-start="true"
            className="w-full sm:w-auto px-6 py-3 rounded-xl brass-button font-serif font-black text-sm sm:text-base uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>
              {highestLevelReached > 1
                ? `Continue — Level ${currentLevel}`
                : 'Begin Apprenticeship'}
            </span>
            <span className="text-lg">→</span>
          </button>

          <button
            onClick={onOpenStationMaster}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-b from-[#3b2010] to-[#1c0e06] border-2 border-[#d4af37] text-[#ffd875] hover:text-[#fff5cf] hover:border-[#ffeaa7] font-serif font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
            aria-label="Meet Station Master Miss Sophia Hartwell"
          >
            <span>👩‍✈️ Meet Sophia</span>
          </button>

          <button
            onClick={onOpenManual}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-b from-[#2e190d] to-[#1a0c06] border-2 border-[#b88c2b] text-[#ffd875] hover:text-[#fff5cf] hover:border-[#ffd875] font-serif font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            aria-label="Open How to Play Manual"
          >
            <span>📖 Manual</span>
          </button>

          <button
            onClick={onOpenLifeline}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-b from-[#24130a] to-[#120803] border-2 border-[#80551e] text-[#e0b865] hover:text-[#ffd875] hover:border-[#ffd875] font-serif font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            Lifeline Mode
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 text-xs font-serif text-[#caa758]/70 tracking-widest uppercase">
          Press [ENTER] or [SPACE] to Begin · [C] for Morse Codex
        </div>
      </div>

      {/* Atmospheric Footer Dispatch */}
      <div className="w-full border-t border-[#543516]/60 pt-3 text-[11px] font-serif text-[#9c7530] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>G.W.R. District Telegraphy Division · London to Dover Line</span>
        <span>A Victorian Morse Code Simulation & Emergency Dispatch</span>
      </div>
    </div>
  );
};
