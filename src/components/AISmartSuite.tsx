import React, { useState } from "react";
import { Sparkles, MessageSquareHeart, Mic, FileVideo, PlusCircle, Play, Pause, RefreshCw, Loader2, Music4 } from "lucide-react";
import { Track, Clip, AIStoryboard, AICaption } from "../types";

interface AISmartSuiteProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  currentTime: number;
  onAddCustomClip: (trackId: string, clip: Clip) => void;
}

export default function AISmartSuite({
  tracks,
  setTracks,
  currentTime,
  onAddCustomClip,
}: AISmartSuiteProps) {
  const [activeSegment, setActiveSegment] = useState<"script" | "captions" | "tts">("script");
  
  // Loading & error trackers
  const [loading, setLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Script-to-Video state variables
  const [videoIdea, setVideoIdea] = useState<string>("Create a futuristic promo video for an energy drink");
  const [storyboardData, setStoryboardData] = useState<AIStoryboard | null>(null);

  // Auto-Captions state variables
  const [captionTheme, setCaptionTheme] = useState<string>("Motivation and mental clarity morning workspace loop");
  const [captionThemeStyle, setCaptionThemeStyle] = useState<string>("hacker_mono");
  const [generatedCaptions, setGeneratedCaptions] = useState<AICaption[]>([]);

  // TTS state variables
  const [ttsInputMsg, setTtsInputMsg] = useState<string>("Greetings human! Welcome to AURA VIDEO EDITER, powered by Google Gemini.");
  const [ttsCharacterVoice, setTtsCharacterVoice] = useState<string>("Zephyr"); // Puck, Kore, Fenrir, Zephyr
  const [generatedTTSBase64, setGeneratedTTSBase64] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);

  // 1. Trigger Script-to-Video generation calling full-stack backend
  const handleGenerateStoryboard = async () => {
    setLoading(true);
    setErrorStatus(null);
    setStoryboardData(null);
    try {
      const res = await fetch("/api/ai/script-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: videoIdea, lengthSeconds: 15 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStoryboardData(data.storyboard);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Could not generate storyboard, verify API settings.");
    } finally {
      setLoading(false);
    }
  };

  // Inject generated storyboard scenes into the current main tracks
  const handleLoadStoryboardToTimeline = () => {
    if (!storyboardData) return;

    // Build lists of clips chronologically
    let elapsed = 0;
    const videoClips: Clip[] = [];
    const subtitleClips: Clip[] = [];

    storyboardData.scenes.forEach((scene, index) => {
      // Map visual prompts to simulated procedural clips we support in canvas
      let matchingUrl = "cyber-neon-drive";
      let thumbnail = "🌆";
      const cat = scene.assetCategory.toLowerCase();

      if (cat.includes("coffee") || cat.includes("vlog") || cat.includes("cafe")) {
        matchingUrl = "morning-espresso";
        thumbnail = "☕";
      } else if (cat.includes("nature") || cat.includes("ocean") || cat.includes("chill")) {
        matchingUrl = "calm-beach-waves";
        thumbnail = "🌊";
      } else if (cat.includes("workout") || cat.includes("gym") || cat.includes("sports")) {
        matchingUrl = "intense-power-gym";
        thumbnail = "🏋️";
      } else if (cat.includes("sunset") || cat.includes("travel") || cat.includes("scenic")) {
        matchingUrl = "gold-sunset-scenic";
        thumbnail = "🌅";
      }

      // 1. Create the video clip
      videoClips.push({
        id: `ai_vid_${index}_${Date.now()}`,
        name: `AI Scene ${index+1}: ${scene.stockSearchQuery.substring(0, 18)}...`,
        type: "video",
        startOffset: elapsed,
        duration: scene.duration,
        mediaUrl: matchingUrl,
        thumbnailUrl: thumbnail,
        properties: {
          volume: 0,
          speed: 1.0,
          scale: 100,
          posX: 0,
          posY: 0,
          filterName: scene.effect || "None",
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          vignette: 10,
          opacity: 100,
          transitionType: index === 0 ? "none" : "fade",
          transitionDuration: 0.6,
        },
      });

      // 2. Create the caption subtitle clip matching timing
      subtitleClips.push({
        id: `ai_sub_${index}_${Date.now()}`,
        name: `[AI Sub] ${scene.caption.substring(0, 15)}...`,
        type: "text",
        startOffset: elapsed + 0.3, // slight delay padding
        duration: scene.duration - 0.6, // pad ends
        mediaUrl: "",
        thumbnailUrl: "💬",
        properties: {
          volume: 0,
          speed: 1.0,
          scale: 100,
          posX: 0,
          posY: 90, // lower third
          filterName: "None",
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          vignette: 0,
          opacity: 100,
          textString: scene.caption.toUpperCase(),
          fontSize: 20,
          fontFamily: "Space Grotesk",
          fontColor: "#00FFFF",
          fontBgColor: "rgba(0,0,0,0.7)",
          textAlignment: "center",
          textAnimation: "bounce",
        }
      });

      elapsed += scene.duration;
    });

    // Wipe tracks and load
    setTracks(
      tracks.map((track) => {
        if (track.type === "video") {
          return { ...track, clips: videoClips };
        }
        if (track.type === "text") {
          return { ...track, clips: subtitleClips };
        }
        return { ...track, clips: [] }; // Clear ambient audio for user's fresh story
      })
    );
  };

  // 2. Generate captions synchronizations calling server
  const handleGenerateCaptions = async () => {
    setLoading(true);
    setErrorStatus(null);
    setGeneratedCaptions([]);
    try {
      const res = await fetch("/api/ai/auto-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoContext: captionTheme, styleTheme: captionThemeStyle }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGeneratedCaptions(data.captions);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to organize captions, verify API setups.");
    } finally {
      setLoading(false);
    }
  };

  // Inject dynamic captions into text timeline layer
  const handleInjectCaptionsToTimeline = () => {
    if (generatedCaptions.length === 0) return;

    let textTrack = tracks.find((t) => t.type === "text");
    if (!textTrack) return;

    const fontStyleConfig = captionThemeStyle === "hacker_mono" ? {
      fontFamily: "JetBrains Mono",
      fontColor: "#00FF00",
      fontBgColor: "#000000",
      textAnimation: "typewriter",
    } : captionThemeStyle === "neon_gradient" ? {
      fontFamily: "Space Grotesk",
      fontColor: "#FF1493",
      fontBgColor: "rgba(0,0,0,0.6)",
      textAnimation: "bounce",
    } : {
      fontFamily: "Inter",
      fontColor: "#FFFFFF",
      fontBgColor: "rgba(30, 41, 59, 0.8)",
      textAnimation: "scale",
    };

    const newClips: Clip[] = generatedCaptions.map((capt, i) => ({
      id: `caption_ai_${i}_${Date.now()}`,
      name: `[Sub] ${capt.text.substring(0, 15)}...`,
      type: "text",
      startOffset: capt.startTime,
      duration: capt.duration,
      mediaUrl: "",
      thumbnailUrl: "💬",
      properties: {
        volume: 0,
        speed: 1.0,
        scale: 100,
        posX: 0,
        posY: 100,
        filterName: "None",
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        vignette: 0,
        opacity: 100,
        textString: capt.text,
        fontSize: 18,
        fontFamily: fontStyleConfig.fontFamily,
        fontColor: capt.suggestedColor || fontStyleConfig.fontColor,
        fontBgColor: fontStyleConfig.fontBgColor,
        textAlignment: "center",
        textAnimation: fontStyleConfig.textAnimation as any,
      }
    }));

    setTracks(
      tracks.map((t) => {
        if (t.type === "text") {
          return { ...t, clips: [...t.clips, ...newClips] };
        }
        return t;
      })
    );
  };

  // 3. Synthesize speech using Google 3.1 tts model
  const handleGenerateTTS = async () => {
    setLoading(true);
    setErrorStatus(null);
    setGeneratedTTSBase64(null);
    try {
      const res = await fetch("/api/ai/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsInputMsg, voice: ttsCharacterVoice }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGeneratedTTSBase64(data.audio);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to trigger voice synthesis. Verify API variables.");
    } finally {
      setLoading(false);
    }
  };

  // Playback the pre-rendered audio base64 safely
  const togglePlayTTSAudio = () => {
    if (!generatedTTSBase64) return;
    if (playingAudio) {
      if (audioElRef.current) {
        audioElRef.current.pause();
        setPlayingAudio(false);
      }
    } else {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(generatedTTSBase64), (c) => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      const aud = new Audio(audioUrl);
      aud.onload = () => {};
      aud.onended = () => setPlayingAudio(false);
      audioElRef.current = aud;
      aud.play();
      setPlayingAudio(true);
    }
  };

  // Overwrite audios on the timeline track
  const handleInjectTTSIntoTimeline = () => {
    if (!generatedTTSBase64) return;

    // Locate first audio or sfx track
    const targetTrack = tracks.find((t) => t.type === "audio") || tracks[0];
    if (!targetTrack) return;

    const newVoc: Clip = {
      id: `tts_audioclip_${Date.now()}`,
      name: `🗣️ Voice: ${ttsCharacterVoice}`,
      type: "audio",
      startOffset: currentTime,
      duration: 5, // Voiceovers average around 5 seconds
      mediaUrl: `data:audio/wav;base64,${generatedTTSBase64}`,
      thumbnailUrl: "🗣️",
      properties: {
        volume: 100,
        speed: 1.0,
        scale: 100,
        posX: 0,
        posY: 0,
        filterName: "None",
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        vignette: 0,
        opacity: 100,
      }
    };

    onAddCustomClip(targetTrack.id, newVoc);
  };

  return (
    <div id="ai_smart_suite_box" className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex flex-col h-full font-sans">
      {/* Smart Suite Menu Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2.5 mb-4">
        <div id="smart_ai_header_flex" className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-[17px] h-[17px] text-blue-500 animate-pulse shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-200">
            Smart AI Studio Tools
          </h3>
        </div>

        <span className="text-[9px] bg-blue-900/20 border border-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
          Gemini Suite
        </span>
      </div>

      {/* Grid selections */}
      <div id="ai_tabs" className="grid grid-cols-3 gap-1 bg-[#1A1A1A] p-0.5 border border-[#2A2A2A] rounded mb-4 text-center shrink-0">
        <button
          onClick={() => setActiveSegment("script")}
          className={`py-1.5 rounded-sm text-[10.5px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
            activeSegment === "script" ? "bg-[#2A2A2A] text-white border border-[#3A3A3A]" : "text-gray-400 hover:text-white"
          }`}
        >
          <FileVideo className="w-3.5 h-3.5" />
          <span>Script-to-Video</span>
        </button>

        <button
          onClick={() => setActiveSegment("captions")}
          className={`py-1.5 rounded-sm text-[10.5px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
            activeSegment === "captions" ? "bg-[#2A2A2A] text-white border border-[#3A3A3A]" : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Auto Captions</span>
        </button>

        <button
          onClick={() => setActiveSegment("tts")}
          className={`py-1.5 rounded-sm text-[10.5px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition ${
            activeSegment === "tts" ? "bg-[#2A2A2A] text-white border border-[#3A3A3A]" : "text-gray-400 hover:text-white"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>AI Voiceover</span>
        </button>
      </div>

      {/* Central Working Panels */}
      <div className="flex-1 overflow-y-auto min-h-[180px] max-h-[300px] mb-2 pr-1 space-y-3">
        
        {/* SCRIPT-TO-VIDEO STORYBOARD BUILDER */}
        {activeSegment === "script" && (
          <div className="space-y-3">
            <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">
              Type your creative commercial, vlog, or marketing promo idea, and Gemini will automatically organize sequential stock scenes, visual filters, and animated caption subtitles.
            </p>

            <div>
              <label className="block text-[9.5px] font-mono text-gray-500 uppercase font-black mb-1">Enter Video Concept</label>
              <textarea
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-2 text-xs rounded-sm focus:ring-1 focus:ring-blue-500 outline-none h-14 resize-none"
                placeholder="Compose scenic sunset story loops..."
              />
            </div>

            <button
              onClick={handleGenerateStoryboard}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1A1A] disabled:text-gray-500 text-white font-semibold py-2 rounded-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Storyboards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Generate Full Storyboard Template</span>
                </>
              )}
            </button>

            {/* View generated scenes shelf */}
            {storyboardData && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm p-2.5 mt-2 space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-bold text-blue-400 truncate">🎬 AI Title: {storyboardData.title}</h4>
                  <span className="text-[9px] text-gray-500 font-mono">BGM: {storyboardData.soundtrackStyle}</span>
                </div>
                
                <div className="space-y-1">
                  {storyboardData.scenes.map((sc, i) => (
                    <div key={i} className="flex justify-between text-[10px] bg-[#121212] border border-[#2A2A2A] p-1.5 rounded-sm text-gray-300">
                      <span>{i+1}. Clip: {sc.stockSearchQuery.split(" ").slice(0, 2).join(" ")}</span>
                      <span className="font-mono text-blue-400">"{sc.caption.substring(0, 15)}..."</span>
                      <span className="text-gray-500">{sc.duration}s</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleLoadStoryboardToTimeline}
                  className="w-full bg-blue-900/20 hover:bg-blue-600 text-blue-400 hover:text-white py-1.5 mt-2.5 rounded-sm text-[10.5px] font-semibold border border-blue-900/40 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Approve & Inject and Load Template</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUTO CAPTIONS LAYER GENERATOR */}
        {activeSegment === "captions" && (
          <div className="space-y-3">
            <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">
              Enter your video focus or sound theme overlay. Gemini will write structured, synchronized caption subtitles using your specified styling fonts.
            </p>

            <div>
              <label className="block text-[9.5px] font-mono text-gray-500 uppercase font-black mb-1">Scenic Backdrop Focus / Music</label>
              <textarea
                value={captionTheme}
                onChange={(e) => setCaptionTheme(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-2 text-xs rounded-sm focus:ring-1 focus:ring-blue-500 outline-none h-14 resize-none"
              />
            </div>

            <div>
              <label className="block text-[9.5px] font-mono text-gray-500 uppercase font-black mb-1">Typography Font Style</label>
              <select
                value={captionThemeStyle}
                onChange={(e) => setCaptionThemeStyle(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-1.5 text-xs rounded-sm outline-none cursor-pointer"
              >
                <option value="hacker_mono">Hacker Terminal Monospace (Green)</option>
                <option value="neon_gradient">Neon Glow Impact (Hot Pink)</option>
                <option value="bold_white">Sleek Professional White</option>
              </select>
            </div>

            <button
              onClick={handleGenerateCaptions}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1A1A] disabled:text-gray-500 text-white font-semibold py-2 rounded-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Smart Captions...</span>
                </>
              ) : (
                <>
                  <MessageSquareHeart className="w-3.5 h-3.5 fill-current" />
                  <span>Generate Subtitle Tracks</span>
                </>
              )}
            </button>

            {generatedCaptions.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm p-2.5 space-y-2 mt-2">
                <h4 className="text-xs font-bold text-gray-200 mb-1">✓ Dynamic Subtitles Ready!</h4>
                <div className="space-y-1">
                  {generatedCaptions.map((capt, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] font-mono text-gray-400 bg-[#121212] p-1 px-2 rounded-sm border border-[#2A2A2A]">
                      <span>{capt.startTime}s - {capt.startTime+capt.duration}s</span>
                      <span className="text-gray-200 font-sans truncate max-w-[130px]">"{capt.text}"</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleInjectCaptionsToTimeline}
                  className="w-full bg-blue-900/20 hover:bg-blue-600 text-blue-400 hover:text-white py-1.5 mt-2.5 rounded-sm text-[10.5px] font-semibold border border-blue-900/40 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Inject Subtitles Into Timeline</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUTHENTIC GEMINI TTS VOICEOVER */}
        {activeSegment === "tts" && (
          <div className="space-y-3">
            <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">
              Integrate narration scripts. Gemini's TTS engine generates high-fidelity voice. Listen to the preset, then overlay it on your audio tracks.
            </p>

            <div>
              <label className="block text-[9.5px] font-mono text-gray-500 uppercase font-black mb-1">Voice script text</label>
              <textarea
                value={ttsInputMsg}
                onChange={(e) => setTtsInputMsg(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-2 text-xs rounded-sm focus:ring-1 focus:ring-blue-500 outline-none h-14 resize-none"
                placeholder="Narrate awesome moments..."
              />
            </div>

            <div>
              <label className="block text-[9.5px] font-mono text-gray-500 uppercase font-black mb-1">Select Character Voice</label>
              <select
                value={ttsCharacterVoice}
                onChange={(e) => setTtsCharacterVoice(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-1.5 text-xs rounded-sm outline-none cursor-pointer"
              >
                <option value="Zephyr">Zephyr (Warm Male Tone)</option>
                <option value="Kore">Kore (Vibrant Female Vocal)</option>
                <option value="Puck">Puck (Fast Energetic Voice)</option>
                <option value="Fenrir">Fenrir (Deep Cinematic voice)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateTTS}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1A1A] disabled:text-gray-500 text-white font-semibold py-2 rounded-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Synthesize Voiceover track</span>
                </>
              )}
            </button>

            {generatedTTSBase64 && (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm p-2.5 mt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <Music4 className="w-3.5 h-3.5" />
                    <span>Voiceover Render Complete</span>
                  </div>
                  
                  {/* Local pre-render audio trigger */}
                  <button
                    onClick={togglePlayTTSAudio}
                    className="p-1 px-3 bg-[#121212] border border-[#2A2A2A] hover:bg-[#2A2A2A] text-gray-300 hover:text-white rounded-sm text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    {playingAudio ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Mute</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen Voice</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleInjectTTSIntoTimeline}
                  className="w-full bg-blue-900/20 hover:bg-blue-600 text-blue-400 hover:text-white py-1.5 mt-1 rounded-sm text-[10.5px] font-semibold border border-blue-900/40 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Inject Voiceover to Active Timeline</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error notification bar */}
      {errorStatus && (
        <div className="bg-rose-95/40 border border-rose-900/50 p-2.5 text-[10.5px] text-rose-400 rounded-sm text-center font-semibold">
          ⚠️ {errorStatus}
        </div>
      )}
    </div>
  );
}
