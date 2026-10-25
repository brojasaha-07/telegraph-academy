import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { SophiaAvatar, SophiaPose } from './SophiaAvatar';
import { telegraphAudio } from '../audio/telegraphAudio';
import {
  SOPHIA_VOICE_TRACKS,
  isVoiceEnabled,
  setVoiceEnabled,
  subscribeVoiceEnabled,
  playSophiaVoice,
  stopSophiaVoice,
} from '../audio/sophiaVoice';

interface SophiaTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  reducedMotion?: boolean;
  // External hook into telegraph key decoding for Step 3 interactive practice
  onPracticeLetterDecoded?: (callback: (letter: string) => void) => () => void;
}

interface TourStep {
  step: number;
  pose: SophiaPose;
  title: string;
  text: string;
  targetSelector?: string;
  isInteractivePractice?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    pose: 'waving',
    title: 'Welcome to the Telegraph Office',
    text: "Good day! I am Miss Sophia Hartwell, Station Master here at the Great Western Railway telegraph office. An emergency has arisen: the 9:15 Express is a runaway train hurtling toward the collapsed bridge at Ravenscar Gorge! Only our telegraph signals can race down the wire to throw the safety switch in time!",
  },
  {
    step: 2,
    pose: 'pointing',
    title: 'The Brass Telegraph Instrument',
    text: "This is your brass telegraph instrument. A brisk, light tap produces a dot (•); holding it down produces a dash (—). Pause briefly for about 0.7 seconds to complete and seal each letter.",
    targetSelector: '[data-tour="key"]',
  },
  {
    step: 3,
    pose: 'pointing',
    title: 'Interactive Practice: Letter E',
    text: "Try it now, apprentice! Tap the letter 'E': just one quick dot on the brass key or spacebar.",
    targetSelector: '[data-tour="key"]',
    isInteractivePractice: true,
  },
  {
    step: 4,
    pose: 'pointing',
    title: 'The Line Race & Incoming Wire Tape',
    text: "Above is our incoming wire tape and the line dispatch race. Each correct letter you tap pushes our electric signal pulse forward to the next pole; hesitation or mistakes allow the runaway engine to gain ground!",
    targetSelector: '[data-tour="race-and-tape"]',
  },
  {
    step: 5,
    pose: 'pointing',
    title: 'The Master Apparatus Gauges',
    text: "These four brass instruments register your Score, consecutive Streak, Accuracy percentage, and Cadence in Words Per Minute. Maintain a high cadence to outpace the steam locomotive!",
    targetSelector: '[data-tour="gauges"]',
  },
  {
    step: 6,
    pose: 'pointing',
    title: 'The Telegrapher\'s Codex',
    text: "If you ever hesitate or forget a letter's Morse pattern, press 'C' on your keyboard or tap the Codex book icon to inspect the complete telegrapher's code table.",
    targetSelector: '[data-tour="codex"]',
  },
  {
    step: 7,
    pose: 'pointing',
    title: 'Lifeline Assistive Mode',
    text: "In the station office you will also find Lifeline Mode. Morse code is miraculous: it enables individuals who cannot speak or type with both hands to communicate with a single switch, a tap, or a blink.",
    targetSelector: '[data-tour="office"]',
  },
  {
    step: 8,
    pose: 'cheering',
    title: 'The Line Awaits!',
    text: "Off you go, apprentice! 300 souls aboard the 9:15 Express are counting on your steady hand. Send the dispatch and save the line!",
  },
];

type PracticeStatus =
  | { type: 'idle' }
  | { type: 'correct' }
  | { type: 'wrong'; letter: string; attempt: number };

