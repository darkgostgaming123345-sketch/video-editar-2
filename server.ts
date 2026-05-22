import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// API: Health / Connection Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AURA VIDEO EDITER Backend operational." });
});

// Helper to double-check and initialize GoogleGenAI client lazily
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined in the settings.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Text-to-Speech Voice Synthesis
app.post("/api/ai/voiceover", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Please provide high-quality text for TTS narration." });
    }
    
    const selectedVoice = voice || "Zephyr"; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this voiceover script naturally, pacing it nicely. Script: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "TTS model did not return any audio data." });
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("Voiceover synthesis error:", error);
    res.status(500).json({ error: error.message || "An error occurred during TTS synthesis." });
  }
});

// API: Script-to-Video Storyboard Generator (returns structured scene sequences)
app.post("/api/ai/script-to-video", async (req, res) => {
  try {
    const { idea, lengthSeconds } = req.body;
    if (!idea || typeof idea !== "string") {
      return res.status(400).json({ error: "Please specify a creative concept or video topic." });
    }

    const targetLength = lengthSeconds || 15;
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a detailed video storyboard outline of roughly ${targetLength} seconds for the creative concept: "${idea}". 
Break this down into 3 to 5 scenes. For each scene, specify a dynamic modern search query query for premium stock videos, a creative captions/subtitle string, scene duration and visual effect/filter suggestions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "scenes", "soundtrackStyle"],
          properties: {
            title: { type: Type.STRING, description: "A punchy title for the video" },
            soundtrackStyle: { type: Type.STRING, description: "Suggested theme/style for the audio track (e.g., Synthwave Beat, Epic Orchestral, Lofi Calm)" },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["duration", "assetCategory", "stockSearchQuery", "caption", "effect"],
                properties: {
                  duration: { type: Type.INTEGER, description: "Duration in seconds (typically between 3 to 6)" },
                  assetCategory: { type: Type.STRING, description: "Primary category of video (e.g., Tech, Workout, Nature, Urban, Minimalist)" },
                  stockSearchQuery: { type: Type.STRING, description: "An aesthetic visual term for matching background video (e.g., Slow motion coffee pour, cyber neon road)" },
                  caption: { type: Type.STRING, description: "Inspirational or punchy overlay text subtitle" },
                  effect: { type: Type.STRING, description: "Suggested screen filter preset (e.g., VHS Retro, Cinematic Teal, Cyber Glitch, Black & White, Chrome)" },
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "Failed to generate video sequence storyboard details." });
    }

    const storyboard = JSON.parse(text.trim());
    res.json({ storyboard });
  } catch (error: any) {
    console.error("Script storyboard generator error:", error);
    res.status(500).json({ error: error.message || "An error occurred during video script composition." });
  }
});

// API: Auto Caption/Subtitle Assistant (transcribes or generates creative lyrics/captions)
app.post("/api/ai/auto-captions", async (req, res) => {
  try {
    const { videoContext, styleTheme } = req.body;
    const ai = getGenAIClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a list of 4 beautifully synchronized subtitle captions/lyrical phrases that perfectly match the theme: "${videoContext || "lifestyle vlogging vibe"}".
The style of output font effects requested is "${styleTheme || "Trendy Bold neon color gradient"}". Return structured subtitle blocks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["startTime", "duration", "text", "suggestedColor"],
            properties: {
              startTime: { type: Type.INTEGER, description: "Relative trigger timestamp in seconds" },
              duration: { type: Type.INTEGER, description: "Display duration in seconds" },
              text: { type: Type.STRING, description: "Caption subtitle string" },
              suggestedColor: { type: Type.STRING, description: "Hex color suitable for styling (e.g., #FF5733)" },
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "Failed to generate dynamic subtitles." });
    }

    const captions = JSON.parse(text.trim());
    res.json({ captions });
  } catch (error: any) {
    console.error("Auto Captions error:", error);
    res.status(500).json({ error: error.message || "An error occurred during captions generation." });
  }
});

// Vite & Static file hosting setups
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AURA VIDEO EDITER Pro] Server actively running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
