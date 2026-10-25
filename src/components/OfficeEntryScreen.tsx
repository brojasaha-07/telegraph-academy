import React, { useEffect } from 'react';
import { Sparkles, Volume2 } from 'lucide-react';

interface OfficeEntryScreenProps {
  onEnter: () => void;
  reducedMotion?: boolean;
}

export const OfficeEntryScreen: React.FC<OfficeEntryScreenProps> = ({
  onEnter,
  reducedMotion = false,
}) => {
  // Enter or Space key triggers entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-between min-h-[92vh] max-w-4xl mx-auto px-4 py-8 text-center select-none">
      {/* Top Insignia */}
      <div className="w-full flex items-center justify-center pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-transparent to-[#ffd875]" />
          <div className="flex items-center gap-1.5 text-[#ffd875] text-xs font-serif tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-[#f5cf53]" />
            <span>Great Western Railway Telegraphic Service</span>
            <Sparkles className="w-4 h-4 text-[#f5cf53]" />
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-l from-transparent to-[#ffd875]" />
        </div>
      </div>

      {/* Main Centerpiece Brass Plaque */}
      <div className="flex flex-col items-center my-auto py-4 w-full max-w-lg">
        <div className="relative w-full px-6 sm:px-12 py-8 sm:py-10 rounded-2xl brass-plate border-2 border-[#fff3b8] shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center">
          {/* Authentic Corner Rivets */}
          <div className="absolute top-2.5 left-2.5 brass-rivet" />
          <div className="absolute top-2.5 right-2.5 brass-rivet" />
          <div className="absolute bottom-2.5 left-2.5 brass-rivet" />
          <div className="absolute bottom-2.5 right-2.5 brass-rivet" />

          {/* Sub-plate */}
          <div className="inline-block px-4 py-0.5 rounded-sm bg-[#1f1106] text-[#ffea9f] font-serif text-xs uppercase tracking-widest border border-[#7a550d] mb-3 shadow-inner">
            London & Dover Line · Est. 1887
          </div>

          <h1
            className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#1c0f04] uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Telegraph
            <span className="block text-2xl sm:text-4xl text-[#3b2108] tracking-wider mt-1">
              Academy
            </span>
          </h1>

          <div className="w-3/4 h-1 mx-auto my-4 bg-gradient-to-r from-transparent via-[#5c3e0e] to-transparent" />

          <p className="text-xs sm:text-sm font-serif italic text-[#2e1708] font-medium leading-relaxed max-w-sm mx-auto mb-6">
            "Learn the language of the wire. Save the runaway 9:15 Express."
          </p>

          {/* Large Brass Plaque Action Button */}
          <button
            onClick={onEnter}
            autoFocus
            data-start="true"
            className="w-full py-4 px-6 rounded-xl brass-button font-serif font-black text-sm sm:text-base uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 border-2 border-[#fff7cc]"
            aria-label="Enter the Telegraph Office"
          >
            <span>ENTER THE TELEGRAPH OFFICE</span>
            <span className="text-lg">→</span>
          </button>

          {/* Sound on hint */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-serif text-[#3b2108] font-bold">
            <Volume2 className="w-4 h-4 text-[#734716]" />
            <span>Sound on 🔊</span>
            <span className="text-[#6d441c] font-normal italic">
              · Press [ENTER] or [SPACE]
            </span>
          </div>
        </div>
      </div>

      {/* Atmospheric Footer Notice */}
      <div className="w-full border-t border-[#543516]/60 pt-3 text-[11px] font-serif text-[#9c7530] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>G.W.R. District Telegraphy Division · London to Dover Line</span>
        <span>Victorian Morse Code Office & Sound Transmission</span>
      </div>
    </div>
  );
};
