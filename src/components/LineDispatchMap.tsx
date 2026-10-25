import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, ArrowRight, ShieldCheck, Sparkles, FastForward } from 'lucide-react';
import { telegraphAudio } from '../audio/telegraphAudio';
import { GAME_LEVELS, MORSE_TABLE, formatMorseVisual } from '../game/morse';
import { SophiaAvatar } from './SophiaAvatar';
import {
  SOPHIA_VOICE_TRACKS,
  playSophiaVoice,
  stopSophiaVoice,
  isVoiceEnabled,
} from '../audio/sophiaVoice';

export interface GWRStation {
  id: string;
  name: string;
  shortName: string;
  county: string;
  x: number;
  y: number;
  mileage: number; // Miles from Paddington
  historicalNote: string;
}

export const GWR_ROUTE_STATIONS: GWRStation[] = [
  { id: 'penzance', name: 'Penzance', shortName: 'Penzance', county: 'Cornwall', x: 60, y: 340, mileage: 305, historicalNote: 'Westernmost broad-gauge terminus overlooking Mount\'s Bay.' },
  { id: 'st_erth', name: 'St Erth', shortName: 'St Erth', county: 'Cornwall', x: 110, y: 320, mileage: 299, historicalNote: 'Junction for the St Ives branchline across the coastal dunes.' },
  { id: 'camborne', name: 'Camborne', shortName: 'Camborne', county: 'Cornwall', x: 165, y: 300, mileage: 290, historicalNote: 'Heart of the Cornish tin and copper mining district.' },
  { id: 'truro', name: 'Truro', shortName: 'Truro', county: 'Cornwall', x: 225, y: 280, mileage: 279, historicalNote: 'Granite viaduct city; cathedral spires and river quays.' },
  { id: 'st_austell', name: 'St Austell', shortName: 'St Austell', county: 'Cornwall', x: 290, y: 265, mileage: 260, historicalNote: 'White china clay quarries and winding valley sidings.' },
  { id: 'liskeard', name: 'Liskeard', shortName: 'Liskeard', county: 'Cornwall', x: 355, y: 250, mileage: 243, historicalNote: 'High moors viaduct junction above the woodland coombes.' },
  { id: 'saltash', name: 'Royal Albert Bridge, Saltash', shortName: 'Saltash Bridge', county: 'Cornwall/Devon', x: 420, y: 240, mileage: 228, historicalNote: 'Brunel\'s tubular suspension wonder across River Tamar.' },
  { id: 'plymouth', name: 'Plymouth', shortName: 'Plymouth', county: 'Devon', x: 475, y: 245, mileage: 226, historicalNote: 'Naval fortress, Millbay docks, and transatlantic mail depot.' },
  { id: 'dawlish', name: 'Dawlish Sea Wall', shortName: 'Dawlish', county: 'Devon', x: 550, y: 235, mileage: 198, historicalNote: 'Dramatic sea wall carved between red sandstone sea cliffs.' },
  { id: 'exeter', name: 'Exeter St Davids', shortName: 'Exeter', county: 'Devon', x: 605, y: 215, mileage: 185, historicalNote: 'Ancient cathedral city and South Devon line junction.' },
  { id: 'taunton', name: 'Taunton', shortName: 'Taunton', county: 'Somerset', x: 680, y: 195, mileage: 163, historicalNote: 'Broad agricultural depot connecting the Somerset levels.' },
  { id: 'bristol', name: 'Bristol Temple Meads', shortName: 'Bristol', county: 'Gloucestershire', x: 755, y: 165, mileage: 118, historicalNote: 'Brunel\'s grand Tudor-arched passenger terminal palace.' },
  { id: 'bath', name: 'Bath & Box Tunnel', shortName: 'Bath & Box', county: 'Wiltshire', x: 815, y: 170, mileage: 101, historicalNote: 'The two-mile subterranean wonder pierced through Box Hill.' },
  { id: 'swindon', name: 'Swindon Railway Works', shortName: 'Swindon', county: 'Wiltshire', x: 875, y: 155, mileage: 77, historicalNote: 'GWR locomotive foundries and giant boiler workshops.' },
  { id: 'reading', name: 'Reading', shortName: 'Reading', county: 'Berkshire', x: 935, y: 150, mileage: 36, historicalNote: 'Thames Valley junction of the Great Western main lines.' },
  { id: 'paddington', name: 'London Paddington', shortName: 'Paddington', county: 'London', x: 980, y: 145, mileage: 0, historicalNote: 'Brunel\'s magnificent wrought-iron cathedral of steam.' },
];

