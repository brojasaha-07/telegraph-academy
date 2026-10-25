/**
 * Telegraph Academy - Morse Code Definitions and Logic
 */

export interface TimingDifficulty {
  name: 'Beginner' | 'Standard' | 'Expert';
  dotMaxMs: number;      // < this duration is a dot
  minPressMs: number;    // < this duration is contact bounce (ignored)
  letterSilenceMs: number; // Silence duration to end a letter
  wordSilenceMs: number;   // Silence duration to insert a word space (Lifeline)
}

export const TIMING_PRESETS: Record<'Beginner' | 'Standard' | 'Expert', TimingDifficulty> = {
  Beginner: {
    name: 'Beginner',
    dotMaxMs: 250,
    minPressMs: 30,
    letterSilenceMs: 900,
    wordSilenceMs: 1800,
  },
  Standard: {
    name: 'Standard',
    dotMaxMs: 200,
    minPressMs: 30,
    letterSilenceMs: 700,
    wordSilenceMs: 1500,
  },
  Expert: {
    name: 'Expert',
    dotMaxMs: 150,
    minPressMs: 30,
    letterSilenceMs: 500,
    wordSilenceMs: 1100,
  },
};

export const MORSE_TABLE: Record<string, string> = {
  // Letters
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  // Digits
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  // Punctuation
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-',
};

// Inverted lookup: sequence -> char
export const REVERSE_MORSE_TABLE: Record<string, string> = Object.entries(
  MORSE_TABLE
).reduce((acc, [char, seq]) => {
  acc[seq] = char;
  return acc;
}, {} as Record<string, string>);

export interface LevelConfig {
  level: number;
  newLetters: [string, string];
  title: string;
  storyContext: string;
  stationName: string;
  defaultMessage: string;
  storyBeat: string;
  tapeSpeedPxPerSec: number; // Ticker tape scroll speed
}

// 13 levels, 2 new letters each, frequency-ordered
export const GAME_LEVELS: LevelConfig[] = [
  {
    level: 1,
    newLetters: ['E', 'T'],
    title: 'The First Spark',
    stationName: 'Ashford Junction',
    storyContext: 'You take your place at the mahogany desk as the telegraph clicks alive. The 9:15 Express just departed London.',
    defaultMessage: 'TEE TEE TEE',
    storyBeat: 'The 9:15 Express has safely departed London Victoria.',
    tapeSpeedPxPerSec: 24,
  },
  {
    level: 2,
    newLetters: ['A', 'N'],
    title: 'Signals Down the Line',
    stationName: 'Sevenoaks Depot',
    storyContext: 'Word arrives from Sevenoaks: the locomotive throttle is jammed wide open! The engineer cannot slow down.',
    defaultMessage: 'TEN AT ANNA',
    storyBeat: 'Sevenoaks reports the Express throttle is jammed wide open.',
    tapeSpeedPxPerSec: 26,
  },
  {
    level: 3,
    newLetters: ['I', 'M'],
    title: 'The Gauge Rises',
    stationName: 'Tonbridge Switch',
    storyContext: 'Boiler pressure is climbing dangerously. We must clear the main line ahead before it reaches Tonbridge.',
    defaultMessage: 'MAIN TEAM AT MINT',
    storyBeat: 'Tonbridge switch operators have cleared the main passenger track.',
    tapeSpeedPxPerSec: 28,
  },
  {
    level: 4,
    newLetters: ['S', 'O'],
    title: 'Runaway Speed',
    stationName: 'Staplehurst Siding',
    storyContext: 'The Express hurtles past Staplehurst at seventy miles an hour, whistling furiously into the dark.',
    defaultMessage: 'STEAM SET TO NOON',
    storyBeat: 'Staplehurst reports the train whistled past at 70 miles per hour.',
    tapeSpeedPxPerSec: 30,
  },
  {
    level: 5,
    newLetters: ['R', 'H'],
    title: 'Roaring North',
    stationName: 'Headcorn Tower',
    storyContext: 'Sparks fly from the steel rails. The firemen are struggling to vent steam through the auxiliary valves.',
    defaultMessage: 'TRAIN ROARS NORTH',
    storyBeat: 'Headcorn tower observers spot fire trailing beneath the tender.',
    tapeSpeedPxPerSec: 32,
  },
  {
    level: 6,
    newLetters: ['D', 'L'],
    title: 'The Fallen Timber',
    stationName: 'Pluckley Cutting',
    storyContext: 'Gale-force winds have brought down heavy pines near Pluckley. The local line is blocked!',
    defaultMessage: 'OLD IRON LINE IS DEAD',
    storyBeat: 'Pluckley telegraph confirms timber on the side line; main wire open.',
    tapeSpeedPxPerSec: 34,
  },
  {
    level: 7,
    newLetters: ['U', 'C'],
    title: 'The Unstoppable Coach',
    stationName: 'Charing Crossing',
    storyContext: 'Station masters along the route gather at their keys. All signals must turn green immediately.',
    defaultMessage: 'COACH CANNOT TURN',
    storyBeat: 'Charing Crossing locks all road gates and drops signals green.',
    tapeSpeedPxPerSec: 36,
  },
  {
    level: 8,
    newLetters: ['W', 'G'],
    title: 'The Red Lantern',
    stationName: 'Wye Valley Box',
    storyContext: 'A slow freight train is ahead in the same block! We must warn them to take the spur siding.',
    defaultMessage: 'WARNING GO AHEAD NOW',
    storyBeat: 'The freight locomotive diverts to the siding with seconds to spare!',
    tapeSpeedPxPerSec: 38,
  },
  {
    level: 9,
    newLetters: ['F', 'Y'],
    title: 'The Steep Descent',
    stationName: 'Folkestone Grade',
    storyContext: 'The runaway hits the downward gradient into the coastal valley. Wheels glow dull red.',
    defaultMessage: 'FLYING FAST DOWN WAY',
    storyBeat: 'Station staff cheer as the Express streaks safely down Folkestone grade.',
    tapeSpeedPxPerSec: 40,
  },
  {
    level: 10,
    newLetters: ['P', 'B'],
    title: 'Grave Peril',
    stationName: 'Dover Western Heights',
    storyContext: 'Urgent wire received! Heavy rains have swept away the trestle support at Ravenscar Gorge!',
    defaultMessage: 'BRIDGE PERIL STOP TRAIN',
    storyBeat: 'Ravenscar Gorge trestle reported damaged; runaway heading directly toward it!',
    tapeSpeedPxPerSec: 42,
  },
  {
    level: 11,
    newLetters: ['K', 'V'],
    title: 'The Wire to the Gorge',
    stationName: 'Ravenscar Tower',
    storyContext: 'There is only one hope: the emergency runaway sand-drag siding before the gorge bridge!',
    defaultMessage: 'RAVEN GORGE LINE BROKE',
    storyBeat: 'Tower operator at Ravenscar scrambles to the mechanical lever frame.',
    tapeSpeedPxPerSec: 44,
  },
  {
    level: 12,
    newLetters: ['J', 'X'],
    title: 'The Decisive Throw',
    stationName: 'Gorge Junction Switch',
    storyContext: 'The Express headlamp cuts through the mist. The lever must be thrown to divert the train!',
    defaultMessage: 'EXPRESS IN DANGER JAM BRAKE',
    storyBeat: 'The switch lever is locked in position toward the safety embankment.',
    tapeSpeedPxPerSec: 46,
  },
  {
    level: 13,
    newLetters: ['Q', 'Z'],
    title: 'Salvation at Track Zero',
    stationName: 'Ravenscar Sand Drag',
    storyContext: 'Final telegram! Confirm the switch setting and activate the buffer stop before impact!',
    defaultMessage: 'QUICK SWITCH TRACK ZERO SAVED',
    storyBeat: 'The Express plows into the safety sand drag, grinding to a halt safe from the gorge! All 300 souls saved!',
    tapeSpeedPxPerSec: 48,
  },
];

