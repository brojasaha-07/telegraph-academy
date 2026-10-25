import React from 'react';

interface GaugesProps {
  score: number;
  streak: number;
  accuracy: number; // 0 to 100
  wpm: number;      // 0 to 40+
}

export const Gauges: React.FC<GaugesProps> = ({ score, streak, accuracy, wpm }) => {
  // Multiplier based on streak
  const multiplier = streak >= 10 ? 3 : streak >= 5 ? 2 : 1;

  // Format 5-digit score for odometer
  const scoreStr = Math.min(99999, Math.max(0, score)).toString().padStart(5, '0');

  // Needle angle calculations:
  // Accuracy: 0% -> -110 deg, 100% -> +110 deg (220 deg range)
  const accuracyAngle = -110 + (Math.max(0, Math.min(100, accuracy)) / 100) * 220;

  // WPM: 0 WPM -> -110 deg, 40 WPM -> +110 deg
  const wpmClamped = Math.max(0, Math.min(40, wpm));
  const wpmAngle = -110 + (wpmClamped / 40) * 220;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-center">
        {/* 1. ODOMETER SCORE GAUGE */}
        <div className="flex flex-col items-center p-2 rounded-lg brass-plate relative shadow-md">
          <div className="absolute top-1 left-1 brass-rivet" />
          <div className="absolute top-1 right-1 brass-rivet" />
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-[#241306] font-bold">
            Score
          </span>
          <div className="flex gap-1 mt-1 px-2 py-1 bg-[#140b06] border border-[#7a550d] rounded shadow-inner">
            {scoreStr.split('').map((digit, i) => (
              <div
                key={i}
                className="w-4 sm:w-5 h-6 sm:h-7 bg-[#211208] border border-[#523807] rounded-sm flex items-center justify-center text-sm sm:text-base font-bold text-[#ffd875] font-serif tabular-nums shadow-sm"
              >
                {digit}
              </div>
            ))}
          </div>
          <span className="text-[9px] text-[#4a3205] mt-0.5 tracking-wider font-semibold">
            TELEGRAPH POINTS
          </span>
        </div>

        {/* 2. STREAK GAUGE */}
        <div className="flex flex-col items-center p-2 rounded-lg brass-plate relative shadow-md">
          <div className="absolute top-1 left-1 brass-rivet" />
          <div className="absolute top-1 right-1 brass-rivet" />
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-[#241306] font-bold">
            Streak
          </span>
          <div className="flex items-center gap-1.5 mt-1 px-3 py-1 bg-[#140b06] border border-[#7a550d] rounded shadow-inner">
            <span className="text-base sm:text-lg font-bold text-[#ffe680] tabular-nums font-serif">
              {streak}
            </span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded font-black tracking-wider ${
                multiplier === 3
                  ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                  : multiplier === 2
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-[#3b230b] text-amber-200/80'
              }`}
            >
              ×{multiplier}
            </span>
          </div>
          <span className="text-[9px] text-[#4a3205] mt-0.5 tracking-wider font-semibold">
            {multiplier > 1 ? 'CADENCE BONUS' : 'CONSECUTIVE'}
          </span>
        </div>

        {/* 3. ACCURACY NEEDLE DIAL */}
        <div className="flex flex-col items-center p-2 rounded-lg brass-plate relative shadow-md">
          <div className="absolute top-1 left-1 brass-rivet" />
          <div className="absolute top-1 right-1 brass-rivet" />
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-[#241306] font-bold">
            Accuracy
          </span>
          <div className="relative w-16 sm:w-20 h-14 sm:h-16 flex items-center justify-center my-0.5">
            {/* Circular Dial Face */}
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <radialGradient id="dialFace" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#faf2db" />
                  <stop offset="80%" stopColor="#e4d4a9" />
                  <stop offset="100%" stopColor="#bfa86b" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#dialFace)" stroke="#523908" strokeWidth="2.5" />
              {/* Dial tick marks */}
              <path
                d="M 18 50 A 32 32 0 1 1 82 50"
                fill="none"
                stroke="#47300c"
                strokeWidth="1.5"
                strokeDasharray="2, 5"
              />
              <text x="22" y="54" fontSize="8" fill="#47300c" fontFamily="serif">0</text>
              <text x="45" y="26" fontSize="8" fill="#47300c" fontFamily="serif">50</text>
              <text x="70" y="54" fontSize="8" fill="#47300c" fontFamily="serif">100</text>

              {/* Pivot center brass screw */}
              <circle cx="50" cy="50" r="5" fill="#c49727" stroke="#4a3508" strokeWidth="1" />

              {/* Animated Needle */}
              <g
                style={{
                  transformOrigin: '50px 50px',
                  transform: `rotate(${accuracyAngle}deg)`,
                  transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
                }}
              >
                <polygon points="48,50 52,50 50.5,18 49.5,18" fill="#8b0000" />
                <polygon points="49.5,18 50.5,18 50,14" fill="#c0392b" />
              </g>
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#1f1105] tabular-nums font-serif">
            {accuracy}%
          </span>
        </div>

        {/* 4. SPEED (WPM) NEEDLE DIAL */}
        <div className="flex flex-col items-center p-2 rounded-lg brass-plate relative shadow-md">
          <div className="absolute top-1 left-1 brass-rivet" />
          <div className="absolute top-1 right-1 brass-rivet" />
          <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-[#241306] font-bold">
            Cadence
          </span>
          <div className="relative w-16 sm:w-20 h-14 sm:h-16 flex items-center justify-center my-0.5">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <radialGradient id="dialFaceWpm" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#faf2db" />
                  <stop offset="80%" stopColor="#e4d4a9" />
                  <stop offset="100%" stopColor="#bfa86b" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#dialFaceWpm)" stroke="#523908" strokeWidth="2.5" />
              <path
                d="M 18 50 A 32 32 0 1 1 82 50"
                fill="none"
                stroke="#47300c"
                strokeWidth="1.5"
                strokeDasharray="2, 5"
              />
              <text x="22" y="54" fontSize="8" fill="#47300c" fontFamily="serif">0</text>
              <text x="45" y="26" fontSize="8" fill="#47300c" fontFamily="serif">20</text>
              <text x="70" y="54" fontSize="8" fill="#47300c" fontFamily="serif">40</text>

              {/* Pivot center brass screw */}
              <circle cx="50" cy="50" r="5" fill="#c49727" stroke="#4a3508" strokeWidth="1" />

              {/* Animated Needle */}
              <g
                style={{
                  transformOrigin: '50px 50px',
                  transform: `rotate(${wpmAngle}deg)`,
                  transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
                }}
              >
                <polygon points="48,50 52,50 50.5,18 49.5,18" fill="#1b2a47" />
                <polygon points="49.5,18 50.5,18 50,14" fill="#2980b9" />
              </g>
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#1f1105] tabular-nums font-serif">
            {wpm} WPM
          </span>
        </div>
      </div>
    </div>
  );
};
