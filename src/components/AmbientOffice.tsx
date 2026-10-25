import React from 'react';

export const AmbientOffice: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Gas lamp in upper-right corner */}
      <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(255,190,70,0.28)_0%,rgba(211,84,0,0.1)_45%,transparent_70%)] lamp-glow" />
      <div className="absolute top-4 right-12 flex flex-col items-center opacity-85">
        {/* Lamp bracket and glass chimney */}
        <div className="w-2 h-10 bg-gradient-to-b from-[#5c3a1d] to-[#2b180d]" />
        <div className="w-12 h-4 rounded-t-md bg-gradient-to-r from-[#8c6518] via-[#e5b33d] to-[#8c6518] border-b border-[#3b2507]" />
        <div className="relative w-10 h-16 rounded-b-2xl border border-amber-200/30 bg-gradient-to-b from-amber-100/10 via-amber-300/30 to-amber-500/40 shadow-[0_0_24px_rgba(255,180,40,0.4)] flex items-center justify-center">
          {/* Flickering mantle flame */}
          <div className="w-3 h-8 rounded-full bg-gradient-to-t from-orange-500 via-amber-200 to-white lamp-glow blur-[1px]" />
        </div>
        <div className="w-14 h-3 rounded-b-md bg-gradient-to-r from-[#6e4e13] via-[#b88c29] to-[#6e4e13]" />
      </div>

      {/* Decorative copper steam pipes on the left edge */}
      <div className="absolute top-0 bottom-0 left-6 w-3 bg-gradient-to-r from-[#4d1f00] via-[#c05a1e] to-[#632903] opacity-60 shadow-[2px_0_6px_rgba(0,0,0,0.7)]" />
      <div className="absolute top-0 bottom-0 left-11 w-2 bg-gradient-to-r from-[#381600] via-[#a34a17] to-[#502002] opacity-50" />
      
      {/* Pipe flange fittings */}
      <div className="absolute top-24 left-4 w-7 h-3 rounded-sm bg-gradient-to-b from-[#b8861e] to-[#5c3e06] border border-[#3b2604] opacity-75" />
      <div className="absolute top-64 left-4 w-7 h-3 rounded-sm bg-gradient-to-b from-[#b8861e] to-[#5c3e06] border border-[#3b2604] opacity-75" />
      <div className="absolute bottom-32 left-4 w-7 h-3 rounded-sm bg-gradient-to-b from-[#b8861e] to-[#5c3e06] border border-[#3b2604] opacity-75" />

      {/* Background Interlocking Brass & Copper Gears */}
      <div className="absolute -bottom-16 -left-16 opacity-25">
        <svg
          className="w-64 h-64 gear-spin-cw-slow text-[#c5982e]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25c2 0 3 4 3 6 3 1 5 2 8 3 2-2 5-3 6-1 2 2 1 5-1 6 2 3 3 5 4 8 2 0 6 1 6 3s-4 3-6 3c-1 3-2 5-4 8 2 1 3 4 1 6-1 2-4 1-6-1-3 1-5 2-8 3 0 2-1 6-3 6s-3-4-3-6c-3-1-5-2-8-3-2 2-5 3-6 1-2-2-1-5 1-6-2-3-3-5-4-8-2 0-6-1-6-3s4-3 6-3c1-3 2-5 4-8-2-1-3-4-1-6 1-2 4-1 6 1 3-1 5-2 8-3 0-2 1-6 3-6z" />
          <circle cx="50" cy="50" r="7" fill="#120906" />
        </svg>
      </div>

      <div className="absolute -bottom-8 left-36 opacity-20">
        <svg
          className="w-48 h-48 gear-spin-ccw-slow text-[#b85b1e]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 38a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0-20c2 0 3 3 3 5 2 1 4 2 6 3 2-1 4-2 5 0 1 1 0 4-1 5 2 2 3 4 3 6 2 0 5 1 5 3s-3 3-5 3c0 2-1 4-3 6 1 1 2 4 1 5-1 2-3 1-5 0-2 1-4 2-6 3 0 2-1 5-3 5s-3-3-3-5c-2-1-4-2-6-3-2 1-4 2-5 0-1-1 0-4 1-5-2-2-3-4-3-6-2 0-5-1-5-3s3-3 5-3c0-2 1-4 3-6-1-1-2-4-1-5 1-2 3-1 5 0 2-1 4-2 6-3 0-2 1-5 3-5z" />
          <circle cx="50" cy="50" r="6" fill="#120906" />
        </svg>
      </div>

      <div className="absolute top-1/3 -right-12 opacity-15">
        <svg
          className="w-40 h-40 gear-spin-cw-mid text-[#cf9c27]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25c2 0 3 4 3 6 3 1 5 2 8 3 2-2 5-3 6-1 2 2 1 5-1 6 2 3 3 5 4 8 2 0 6 1 6 3s-4 3-6 3c-1 3-2 5-4 8 2 1 3 4 1 6-1 2-4 1-6-1-3 1-5 2-8 3 0 2-1 6-3 6s-3-4-3-6c-3-1-5-2-8-3-2 2-5 3-6 1-2-2-1-5 1-6-2-3-3-5-4-8-2 0-6-1-6-3s4-3 6-3c1-3 2-5 4-8-2-1-3-4-1-6 1-2 4-1 6 1 3-1 5-2 8-3 0-2 1-6 3-6z" />
          <circle cx="50" cy="50" r="6" fill="#120906" />
        </svg>
      </div>

      {/* Steam wisps rising from lower pipe valve */}
      <div className="absolute bottom-28 left-8 w-24 h-24 rounded-full bg-gradient-to-t from-amber-100/20 to-transparent blur-xl steam-wisp-1" />
      <div className="absolute bottom-32 left-10 w-28 h-28 rounded-full bg-gradient-to-t from-orange-200/15 to-transparent blur-2xl steam-wisp-2" />
      <div className="absolute bottom-20 left-14 w-20 h-20 rounded-full bg-gradient-to-t from-amber-50/15 to-transparent blur-lg steam-wisp-3" />

      {/* Deep vignette around screen edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,5,3,0.85)_100%)]" />
    </div>
  );
};
