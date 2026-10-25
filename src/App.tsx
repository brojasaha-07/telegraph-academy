/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AmbientOffice } from './components/AmbientOffice';
import { TitleScreen } from './components/TitleScreen';
import { TelegraphKey } from './components/TelegraphKey';
import { Gauges } from './components/Gauges';
import { TickerTape } from './components/TickerTape';
import { MorseChartDrawer } from './components/MorseChartDrawer';
import { LessonCardModal } from './components/LessonCardModal';
import { LevelSummaryModal, StationMasterResponse } from './components/LevelSummaryModal';
import { LifelineMode } from './components/LifelineMode';
import { SettingsModal } from './components/SettingsModal';
import { LineDispatchRace } from './components/LineDispatchRace';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SophiaTour } from './components/SophiaTour';
import { SophiaGameplayBubble } from './components/SophiaGameplayBubble';
import { LineDispatchMap } from './components/LineDispatchMap';
import { OfficeEntryScreen } from './components/OfficeEntryScreen';
import {
  GAME_LEVELS,
  getLearnedLetters,
  TIMING_PRESETS,
  TimingDifficulty,
  calculateAccuracy,
  calculateWPM,
} from './game/morse';
import { telegraphAudio } from './audio/telegraphAudio';
import {
  isVoiceEnabled,
  setVoiceEnabled,
  subscribeVoiceEnabled,
  syncSophiaVoiceVolume,
  primeVoiceAudio,
} from './audio/sophiaVoice';
import { Pause, Play, RotateCcw, BookOpen, Settings as SettingsIcon, Lightbulb } from 'lucide-react';

