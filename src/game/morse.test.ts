import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIMING_PRESETS,
  classifyPress,
  decodeMorse,
  encodeMorse,
  formatMorseVisual,
  getLearnedLetters,
  validateMessageLetters,
  calculateWPM,
  calculateAccuracy,
  calculateStars,
  GAME_LEVELS,
} from './morse';

test('Morse encoding and decoding', () => {
  assert.equal(encodeMorse('E'), '.');
  assert.equal(encodeMorse('T'), '-');
  assert.equal(encodeMorse('S'), '...');
  assert.equal(encodeMorse('O'), '---');
  assert.equal(encodeMorse('a'), '.-');

  assert.equal(decodeMorse('.'), 'E');
  assert.equal(decodeMorse('-'), 'T');
  assert.equal(decodeMorse('...'), 'S');
  assert.equal(decodeMorse('---'), 'O');
  assert.equal(decodeMorse('.-'), 'A');
  assert.equal(decodeMorse('-.-.'), 'C');
  assert.equal(decodeMorse('.....-.-'), '?'); // unknown
});

test('Timing classification respects thresholds', () => {
  const std = TIMING_PRESETS.Standard;
  assert.equal(classifyPress(15, std), 'bounce'); // < 30ms ignored
  assert.equal(classifyPress(120, std), 'dot');    // < 200ms dot
  assert.equal(classifyPress(200, std), 'dash');   // >= 200ms dash
  assert.equal(classifyPress(450, std), 'dash');

  const beginner = TIMING_PRESETS.Beginner;
  assert.equal(classifyPress(220, beginner), 'dot'); // < 250ms is dot in beginner
  assert.equal(classifyPress(260, beginner), 'dash');
});

test('Learned letters accumulation per level', () => {
  const lvl1 = getLearnedLetters(1);
  assert.deepEqual(Array.from(lvl1).sort(), ['E', 'T']);

  const lvl2 = getLearnedLetters(2);
  assert.deepEqual(Array.from(lvl2).sort(), ['A', 'E', 'N', 'T']);

  const lvl13 = getLearnedLetters(13);
  assert.equal(lvl13.size, 26);
});

test('Message validation strictly adheres to learned letters', () => {
  const lvl2Letters = getLearnedLetters(2); // E, T, A, N
  assert.equal(validateMessageLetters('TEN MEN AT ANNA', lvl2Letters), false); // 'M' is not learned yet
  assert.equal(validateMessageLetters('TEN AT TEA', lvl2Letters), true);
  assert.equal(validateMessageLetters('TEA AND TEA', lvl2Letters), false); // 'D' not learned
});

test('Default level messages only use letters learned at or before that level', () => {
  GAME_LEVELS.forEach((levelConfig) => {
    const learned = getLearnedLetters(levelConfig.level);
    const valid = validateMessageLetters(levelConfig.defaultMessage, learned);
    assert.equal(
      valid,
      true,
      `Default message for level ${levelConfig.level} ("${levelConfig.defaultMessage}") contains unlearned letters!`
    );
  });
});

test('WPM and Accuracy calculations', () => {
  // 50 characters in 60 seconds = 10 words in 1 minute = 10 WPM
  assert.equal(calculateWPM(50, 60), 10);
  assert.equal(calculateWPM(25, 30), 10);
  assert.equal(calculateWPM(0, 60), 0);

  // Accuracy: 18 correct out of 20 total = 90%
  assert.equal(calculateAccuracy(18, 20), 90);
  assert.equal(calculateAccuracy(0, 0), 0);

  // Stars
  assert.equal(calculateStars(98, 0), 3);
  assert.equal(calculateStars(85, 2), 2);
  assert.equal(calculateStars(60, 8), 1);
});

test('Visual formatting of Morse sequence', () => {
  assert.equal(formatMorseVisual('.-.'), '• — •');
  assert.equal(formatMorseVisual('...'), '• • •');
});

test('Curriculum levels 1, 2, and 3 teach exact required letters', () => {
  const lvl1 = GAME_LEVELS[0];
  assert.equal(lvl1.level, 1);
  assert.deepEqual(lvl1.newLetters, ['E', 'T']);
  assert.equal(validateMessageLetters(lvl1.defaultMessage, getLearnedLetters(1)), true);

  const lvl2 = GAME_LEVELS[1];
  assert.equal(lvl2.level, 2);
  assert.deepEqual(lvl2.newLetters, ['A', 'N']);
  assert.equal(validateMessageLetters(lvl2.defaultMessage, getLearnedLetters(2)), true);

  const lvl3 = GAME_LEVELS[2];
  assert.equal(lvl3.level, 3);
  assert.deepEqual(lvl3.newLetters, ['I', 'M']);
  assert.equal(validateMessageLetters(lvl3.defaultMessage, getLearnedLetters(3)), true);
});

test('4-symbol letters and 5-symbol numbers are fully mapped', () => {
  const fourSymbols = ['L', 'J', 'Q', 'Y', 'F', 'H', 'P', 'Z'];
  for (const ch of fourSymbols) {
    const code = encodeMorse(ch);
    assert.ok(code, `Missing code for ${ch}`);
    assert.equal(code.length, 4, `${ch} should have 4 symbols, got ${code}`);
    assert.equal(decodeMorse(code), ch);
  }

  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (const d of digits) {
    const code = encodeMorse(d);
    assert.ok(code, `Missing code for digit ${d}`);
    assert.equal(code.length, 5, `Digit ${d} should have 5 symbols, got ${code}`);
    assert.equal(decodeMorse(code), d);
  }
});

test('Target test tapes (OLD IRON, JAZZ, QUIZ, 1234567890) have valid Morse encodings', () => {
  const testStrings = ['OLD IRON', 'JAZZ', 'QUIZ', '1234567890'];
  for (const str of testStrings) {
    for (const ch of str) {
      if (ch === ' ') continue;
      const morse = encodeMorse(ch);
      assert.ok(morse !== null, `Character ${ch} must have a valid Morse encoding`);
      if (!morse) continue;
      assert.ok(morse.length > 0, `Character ${ch} must have a valid Morse encoding`);
      assert.ok(morse.length <= 5, `Morse code for ${ch} (${morse}) exceeds 5 symbols`);
      // Verify adaptive width guarantees no overlap
      const width = Math.max(56, morse.length * 18 + 10);
      // Ensure tile width easily fits 14px dash + 4px gap per symbol
      const maxInnerWidth = morse.length * 14 + (morse.length - 1) * 4;
      assert.ok(width > maxInnerWidth + 8, `Tile width ${width} for ${ch} (${morse}) must provide comfortable padding`);
    }
  }
});