/** Map Level (1..13) to starting station index and arriving station index */
function getStationIndicesForLevel(completedLevel: number): { fromIdx: number; toIdx: number } {
  // If starting fresh Level 1 (not completed any yet)
  if (completedLevel <= 0) {
    return { fromIdx: 0, toIdx: 0 };
  }
  // Level 1: Penzance (0) -> St Erth (1)
  // ...
  // Level 12: Taunton/Bristol (11) -> Bath/Box (12) -> Swindon (13)
  // Level 13: Swindon (13) -> Reading (14) -> Paddington (15)
  if (completedLevel >= 13) {
    return { fromIdx: 13, toIdx: 15 };
  }
  if (completedLevel === 12) {
    return { fromIdx: 11, toIdx: 13 };
  }
  return { fromIdx: completedLevel - 1, toIdx: completedLevel };
}

interface LineDispatchMapProps {
  completedLevel: number; // The level just completed (1 to 13), or 0 if starting fresh from title
  isInitialGameStart?: boolean; // True if first time starting Level 1 from title
  finalScore?: number;
  finalAccuracy?: number;
  onBeginNextLevel: (nextLevelNumber: number) => void;
  onReturnToOffice: () => void;
  onPlayMorseAudio?: (letter: string, pattern: string) => void;
  reducedMotion?: boolean;
}