type AppState = 'title' | 'lesson' | 'playing' | 'paused' | 'summary' | 'gameover' | 'lifeline' | 'map';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [highestLevelReached, setHighestLevelReached] = useState<number>(1);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isFinalVictory, setIsFinalVictory] = useState<boolean>(false);
  const practiceCallbackRef = useRef<((letter: string) => void) | null>(null);

  // Office entry gate: shown once per visit before anything else to unlock audio
  const [hasEnteredOffice, setHasEnteredOffice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('telegraph_office_entered') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const handleEnterOffice = useCallback(() => {
    primeVoiceAudio();
    try {
      sessionStorage.setItem('telegraph_office_entered', 'true');
    } catch (e) {
      console.warn('sessionStorage setItem failed:', e);
    }
    setHasEnteredOffice(true);
  }, []);

  // Settings
  const [timingDifficulty, setTimingDifficulty] = useState<TimingDifficulty>(TIMING_PRESETS.Standard);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [pitch, setPitch] = useState<number>(600);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [trainSounds, setTrainSounds] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => isVoiceEnabled());

  // Subscribe to external voice setting changes (from speech bubble toggle)
  useEffect(() => {
    return subscribeVoiceEnabled((enabled) => {
      setVoiceEnabledState(enabled);
    });
  }, []);

  // UI Drawers & Modals
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Active Level State
  const [currentMessage, setCurrentMessage] = useState<string>(GAME_LEVELS[0].defaultMessage);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [externalKeyActive, setExternalKeyActive] = useState<boolean>(false);

  // Time Limit & Tape Tension Bar
  const [totalLevelTimeSec, setTotalLevelTimeSec] = useState<number>(30);
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(30);
  const levelStartTimeRef = useRef<number>(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopAudioDemoRef = useRef<(() => void) | null>(null);

  // Gemini Coach Data
  const [coachData, setCoachData] = useState<StationMasterResponse | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);

  // Load persisted progress on boot
  useEffect(() => {
    try {
      const savedLevel = localStorage.getItem('telegraph_level');
      if (savedLevel) {
        const lvl = parseInt(savedLevel, 10);
        if (lvl >= 1 && lvl <= GAME_LEVELS.length) {
          setCurrentLevel(lvl);
        }
      }
      const savedHighest = localStorage.getItem('telegraph_highest');
      if (savedHighest) {
        const hLvl = parseInt(savedHighest, 10);
        if (hLvl >= 1) {
          setHighestLevelReached(hLvl);
        }
      }
      const savedTiming = localStorage.getItem('telegraph_timing');
      if (savedTiming && TIMING_PRESETS[savedTiming as keyof typeof TIMING_PRESETS]) {
        setTimingDifficulty(TIMING_PRESETS[savedTiming as keyof typeof TIMING_PRESETS]);
      }
      const savedMotion = localStorage.getItem('telegraph_reduced_motion');
      if (savedMotion) {
        setReducedMotion(savedMotion === 'true');
      }

      setVolume(telegraphAudio.getVolume());
      setIsMuted(telegraphAudio.getMuted());
      setPitch(telegraphAudio.getPitch());
      setTrainSounds(telegraphAudio.getTrainSoundsEnabled());
    } catch (e) {
      console.warn('Storage load failed:', e);
    }
  }, []);

  // Audio unlock on first touch/pointerdown for mobile browsers
  useEffect(() => {
    const handleFirstTouch = () => {
      telegraphAudio.unlock();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('pointerdown', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  // Start Level Setup: SINGLE SOURCE OF TRUTH for level index and content
  const startLevel = useCallback(
    (lvlNum: number, skipLesson = false) => {
      // Clear any ongoing audio previews
      if (stopAudioDemoRef.current) {
        stopAudioDemoRef.current();
        stopAudioDemoRef.current = null;
      }

      const clampedLvl = Math.max(1, Math.min(GAME_LEVELS.length, lvlNum));
      const lvlConfig = GAME_LEVELS.find((l) => l.level === clampedLvl) || GAME_LEVELS[0];
      const targetMessage = lvlConfig.defaultMessage;

      // Update state and immediately persist
      setCurrentLevel(clampedLvl);
      try {
        localStorage.setItem('telegraph_level', clampedLvl.toString());
      } catch (e) {
        console.warn('Storage setItem failed:', e);
      }

      setHighestLevelReached((prev) => {
        const nextHighest = Math.max(prev, clampedLvl);
        try {
          localStorage.setItem('telegraph_highest', nextHighest.toString());
        } catch {}
        return nextHighest;
      });

      setCurrentMessage(targetMessage);
      setCharIndex(0);
      setLastFeedback(null);
      setStreak(0);
      setMistakes({});
      setCorrectCount(0);
      setAttemptCount(0);
      setCoachData(null);
      setShowHint(false);

      // Calculate total level time based on tape scroll speed (at least 28s, ~3.2s per letter)
      const allowedTime = Math.max(28, Math.round(targetMessage.length * 3.2));
      setTotalLevelTimeSec(allowedTime);
      setTimeRemainingSec(allowedTime);

      setAppState(skipLesson ? 'playing' : 'lesson');
      if (skipLesson) {
        levelStartTimeRef.current = performance.now();
      }
    },
    []
  );

  // Check ?autostart=1 query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        const savedLevel = localStorage.getItem('telegraph_level');
        const lvl = savedLevel ? parseInt(savedLevel, 10) : 1;
        startLevel(lvl && !isNaN(lvl) ? lvl : 1);
      }
    }
  }, [startLevel]);

  // Synchronize document.body.dataset.state for Ultra Mode verification
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (!hasEnteredOffice) {
        document.body.dataset.state = 'title';
      } else if (appState === 'title') {
        document.body.dataset.state = 'title';
      } else if (appState === 'playing' || appState === 'lesson') {
        document.body.dataset.state = 'playing';
      } else if (appState === 'paused') {
        document.body.dataset.state = 'paused';
      } else if (appState === 'summary' || appState === 'gameover') {
        document.body.dataset.state = 'gameover';
      } else {
        document.body.dataset.state = 'playing';
      }
    }
  }, [appState, hasEnteredOffice]);

  // Hook for Miss Sophia's Step 3 interactive practice tapping
  const handleHookPracticeDecoded = useCallback((cb: (letter: string) => void) => {
    practiceCallbackRef.current = cb;
    return () => {
      practiceCallbackRef.current = null;
    };
  }, []);

  // First launch: check if guided tour has been completed (only after entering the office!)
  useEffect(() => {
    if (!hasEnteredOffice) return;

    try {
      const tourCompleted = localStorage.getItem('telegraph_tour_completed');
      if (!tourCompleted) {
        startLevel(1, true);
        setIsTourOpen(true);
      }
    } catch (e) {
      console.warn('Tour check failed:', e);
    }
  }, [hasEnteredOffice, startLevel]);

  // Begin transmission after lesson card
  const handleBeginTransmission = () => {
    setAppState('playing');
    levelStartTimeRef.current = performance.now();
  };

  // Level Timer Tick Loop (paused during guided tour or when paused)
  useEffect(() => {
    if (appState === 'playing' && !isTourOpen) {
      playTimerRef.current = setInterval(() => {
        setTimeRemainingSec((prev) => {
          if (prev <= 0.1) {
            handleLevelTimeout();
            return 0;
          }
          return Math.max(0, prev - 0.2);
        });
      }, 200);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [appState, isTourOpen]);

  // Handle timeout (line went dead)
  const handleLevelTimeout = () => {
    setAppState('gameover');
  };

  // Fetch Station Master critique from Gemini Coach with fallback and abort timeout
  const fetchStationMasterCoach = async (
    levelNum: number,
    finalAccuracy: number,
    finalWpm: number,
    recordedMistakes: Record<string, number>
  ) => {
    setIsLoadingCoach(true);
    const currentConfig = GAME_LEVELS.find((l) => l.level === levelNum) || GAME_LEVELS[0];
    const nextConfig = GAME_LEVELS.find((l) => l.level === levelNum + 1);
    const nextMsg = nextConfig ? nextConfig.defaultMessage : 'QUICK SWITCH TRACK ZERO SAVED';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          level: levelNum,
          learnedLetters: Array.from(getLearnedLetters(levelNum)),
          mistakes: recordedMistakes,
          accuracy: finalAccuracy,
          wpm: finalWpm,
          storySummary: currentConfig.storyContext,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data: StationMasterResponse = await response.json();
      setCoachData(data);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Station Master Coach fetch error:', err);
      // Seamless fallback
      setCoachData({
        comment: `Capital discipline, apprentice! Accuracy at ${finalAccuracy}%. The wires hold firm down the line.`,
        nextMessage: nextMsg,
        storyBeat: currentConfig.storyBeat,
        fallback: true,
      });
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Telegraph Key Letter Decoded Listener
  const handleLetterDecoded = (decodedLetter: string) => {
    if (isTourOpen) {
      practiceCallbackRef.current?.(decodedLetter);
      return; // Do NOT evaluate against active level during guided tour!
    }
    if (appState !== 'playing') return;

    const expectedChar = currentMessage[charIndex];
    if (!expectedChar) return;

    setAttemptCount((prev) => prev + 1);

    if (decodedLetter === expectedChar) {
      // CORRECT!
      setLastFeedback('correct');
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const multiplier = newStreak >= 10 ? 3 : newStreak >= 5 ? 2 : 1;
      setScore((prev) => prev + 100 * multiplier);

      // Check next index (skip spaces)
      let nextIdx = charIndex + 1;
      while (nextIdx < currentMessage.length && currentMessage[nextIdx] === ' ') {
        nextIdx++;
      }

      if (nextIdx >= currentMessage.length) {
        // LEVEL SUCCESS!
        telegraphAudio.playSteamHiss();

        const elapsedSec = Math.max(1, (performance.now() - levelStartTimeRef.current) / 1000);
        const finalAccuracy = calculateAccuracy(correctCount + 1, attemptCount + 1);
        const finalWpm = calculateWPM(currentMessage.replace(/\s+/g, '').length, elapsedSec);

        // Update highest reached level
        const nextLvl = Math.min(GAME_LEVELS.length + 1, currentLevel + 1);
        if (nextLvl > highestLevelReached) {
          setHighestLevelReached(nextLvl);
          try {
            localStorage.setItem('telegraph_highest', nextLvl.toString());
          } catch {}
        }

        setAppState('summary');
        fetchStationMasterCoach(currentLevel, finalAccuracy, finalWpm, mistakes);
      } else {
        setCharIndex(nextIdx);
      }
    } else {
      // WRONG!
      setLastFeedback('wrong');
      setStreak(0);
      setMistakes((prev) => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1,
      }));
    }
  };

  // Audio preview helper that animates the key in sync
  const handlePlayAudioDemo = (letter: string, pattern: string) => {
    if (stopAudioDemoRef.current) {
      stopAudioDemoRef.current();
    }
    telegraphAudio.unlock();
    stopAudioDemoRef.current = telegraphAudio.playSequence(
      pattern,
      (active) => setExternalKeyActive(active),
      () => {
        setExternalKeyActive(false);
        stopAudioDemoRef.current = null;
      }
    );
  };

  // Keyboard Shortcuts: Esc to Pause, C for Codex
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (appState === 'playing') {
          setAppState('paused');
        } else if (appState === 'paused') {
          setAppState('playing');
        } else if (isCodexOpen) {
          setIsCodexOpen(false);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCodexOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, isCodexOpen]);

  // Reset Progress
  const handleResetProgress = () => {
    try {
      localStorage.removeItem('telegraph_level');
      localStorage.removeItem('telegraph_highest');
    } catch {}
    setCurrentLevel(1);
    setHighestLevelReached(1);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setAttemptCount(0);
    setIsSettingsOpen(false);
    setAppState('title');
  };

  const learnedLettersSet = getLearnedLetters(currentLevel);
  // Gauges: accuracy starts at 0 before any attempts, and WPM starts at 0
  const currentAccuracy = calculateAccuracy(correctCount, attemptCount);
  const elapsedSecLive =
    appState === 'playing' && levelStartTimeRef.current > 0
      ? Math.max(1, (performance.now() - levelStartTimeRef.current) / 1000)
      : 1;
  const currentWpm = attemptCount > 0 ? calculateWPM(correctCount, elapsedSecLive) : 0;

  // Train race metrics
  const totalLettersCount = currentMessage.replace(/\s+/g, '').length;
  const completedLettersCount = currentMessage.slice(0, charIndex).replace(/\s+/g, '').length;
  const totalMistakesCount = Object.values(mistakes).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`relative min-h-screen victorian-wood-bg flex flex-col justify-between overflow-x-hidden ${
        reducedMotion ? 'motion-reduce' : ''
      }`}
    >
      {/* Background Gas Lamp, Steam, and Interlocking Gears */}
      <AmbientOffice />

      {/* 0. ENTRY SCREEN: shown once per visit before anything else to unlock audio */}
      {!hasEnteredOffice && (
        <OfficeEntryScreen
          onEnter={handleEnterOffice}
          reducedMotion={reducedMotion}
        />
      )}

      {/* 1. TITLE SCREEN VIEW */}
      {hasEnteredOffice && appState === 'title' && (
        <TitleScreen
          currentLevel={currentLevel}
          highestLevelReached={highestLevelReached}
          onStartGame={() => {
            startLevel(currentLevel);
          }}
          onOpenLifeline={() => setAppState('lifeline')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
          onOpenStationMaster={() => {
            startLevel(currentLevel, true);
            setIsTourOpen(true);
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            telegraphAudio.setMuted(next);
          }}
        />
      )}

      {/* 2. LIFELINE ASSISTIVE MODE VIEW */}
      {hasEnteredOffice && appState === 'lifeline' && (
        <LifelineMode
          onBackToTitle={() => setAppState('title')}
          timingDifficulty={timingDifficulty}
        />
      )}

      {/* 3. ACTIVE GAMEPLAY & PAUSED VIEW */}
      {hasEnteredOffice &&
        (appState === 'playing' ||
          appState === 'paused' ||
          appState === 'lesson' ||
          appState === 'summary' ||
          appState === 'gameover') && (
        <main className="relative z-10 flex flex-col justify-between min-h-screen max-w-5xl mx-auto w-full px-2 sm:px-3 py-1 sm:py-2 select-none">
          {/* Top Victorian HUD Header */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-[#5c3e1c]/80 bg-[#1f1109]/50 rounded-lg mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAppState('title')}
                data-tour="office"
                className="px-2.5 py-1 rounded brass-button font-serif text-xs uppercase font-bold cursor-pointer shadow"
                aria-label="Return to Station Office"
              >
                ⌂ Office
              </button>
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[#d8af4b] font-bold">
                  LEVEL {currentLevel}: {GAME_LEVELS[currentLevel - 1]?.stationName}
                </span>
                <span className="text-[11px] text-[#caa758]/80 font-serif italic">
                  "{GAME_LEVELS[currentLevel - 1]?.title}"
                </span>
              </div>
            </div>

            {/* In-Game Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Hint Toggle Button */}
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className={`p-1.5 rounded transition-all cursor-pointer shadow flex items-center justify-center ${
                  showHint
                    ? 'bg-[#ffeaa7] border border-[#f59e0b] shadow-[0_0_12px_#f59e0b] scale-105 text-amber-950'
                    : 'brass-plate hover:scale-105 text-[#241306]'
                }`}
                aria-label="Toggle Morse Code Pattern Hint"
                title={showHint ? 'Hint Active (Click to Hide)' : 'Hint: Highlight Morse Pattern on Tape'}
              >
                <Lightbulb
                  className={`w-4 h-4 ${
                    showHint ? 'text-amber-800 animate-pulse' : 'text-[#241306]'
                  }`}
                />
              </button>

              <button
                onClick={() => setAppState((prev) => (prev === 'playing' ? 'paused' : 'playing'))}
                className="p-1.5 rounded brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
                aria-label={appState === 'paused' ? 'Resume Wire' : 'Pause Wire'}
                title="Pause [ESC]"
              >
                {appState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={() => startLevel(currentLevel)}
                className="p-1.5 rounded brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
                aria-label="Restart Wire Transmission"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCodexOpen(true)}
                data-tour="codex"
                className="p-1.5 rounded brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
                aria-label="Open Morse Codex [C]"
                title="Codex [C]"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow"
                aria-label="Open Apparatus Settings"
                title="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsTourOpen(true)}
                className="px-2 py-1 rounded brass-plate hover:scale-105 transition-transform text-[#241306] cursor-pointer shadow flex items-center gap-1 text-[11px] font-serif font-bold"
                aria-label="Miss Sophia Hartwell Guide"
                title="Miss Sophia Hartwell Guide"
              >
                <span>👩‍✈️</span>
                <span className="hidden sm:inline">Sophia</span>
              </button>
            </div>
          </div>

          {/* 1 & 3. RUNAWAY EXPRESS DISPATCH RACE & WIRE TAPE CONTAINER */}
          <div data-tour="race-and-tape" className="w-full flex flex-col gap-1">
            <LineDispatchRace
              currentLevel={currentLevel}
              totalLetters={totalLettersCount}
              completedLetters={completedLettersCount}
              timeRemainingRatio={timeRemainingSec / Math.max(1, totalLevelTimeSec)}
              isPaused={appState !== 'playing'}
              mistakesCount={totalMistakesCount}
              reducedMotion={reducedMotion}
            />

            {/* 2. FOUR BRASS GAUGES (SCORE, STREAK, ACCURACY, CADENCE) */}
            <div data-tour="gauges">
              <Gauges
                score={score}
                streak={streak}
                accuracy={currentAccuracy}
                wpm={currentWpm}
              />
            </div>

            {/* 3. INCOMING WIRE TAPE */}
            <TickerTape
              message={currentMessage}
              currentIndex={charIndex}
              lastFeedback={lastFeedback}
              speedPxPerSec={GAME_LEVELS[currentLevel - 1]?.tapeSpeedPxPerSec || 28}
              isPaused={appState !== 'playing'}
              onTimeout={handleLevelTimeout}
              showHint={showHint}
            />
          </div>

          {/* 3.5. MISS SOPHIA HARTWELL LIVE GAMEPLAY REACTIONS */}
          <SophiaGameplayBubble
            streak={streak}
            trainProgress={Math.min(
              1,
              Math.max(
                0,
                1 - timeRemainingSec / Math.max(1, totalLevelTimeSec) + totalMistakesCount * 0.04
              )
            )}
            isTension={timeRemainingSec / Math.max(1, totalLevelTimeSec) <= 0.25}
            mistakes={mistakes}
            isPaused={appState !== 'playing'}
            reducedMotion={reducedMotion}
          />

          {/* 4. CIRCUIT OPEN / STANDBY & TACTILE BRASS TELEGRAPH KEY */}
          <div data-tour="key" className="mt-auto pb-1">
            <TelegraphKey
              timingDifficulty={timingDifficulty}
              onLetterDecoded={handleLetterDecoded}
              externalActive={externalKeyActive}
              disabled={appState !== 'playing' && !isTourOpen}
            />
          </div>
        </main>
      )}

      {/* PRE-LEVEL LESSON MODAL */}
      {appState === 'lesson' && !isTourOpen && (
        <LessonCardModal
          levelNumber={currentLevel}
          onStartLevel={handleBeginTransmission}
          onHearLetter={handlePlayAudioDemo}
        />
      )}

      {/* PAUSE MODAL */}
      {appState === 'paused' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Transmission Paused"
        >
          <div className="parchment-sheet rounded-xl p-6 sm:p-8 max-w-sm w-full border-4 border-[#8c6527] shadow-2xl text-center flex flex-col items-center">
            <div className="brass-rivet mb-2" />
            <h2 className="text-2xl font-serif font-black text-[#291708] mb-1">
              Wire Paused
            </h2>
            <p className="text-xs text-[#734c1f] font-serif italic mb-6">
              The 9:15 Express continues down the line. Resume dispatch promptly!
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => setAppState('playing')}
                data-start="true"
                className="w-full py-2.5 rounded-lg brass-button font-serif font-bold text-sm uppercase tracking-wider shadow cursor-pointer"
              >
                Resume Dispatch [ESC]
              </button>
              <button
                onClick={() => startLevel(currentLevel)}
                className="w-full py-2 rounded-lg bg-[#ebdcb5] border border-[#a87e38] text-[#543615] font-serif font-bold text-xs uppercase hover:bg-[#f2e6c7] cursor-pointer"
              >
                Restart Current Wire
              </button>
              <button
                onClick={() => setAppState('title')}
                className="w-full py-2 rounded-lg bg-[#ebdcb5] border border-[#a87e38] text-[#543615] font-serif font-bold text-xs uppercase hover:bg-[#f2e6c7] cursor-pointer"
              >
                Return to Station Office
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL SUMMARY / GAME OVER MODAL */}
      {(appState === 'summary' || appState === 'gameover') && (
        <LevelSummaryModal
          levelNumber={currentLevel}
          isSuccess={appState === 'summary'}
          score={score}
          accuracy={currentAccuracy}
          bestStreak={bestStreak}
          wpm={currentWpm}
          mistakes={mistakes}
          stationMasterData={coachData}
          isLoadingCoach={isLoadingCoach}
          onRetry={() => startLevel(currentLevel)}
          onNextLevel={() => {
            // Check if all 13 levels completed
            if (currentLevel >= 13) {
              setIsFinalVictory(true);
              setAppState('map');
              return;
            }
            // Advance level index and immediately persist before moving to map
            const nextLvl = currentLevel + 1;
            setCurrentLevel(nextLvl);
            try {
              localStorage.setItem('telegraph_level', nextLvl.toString());
              localStorage.setItem(
                'telegraph_highest',
                Math.max(highestLevelReached, nextLvl).toString()
              );
            } catch {}
            setHighestLevelReached((prev) => Math.max(prev, nextLvl));
            setAppState('map');
          }}
          onReturnToOffice={() => setAppState('title')}
          isGameComplete={isFinalVictory || currentLevel === 13}
        />
      )}

      {/* LINE DISPATCH GWR MAIN LINE MAP TRANSITION SCREEN */}
      {appState === 'map' && (
        <LineDispatchMap
          completedLevel={isFinalVictory ? 13 : Math.max(1, currentLevel - 1)}
          finalScore={score}
          finalAccuracy={currentAccuracy}
          onBeginNextLevel={(nextLvl) => {
            startLevel(nextLvl);
          }}
          onReturnToOffice={() => setAppState('title')}
          onPlayMorseAudio={handlePlayAudioDemo}
          reducedMotion={reducedMotion}
        />
      )}

      {/* MORSE REFERENCE CODEX DRAWER */}
      <MorseChartDrawer
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        learnedLetters={learnedLettersSet}
        onPlayPattern={handlePlayAudioDemo}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timingDifficulty={timingDifficulty}
        onTimingChange={(tier) => {
          setTimingDifficulty(tier);
          try {
            localStorage.setItem('telegraph_timing', tier.name);
          } catch {}
        }}
        volume={volume}
        onVolumeChange={(vol) => {
          setVolume(vol);
          telegraphAudio.setVolume(vol);
          syncSophiaVoiceVolume();
        }}
        isMuted={isMuted}
        onMuteToggle={(muted) => {
          setIsMuted(muted);
          telegraphAudio.setMuted(muted);
          syncSophiaVoiceVolume();
        }}
        pitch={pitch}
        onPitchChange={(p) => {
          setPitch(p);
          telegraphAudio.setPitch(p);
        }}
        trainSounds={trainSounds}
        onToggleTrainSounds={(ts) => {
          setTrainSounds(ts);
          telegraphAudio.setTrainSoundsEnabled(ts);
        }}
        voiceEnabled={voiceEnabled}
        onToggleVoice={(val) => {
          setVoiceEnabledState(val);
          setVoiceEnabled(val);
        }}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={(rm) => {
          setReducedMotion(rm);
          try {
            localStorage.setItem('telegraph_reduced_motion', rm ? 'true' : 'false');
          } catch {}
        }}
        onResetProgress={handleResetProgress}
      />

      {/* HOW TO PLAY APPRENTICE MANUAL MODAL */}
      <HowToPlayModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* MISS SOPHIA HARTWELL INTERACTIVE GUIDED TOUR */}
      <SophiaTour
        isOpen={hasEnteredOffice && isTourOpen}
        onComplete={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('telegraph_tour_completed', 'true');
          } catch {}
          if (appState !== 'playing' && appState !== 'lesson') {
            setAppState('playing');
          }
        }}
        onSkip={() => {
          setIsTourOpen(false);
          try {
            localStorage.setItem('telegraph_tour_completed', 'true');
          } catch {}
          if (appState !== 'playing' && appState !== 'lesson') {
            setAppState('playing');
          }
        }}
        reducedMotion={reducedMotion}
        onPracticeLetterDecoded={handleHookPracticeDecoded}
      />
    </div>
  );
}