/**
 * Returns all letters learned up to and including a given level.
 */
export function getLearnedLetters(levelNumber: number): Set<string> {
  const letters = new Set<string>();
  if (levelNumber < 1) return letters;
  const maxLevel = Math.min(levelNumber, GAME_LEVELS.length);
  for (let i = 0; i < maxLevel; i++) {
    const lvl = GAME_LEVELS[i];
    lvl.newLetters.forEach((l) => letters.add(l.toUpperCase()));
  }
  return letters;
}

/**
 * Classifies key press duration into dot, dash, or bounce.
 */
export function classifyPress(
  durationMs: number,
  difficulty: TimingDifficulty
): 'dot' | 'dash' | 'bounce' {
  if (durationMs < difficulty.minPressMs) {
    return 'bounce';
  }
  if (durationMs < difficulty.dotMaxMs) {
    return 'dot';
  }
  return 'dash';
}

/**
 * Decodes a string of '.' and '-' to character, or '?' if unknown.
 */
export function decodeMorse(sequence: string): string {
  const trimmed = sequence.trim();
  if (!trimmed) return '';
  return REVERSE_MORSE_TABLE[trimmed] || '?';
}

/**
 * Encodes a character to Morse sequence.
 */
export function encodeMorse(char: string): string | null {
  const upper = char.toUpperCase();
  return MORSE_TABLE[upper] || null;
}

/**
 * Formats a Morse code string into readable symbols (• and —).
 */
export function formatMorseVisual(sequence: string): string {
  return sequence
    .split('')
    .map((s) => (s === '.' ? '•' : s === '-' ? '—' : s))
    .join(' ');
}

/**
 * Validates that all letters in a candidate message are in the learned set.
 */
export function validateMessageLetters(
  message: string,
  learnedLetters: Set<string>
): boolean {
  const sanitized = message.toUpperCase().trim();
  if (!sanitized) return false;
  for (const ch of sanitized) {
    if (ch === ' ') continue;
    if (!learnedLetters.has(ch)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculates WPM using the PARIS standard:
 * WPM = (characters / 5) / (elapsedSeconds / 60)
 */
export function calculateWPM(charCount: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || charCount <= 0) return 0;
  const minutes = elapsedSeconds / 60;
  const words = charCount / 5;
  const wpm = words / minutes;
  return Math.round(Math.min(wpm, 60)); // clamp reasonable telegraph speeds
}

/**
 * Calculates accuracy percentage.
 */
export function calculateAccuracy(
  correctChars: number,
  totalAttempts: number
): number {
  if (totalAttempts <= 0) return 0;
  return Math.round((correctChars / totalAttempts) * 100);
}

/**
 * Calculates star rating (1-3 stars) based on accuracy and completion.
 */
export function calculateStars(accuracy: number, mistakes: number): number {
  if (accuracy >= 95 && mistakes <= 1) return 3;
  if (accuracy >= 80 && mistakes <= 3) return 2;
  return 1;
}