export const LineDispatchMap: React.FC<LineDispatchMapProps> = ({
  completedLevel,
  isInitialGameStart = false,
  finalScore = 0,
  finalAccuracy = 100,
  onBeginNextLevel,
  onReturnToOffice,
  onPlayMorseAudio,
  reducedMotion = false,
}) => {
  const isAllCompleted = completedLevel >= 13;
  const nextLevelNumber = Math.min(13, completedLevel + 1);
  const nextLevelConfig = GAME_LEVELS.find((l) => l.level === nextLevelNumber) || GAME_LEVELS[0];

  const { fromIdx, toIdx } = useMemo(
    () => (isInitialGameStart ? { fromIdx: 0, toIdx: 0 } : getStationIndicesForLevel(completedLevel)),
    [completedLevel, isInitialGameStart]
  );

  // Animation Stage: 'stamp' | 'rolling' | 'arriving' | 'ready'
  const [animationStage, setAnimationStage] = useState<'stamp' | 'rolling' | 'arriving' | 'ready'>(
    isInitialGameStart || reducedMotion ? 'ready' : 'stamp'
  );

  // Train position progress (0: at fromIdx, 1: at toIdx)
  const [trainProgress, setTrainProgress] = useState<number>(
    isInitialGameStart || reducedMotion ? 1 : 0
  );

  // Smoke puffs during rolling
  const [smokePuffs, setSmokePuffs] = useState<{ id: number; x: number; y: number }[]>([]);
  const smokeIdCounterRef = useRef<number>(0);

  // Wheel angle in degrees
  const [wheelAngle, setWheelAngle] = useState<number>(0);

  // Audio interval for chuffing during transit
  const chuffIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Victory dispatch typewriter and voice sync
  const FULL_VICTORY_DISPATCH =
    "Penzance to Paddington is safe! The points were thrown, the runaway 9:15 Express came to rest without a scratch, and all 300 passengers are saved. The Great Western Railway Board commends your valiant service!";
  const [displayedVictoryText, setDisplayedVictoryText] = useState(
    reducedMotion ? FULL_VICTORY_DISPATCH : ''
  );
  const [isVictoryTypingDone, setIsVictoryTypingDone] = useState(reducedMotion);
  const victoryTypewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Stop voice on component unmount
  useEffect(() => {
    return () => {
      stopSophiaVoice();
      if (victoryTypewriterRef.current) {
        clearInterval(victoryTypewriterRef.current);
      }
    };
  }, []);

  // Trigger voice and typewriter when reaching London Paddington
  useEffect(() => {
    if (!isAllCompleted || animationStage !== 'ready') return;

    stopSophiaVoice();
    if (victoryTypewriterRef.current) {
      clearInterval(victoryTypewriterRef.current);
      victoryTypewriterRef.current = null;
    }

    if (reducedMotion) {
      setDisplayedVictoryText(FULL_VICTORY_DISPATCH);
      setIsVictoryTypingDone(true);
      if (isVoiceEnabled() && !telegraphAudio.getMuted()) {
        playSophiaVoice(SOPHIA_VOICE_TRACKS.certificate_victory);
      }
      return;
    }

    setDisplayedVictoryText('');
    setIsVictoryTypingDone(false);

    const runFallbackTypewriter = () => {
      if (victoryTypewriterRef.current) clearInterval(victoryTypewriterRef.current);
      let charIdx = 0;
      victoryTypewriterRef.current = setInterval(() => {
        charIdx += 2;
        if (charIdx >= FULL_VICTORY_DISPATCH.length) {
          setDisplayedVictoryText(FULL_VICTORY_DISPATCH);
          setIsVictoryTypingDone(true);
          if (victoryTypewriterRef.current) {
            clearInterval(victoryTypewriterRef.current);
            victoryTypewriterRef.current = null;
          }
        } else {
          setDisplayedVictoryText(FULL_VICTORY_DISPATCH.slice(0, charIdx));
        }
      }, 20);
    };

    if (!isVoiceEnabled() || telegraphAudio.getMuted()) {
      runFallbackTypewriter();
      return;
    }

    let isAudioActive = false;
    let isAudioDriving = false;

    const audioHangTimer = setTimeout(() => {
      if (!isAudioActive) {
        runFallbackTypewriter();
      }
    }, 250);

    const stopVoice = playSophiaVoice(SOPHIA_VOICE_TRACKS.certificate_victory, {
      onProgress: (progress) => {
        isAudioDriving = true;
        isAudioActive = true;
        clearTimeout(audioHangTimer);
        if (victoryTypewriterRef.current) {
          clearInterval(victoryTypewriterRef.current);
          victoryTypewriterRef.current = null;
        }
        const count = Math.min(
          FULL_VICTORY_DISPATCH.length,
          Math.floor(progress * FULL_VICTORY_DISPATCH.length)
        );
        setDisplayedVictoryText(FULL_VICTORY_DISPATCH.slice(0, count));
      },
      onEnded: () => {
        clearTimeout(audioHangTimer);
        setDisplayedVictoryText(FULL_VICTORY_DISPATCH);
        setIsVictoryTypingDone(true);
      },
      onError: () => {
        clearTimeout(audioHangTimer);
        if (!isAudioDriving) {
          runFallbackTypewriter();
        }
      },
    });

    return () => {
      clearTimeout(audioHangTimer);
      if (victoryTypewriterRef.current) {
        clearInterval(victoryTypewriterRef.current);
        victoryTypewriterRef.current = null;
      }
      stopVoice();
    };
  }, [isAllCompleted, animationStage, reducedMotion]);

  // Save progress in localStorage
  useEffect(() => {
    try {
      const highest = Math.max(toIdx, parseInt(localStorage.getItem('telegraph_map_highest_cleared') || '0', 10));
      localStorage.setItem('telegraph_map_highest_cleared', highest.toString());
    } catch {
      // ignore
    }
  }, [toIdx]);

  // Main animated sequence
  useEffect(() => {
    if (isInitialGameStart || reducedMotion) {
      setAnimationStage('ready');
      setTrainProgress(1);
      return;
    }

    // Step 1: STAMP CLEARED SEAL (0 to 1000ms)
    setAnimationStage('stamp');
    setTrainProgress(0);
    const stampTimer = setTimeout(() => {
      telegraphAudio.playStampThud();
    }, 250);

    // Step 2: ROLLING TRAIN (1000ms to 4200ms)
    const rollingTimer = setTimeout(() => {
      setAnimationStage('rolling');

      // Start periodic steam chuffs
      chuffIntervalRef.current = setInterval(() => {
        telegraphAudio.playTrainChuff(0.28);
      }, 260);

      const startTime = performance.now();
      const durationMs = 3200;

      const animateTrain = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / durationMs);
        // Smooth ease-in-out
        const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        setTrainProgress(eased);
        setWheelAngle((prev) => (prev + 18) % 360);

        if (p < 1) {
          requestAnimationFrame(animateTrain);
        } else {
          // Arrived!
          if (chuffIntervalRef.current) {
            clearInterval(chuffIntervalRef.current);
            chuffIntervalRef.current = null;
          }
          setAnimationStage('arriving');
          telegraphAudio.playTrainWhistle();
          telegraphAudio.playSteamHiss();

          // Step 4: READY (telegram card slides up)
          setTimeout(() => {
            setAnimationStage('ready');
          }, 900);
        }
      };

      requestAnimationFrame(animateTrain);
    }, 1100);

    return () => {
      clearTimeout(stampTimer);
      clearTimeout(rollingTimer);
      if (chuffIntervalRef.current) {
        clearInterval(chuffIntervalRef.current);
      }
    };
  }, [completedLevel, isInitialGameStart, reducedMotion]);

  // Skip animation button handler
  const handleSkip = () => {
    if (chuffIntervalRef.current) {
      clearInterval(chuffIntervalRef.current);
      chuffIntervalRef.current = null;
    }
    setTrainProgress(1);
    setAnimationStage('ready');
  };

  // Interpolate current train coordinates
  const fromStation = GWR_ROUTE_STATIONS[fromIdx];
  const toStation = GWR_ROUTE_STATIONS[toIdx];

  const currentTrainX = fromStation.x + (toStation.x - fromStation.x) * trainProgress;
  const currentTrainY = fromStation.y + (toStation.y - fromStation.y) * trainProgress;

  // Camera viewport panning (centered on current train position, with boundary clamping)
  const cameraX = Math.max(0, Math.min(1000 - 640, currentTrainX - 320));

  // Spawn smoke puff particles when train is rolling
  useEffect(() => {
    if (animationStage !== 'rolling' || reducedMotion) return;
    const interval = setInterval(() => {
      setSmokePuffs((prev) => {
        const nextId = ++smokeIdCounterRef.current;
        const newPuff = {
          id: nextId,
          x: currentTrainX - 12 + (Math.random() * 4 - 2),
          y: currentTrainY - 14 + (Math.random() * 4 - 2),
        };
        return [...prev.slice(-6), newPuff];
      });
    }, 180);
    return () => clearInterval(interval);
  }, [animationStage, currentTrainX, currentTrainY, reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-45 bg-[#0f0804] text-[#fcf8ee] flex flex-col justify-between overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Line Dispatch Map: Great Western Railway Main Line"
    >
      {/* Top Victorian Brass Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-2 bg-gradient-to-b from-[#24130a] to-[#120803] border-b-2 border-[#b58b45] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="brass-rivet" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-serif uppercase tracking-widest text-[#d4af37] font-bold">
              Great Western Railway · Main Broad Gauge Line (1887)
            </span>
            <h1 className="text-sm sm:text-lg font-serif font-black text-[#fff1cc] tracking-wide">
              {isAllCompleted
                ? 'London Paddington Terminus · Line Secured!'
                : `Section Dispatch: ${fromStation.name} → ${toStation.name}`}
            </h1>
          </div>
        </div>

        {/* Top Controls: Skip & Return to Office */}
        <div className="flex items-center gap-2">
          {animationStage !== 'ready' && !isAllCompleted && (
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 rounded bg-[#3d2311] border border-[#d4af37] text-[#ffd875] hover:text-[#fff5cf] hover:border-[#ffeaa7] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer transition-transform hover:scale-105"
              aria-label="Skip Map Transition"
            >
              <span>Skip</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onReturnToOffice}
            className="px-3 py-1.5 rounded bg-[#2e190d] border border-[#8c6527] text-[#caa758] hover:text-[#f3ebcb] font-serif text-xs uppercase cursor-pointer"
          >
            ⌂ Office
          </button>
        </div>
      </header>

      {/* Center 1887 Engraved Parchment Map Viewport */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-1 sm:p-2.5 bg-[#140b06]">
        {/* Parchment Map Container with Brass Inlay Frame spanning entire space */}
        <div className="relative w-full h-full min-h-[280px] max-h-[580px] rounded-2xl border-4 border-[#8c6527] shadow-[0_12px_45px_rgba(0,0,0,0.95)] overflow-hidden bg-[#ebdcb2]">
          {/* Corner Rivets */}
          <div className="absolute top-2 left-2 brass-rivet z-30" />
          <div className="absolute top-2 right-2 brass-rivet z-30" />
          <div className="absolute bottom-2 left-2 brass-rivet z-30" />
          <div className="absolute bottom-2 right-2 brass-rivet z-30" />

          {/* Mechanical "LINE CLOSED" / "LINE OPEN" Flip Indicator */}
          <div className="absolute top-3 left-4 z-30 flex items-center gap-2 bg-[#211208]/85 px-3 py-1.5 rounded border border-[#b88c2b] shadow-md backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-[#caa758] tracking-widest font-serif">
              Block Wire:
            </span>
            <div
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-black tracking-wider transition-all duration-500 ${
                animationStage === 'ready'
                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-red-950/90 text-red-200 border border-red-600 shadow-[0_0_8px_#ef4444]'
              }`}
            >
              {animationStage === 'ready' ? '● LINE OPEN · CLEAR' : '■ BLOCK OCCUPIED'}
            </div>
          </div>

          {/* Compass Rose & Cartouche Badge */}
          <div className="absolute bottom-3 right-4 z-20 pointer-events-none opacity-80 hidden sm:block">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#734616] block">
                I.K. BRUNEL, ENG.
              </span>
              <span className="text-[9px] italic text-[#8a571f] font-serif">
                Gauge: 7ft 0¼in · 1887 Broad Gauge Route
              </span>
            </div>
          </div>

          {/* SVG Map of the GWR Route - Fills 100% of the entire frame */}
          <svg
            viewBox="0 0 1020 440"
            className="w-full h-full select-none block"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Map background tint */}
              <radialGradient id="mapVignette" cx="50%" cy="50%" r="70%">
                <stop offset="40%" stopColor="#f7f0d8" />
                <stop offset="85%" stopColor="#e8d5a2" />
                <stop offset="100%" stopColor="#cfa565" />
              </radialGradient>

              {/* Red Inked Trail Gradient */}
              <linearGradient id="redInkTrail" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>

              {/* Broad Gauge Ballast / Track Pattern */}
              <pattern id="railSleepers" width="8" height="8" patternUnits="userSpaceOnUse">
                <line x1="0" y1="4" x2="8" y2="4" stroke="#5a3d1d" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Map parchment fill */}
            <rect width="1020" height="440" fill="url(#mapVignette)" />

            {/* Subtle Geographical Coastline / Topo lines */}
            <g opacity="0.25" stroke="#875723" strokeWidth="1" fill="none">
              {/* English Channel & Celtic Sea coastline approximation */}
              <path d="M 30 380 Q 120 370 200 350 T 360 300 T 520 280 T 680 250 T 840 230 T 1000 230" strokeDasharray="3 3" />
              <path d="M 40 400 Q 180 390 320 360 T 600 320 T 900 290" />
              {/* River Thames winding through Reading to London */}
              <path d="M 880 130 Q 920 145 950 135 T 1010 140" stroke="#3b82f6" strokeWidth="2.5" opacity="0.35" />
            </g>

            {/* Complete Broad Gauge Railway Track (Underlayer) */}
            {GWR_ROUTE_STATIONS.map((station, i) => {
              if (i === GWR_ROUTE_STATIONS.length - 1) return null;
              const next = GWR_ROUTE_STATIONS[i + 1];
              return (
                <g key={`track-${station.id}-${next.id}`}>
                  {/* Timber Sleepers */}
                  <line
                    x1={station.x}
                    y1={station.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="#5c3917"
                    strokeWidth="6"
                    strokeDasharray="2 3"
                    opacity="0.75"
                  />
                  {/* Broad Gauge Dual Rails */}
                  <line
                    x1={station.x}
                    y1={station.y - 2.5}
                    x2={next.x}
                    y2={next.y - 2.5}
                    stroke="#2e1a0b"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={station.x}
                    y1={station.y + 2.5}
                    x2={next.x}
                    y2={next.y + 2.5}
                    stroke="#2e1a0b"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

            {/* Red Inked Trail Behind Train on Cleared Segments */}
            {GWR_ROUTE_STATIONS.map((station, i) => {
              if (i >= toIdx) return null;
              const next = GWR_ROUTE_STATIONS[i + 1];
              if (!next) return null;

              // Partial trail on currently moving segment
              const isCurrentSegment = i === fromIdx && fromIdx !== toIdx;
              const targetX = isCurrentSegment
                ? station.x + (next.x - station.x) * trainProgress
                : next.x;
              const targetY = isCurrentSegment
                ? station.y + (next.y - station.y) * trainProgress
                : next.y;

              return (
                <line
                  key={`cleared-trail-${station.id}`}
                  x1={station.x}
                  y1={station.y}
                  x2={targetX}
                  y2={targetY}
                  stroke="url(#redInkTrail)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_1px_3px_rgba(220,38,38,0.5)]"
                />
              );
            })}

            {/* Station Medallions, Names, and CLEARED Stamps */}
            {GWR_ROUTE_STATIONS.map((station, idx) => {
              const isCleared = idx < toIdx || (idx === toIdx && isAllCompleted);
              const isCurrent = idx === toIdx && !isAllCompleted;
              const isFromStation = idx === fromIdx;
              const labelAbove = idx % 2 === 0;

              return (
                <g key={station.id} transform={`translate(${station.x}, ${station.y})`}>
                  {/* Station Marker Circle */}
                  <circle
                    r={isCurrent ? 7.5 : 5.5}
                    fill={isCleared ? '#991b1b' : isCurrent ? '#d97706' : '#ebdcb6'}
                    stroke="#3b200b"
                    strokeWidth="2"
                    className={isCurrent ? 'animate-pulse' : ''}
                  />
                  <circle
                    r={isCurrent ? 3 : 2}
                    fill={isCleared ? '#fef2f2' : isCurrent ? '#fef3c7' : '#5c3a16'}
                  />

                  {/* Station Label */}
                  <text
                    x={0}
                    y={labelAbove ? -14 : 20}
                    textAnchor="middle"
                    className={`font-serif text-[10.5px] font-bold select-none ${
                      isCurrent
                        ? 'fill-[#78350f] font-black'
                        : isCleared
                        ? 'fill-[#7f1d1d] font-bold'
                        : 'fill-[#523315]'
                    }`}
                  >
                    {station.shortName}
                  </text>

                  {/* Mileage sublabel */}
                  <text
                    x={0}
                    y={labelAbove ? -24 : 30}
                    textAnchor="middle"
                    className="font-mono text-[8px] fill-[#8c591c] opacity-80"
                  >
                    {station.mileage === 0 ? 'TERM.' : `${station.mileage}m`}
                  </text>

                  {/* Red Ink "CLEARED" Stamp Badge */}
                  {isCleared && (
                    <g
                      transform="translate(0, 0) rotate(-10)"
                      className={
                        isFromStation && animationStage === 'stamp' ? 'stamp-cleared-anim' : ''
                      }
                    >
                      <rect
                        x="-20"
                        y="-9"
                        width="40"
                        height="18"
                        rx="3"
                        fill="none"
                        stroke="#991b1b"
                        strokeWidth="1.8"
                        strokeDasharray="3 1"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="font-serif text-[8.5px] font-black fill-[#991b1b] tracking-wider"
                      >
                        CLEARED
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Smoke Puff Particles drifting from chimney */}
            {smokePuffs.map((puff) => (
              <circle
                key={puff.id}
                cx={puff.x}
                cy={puff.y}
                r="5"
                fill="#ffffff"
                opacity="0.45"
                className="animate-ping"
              />
            ))}

            {/* Animated Miniature SVG Steam Locomotive on Track */}
            <g
              transform={`translate(${currentTrainX}, ${currentTrainY - 6})`}
              className="filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]"
            >
              {/* Tender Coal Car */}
              <rect x="-32" y="-5" width="16" height="8" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
              <ellipse cx="-24" cy="-5" rx="6" ry="2" fill="#090d16" />

              {/* Locomotive Boiler & Cab (GWR Dark Green / Brass Boiler Bands) */}
              <rect x="-14" y="-10" width="12" height="13" rx="1.5" fill="#14532d" stroke="#052e16" strokeWidth="1" />
              <rect x="-12" y="-8" width="4" height="4" rx="0.5" fill="#fef08a" opacity="0.8" /> {/* Cab Window */}
              <rect x="-2" y="-7" width="18" height="9" rx="2" fill="#14532d" stroke="#052e16" strokeWidth="1" />
              {/* Brass Boiler Bands */}
              <line x1="3" y1="-7" x2="3" y2="2" stroke="#d4af37" strokeWidth="1.2" />
              <line x1="9" y1="-7" x2="9" y2="2" stroke="#d4af37" strokeWidth="1.2" />

              {/* Smokestack / Chimney with Brass Cap */}
              <rect x="10" y="-12" width="3.5" height="5" fill="#0f172a" />
              <ellipse cx="11.75" cy="-12" rx="2.5" ry="1" fill="#d4af37" />

              {/* Front Cowcatcher / Headlamp */}
              <polygon points="16,2 20,2 17,-3" fill="#334155" />
              <circle cx="16" cy="-4" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

              {/* Rotating Spoked Driving Wheels & Connecting Rod */}
              {[-26, -18, -6, 2, 10].map((wx, i) => (
                <g key={`wheel-${i}`} transform={`translate(${wx}, 3)`}>
                  <circle r="3.2" fill="#334155" stroke="#d4af37" strokeWidth="0.8" />
                  <line
                    x1="0"
                    y1="-3"
                    x2="0"
                    y2="3"
                    stroke="#94a3b8"
                    strokeWidth="0.6"
                    transform={`rotate(${wheelAngle})`}
                  />
                  <line
                    x1="-3"
                    y1="0"
                    x2="3"
                    y2="0"
                    stroke="#94a3b8"
                    strokeWidth="0.6"
                    transform={`rotate(${wheelAngle})`}
                  />
                </g>
              ))}

              {/* Connecting Rod */}
              <line
                x1="-6"
                y1={3 + Math.sin((wheelAngle * Math.PI) / 180) * 1.5}
                x2="10"
                y2={3 + Math.sin((wheelAngle * Math.PI) / 180) * 1.5}
                stroke="#cbd5e1"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Dispatch Telegram Card / Final Terminus Certificate */}
      <footer className="relative z-30 w-full max-w-4xl mx-auto px-3 pb-3 sm:pb-4">
        {isAllCompleted ? (
          /* FINAL TERMINUS VICTORY: London Paddington Reached! */
          <div
            onClick={() => {
              if (!isVictoryTypingDone) {
                stopSophiaVoice();
                if (victoryTypewriterRef.current) {
                  clearInterval(victoryTypewriterRef.current);
                  victoryTypewriterRef.current = null;
                }
                setDisplayedVictoryText(FULL_VICTORY_DISPATCH);
                setIsVictoryTypingDone(true);
              }
            }}
            className="parchment-sheet rounded-xl p-4 sm:p-6 border-3 border-[#b88c2b] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <SophiaAvatar pose="cheering" size="md" reducedMotion={reducedMotion} />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a4816]">
                  Royal Albert Line · London Paddington Terminus
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[#2b1706] mb-1">
                  LINE SECURED · ALL STATIONS CLEARED!
                </h2>
                <p className="text-xs sm:text-sm font-serif italic text-[#4a2b13] max-w-lg leading-relaxed min-h-[44px]">
                  "{displayedVictoryText}"
                  {!isVictoryTypingDone && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#8c591c] animate-pulse" />
                  )}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs font-serif font-bold text-[#805510]">
                  <span>Total Score: {finalScore}</span>
                  <span>Overall Accuracy: {finalAccuracy}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopSophiaVoice();
                  onReturnToOffice();
                }}
                className="px-6 py-2.5 rounded-lg brass-button font-serif font-bold text-xs uppercase tracking-wider shadow cursor-pointer text-center"
              >
                Return to Station Office ⌂
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR NEXT DISPATCH TELEGRAM CARD */
          <div
            className={`parchment-sheet rounded-xl p-3 sm:p-4 border-2 border-[#8c6527] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-500 ${
              animationStage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-95'
            }`}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="hidden sm:block flex-shrink-0">
                <SophiaAvatar
                  pose={animationStage === 'ready' ? 'pointing' : 'waving'}
                  size="sm"
                  reducedMotion={reducedMotion}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a4816]">
                    Next Telegraph Block Section · Level {nextLevelNumber}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#ebdcb5] px-1.5 py-0.2 rounded text-[#523315]">
                    {toStation.name}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-serif font-bold text-[#2e1708] mb-0.5">
                  "{nextLevelConfig.title}" — {toStation.historicalNote}
                </h3>

                {/* New Letters Introduced Banner */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-serif font-bold text-[#6b4216]">
                    Signals to Transmit:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {nextLevelConfig.newLetters.map((letter) => {
                      const rawPattern = MORSE_TABLE[letter] || '';
                      const pattern = formatMorseVisual(rawPattern);
                      return (
                        <button
                          key={letter}
                          onClick={() => onPlayMorseAudio?.(letter, rawPattern)}
                          className="px-2 py-0.5 rounded bg-[#faedd0] border border-[#b8954f] hover:border-[#734a1a] text-xs font-serif font-bold text-[#381f0b] flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                          title={`Listen to letter ${letter}`}
                        >
                          <span className="font-black text-amber-950">{letter}</span>
                          <span className="text-[10px] font-mono text-[#8a2214]">{pattern}</span>
                          <Volume2 className="w-3 h-3 text-[#7a4816]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Begin Shift Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  stopSophiaVoice();
                  onBeginNextLevel(nextLevelNumber);
                }}
                data-start="true"
                disabled={animationStage !== 'ready'}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-serif font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  animationStage === 'ready'
                    ? 'brass-button hover:scale-105 active:scale-95'
                    : 'opacity-60 bg-amber-100 text-amber-800 border border-amber-300 cursor-wait'
                }`}
              >
                <span>{isInitialGameStart ? 'Begin First Wire' : 'Begin Shift'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
