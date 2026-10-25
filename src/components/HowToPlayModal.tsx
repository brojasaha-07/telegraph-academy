import React from 'react';
import { BookOpen, Sparkles, Volume2, ShieldCheck } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Apprentice Telegraph Manual — How to Play"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto parchment-sheet rounded-xl p-6 sm:p-8 border-4 border-[#8c6527] shadow-[0_18px_45px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Header with Brass Rivets */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#b58b45]">
          <div className="flex items-center gap-2">
            <div className="brass-rivet" />
            <div>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8c591c] font-bold">
                Great Western Railway · Telegraphic Division
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#2e1708] tracking-tight">
                Apprentice Operator's Manual
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full brass-button flex items-center justify-center font-bold text-sm cursor-pointer shadow"
            aria-label="Close Manual"
          >
            ✕
          </button>
        </div>

        {/* Story & Emergency Mission */}
        <div className="p-3 mb-5 rounded-lg bg-[#ede1be] border border-[#b89146] text-xs sm:text-sm font-serif italic text-[#382210] leading-relaxed shadow-sm">
          <strong>The Emergency (1887):</strong> The locomotive throttle on the 9:15 Express is jammed wide open! The runaway train is hurtling down the London-to-Dover line toward a broken trestle bridge at Ravenscar Gorge. You must transmit telegrams down the line to throw the safety switch before disaster strikes.
        </div>

        {/* 4 Simple Steps */}
        <div className="space-y-4 text-xs sm:text-sm font-serif text-[#291708]">
          {/* Step 1: The Brass Key */}
          <div className="p-3.5 rounded-lg bg-[#f5ecce] border border-[#a87d32] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-[#6e461b] uppercase text-xs">
              <span className="w-5 h-5 rounded-full bg-[#3b200b] text-[#ffd875] flex items-center justify-center text-xs">
                1
              </span>
              <span>How to Tap Morse Code</span>
            </div>
            <p className="leading-relaxed mb-2">
              Use your <strong>SPACEBAR</strong> or press the on-screen brass key with your mouse/touch:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 font-mono text-xs">
              <div className="p-2 rounded bg-[#ebe0be] border border-[#b8964e] flex items-center gap-2">
                <span className="text-lg font-bold text-[#8a5b1a]">● DOT</span>
                <span className="text-[11px] text-[#472c11] font-serif">Quick tap (under 0.2 seconds)</span>
              </div>
              <div className="p-2 rounded bg-[#ebe0be] border border-[#b8964e] flex items-center gap-2">
                <span className="text-lg font-bold text-[#8a5b1a]">▬ DASH</span>
                <span className="text-[11px] text-[#472c11] font-serif">Hold down longer (over 0.2 seconds)</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#6b471c] italic">
              <strong>Tip:</strong> Stop pressing for about 0.7 seconds, and your dots & dashes automatically decode into a letter!
            </p>
          </div>

          {/* Step 2: The Race on Top */}
          <div className="p-3.5 rounded-lg bg-[#f5ecce] border border-[#a87d32] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-[#6e461b] uppercase text-xs">
              <span className="w-5 h-5 rounded-full bg-[#3b200b] text-[#ffd875] flex items-center justify-center text-xs">
                2
              </span>
              <span>The Race: Outpace the Runaway Train</span>
            </div>
            <p className="leading-relaxed">
              At the very top of your screen, the <strong>9:15 Express</strong> is steaming along the rails toward danger. Every time you tap a correct letter, your glowing amber telegraph pulse hops forward along the wire poles. 
            </p>
            <p className="mt-1 text-[11px] text-[#6b471c] font-semibold">
              Get your signal to the signal box first to flip the switch track to safety!
            </p>
          </div>

          {/* Step 3: Ticker Tape & Hints */}
          <div className="p-3.5 rounded-lg bg-[#f5ecce] border border-[#a87d32] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-[#6e461b] uppercase text-xs">
              <span className="w-5 h-5 rounded-full bg-[#3b200b] text-[#ffd875] flex items-center justify-center text-xs">
                3
              </span>
              <span>Reading the Ticker Tape & Hints</span>
            </div>
            <p className="leading-relaxed">
              The scrolling paper tape shows the letters you need to transmit. Each card displays the <strong>letter and its Morse code pattern right underneath</strong>.
            </p>
            <p className="mt-1 text-[11px] text-[#6b471c] italic">
              Need help? Click the <strong>Lightbulb Hint icon</strong> in the top toolbar to highlight the active Morse pattern! Press <strong>[C]</strong> anytime to open the full Morse Code Codex.
            </p>
          </div>

          {/* Step 4: The Station Master Coach */}
          <div className="p-3.5 rounded-lg bg-[#f5ecce] border border-[#a87d32] shadow-xs">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-[#6e461b] uppercase text-xs">
              <span className="w-5 h-5 rounded-full bg-[#3b200b] text-[#ffd875] flex items-center justify-center text-xs">
                4
              </span>
              <span>The Station Master (AI Coach)</span>
            </div>
            <p className="leading-relaxed">
              After each level, the kindly Victorian Station Master reviews your speed, accuracy, and streaks. He will encourage your rhythm, give pointers on tricky letters, and write the next exciting dispatch of the runaway story!
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-3 border-t-2 border-[#b58b45] flex items-center justify-between">
          <span className="text-xs text-[#704819] italic font-serif">
            13 Levels · Frequency-based learning · Victorian British 1887
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg brass-button font-serif font-bold text-sm uppercase tracking-wider shadow cursor-pointer"
          >
            Understood, Station Master →
          </button>
        </div>
      </div>
    </div>
  );
};
