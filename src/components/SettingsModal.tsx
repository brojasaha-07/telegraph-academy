import React from 'react';
import { TIMING_PRESETS, TimingDifficulty } from '../game/morse';
import { telegraphAudio } from '../audio/telegraphAudio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timingDifficulty: TimingDifficulty;
  onTimingChange: (difficulty: TimingDifficulty) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  trainSounds: boolean;
  onToggleTrainSounds: (val: boolean) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: (val: boolean) => void;
  voiceEnabled?: boolean;
  onToggleVoice?: (val: boolean) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  timingDifficulty,
  onTimingChange,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  pitch,
  onPitchChange,
  trainSounds,
  onToggleTrainSounds,
  reducedMotion,
  onToggleReducedMotion,
  voiceEnabled = true,
  onToggleVoice,
  onResetProgress,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Apparatus & Workshop Settings"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto parchment-sheet rounded-xl p-6 sm:p-8 border-4 border-[#8c6527] shadow-[0_18px_45px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-[#b58b45]">
          <div className="flex items-center gap-2">
            <div className="brass-rivet" />
            <h2 className="text-2xl font-serif font-black text-[#2e1708]">
              Apparatus Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full brass-button flex items-center justify-center font-bold text-sm cursor-pointer"
            aria-label="Close Settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm font-serif text-[#291708]">
          {/* Timing Difficulty */}
          <div>
            <label className="font-bold text-xs uppercase tracking-wider text-[#6e461b] block mb-1.5">
              Key Timing Sensitivity:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Standard', 'Expert'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => onTimingChange(TIMING_PRESETS[tier])}
                  className={`py-2 px-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    timingDifficulty.name === tier
                      ? 'brass-button shadow-md'
                      : 'bg-[#ebdcb5] border border-[#a87e38] text-[#543615] hover:bg-[#f2e6c7]'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#704d23] mt-1.5 italic">
              {timingDifficulty.name === 'Beginner' && 'Dot < 250ms · Letter gap 900ms (Very forgiving)'}
              {timingDifficulty.name === 'Standard' && 'Dot < 200ms · Letter gap 700ms (Authentic period pace)'}
              {timingDifficulty.name === 'Expert' && 'Dot < 150ms · Letter gap 500ms (High-speed telegraphist)'}
            </p>
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="volume-slider" className="font-bold text-xs uppercase tracking-wider text-[#6e461b]">
                Instrument Volume ({Math.round(volume * 100)}%):
              </label>
              <button
                onClick={() => onMuteToggle(!isMuted)}
                className="text-xs underline text-[#8c591c] hover:text-[#52330f] cursor-pointer"
              >
                {isMuted ? 'Unmute Sound' : 'Mute Sound'}
              </button>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#cf9c27] cursor-pointer"
            />
          </div>

          {/* Tone Frequency Pitch */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pitch-slider" className="font-bold text-xs uppercase tracking-wider text-[#6e461b]">
                Telegraph Tone Pitch ({pitch} Hz):
              </label>
              <button
                onClick={() => {
                  telegraphAudio.unlock();
                  telegraphAudio.startTone();
                  setTimeout(() => telegraphAudio.stopTone(), 180);
                }}
                className="text-xs underline text-[#8c591c] hover:text-[#52330f] cursor-pointer"
              >
                Test Pitch
              </button>
            </div>
            <input
              id="pitch-slider"
              type="range"
              min="350"
              max="900"
              step="25"
              value={pitch}
              onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
              className="w-full accent-[#cf9c27] cursor-pointer"
            />
          </div>

          {/* Locomotive Steam Sounds Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#bfa264]">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#6e461b] block">
                Locomotive Steam Audio:
              </span>
              <span className="text-[11px] text-[#704d23] italic">
                Steam chuff, whistle & siding hiss (ducks during Morse keying).
              </span>
            </div>
            <button
              onClick={() => onToggleTrainSounds(!trainSounds)}
              className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase cursor-pointer ${
                trainSounds ? 'brass-button' : 'bg-[#e2d2a8] border border-[#a37930] text-[#543615]'
              }`}
            >
              {trainSounds ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Miss Sophia Voice Narration Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#bfa264]">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#6e461b] block">
                Miss Sophia Voice Narration:
              </span>
              <span className="text-[11px] text-[#704d23] italic">
                Spoken voice recordings for guided tour & dispatch certificates.
              </span>
            </div>
            <button
              onClick={() => onToggleVoice?.(!voiceEnabled)}
              className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase cursor-pointer ${
                voiceEnabled ? 'brass-button' : 'bg-[#e2d2a8] border border-[#a37930] text-[#543615]'
              }`}
            >
              {voiceEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#bfa264]">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#6e461b] block">
                Reduce Ambient Motion:
              </span>
              <span className="text-[11px] text-[#704d23] italic">
                Halts background gears and steam particles.
              </span>
            </div>
            <button
              onClick={() => onToggleReducedMotion(!reducedMotion)}
              className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase cursor-pointer ${
                reducedMotion ? 'brass-button' : 'bg-[#e2d2a8] border border-[#a37930] text-[#543615]'
              }`}
            >
              {reducedMotion ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reset Progress */}
          <div className="flex items-center justify-between pt-2 border-t border-[#bfa264]">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-[#8a2416] block">
                Reset Apprenticeship:
              </span>
              <span className="text-[11px] text-[#704d23] italic">
                Clears level progress and records back to Level 1.
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all progress back to Level 1?')) {
                  onResetProgress();
                }
              }}
              className="px-3 py-1.5 rounded-md bg-red-100 border border-red-800 text-red-950 font-bold text-xs uppercase hover:bg-red-200 cursor-pointer shadow-sm"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t-2 border-[#b58b45] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg brass-button font-serif font-bold text-sm uppercase tracking-wider shadow cursor-pointer"
          >
            Save & Return
          </button>
        </div>
      </div>
    </div>
  );
};
