import React from "react";
import { Sliders, Volume2, Type, Move, Sparkles, LayoutGrid, Info, Trash2 } from "lucide-react";
import { Clip, Track, VideoEditorSettings } from "../types";
import { FILTER_PRESETS, TRANSITION_TYPES } from "../data";

interface PropertiesPanelProps {
  activeClip: Clip | null;
  activeTrack: Track | null;
  onUpdateClipProperties: (clipId: string, updatedProps: any) => void;
  onDeleteClip: (clipId: string) => void;
  settings: VideoEditorSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoEditorSettings>>;
}

const FONTS = ["Inter", "Space Grotesk", "JetBrains Mono", "Playfair Display", "Impact"];

export default function PropertiesPanel({
  activeClip,
  activeTrack,
  onUpdateClipProperties,
  onDeleteClip,
  settings,
  setSettings,
}: PropertiesPanelProps) {

  const handlePropChange = (field: string, value: any) => {
    if (!activeClip) return;
    onUpdateClipProperties(activeClip.id, {
      [field]: value,
    });
  };

  return (
    <div id="properties_inspector" className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex flex-col h-full scrollbar-thin font-sans">
      {activeClip ? (
        <div className="flex-1 flex flex-col justify-between h-full space-y-4">
          {/* Header element */}
          <div>
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sliders className="w-4 h-4 text-blue-500 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 truncate pr-2">
                  Edit: {activeClip.name}
                </h3>
              </div>
              <button
                onClick={() => onDeleteClip(activeClip.id)}
                className="p-1 px-2 text-red-400 hover:bg-red-950/30 border border-red-900/40 hover:border-red-600 rounded-sm text-[10px] font-mono tracking-tighter cursor-pointer flex items-center gap-1 transition"
                title="Remove highlighted clip"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <div className="space-y-4 h-[330px] overflow-y-auto pr-1">
              {/* TEXT LAYER PARAMETERS */}
              {activeClip.type === "text" && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                  <div className="flex items-center gap-1 px-1 text-blue-400">
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Caption Text Properties</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1">Text String Content</label>
                    <textarea
                      value={activeClip.properties.textString || ""}
                      onChange={(e) => handlePropChange("textString", e.target.value)}
                      className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-2 rounded-sm text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none h-14"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Font Family</label>
                      <select
                        value={activeClip.properties.fontFamily || "Inter"}
                        onChange={(e) => handlePropChange("fontFamily", e.target.value)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 px-2 rounded-sm text-xs outline-none cursor-pointer"
                      >
                        {FONTS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Font Size (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={activeClip.properties.fontSize || 22}
                        onChange={(e) => handlePropChange("fontSize", parseInt(e.target.value) || 22)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 px-2 rounded-sm text-xs outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Text Color Hex</label>
                      <div className="flex items-center gap-1.5 bg-[#121212] border border-[#2A2A2A] rounded-sm p-1">
                        <input
                          type="color"
                          value={activeClip.properties.fontColor || "#FFFFFF"}
                          onChange={(e) => handlePropChange("fontColor", e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer outline-none"
                        />
                        <span className="text-[9px] font-mono text-gray-300">
                          {activeClip.properties.fontColor || "#FFFFFF"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Background Hex</label>
                      <div className="flex items-center gap-1.5 bg-[#121212] border border-[#2A2A2A] rounded-sm p-1">
                        <input
                          type="color"
                          value={activeClip.properties.fontBgColor === "transparent" ? "#000000" : (activeClip.properties.fontBgColor || "rgba(0,0,0,0.5)")}
                          onChange={(e) => handlePropChange("fontBgColor", e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer outline-none"
                        />
                        <select
                          value={activeClip.properties.fontBgColor === "transparent" ? "transparent" : "color"}
                          onChange={(e) => handlePropChange("fontBgColor", e.target.value === "transparent" ? "transparent" : "#000000")}
                          className="bg-transparent text-[9px] font-mono text-gray-300 border-0 outline-none w-14"
                        >
                          <option value="color">Box</option>
                          <option value="transparent">None</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Display Entrance</label>
                      <select
                        value={activeClip.properties.textAnimation || "none"}
                        onChange={(e) => handlePropChange("textAnimation", e.target.value)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 rounded-sm text-xs outline-none cursor-pointer"
                      >
                        <option value="none">None - Stabalized</option>
                        <option value="bounce">Bounce Wave loop</option>
                        <option value="typewriter">Typewriter Sync</option>
                        <option value="fade">Dynamic Fade-in</option>
                        <option value="scale">Pulsing pop</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 mb-1">Text Align</label>
                      <select
                        value={activeClip.properties.textAlignment || "center"}
                        onChange={(e) => handlePropChange("textAlignment", e.target.value)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 rounded-sm text-xs outline-none cursor-pointer"
                      >
                        <option value="left">Left align</option>
                        <option value="center">Center align</option>
                        <option value="right">Right align</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSFORM COORDINATES & SIZE */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                <div className="flex items-center gap-1 px-1 text-blue-400 font-sans">
                  <Move className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Sizing & Coordinate Placement</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400">Scale Ratio ({activeClip.properties.scale}%)</label>
                    <input
                      type="range"
                      min="15"
                      max="180"
                      value={activeClip.properties.scale}
                      onChange={(e) => handlePropChange("scale", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400">Opacity ({activeClip.properties.opacity}%)</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={activeClip.properties.opacity}
                      onChange={(e) => handlePropChange("opacity", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400">X-Offset ({activeClip.properties.posX}px)</label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={activeClip.properties.posX}
                      onChange={(e) => handlePropChange("posX", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400">Y-Offset ({activeClip.properties.posY}px)</label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={activeClip.properties.posY}
                      onChange={(e) => handlePropChange("posY", parseInt(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* TIMELINE AUDIO VOLUME & SPEED */}
              {activeClip.type !== "text" && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                  <div className="flex items-center gap-1 px-1 text-blue-400">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Audio Gain & Speed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400">Clip Volume ({activeClip.properties.volume}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={activeClip.properties.volume}
                        onChange={(e) => handlePropChange("volume", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400">Speed multiplier ({activeClip.properties.speed}x)</label>
                      <select
                        value={activeClip.properties.speed}
                        onChange={(e) => handlePropChange("speed", parseFloat(e.target.value))}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 rounded-sm text-xs outline-none cursor-pointer mt-1"
                      >
                        <option value="0.5">0.5x (Slow-Mo)</option>
                        <option value="0.8">0.8x</option>
                        <option value="1.0">1.0x (Standard)</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2.0">2.0x (Time-Lapse)</option>
                        <option value="4.0">4.0x (Fast HyperLapse)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC COLOR GRADING / FILTERS */}
              {activeClip.type === "video" && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                  <div className="flex items-center gap-1 px-1 text-blue-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Interactive Color Grading</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Apply Screen Filter Preset</label>
                    <select
                      value={activeClip.properties.filterName}
                      onChange={(e) => handlePropChange("filterName", e.target.value)}
                      className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 px-2 rounded-sm text-xs outline-none cursor-pointer"
                    >
                      {FILTER_PRESETS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400">Brightness ({activeClip.properties.brightness}%)</label>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={activeClip.properties.brightness}
                        onChange={(e) => handlePropChange("brightness", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-gray-400">Contrast ({activeClip.properties.contrast}%)</label>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={activeClip.properties.contrast}
                        onChange={(e) => handlePropChange("contrast", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400">Saturation ({activeClip.properties.saturation}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={activeClip.properties.saturation}
                        onChange={(e) => handlePropChange("saturation", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-gray-400">Glow Blur ({activeClip.properties.blur}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={activeClip.properties.blur}
                        onChange={(e) => handlePropChange("blur", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400">Vignette shadow ({activeClip.properties.vignette}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={activeClip.properties.vignette}
                        onChange={(e) => handlePropChange("vignette", parseInt(e.target.value))}
                        className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSITION OVERRIDES */}
              {activeClip.type === "video" && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                  <div className="flex items-center gap-1 px-1 text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Start Transition swipe</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Swipe FX</label>
                      <select
                        value={activeClip.properties.transitionType || "none"}
                        onChange={(e) => handlePropChange("transitionType", e.target.value)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 rounded-sm text-xs outline-none cursor-pointer"
                      >
                        {TRANSITION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name.split("-")[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Duration (s)</label>
                      <input
                        type="number"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={activeClip.properties.transitionDuration || 0.5}
                        onChange={(e) => handlePropChange("transitionDuration", parseFloat(e.target.value) || 0.5)}
                        className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1 rounded-sm text-xs outline-none text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CHROMA KEY (GREEN SCREEN) */}
              {activeClip.type === "video" && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        <path d="M2 12h20" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Chroma Key (Green Screen)</span>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!activeClip.properties.chromaKeyEnabled}
                        onChange={(e) => handlePropChange("chromaKeyEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-[#2A2A2A] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {activeClip.properties.chromaKeyEnabled && (
                    <div className="space-y-3 pt-2 border-t border-[#2A2A2A] animate-fadeIn">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] text-gray-400 font-mono">Key Screen Color</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={activeClip.properties.chromaColor || "#00ff00"}
                            onChange={(e) => handlePropChange("chromaColor", e.target.value)}
                            className="bg-transparent border-0 cursor-pointer w-6 h-6 rounded-full overflow-hidden"
                          />
                          <span className="text-[10.5px] font-mono text-gray-300">
                            {activeClip.properties.chromaColor || "#00ff00"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-gray-400">
                          <span>Similarity Tolerance</span>
                          <span>{activeClip.properties.chromaSimilarity ?? 45}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={activeClip.properties.chromaSimilarity ?? 45}
                          onChange={(e) => handlePropChange("chromaSimilarity", parseInt(e.target.value))}
                          className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] font-mono text-gray-400">
                          <span>Edge Smoothness</span>
                          <span>{activeClip.properties.chromaSmoothness ?? 10}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeClip.properties.chromaSmoothness ?? 10}
                          onChange={(e) => handlePropChange("chromaSmoothness", parseInt(e.target.value))}
                          className="w-full h-1 bg-[#2A2A2A] rounded-sm appearance-none cursor-pointer accent-blue-500 mt-1"
                        />
                      </div>

                      <div className="text-[9px] leading-relaxed text-gray-500 font-sans p-2 bg-[#121212] border border-[#232323] rounded-sm">
                        💡 <em>Tip:</em> Green/blue screen removal masks the chosen color from the canvas frame instantly.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono bg-[#1A1A1A] p-2.5 border border-[#2A2A2A] rounded-sm">
            ⚡ Clip duration: <span className="text-gray-300 font-medium">{activeClip.duration}s</span>. Standard start offset at <span className="text-gray-300 font-medium">{activeClip.startOffset}s</span> in timeline track <span className="text-gray-300 font-medium">"{activeTrack?.name}"</span>.
          </div>
        </div>
      ) : (
        /* Workspace defaults when no clip is highlighted */
        <div id="workspace_defaults" className="flex-1 flex flex-col justify-between h-full text-gray-400">
          <div>
            <div className="flex items-center gap-1.5 border-b border-[#2A2A2A] pb-2 mb-4">
              <LayoutGrid className="w-4 h-4 text-gray-400 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Workspace: Project Setup
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-sm space-y-3">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Interactive Resolution Setup</span>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-mono mb-1">Preset Core Width & Height</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1.5 rounded-sm text-xs cursor-pointer outline-none"
                  >
                    <option value="1080p">FHD 1080p (Standard Web Broadcast)</option>
                    <option value="720p">HD 720p (Speed Optimized Preview)</option>
                    <option value="4K">UHD 4K (Extreme Cinema quality)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-mono mb-1">Target Framerate</label>
                    <select
                      value={settings.fps}
                      onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) as any })}
                      className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1.5 rounded-sm text-xs cursor-pointer outline-none"
                    >
                      <option value="30">30 FPS (Standard)</option>
                      <option value="60">60 FPS (Ultra Smooth)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 font-mono mb-1">Visual Aspect</label>
                    <select
                      value={settings.aspectRatio}
                      onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
                      className="w-full bg-[#121212] border border-[#2A2A2A] text-white p-1.5 rounded-sm text-xs cursor-pointer outline-none"
                    >
                      <option value="16:9">YouTube (16:9)</option>
                      <option value="9:16">TikTok (9:16)</option>
                      <option value="1:1">Square (1:1)</option>
                      <option value="21:9">Wide (21:9)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-sm space-y-2">
                <div className="flex items-center gap-1.5 text-gray-300 text-[11px] font-bold font-mono">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <span>WIDGET INSTRUCTIONS</span>
                </div>
                <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans">
                  Click on any purple, blue, or yellow visual block in the multi-track timeline below to load its advanced coordinates, volume gains, filter knobs, text formatting, and entrance animations here.
                </p>
                <p className="text-[10px] text-emerald-500 font-medium">
                  ✓ PC App Installer loaded. Supports Offline persistence!
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono bg-[#1A1A1A] p-2.5 border border-[#2A2A2A] rounded-sm text-center leading-normal">
            ⚙ Ready to export? Click the top-right <span className="text-blue-400">Export Video</span> button to render the composition frames into a high gloss output.
          </div>
        </div>
      )}
    </div>
  );
}