export const SophiaTour: React.FC<SophiaTourProps> = ({
  isOpen,
  onComplete,
  onSkip,
  reducedMotion = false,
  onPracticeLetterDecoded,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [practiceStatus, setPracticeStatus] = useState<PracticeStatus>({ type: 'idle' });
  const [currentPose, setCurrentPose] = useState<SophiaPose>('waving');
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => isVoiceEnabled());

  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStep = TOUR_STEPS[currentStepIndex];

  // Subscribe to external voice setting changes
  useEffect(() => {
    return subscribeVoiceEnabled((enabled) => {
      setVoiceOn(enabled);
    });
  }, []);

  // Reset state when opening tour
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setPracticeStatus({ type: 'idle' });
    } else {
      stopSophiaVoice();
    }
  }, [isOpen]);

  // Compute current line content, voice URL, pose, and completion state
  const { lineText, voiceTrackUrl, linePose, isPracticeSuccess } = useMemo(() => {
    if (currentStep.step === 3 && currentStep.isInteractivePractice) {
      if (practiceStatus.type === 'correct') {
        return {
          lineText: "Splendid tapping, apprentice! You've got the true Victorian spark! Letter 'E' is registered.",
          voiceTrackUrl: SOPHIA_VOICE_TRACKS.step_03_correct,
          linePose: 'cheering' as SophiaPose,
          isPracticeSuccess: true,
        };
      }
      if (practiceStatus.type === 'wrong') {
        return {
          lineText: `Careful now! A dot is a brisk, light tap under a quarter-second. You tapped '${practiceStatus.letter}'. Try 'E' again!`,
          voiceTrackUrl: SOPHIA_VOICE_TRACKS.step_03_wrong,
          linePose: 'worried' as SophiaPose,
          isPracticeSuccess: false,
        };
      }
      return {
        lineText: currentStep.text,
        voiceTrackUrl: SOPHIA_VOICE_TRACKS.step_03_prompt,
        linePose: currentStep.pose,
        isPracticeSuccess: false,
      };
    }

    const voiceMap: Record<number, string> = {
      1: SOPHIA_VOICE_TRACKS.step_01,
      2: SOPHIA_VOICE_TRACKS.step_02,
      4: SOPHIA_VOICE_TRACKS.step_04,
      5: SOPHIA_VOICE_TRACKS.step_05,
      6: SOPHIA_VOICE_TRACKS.step_06,
      7: SOPHIA_VOICE_TRACKS.step_07,
      8: SOPHIA_VOICE_TRACKS.step_08,
    };

    return {
      lineText: currentStep.text,
      voiceTrackUrl: voiceMap[currentStep.step] || '',
      linePose: currentStep.pose,
      isPracticeSuccess: false,
    };
  }, [currentStep, practiceStatus]);

  // Update spotlight element position
  const updateSpotlight = useCallback(() => {
    if (!currentStep.targetSelector) {
      setTargetRect(null);
      document.querySelectorAll('.tour-spotlight-active').forEach((el) => {
        el.classList.remove('tour-spotlight-active');
      });
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      document.querySelectorAll('.tour-spotlight-active').forEach((e) => {
        e.classList.remove('tour-spotlight-active');
      });
      el.classList.add('tour-spotlight-active');
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    } else {
      setTargetRect(null);
    }
  }, [currentStep.targetSelector, reducedMotion]);

  // Recalculate on window resize or step change
  useEffect(() => {
    if (!isOpen) {
      document.querySelectorAll('.tour-spotlight-active').forEach((el) => {
        el.classList.remove('tour-spotlight-active');
      });
      return;
    }

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      document.querySelectorAll('.tour-spotlight-active').forEach((el) => {
        el.classList.remove('tour-spotlight-active');
      });
    };
  }, [isOpen, currentStepIndex, updateSpotlight]);

  // Typewriter effect & Synchronized Voice Playback
  useEffect(() => {
    if (!isOpen) {
      stopSophiaVoice();
      return;
    }

    // Stop any ongoing voice audio so recordings never overlap
    stopSophiaVoice();
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    setCurrentPose(linePose);

    // Reduced motion fast path
    if (reducedMotion) {
      setDisplayedText(lineText);
      setIsTypingComplete(true);
      if (voiceOn && !telegraphAudio.getMuted() && voiceTrackUrl) {
        playSophiaVoice(voiceTrackUrl);
      }
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);

    // Standard typewriter fallback (approx 20ms per 2 characters)
    const runFallbackTypewriter = () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      let charIdx = 0;
      typewriterTimerRef.current = setInterval(() => {
        charIdx += 2;
        if (charIdx >= lineText.length) {
          setDisplayedText(lineText);
          setIsTypingComplete(true);
          if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
        } else {
          setDisplayedText(lineText.slice(0, charIdx));
        }
      }, 20);
    };

    // If voice is disabled or sound is muted, run typewriter immediately
    if (!voiceOn || telegraphAudio.getMuted() || !voiceTrackUrl) {
      runFallbackTypewriter();
      return;
    }

    let isAudioDriving = false;
    // Safety timer to prevent hanging if audio loading is stalled
    const audioHangTimer = setTimeout(() => {
      if (!isAudioActive) {
        runFallbackTypewriter();
      }
    }, 250);

    let isAudioActive = false;
    const stopVoice = playSophiaVoice(voiceTrackUrl, {
      onProgress: (progress) => {
        isAudioDriving = true;
        isAudioActive = true;
        clearTimeout(audioHangTimer);
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        const count = Math.min(lineText.length, Math.floor(progress * lineText.length));
        setDisplayedText(lineText.slice(0, count));
      },
      onEnded: () => {
        clearTimeout(audioHangTimer);
        setDisplayedText(lineText);
        setIsTypingComplete(true);
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
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      stopVoice();
    };
  }, [isOpen, currentStepIndex, lineText, voiceTrackUrl, linePose, reducedMotion, voiceOn]);

  // Handle Practice Key Listener for Step 3
  useEffect(() => {
    if (!isOpen || !currentStep.isInteractivePractice || !onPracticeLetterDecoded) return;

    const cleanup = onPracticeLetterDecoded((decodedLetter: string) => {
      if (decodedLetter === 'E') {
        setPracticeStatus({ type: 'correct' });
      } else {
        // Tapped wrong letter
        setPracticeStatus((prev) => ({
          type: 'wrong',
          letter: decodedLetter,
          attempt: prev.type === 'wrong' ? prev.attempt + 1 : 1,
        }));
      }
    });

    return () => cleanup();
  }, [isOpen, currentStep.isInteractivePractice, onPracticeLetterDecoded]);

  // Fast forward typewriter on speech bubble click
  const handleBubbleClick = () => {
    if (!isTypingComplete) {
      stopSophiaVoice();
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setDisplayedText(lineText);
      setIsTypingComplete(true);
    }
  };

  const handleToggleVoice = () => {
    const nextVal = !voiceOn;
    setVoiceOn(nextVal);
    setVoiceEnabled(nextVal);
  };

  const handleNext = () => {
    stopSophiaVoice();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setPracticeStatus({ type: 'idle' });
    } else {
      onComplete();
    }
  };

  if (!isOpen) return null;

  const isTargetAtBottom = currentStep.targetSelector === '[data-tour="key"]';

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex flex-col ${
        isTargetAtBottom ? 'justify-start pt-3 sm:pt-6' : 'justify-end pb-3 sm:pb-5'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Guided Tour with Miss Sophia Hartwell"
    >
      {/* Dimmed backdrop overlay with cutout hole over targetRect */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-auto"
        style={
          targetRect
            ? {
                clipPath: `polygon(
                  0% 0%,
                  0% 100%,
                  ${Math.max(0, targetRect.left - 6)}px 100%,
                  ${Math.max(0, targetRect.left - 6)}px ${Math.max(0, targetRect.top - 6)}px,
                  ${Math.min(typeof window !== 'undefined' ? window.innerWidth : 1000, targetRect.right + 6)}px ${Math.max(0, targetRect.top - 6)}px,
                  ${Math.min(typeof window !== 'undefined' ? window.innerWidth : 1000, targetRect.right + 6)}px ${Math.min(typeof window !== 'undefined' ? window.innerHeight : 1000, targetRect.bottom + 6)}px,
                  ${Math.max(0, targetRect.left - 6)}px ${Math.min(typeof window !== 'undefined' ? window.innerHeight : 1000, targetRect.bottom + 6)}px,
                  ${Math.max(0, targetRect.left - 6)}px 100%,
                  100% 100%,
                  100% 0%
                )`,
              }
            : undefined
        }
        onClick={handleBubbleClick}
      />

      {/* Cutout/Spotlight Ring around target element if present */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-lg border-2 border-[#f5cf53] shadow-[0_0_20px_#f5cf53,0_0_50px_rgba(245,207,83,0.4)] transition-all duration-300"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            zIndex: 55,
          }}
        />
      )}

      {/* Miss Sophia & Speech Bubble Container */}
      <div className="relative z-55 w-full max-w-4xl mx-auto px-3 flex flex-col-reverse sm:flex-row items-center sm:items-end gap-2 sm:gap-4 pointer-events-none">
        {/* Sophia Character Avatar */}
        <div className="pointer-events-auto flex-shrink-0 -mb-2 sm:-mb-3 z-20">
          <SophiaAvatar
            pose={currentPose}
            size="md"
            reducedMotion={reducedMotion}
            className="filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] sm:w-44 sm:h-60"
          />
        </div>

        {/* Parchment Speech Bubble with Brass Border & Rivets */}
        <div
          onClick={handleBubbleClick}
          className="pointer-events-auto relative flex-1 parchment-sheet rounded-xl p-3.5 sm:p-5 border-3 border-[#8c6527] shadow-[0_16px_40px_rgba(0,0,0,0.85)] cursor-pointer text-[#291708] mb-1 sm:mb-4 w-full"
        >
          {/* Decorative Corner Rivets */}
          <div className="absolute top-1.5 left-1.5 brass-rivet" />
          <div className="absolute top-1.5 right-1.5 brass-rivet" />
          <div className="absolute bottom-1.5 left-1.5 brass-rivet" />
          <div className="absolute bottom-1.5 right-1.5 brass-rivet" />

          {/* Speech Bubble Tail pointing towards Sophia (Desktop: left toward Sophia) */}
          <div className="hidden sm:block absolute -left-3.5 bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[14px] border-r-[#8c6527]" />
          <div className="hidden sm:block absolute -left-2.5 bottom-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-[#f3ebcb]" />

          {/* Mobile Tail pointing down to Sophia below it */}
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 -bottom-3.5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-[#8c6527]" />
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 -bottom-2.5 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-[#f3ebcb]" />

          {/* Header Row: Title, Voice Toggle & Step Counter */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#b88c2b]/50">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a4816]">
                Miss Sophia Hartwell · Station Master (1887)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice On/Off Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVoice();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-serif font-bold border transition-colors cursor-pointer ${
                  voiceOn
                    ? 'bg-[#eddab4] border-[#a87f3b] text-[#523311] hover:bg-[#faedd0]'
                    : 'bg-[#ddcca3] border-[#967332] text-[#6b471c] hover:bg-[#e6d7b5]'
                }`}
                title={voiceOn ? 'Sophia voice narration active — click to turn off' : 'Sophia voice narration off — click to turn on'}
                aria-label={voiceOn ? 'Turn voice off' : 'Turn voice on'}
              >
                {voiceOn ? (
                  <>
                    <Volume2 className="w-3 h-3 text-[#7a4816]" />
                    <span>Voice ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 text-[#8a571f]" />
                    <span>Voice OFF</span>
                  </>
                )}
              </button>

              <span className="text-[10px] font-serif font-bold text-[#8a571f] px-2 py-0.5 rounded bg-[#eddab4] border border-[#a87f3b]">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          {/* Step Headline */}
          <h3 className="text-base sm:text-lg font-serif font-black text-[#2e1708] mb-1.5">
            {currentStep.title}
          </h3>

          {/* Typewriter Speech Text */}
          <p className="text-xs sm:text-sm font-serif italic text-[#3a200d] leading-relaxed min-h-[50px] mb-3">
            "{displayedText}"
            {!isTypingComplete && <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#8c591c] animate-pulse" />}
          </p>

          {/* Interactive practice notice if awaiting tap */}
          {currentStep.isInteractivePractice && !isPracticeSuccess && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-[#faedd0] border border-[#d4af37] flex items-center justify-between text-xs text-[#523311]">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                Tap key below or press [SPACE] for 'E' (•)
              </span>
              <span className="font-mono text-sm font-bold bg-[#e8d2a0] px-2 py-0.5 rounded">
                • (1 Quick Dot)
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#b88c2b]/40">
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopSophiaVoice();
                onSkip();
              }}
              className="text-xs font-serif text-[#7d501e] hover:text-[#2d1706] underline cursor-pointer"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stopSophiaVoice();
                    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                    setPracticeStatus({ type: 'idle' });
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#ead9b2] border border-[#a87f3b] text-[#523311] font-serif font-bold text-xs uppercase hover:bg-[#f2e4c4] cursor-pointer"
                >
                  ◂ Back
                </button>
              )}

              {/* Show Next button (if interactive, require practice success) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopSophiaVoice();
                  handleNext();
                }}
                disabled={currentStep.isInteractivePractice && !isPracticeSuccess}
                className={`px-4 py-1.5 rounded-lg font-serif font-bold text-xs uppercase tracking-wider shadow cursor-pointer transition-all ${
                  currentStep.isInteractivePractice && !isPracticeSuccess
                    ? 'opacity-50 cursor-not-allowed bg-amber-200 text-amber-900 border border-amber-400'
                    : 'brass-button'
                }`}
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? 'Begin Dispatch ▸' : 'Next ▸'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
