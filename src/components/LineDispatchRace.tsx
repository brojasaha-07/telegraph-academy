import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GAME_LEVELS } from '../game/morse';
import { telegraphAudio } from '../audio/telegraphAudio';

interface LineDispatchRaceProps {
  currentLevel: number;
  totalLetters: number;
  completedLetters: number;
  timeRemainingRatio: number; // 1 down to 0
  isPaused: boolean;
  mistakesCount: number;
  onTrainWon?: () => void;
  onPulseWon?: () => void;
  reducedMotion?: boolean;
}

export const LineDispatchRace: React.FC<LineDispatchRaceProps> = ({
  currentLevel,
  totalLetters,
  completedLetters,
  timeRemainingRatio,
  isPaused,
  mistakesCount,
  reducedMotion = false,
}) => {
  const currentConfig = GAME_LEVELS.find((l) => l.level === currentLevel) || GAME_LEVELS[0];
  const nextConfig = GAME_LEVELS.find((l) => l.level === currentLevel + 1);
  const nextStationName = nextConfig ? nextConfig.stationName : 'Ravenscar Gorge';

  // Number of poles based on telegram characters (at least 6, up to 14)
  const totalPoles = useMemo(() => Math.max(6, Math.min(14, totalLetters)), [totalLetters]);
  const activePoleIndex = Math.min(totalPoles, completedLetters);

  // Train progress: 0 (start at left) to 1 (reaches gorge)
  // Faster, more urgent progression: baseline speed is slightly higher and mistakes add palpable pressure
  const mistakePenalty = Math.min(0.25, mistakesCount * 0.04);
  const trainProgress = Math.min(1, Math.max(0, (1 - timeRemainingRatio) * 1.05 + mistakePenalty));

  // Pulse progress: 0 to 1 based on completed letters
  const pulseProgress = totalLetters > 0 ? Math.min(1, completedLetters / totalLetters) : 0;

  // Tension stage: train is >= 70%
  const isTension = trainProgress >= 0.70;
  const [isWhistling, setIsWhistling] = useState(false);
  const whistlePlayedRef = useRef(false);

  // Periodic warning whistles when tension is high or every 7s
  useEffect(() => {
    if (isPaused) return;

    if (isTension && !whistlePlayedRef.current) {
      whistlePlayedRef.current = true;
      setIsWhistling(true);
      telegraphAudio.playTrainWhistle();
      const t = setTimeout(() => setIsWhistling(false), 900);
      return () => clearTimeout(t);
    } else if (!isTension) {
      whistlePlayedRef.current = false;
    }
  }, [isTension, isPaused]);

  // Periodic train whistle during high speed run
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    const interval = setInterval(() => {
      if (trainProgress >= 0.5 && Math.random() > 0.4) {
        setIsWhistling(true);
        telegraphAudio.playTrainWhistle();
        setTimeout(() => setIsWhistling(false), 850);
      }
    }, 7500);

    return () => clearInterval(interval);
  }, [isPaused, trainProgress, reducedMotion]);

  // Procedural train chuff loop (faster cadence)
  const lastChuffTimeRef = useRef(0);
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    let animId: number;
    const loop = (timestamp: number) => {
      // Faster chuff tempo scaling with train urgency
      const speedFactor = 1.3 + trainProgress * 0.9;
      const interval = Math.max(120, 320 / speedFactor);

      if (timestamp - lastChuffTimeRef.current >= interval) {
        lastChuffTimeRef.current = timestamp;
        telegraphAudio.playTrainChuff(0.22 + trainProgress * 0.18);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, trainProgress, reducedMotion]);

  // Wheel rotation angle and mechanical suspension bounce
  const [wheelAngle, setWheelAngle] = useState(0);
  const [trainBounceY, setTrainBounceY] = useState(0);
  const wheelAngleRef = useRef(0);

  useEffect(() => {
    if (isPaused || reducedMotion) return;
    let animId: number;
    let lastTime = performance.now();
    let lastStateTime = 0;

    const updateMotion = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Higher rotation speed scaling with train progress
      const rotationSpeed = 360 + trainProgress * 420; // deg/sec
      wheelAngleRef.current = (wheelAngleRef.current + rotationSpeed * dt) % 360;

      // Throttle state update to ~30-60fps
      if (now - lastStateTime >= 24) {
        lastStateTime = now;
        setWheelAngle(wheelAngleRef.current);

        // Mechanical suspension bounce (chuff recoil + track joint clickety-clack)
        const suspension = Math.sin((wheelAngleRef.current * Math.PI) / 45) * 1.8;
        // Extra vigorous bounce/shake when whistling or in tension
        const whistleShake = isWhistling ? Math.sin(now * 0.05) * 3.5 : 0;
        setTrainBounceY(suspension + whistleShake);
      }

      animId = requestAnimationFrame(updateMotion);
    };
    animId = requestAnimationFrame(updateMotion);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, trainProgress, reducedMotion, isWhistling]);

  // Compute positions across the 1000-unit SVG viewBox
  const trackStartX = 50;
  const trackEndX = 920;
  const trackLength = trackEndX - trackStartX;

  // Train horizontal position: full consist (~400px wide from Car 3 tail to Loco front buffer)
  // At trainProgress = 0: translate is 20 (locomotive front at x=422, tail at x=20 on rail)
  // At trainProgress = 1: translate is 480 (locomotive front reaches switch/gorge at x=882)
  const trainTranslateX = 20 + trainProgress * 460;

  // Pulse coordinate on catenary wire
  const poleSpacing = (trackLength - 80) / (totalPoles - 1);
  const currentPulseX = trackStartX + 30 + pulseProgress * (trackLength - 80);
  const pulseY = 56 + Math.sin((pulseProgress * totalPoles * Math.PI) % Math.PI) * 7;

  // Mile marker countdown (10.0 down to 0.0 miles)
  const milesToSwitch = Math.max(0, (10 * (1 - trainProgress))).toFixed(1);

  // Switch status: true if pulse arrived first (pulseProgress >= 1)
  const isSwitchThrown = pulseProgress >= 1;

  return (
    <section
      aria-label={`Line Dispatch Race: ${currentConfig.stationName} to ${nextStationName}`}
      className="w-full max-w-4xl mx-auto px-2 py-1 select-none"
    >
      <div className="relative rounded-xl brass-plate p-2 sm:p-2.5 border-2 border-[#fff2b3] shadow-[0_8px_20px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Brass Corner Rivets */}
        <div className="absolute top-1.5 left-1.5 brass-rivet" />
        <div className="absolute top-1.5 right-1.5 brass-rivet" />
        <div className="absolute bottom-1.5 left-1.5 brass-rivet" />
        <div className="absolute bottom-1.5 right-1.5 brass-rivet" />

        {/* Panel Header: Line Dispatch Station Arc */}
        <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-[#734c14]/40 text-xs font-serif">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-[#422507] transition-colors ${
                isTension
                  ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                  : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
              }`}
            />
            <span className="font-bold tracking-widest text-[#241306] uppercase text-[11px] sm:text-xs">
              LINE DISPATCH · {currentConfig.stationName.toUpperCase()} → {nextStationName.toUpperCase()}
            </span>
          </div>

          {/* Miles to switch odometer badge & whistle alert */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-[#381f08]">
            {isWhistling && (
              <span className="px-1.5 py-0.5 rounded bg-red-900 text-yellow-300 font-serif uppercase tracking-wider animate-bounce border border-yellow-500 text-[9px]">
                WHISTLE BLOWING!
              </span>
            )}
            <span className="text-[#694212] tracking-wider uppercase hidden sm:inline">Distance to Points:</span>
            <span className="px-2 py-0.5 rounded bg-[#170c06] text-[#ffd875] font-serif tabular-nums border border-[#6b4716]">
              {milesToSwitch} MILES
            </span>
          </div>
        </div>

        {/* Main Mechanical Track Stage (SVG with increased height and larger train) */}
        <div className="relative w-full h-28 sm:h-38 bg-gradient-to-b from-[#211107] via-[#2d180b] to-[#140a04] rounded-lg border-2 border-[#5c3c1a] overflow-hidden shadow-inner">
          <svg
            viewBox="0 0 1000 170"
            className={`w-full h-full overflow-hidden ${isTension && !reducedMotion ? 'animate-[pulse_1.2s_infinite]' : ''}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Victorian Sepia Sky gradient */}
              <linearGradient id="sepiaSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2c170c" />
                <stop offset="50%" stopColor="#452714" />
                <stop offset="100%" stopColor="#693c1d" />
              </linearGradient>

              {/* Steel Rails Gradient */}
              <linearGradient id="steelRail" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="40%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Locomotive Boiler (GWR Brunswick Green) */}
              <linearGradient id="locoBoiler" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a7c47" />
                <stop offset="35%" stopColor="#244a22" />
                <stop offset="85%" stopColor="#122911" />
                <stop offset="100%" stopColor="#081408" />
              </linearGradient>

              {/* GWR Coach Mahogany Teak */}
              <linearGradient id="coachWood" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6b301a" />
                <stop offset="50%" stopColor="#421b0d" />
                <stop offset="100%" stopColor="#260f06" />
              </linearGradient>

              {/* GWR Coach Cream Clerestory Roof */}
              <linearGradient id="coachRoof" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="60%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              {/* Brass Bands & Trimmings */}
              <linearGradient id="brassTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff3b8" />
                <stop offset="50%" stopColor="#d4a329" />
                <stop offset="100%" stopColor="#875e0e" />
              </linearGradient>

              {/* Electric Pulse Glow */}
              <radialGradient id="sparkPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#ffea75" />
                <stop offset="80%" stopColor="#ff8c00" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Background Layer 1: Sepia Sky */}
            <rect x="0" y="0" width="1000" height="170" fill="url(#sepiaSky)" />

            {/* Background Layer 2: Distant Hills & Viaduct Silhouette */}
            <path
              d="M 0 100 Q 120 75 240 92 T 480 86 T 720 90 T 1000 84 L 1000 170 L 0 170 Z"
              fill="#26140a"
              opacity="0.65"
            />
            {/* Distant Viaduct Arches */}
            <g fill="#1f1007" opacity="0.5">
              <rect x="660" y="90" width="240" height="28" />
              <circle cx="690" cy="106" r="14" fill="#2c170c" />
              <circle cx="730" cy="106" r="14" fill="#2c170c" />
              <circle cx="770" cy="106" r="14" fill="#2c170c" />
              <circle cx="810" cy="106" r="14" fill="#2c170c" />
              <circle cx="850" cy="106" r="14" fill="#2c170c" />
              <circle cx="890" cy="106" r="14" fill="#2c170c" />
            </g>

            {/* TELEGRAPH POLES, CATENARY WIRES & INSULATORS */}
            {/* Catenary Wire Stringing between poles */}
            {Array.from({ length: totalPoles - 1 }).map((_, i) => {
              const x1 = trackStartX + 30 + i * poleSpacing;
              const x2 = trackStartX + 30 + (i + 1) * poleSpacing;
              const midX = (x1 + x2) / 2;
              const isEnergized = i < activePoleIndex;
              return (
                <path
                  key={`wire-${i}`}
                  d={`M ${x1} 54 Q ${midX} 65 ${x2} 54`}
                  fill="none"
                  stroke={isEnergized ? '#ffd875' : '#734e26'}
                  strokeWidth={isEnergized ? '2.2' : '1.2'}
                  filter={isEnergized ? 'drop-shadow(0 0 4px #f59e0b)' : undefined}
                />
              );
            })}

            {/* Telegraph Poles */}
            {Array.from({ length: totalPoles }).map((_, i) => {
              const poleX = trackStartX + 30 + i * poleSpacing;
              const isReached = i <= activePoleIndex;
              return (
                <g key={`pole-${i}`}>
                  {/* Timber pole */}
                  <line x1={poleX} y1={50} x2={poleX} y2={132} stroke="#4a2c13" strokeWidth="3" />
                  {/* Crossarm */}
                  <line x1={poleX - 7} y1={54} x2={poleX + 7} y2={54} stroke="#3b210c" strokeWidth="2.5" />
                  {/* Ceramic Insulator cap */}
                  <circle
                    cx={poleX}
                    cy={53}
                    r={3.2}
                    fill={isReached ? '#ffe680' : '#8a9ba8'}
                    stroke="#2e1a0b"
                    strokeWidth="0.8"
                  />
                  {isReached && (
                    <circle cx={poleX} cy={53} r={7} fill="#f59e0b" opacity="0.4" />
                  )}
                </g>
              );
            })}

            {/* GLOWING AMBER TELEGRAPH PULSE SPARK */}
            <g transform={`translate(${currentPulseX}, ${pulseY})`}>
              <circle cx="0" cy="0" r="11" fill="url(#sparkPulse)" />
              <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
              {!reducedMotion && (
                <>
                  <circle cx="-8" cy="1" r="3" fill="#f59e0b" opacity="0.75" />
                  <circle cx="-16" cy="2" r="1.8" fill="#d97706" opacity="0.5" />
                </>
              )}
            </g>

            {/* TRACKWORK (BALLAST, SLEEPERS & RAILS) */}
            {/* Gravel Ballast Bed */}
            <polygon
              points="30,144 950,144 960,158 20,158"
              fill="#26170d"
              stroke="#1a0f08"
              strokeWidth="1"
            />

            {/* Wooden Sleepers */}
            {Array.from({ length: 50 }).map((_, i) => {
              const x = 35 + i * 18.5;
              return (
                <rect
                  key={`sleeper-${i}`}
                  x={x}
                  y={142}
                  width="7.5"
                  height="13"
                  fill="#382012"
                  stroke="#1c0f07"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Steel Running Rails with Specular Top Highlight */}
            <rect x="25" y="140" width="895" height="4" fill="url(#steelRail)" />
            <rect x="25" y="150" width="895" height="2.5" fill="#525d6b" opacity="0.6" />

            {/* SWITCH POINTS & DIVERGING SIDING (FAR RIGHT) */}
            <path
              d="M 810 140 Q 860 140 895 125 T 950 114"
              fill="none"
              stroke={isSwitchThrown ? 'url(#steelRail)' : '#422815'}
              strokeWidth="4"
              strokeDasharray={isSwitchThrown ? undefined : '3,3'}
            />
            {/* Siding Sand Drag Buffer Stop */}
            <g transform="translate(940, 102)">
              <rect x="0" y="8" width="18" height="15" rx="2" fill="#bfa369" stroke="#634f26" />
              <rect x="5" y="0" width="8" height="23" fill="#a88544" />
              <text x="9" y="32" fontSize="7" fill="#f5eed6" fontFamily="serif" textAnchor="middle" fontWeight="bold">
                SAFE
              </text>
            </g>

            {/* HAZARD: Broken Trestle Bridge Chasm (Straight Ahead x=905) */}
            <g transform="translate(905, 138)">
              <line x1="0" y1="0" x2="30" y2="0" stroke="#7a341b" strokeWidth="4.5" />
              <path d="M 30 0 L 26 12 L 32 18 L 24 32" stroke="#4d1f0d" strokeWidth="3" />
              <path d="M 22 22 L 40 45 L 50 70" stroke="#120803" strokeWidth="8" />
              {/* Warning Lantern */}
              <circle
                cx="18"
                cy="-12"
                r="5"
                fill={isTension ? '#ef4444' : '#f59e0b'}
                className={isTension ? 'animate-ping' : ''}
              />
              <circle cx="18" cy="-12" r="2.8" fill="#ffffff" />
            </g>

            {/* SIGNAL BOX & GROUND SWITCH LEVER (x=825) */}
            <g transform="translate(820, 80)">
              <polygon points="16,20 48,20 54,58 10,58" fill="#5c2616" stroke="#2e120a" strokeWidth="1" />
              <polygon points="5,20 59,20 32,5" fill="#2d3748" stroke="#1a202c" strokeWidth="1" />
              <rect x="20" y="25" width="24" height="12" fill="#fef08a" stroke="#451a03" strokeWidth="1" />
              <line x1="32" y1="25" x2="32" y2="37" stroke="#451a03" />

              {/* Lever Frame */}
              <rect x="37" y="56" width="7" height="9" fill="#1c1917" />
              <line
                x1="40"
                y1="60"
                x2={isSwitchThrown ? '54' : '26'}
                y2="46"
                stroke="url(#brassTrim)"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <circle
                cx={isSwitchThrown ? 54 : 26}
                cy="46"
                r="4"
                fill={isSwitchThrown ? '#22c55e' : '#ef4444'}
                stroke="#1c1917"
                strokeWidth="1"
              />
            </g>

            {/* =========================================================================
                THE 9:15 EXPRESS RUNAWAY TRAIN CONSIST
                (Locomotive + Tender + 3 Distinct Victorian Cars: 1st Class, 2nd Class, Brake Van)
                Now bigger, richer, with dynamic mechanical whistle bounce & steam plumes!
               ========================================================================= */}
            <g
              transform={`translate(${trainTranslateX}, ${isSwitchThrown ? 134 : 136 + trainBounceY})`}
              className="transition-transform duration-200 ease-linear"
            >
              {/* CHIMNEY BILLOWING STEAM PUFFS (High speed puffs) */}
              {!reducedMotion && !isPaused && (
                <g transform="translate(326, -34)">
                  {/* Billowing particle stream expanding and drifting left */}
                  <circle cx="-16" cy="-8" r="8" fill="#f8fafc" opacity="0.6" className="animate-ping" />
                  <circle cx="-36" cy="-18" r="13" fill="#e2e8f0" opacity="0.45" />
                  <circle cx="-62" cy="-28" r="18" fill="#cbd5e1" opacity="0.3" />
                  <circle cx="-95" cy="-38" r="23" fill="#94a3b8" opacity="0.18" />
                </g>
              )}

              {/* WHISTLE STEAM JET (Erupts upward from cab roof when whistling) */}
              {isWhistling && (
                <g transform="translate(290, -38)">
                  <path
                    d="M 0 0 L -8 -16 L -4 -22 L 2 -14 Z"
                    fill="#ffffff"
                    opacity="0.85"
                    className="animate-pulse"
                  />
                  <circle cx="-6" cy="-20" r="5" fill="#f8fafc" opacity="0.7" />
                  <circle cx="-12" cy="-30" r="8" fill="#e2e8f0" opacity="0.4" />
                </g>
              )}

              {/* -----------------------------------------------------------------
                  CAR 3: GWR ROYAL MAIL & GUARD'S BRAKE VAN (Rearmost car)
                  Features: Guard's ducket lookout cupola, glowing red tail marker lamp,
                  planked teak body, dual-axle bogies.
                 ----------------------------------------------------------------- */}
              <g transform={`translate(0, ${-24 + Math.sin((wheelAngle + 120) * Math.PI / 90) * 1.2})`}>
                {/* Main teak wooden body */}
                <rect x="0" y="0" width="70" height="24" rx="2" fill="url(#coachWood)" stroke="#170903" strokeWidth="1" />
                {/* Roof */}
                <rect x="2" y="-3" width="66" height="4" fill="#2d3748" rx="1" />
                {/* Raised Guard's Cupola / Lookout Ducket */}
                <polygon points="24,-3 46,-3 44,-9 26,-9" fill="#1c1917" stroke="#090d16" strokeWidth="0.8" />
                <rect x="28" y="-8" width="14" height="4" fill="#fef08a" opacity="0.85" />
                {/* Mail sorting sliding door & brass handle */}
                <rect x="18" y="3" width="16" height="17" fill="#36170b" stroke="#78350f" strokeWidth="0.8" />
                <line x1="26" y1="3" x2="26" y2="20" stroke="#78350f" />
                <circle cx="31" cy="12" r="1.2" fill="url(#brassTrim)" />
                {/* Small window */}
                <rect x="46" y="5" width="10" height="10" fill="#fef08a" opacity="0.8" rx="1" />
                {/* Rear Red Tail Lamp (Crucial Victorian Train Marker!) */}
                <circle cx="-2" cy="10" r="3.5" fill="#ef4444" className="animate-pulse shadow-[0_0_8px_#ef4444]" />
                <circle cx="-2" cy="10" r="1.8" fill="#ffffff" />
                {/* Bogie Wheels */}
                <circle cx="16" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="54" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
              </g>

              {/* Coupling link */}
              <line x1="70" y1="-12" x2="78" y2="-12" stroke="#1c1917" strokeWidth="3" />

              {/* -----------------------------------------------------------------
                  CAR 2: 2ND CLASS PASSENGER COACH (Middle car)
                  Features: Teak panelling, clerestory roof, 5 illuminated compartment windows,
                  passenger silhouettes.
                 ----------------------------------------------------------------- */}
              <g transform={`translate(78, ${-24 + Math.sin((wheelAngle + 60) * Math.PI / 90) * 1.2})`}>
                {/* Coach Body */}
                <rect x="0" y="0" width="76" height="24" rx="2" fill="url(#coachWood)" stroke="#170903" strokeWidth="1" />
                {/* Clerestory Raised Roof */}
                <rect x="0" y="-3.5" width="76" height="4" fill="url(#coachRoof)" />
                <rect x="10" y="-6.5" width="56" height="3.5" fill="#1e293b" />
                {/* 5 Illuminated Compartment Windows */}
                <rect x="5" y="4" width="10" height="10" fill="#fef08a" opacity="0.9" rx="1" />
                <rect x="19" y="4" width="10" height="10" fill="#fef08a" opacity="0.9" rx="1" />
                <rect x="33" y="4" width="10" height="10" fill="#fef08a" opacity="0.9" rx="1" />
                <rect x="47" y="4" width="10" height="10" fill="#fef08a" opacity="0.9" rx="1" />
                <rect x="61" y="4" width="10" height="10" fill="#fef08a" opacity="0.9" rx="1" />
                {/* Victorian Passenger Silhouette Heads */}
                <circle cx="10" cy="9" r="2.2" fill="#422006" />
                <circle cx="38" cy="9" r="2.2" fill="#422006" />
                <circle cx="66" cy="9" r="2.2" fill="#422006" />
                {/* GWR Gold Monogram Line */}
                <line x1="4" y1="18" x2="72" y2="18" stroke="url(#brassTrim)" strokeWidth="0.8" />
                {/* Bogie Wheels */}
                <circle cx="18" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="58" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
              </g>

              {/* Coupling link */}
              <line x1="154" y1="-12" x2="162" y2="-12" stroke="#1c1917" strokeWidth="3" />

              {/* -----------------------------------------------------------------
                  CAR 1: 1ST CLASS PARLOUR SALOON COACH (Front coach)
                  Features: Brunswick Green & Teak, ornate arched windows, gold trim,
                  curtains, brass grab handles.
                 ----------------------------------------------------------------- */}
              <g transform={`translate(162, ${-24 + Math.sin(wheelAngle * Math.PI / 90) * 1.2})`}>
                {/* Saloon Body */}
                <rect x="0" y="0" width="76" height="24" rx="2" fill="url(#coachWood)" stroke="#170903" strokeWidth="1" />
                {/* Clerestory Roof */}
                <rect x="0" y="-3.5" width="76" height="4" fill="url(#coachRoof)" />
                <rect x="10" y="-6.5" width="56" height="3.5" fill="#1e293b" />
                {/* 4 Large Arched Saloon Windows */}
                <rect x="6" y="3" width="12" height="12" fill="#fef08a" opacity="0.95" rx="2" stroke="#78350f" strokeWidth="0.5" />
                <rect x="23" y="3" width="12" height="12" fill="#fef08a" opacity="0.95" rx="2" stroke="#78350f" strokeWidth="0.5" />
                <rect x="40" y="3" width="12" height="12" fill="#fef08a" opacity="0.95" rx="2" stroke="#78350f" strokeWidth="0.5" />
                <rect x="57" y="3" width="12" height="12" fill="#fef08a" opacity="0.95" rx="2" stroke="#78350f" strokeWidth="0.5" />
                {/* Gilded Curtains & Trim */}
                <path d="M 6 3 Q 12 7 18 3" stroke="#b45309" strokeWidth="1.2" fill="none" />
                <path d="M 23 3 Q 29 7 35 3" stroke="#b45309" strokeWidth="1.2" fill="none" />
                <path d="M 40 3 Q 46 7 52 3" stroke="#b45309" strokeWidth="1.2" fill="none" />
                <path d="M 57 3 Q 63 7 69 3" stroke="#b45309" strokeWidth="1.2" fill="none" />
                {/* Gilded waistline */}
                <line x1="4" y1="18" x2="72" y2="18" stroke="url(#brassTrim)" strokeWidth="1" />
                {/* Bogie Wheels */}
                <circle cx="18" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="58" cy="26" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
              </g>

              {/* Coupling link */}
              <line x1="238" y1="-12" x2="246" y2="-12" stroke="#1c1917" strokeWidth="3" />

              {/* -----------------------------------------------------------------
                  COAL TENDER
                  Features: Faceted coal pile, GWR brass crest, water tank filler cap,
                  dual axles.
                 ----------------------------------------------------------------- */}
              <g transform="translate(246, -22)">
                <rect x="0" y="0" width="46" height="22" fill="#1c1917" stroke="#0f172a" strokeWidth="1" />
                {/* Mounded coal with textured facets */}
                <path d="M 4 0 Q 14 -8 24 -6 T 42 0 Z" fill="#09090b" />
                <polygon points="12,-4 18,-6 20,-3" fill="#27272a" />
                <polygon points="26,-5 32,-7 34,-3" fill="#27272a" />
                {/* GWR Gold Crest Plate */}
                <rect x="15" y="6" width="16" height="7" rx="1" fill="#78350f" stroke="url(#brassTrim)" strokeWidth="0.8" />
                <text x="23" y="12" fontSize="5" fill="#fef08a" fontFamily="serif" textAnchor="middle" fontWeight="bold">
                  GWR
                </text>
                {/* Tender Wheels */}
                <circle cx="12" cy="24" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="34" cy="24" r="6" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.2" />
              </g>

              {/* -----------------------------------------------------------------
                  THE STEAM LOCOMOTIVE (Victorian 4-4-0 Express Engine)
                  Bigger, beefier, with polished brass dome, safety valve, whistle turret,
                  firebox glow, spoked driving wheels, and moving connecting rods!
                 ----------------------------------------------------------------- */}
              <g transform="translate(292, -34)">
                {/* Firebox Glow underneath cab */}
                <ellipse cx="14" cy="32" rx="12" ry="4" fill="#f97316" opacity="0.4" className="animate-pulse" />

                {/* Engine Driver's Cab */}
                <rect x="0" y="4" width="28" height="30" fill="url(#locoBoiler)" stroke="#0e1f0e" strokeWidth="1.2" />
                {/* Cab Spectacle Window with Driver Silhouette */}
                <circle cx="12" cy="14" r="5.5" fill="#fef08a" stroke="url(#brassTrim)" strokeWidth="1" opacity="0.9" />
                <circle cx="12" cy="15" r="2.8" fill="#1c1917" />
                {/* Cab Overhang Roof */}
                <path d="M -3 4 Q 14 0 30 4" stroke="url(#brassTrim)" strokeWidth="2.5" fill="none" />

                {/* Brass Whistle Turret (on cab roof) */}
                <rect x="2" y="-2" width="3.5" height="6" fill="url(#brassTrim)" />
                <circle cx="3.8" cy="-2" r="2" fill="url(#brassTrim)" />

                {/* Cylindrical Boiler Barrel (Brunswick Green) */}
                <rect x="28" y="10" width="58" height="24" rx="2" fill="url(#locoBoiler)" stroke="#0e1f0e" strokeWidth="1.2" />
                {/* Polished Brass Boiler Bands */}
                <line x1="40" y1="10" x2="40" y2="34" stroke="url(#brassTrim)" strokeWidth="2" />
                <line x1="58" y1="10" x2="58" y2="34" stroke="url(#brassTrim)" strokeWidth="2" />
                <line x1="74" y1="10" x2="74" y2="34" stroke="url(#brassTrim)" strokeWidth="2" />

                {/* Polished Brass Steam Dome */}
                <ellipse cx="48" cy="7" rx="6.5" ry="5" fill="url(#brassTrim)" stroke="#78350f" strokeWidth="0.8" />
                {/* Salter Safety Valve */}
                <rect x="34" y="5" width="4" height="5" fill="url(#brassTrim)" />

                {/* Graphite Smokebox & Smokebox Door */}
                <rect x="86" y="8" width="16" height="26" fill="#09090b" stroke="#170d05" strokeWidth="1" />
                {/* Central Dart Handle */}
                <circle cx="94" cy="21" r="2" fill="url(#brassTrim)" />

                {/* Tall Victorian Chimney Stack with Copper/Brass Lip */}
                <polygon points="89,8 99,8 98,-4 90,-4" fill="#09090b" stroke="#1c1917" strokeWidth="1" />
                <ellipse cx="94" cy="-4" rx="5" ry="2" fill="url(#brassTrim)" />

                {/* Vermilion Buffer Beam & Twin Sprung Buffers */}
                <rect x="98" y="26" width="8" height="10" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
                <rect x="106" y="27" width="4" height="3" fill="url(#brassTrim)" />
                <rect x="106" y="32" width="4" height="3" fill="url(#brassTrim)" />
                {/* Guard iron / Cowcatcher */}
                <polygon points="98,36 108,36 102,40" fill="#1c1917" />

                {/* Large Polished Brass Headlamp */}
                <g transform="translate(100, 16)">
                  <polygon points="0,0 5,2 5,8 0,10" fill="url(#brassTrim)" stroke="#78350f" strokeWidth="0.6" />
                  <circle cx="2.5" cy="5" r="2.8" fill="#fffbeb" />
                  {/* Glowing Amber Forward Light Cone */}
                  <polygon points="5,5 75,-10 75,20" fill="url(#sparkPulse)" opacity="0.3" />
                </g>

                {/* ROTATING SPOKED DRIVER WHEELS (6.5ft Express Drivers) */}
                {/* Driver Wheel 1 */}
                <g transform="translate(22, 38)">
                  <circle cx="0" cy="0" r="13" fill="#1c1917" stroke="url(#brassTrim)" strokeWidth="2" />
                  <g transform={`rotate(${wheelAngle})`}>
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-8.5" y1="8.5" x2="8.5" y2="-8.5" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Counterweight */}
                    <path d="M -8 -8 A 12 12 0 0 1 8 -8 Z" fill="#475569" />
                    {/* Crank pin */}
                    <circle cx="7" cy="0" r="2.2" fill="#f8fafc" />
                  </g>
                </g>

                {/* Driver Wheel 2 */}
                <g transform="translate(54, 38)">
                  <circle cx="0" cy="0" r="13" fill="#1c1917" stroke="url(#brassTrim)" strokeWidth="2" />
                  <g transform={`rotate(${wheelAngle})`}>
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-8.5" y1="-8.5" x2="8.5" y2="8.5" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="-8.5" y1="8.5" x2="8.5" y2="-8.5" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M -8 -8 A 12 12 0 0 1 8 -8 Z" fill="#475569" />
                    <circle cx="7" cy="0" r="2.2" fill="#f8fafc" />
                  </g>
                </g>

                {/* Oscillating Connecting Side Rod between drivers */}
                <line
                  x1={22 + Math.cos((wheelAngle * Math.PI) / 180) * 7}
                  y1={38 + Math.sin((wheelAngle * Math.PI) / 180) * 7}
                  x2={54 + Math.cos((wheelAngle * Math.PI) / 180) * 7}
                  y2={38 + Math.sin((wheelAngle * Math.PI) / 180) * 7}
                  stroke="url(#steelRail)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Piston Cylinder & Crosshead Slide Bars */}
                <rect x="70" y="32" width="14" height="9" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                <line
                  x1={54 + Math.cos((wheelAngle * Math.PI) / 180) * 7}
                  y1={38 + Math.sin((wheelAngle * Math.PI) / 180) * 7}
                  x2="74"
                  y2="36"
                  stroke="url(#steelRail)"
                  strokeWidth="2.5"
                />

                {/* Front Leading Bogie Wheels (2 pairs) */}
                <circle cx="78" cy="41" r="7" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="94" cy="41" r="7" fill="#1c1917" stroke="#94a3b8" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        </div>

        {/* Panel Footer: Dispatch Race Status & Screen Reader Announcement */}
        <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] sm:text-xs font-serif text-[#38200d]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[#734b16]">WIRE STATUS:</span>
            <span className="font-bold text-[#1f1105]">
              POLE {activePoleIndex} OF {totalPoles} ENERGIZED
            </span>
          </div>

          <div
            className={`font-semibold tracking-wide ${
              isSwitchThrown
                ? 'text-green-900 font-bold'
                : isTension
                ? 'text-red-900 font-bold animate-pulse'
                : 'text-[#593b16]'
            }`}
          >
            {isSwitchThrown
              ? '✓ SWITCH THROWN TO SIDING!'
              : isTension
              ? '⚠ DANGER: 9:15 EXPRESS CLOSING ON RAVENSCAR GORGE!'
              : 'TRANSMIT TO OUTPACE THE RUNAWAY EXPRESS'}
          </div>
        </div>

        {/* Live Accessibility Announcement */}
        <div className="sr-only" aria-live="polite">
          Signal pulse at pole {activePoleIndex} of {totalPoles}. The 9:15 Express is {milesToSwitch} miles from the switch.
        </div>
      </div>
    </section>
  );
};
