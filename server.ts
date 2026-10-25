import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { GAME_LEVELS, getLearnedLetters, validateMessageLetters } from './src/game/morse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with User-Agent as instructed by guidelines
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Station Master Coach API
app.post('/api/gemini/coach', async (req, res) => {
  const {
    level = 1,
    learnedLetters = ['E', 'T'],
    mistakes = {},
    accuracy = 100,
    wpm = 10,
    storySummary = '',
  } = req.body;

  const currentLevelConfig = GAME_LEVELS.find((l) => l.level === Number(level)) || GAME_LEVELS[0];
  const nextLevelConfig = GAME_LEVELS.find((l) => l.level === Number(level) + 1);
  const nextLevelMessage = nextLevelConfig
    ? nextLevelConfig.defaultMessage
    : 'QUICK SWITCH TRACK ZERO SAVED';

  // Fallback response generator in case Gemini is offline
  const getFallback = (reason?: string) => {
    const mistakeEntries = Object.entries(mistakes);
    let comment = `Capital tapping, apprentice! Accuracy at ${accuracy}% with ${wpm} WPM.`;
    if (mistakeEntries.length > 0) {
      const worstLetter = mistakeEntries.sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
      comment = `Fine efforts on the brass lever! Keep a sharp eye on letter '${worstLetter}', but your rhythm shows true promise.`;
    }
    return {
      comment,
      nextMessage: nextLevelMessage,
      storyBeat: currentLevelConfig.storyBeat,
      fallback: true,
      reason,
    };
  };

  if (!ai || !process.env.GEMINI_API_KEY) {
    return res.json(getFallback('API key not configured'));
  }

  try {
    const prompt = `You are Miss Sophia Hartwell, Station Master of the Great Western Railway telegraph office in 1887. You are cute, warm, encouraging, playful, and speak in light, friendly Victorian English ("Splendid tapping, apprentice!").
A runaway steam locomotive (the 9:15 Express) is careening toward Ravenscar Gorge!
Completed Level: ${level} (${currentLevelConfig.stationName}).
Player Accuracy: ${accuracy}%. Speed: ${wpm} WPM.
Mistakes this run: ${JSON.stringify(mistakes)}.
Previous Story Context: "${storySummary || currentLevelConfig.storyContext}".

TASK:
1. Provide a 1-2 sentence warm, encouraging critique from Miss Sophia Hartwell in authentic Victorian English ("Splendid tapping, apprentice!", "Capital discipline!"). If mistakes occurred, gently mention the troublesome letters.
2. Provide a brief 1-sentence dramatic story update on the runaway 9:15 Express.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are Miss Sophia Hartwell, a Victorian railway Station Master in 1887. You output only valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comment: {
              type: Type.STRING,
              description: '1-2 sentence encouraging Victorian critique',
            },
            storyBeat: {
              type: Type.STRING,
              description: '1-sentence story progression about the runaway 9:15 Express',
            },
          },
          required: ['comment', 'storyBeat'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return res.json(getFallback('Empty response from model'));
    }

    const parsed = JSON.parse(text);

    return res.json({
      comment: parsed.comment || getFallback().comment,
      nextMessage: nextLevelMessage,
      storyBeat: parsed.storyBeat || currentLevelConfig.storyBeat,
      fallback: false,
    });
  } catch (error) {
    console.error('Gemini coach generation failed:', error);
    return res.json(getFallback('Exception during model call'));
  }
});

// ElevenLabs Text-to-Speech API proxy for Lifeline Mode
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ELEVENLABS_API_KEY is not configured' });
  }

  const voiceId = 'kzu3kyvzVxdPA7NdrgD7';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`ElevenLabs API error (${response.status}):`, errText);
      return res.status(response.status).json({
        error: `ElevenLabs API returned status ${response.status}`,
        details: errText,
      });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    return res.send(Buffer.from(audioBuffer));
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError';
    console.warn('ElevenLabs proxy error:', isTimeout ? 'Timed out after 5s' : error?.message || error);
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'ElevenLabs request timed out' : 'Failed to reach ElevenLabs API',
    });
  }
});


// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegraph Academy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
