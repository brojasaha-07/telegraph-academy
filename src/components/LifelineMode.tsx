import React, { useState, useEffect, useRef } from 'react';
import { TelegraphKey } from './TelegraphKey';
import { MorseChartDrawer } from './MorseChartDrawer';
import { TIMING_PRESETS, TimingDifficulty } from '../game/morse';
import { telegraphAudio } from '../audio/telegraphAudio';
import { Volume2, Delete, Trash2, Copy, Check, BookOpen, ArrowLeft } from 'lucide-react';

interface LifelineModeProps {
  onBackToTitle: () => void;
  timingDifficulty: TimingDifficulty;
}

export const LifelineMode: React.FC<LifelineModeProps> = ({
  onBackToTitle,
  timingDifficulty,
}) => {
  const [composedText, setComposedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isChartOpen, setIsChartOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<'natural' | 'basic'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeline_voice_mode');
      if (saved === 'basic' || saved === 'natural') return saved;
    }
    return 'natural';
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAbortRef = useRef<AbortController | null>(null);

  // Stop any playing audio or ongoing speech synthesis
  const stopAllSpeech = () => {
    if (currentAbortRef.current) {
      currentAbortRef.current.abort();
      currentAbortRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.removeAttribute('src');
        currentAudioRef.current.load();
      } catch {
        // safe fallback
      }
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // safe fallback
      }
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const handleVoiceModeChange = (mode: 'natural' | 'basic') => {
    setVoiceMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeline_voice_mode', mode);
    }
  };

  // Append decoded letter
  const handleLetterDecoded = (letter: string) => {
    if (letter && letter !== '?') {
      setComposedText((prev) => prev + letter);
    }
  };

  // Append word space
  const handleWordSpace = () => {
    setComposedText((prev) => (prev.endsWith(' ') || !prev ? prev : prev + ' '));
  };

  // Backspace
  const handleBackspace = () => {
    setComposedText((prev) => prev.slice(0, -1));
  };

  // Clear
  const handleClear = () => {
    stopAllSpeech();
    setComposedText('');
  };

  // Copy with fallback for iframes/restricted environments
  const handleCopy = () => {
    if (!composedText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(composedText)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy(composedText);
        });
    } else {
      fallbackCopy(composedText);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.warn('Copy fallback failed:', e);
    }
  };

  // Browser speech synthesis fallback
  const speakWithBrowser = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';

      // Respect master volume & mute settings
      const vol = telegraphAudio.getMuted() ? 0 : telegraphAudio.getVolume();
      utterance.volume = Math.max(0, Math.min(1, vol));

      // Pick British English or available natural voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find((v) => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) ||
        voices[0];
      if (enVoice) {
        utterance.voice = enVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Browser speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  // Speak handler supporting ElevenLabs TTS with automatic 5s/failure fallback to browser speech
  const handleSpeak = async () => {
    const textToSpeak = composedText.trim();
    if (!textToSpeak) return;

    // Reset any previous speech
    stopAllSpeech();

    // If basic browser speech is selected, use it directly
    if (voiceMode === 'basic') {
      speakWithBrowser(textToSpeak);
      return;
    }

    // Natural mode: call ElevenLabs backend proxy
    setIsSpeaking(true);

    const abortController = new AbortController();
    currentAbortRef.current = abortController;

    // 5-second timeout: automatically fall back to browser speech if exceeded
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, 5000);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`ElevenLabs TTS responded with ${response.status}. Falling back to browser speech.`);
        speakWithBrowser(textToSpeak);
        return;
      }

      const audioBlob = await response.blob();
      if (!audioBlob || audioBlob.size === 0) {
        console.warn('ElevenLabs TTS returned empty audio. Falling back to browser speech.');
        speakWithBrowser(textToSpeak);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Respect master volume & mute settings
      const vol = telegraphAudio.getMuted() ? 0 : telegraphAudio.getVolume();
      audio.volume = Math.max(0, Math.min(1, vol));

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      };

      audio.onerror = () => {
        console.warn('ElevenLabs audio playback failed. Falling back to browser speech.');
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        speakWithBrowser(textToSpeak);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn('Audio play rejected. Falling back to browser speech:', playErr);
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          speakWithBrowser(textToSpeak);
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(
        timedOut
          ? 'ElevenLabs request timed out (>5s). Falling back to browser speech.'
          : 'ElevenLabs request failed. Falling back to browser speech:',
        err?.message || err
      );
      speakWithBrowser(textToSpeak);
    }
  };

  // Quick phrase insertion
  const handleAddPhrase = (phrase: string) => {
    setComposedText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${phrase} ` : `${phrase} `;
    });
  };

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-[90vh]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#5c3e1c]">
        <button
          onClick={onBackToTitle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded brass-button font-serif font-bold text-xs uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Lifeline</span>
        </button>

        <div className="text-center">
          <h1 className="font-serif text-xl sm:text-2xl font-black text-[#f7d774] tracking-wide">
            Lifeline Telegraph
          </h1>
          <span className="text-[11px] text-[#cca550] uppercase tracking-widest font-semibold">
            Single-Switch Assistive Voice Communicator
          </span>
        </div>

        <button
          onClick={() => setIsChartOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded brass-button font-serif font-bold text-xs uppercase cursor-pointer"
          title="Open Morse Code Chart [C]"
        >
          <BookOpen className="w-4 h-4" />
          <span>Codex</span>
        </button>
      </div>

      {/* Assistive Mission Statement Banner */}
      <div className="mb-3 p-3 rounded-lg bg-[#2b170c] border border-[#7a4c17] text-xs sm:text-sm font-serif italic text-[#ffebbd] text-center leading-relaxed shadow-sm">
        "Morse code lets people who cannot speak communicate with a single button — a blink, a tap, or a breath is enough."
      </div>

      {/* Voice Mode Selector Toggle */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg bg-[#241308]/90 border border-[#6b4317] shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-serif font-bold text-[#f7d774] tracking-wide">
            Voice:
          </span>
          <div className="inline-flex rounded-md p-0.5 bg-[#140b05] border border-[#7a4c17]">
            <button
              type="button"
              onClick={() => handleVoiceModeChange('natural')}
              className={`px-3 py-1 rounded text-xs font-serif font-bold transition-all cursor-pointer ${
                voiceMode === 'natural'
                  ? 'bg-[#c89b3c] text-[#241407] shadow-sm'
                  : 'text-[#caa758] hover:text-[#ffebbd]'
              }`}
              aria-pressed={voiceMode === 'natural'}
            >
              Natural (ElevenLabs)
            </button>
            <button
              type="button"
              onClick={() => handleVoiceModeChange('basic')}
              className={`px-3 py-1 rounded text-xs font-serif font-bold transition-all cursor-pointer ${
                voiceMode === 'basic'
                  ? 'bg-[#c89b3c] text-[#241407] shadow-sm'
                  : 'text-[#caa758] hover:text-[#ffebbd]'
              }`}
              aria-pressed={voiceMode === 'basic'}
            >
              Basic (browser)
            </button>
          </div>
        </div>

        <span className="text-[11px] font-serif text-[#caa758]/90 italic">
          {voiceMode === 'natural'
            ? 'ElevenLabs low-latency voice (auto-fallback if slow/unavailable)'
            : 'Standard browser speech synthesis'}
        </span>
      </div>

      {/* Main Parchment Message Display Box */}
      <div className="relative w-full rounded-xl parchment-sheet p-4 sm:p-6 border-4 border-[#8c6527] shadow-[0_12px_30px_rgba(0,0,0,0.85)] mb-4 flex flex-col min-h-[160px] sm:min-h-[190px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#b58b45]">
          <span className="text-xs uppercase tracking-widest text-[#784d1c] font-bold">
            Transcribed Text:
          </span>
          <span className="text-[11px] text-[#8c632e] font-serif">
            {composedText.length} characters · {composedText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <div className="flex-1 font-mono text-2xl sm:text-3xl font-black text-[#1c1108] whitespace-pre-wrap break-words min-h-[80px] select-text">
          {composedText || (
            <span className="text-[#a68c6a] italic font-serif text-lg font-normal">
              Tap the telegraph key below with dots and dashes to compose text...
            </span>
          )}
        </div>

        {/* Quick Voice & Editing Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[#bfa262]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSpeak}
              disabled={!composedText}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-serif font-bold text-sm uppercase tracking-wide cursor-pointer shadow transition-all ${
                composedText
                  ? 'brass-button'
                  : 'bg-[#cfb989] text-[#705531] opacity-50 cursor-not-allowed'
              }`}
              aria-label="Read text aloud"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-[#241407]' : ''}`} />
              <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
            </button>

            {/* Small brass "Speaking..." indicator while loading and playing */}
            {isSpeaking && (
              <div
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f7d774] to-[#c89b3c] text-[#241306] font-serif font-bold text-xs uppercase tracking-wider shadow border border-[#fff2a8] animate-pulse"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b1e1e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8b1e1e]"></span>
                </span>
                <span>Speaking...</span>
              </div>
            )}

            <button
              onClick={handleCopy}
              disabled={!composedText}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-serif font-bold uppercase tracking-wider cursor-pointer shadow ${
                composedText
                  ? 'bg-[#e2d09f] border border-[#a87e35] text-[#2e1908] hover:bg-[#ebdcae]'
                  : 'bg-[#cfb989] text-[#705531] opacity-50 cursor-not-allowed'
              }`}
              aria-label="Copy text to clipboard"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-800" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWordSpace}
              className="px-3 py-2 rounded-lg bg-[#e2d09f] border border-[#a87e35] text-[#2e1908] hover:bg-[#ebdcae] text-xs font-serif font-bold uppercase tracking-wider cursor-pointer shadow"
              aria-label="Insert space"
            >
              ␣ Space
            </button>

            <button
              onClick={handleBackspace}
              disabled={!composedText}
              className="p-2 rounded-lg bg-[#e2d09f] border border-[#a87e35] text-[#2e1908] hover:bg-[#ebdcae] disabled:opacity-40 cursor-pointer shadow"
              aria-label="Backspace"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              disabled={!composedText}
              className="p-2 rounded-lg bg-[#e2d09f] border border-[#a87e35] text-red-900 hover:bg-[#ebdcae] disabled:opacity-40 cursor-pointer shadow"
              aria-label="Clear all text"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Phrase Buttons for fast accessibility */}
      <div className="mb-4 flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs uppercase font-serif tracking-widest text-[#caa758] mr-1">
          Quick Words:
        </span>
        {['YES', 'NO', 'HELP', 'THANK YOU', 'PLEASE', 'WATER'].map((phrase) => (
          <button
            key={phrase}
            onClick={() => handleAddPhrase(phrase)}
            className="px-3.5 py-1.5 rounded-md brass-plate font-serif font-bold text-xs uppercase tracking-wider text-[#241306] hover:scale-105 transition-transform cursor-pointer shadow"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Central Interactive Telegraph Key */}
      <div className="mt-auto">
        <TelegraphKey
          timingDifficulty={timingDifficulty}
          onLetterDecoded={handleLetterDecoded}
          onWordSpace={handleWordSpace}
          freeTapMode={true}
        />
      </div>

      {/* Morse Reference Codex Drawer */}
      <MorseChartDrawer
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        learnedLetters={new Set()}
        allUnlocked={true}
      />
    </div>
  );
};

