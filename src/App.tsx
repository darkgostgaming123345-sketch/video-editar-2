import React, { useState, useEffect } from "react";
import { 
  Laptop, Sparkles, Sliders, Play, Film, MessageSquareCode, DownloadCloud, HelpCircle, 
  Settings2, Keyboard, UserCheck, CheckCircle2, ChevronRight, MonitorPlay, RefreshCw 
} from "lucide-react";
import { Track, Clip, VideoEditorSettings } from "./types";
import { INITIAL_TIMELINE_TRACKS, DEFAULT_ASSETS, KEYBOARD_SHORTCUTS } from "./data";
import VisualEditor from "./components/VisualEditor";
import MediaLibrary from "./components/MediaLibrary";
import PropertiesPanel from "./components/PropertiesPanel";
import Timeline from "./components/Timeline";
import AISmartSuite from "./components/AISmartSuite";
import PWAInstallModal from "./components/PWAInstallModal";

export default function App() {
  // Main states
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TIMELINE_TRACKS);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  
  // Custom video presets configurations
  const [settings, setSettings] = useState<VideoEditorSettings>({
    aspectRatio: "16:9",
    resolution: "1080p",
    fps: 30,
    masterVolume: 80,
  });

  // Modal displays trackers
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStep, setExportStep] = useState<number>(0);
  const [exportComplete, setExportComplete] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Standalone Mode Detection to dynamically show/hide installation prompts
  useEffect(() => {
    const checkStandalone = () => {
      let isDesktopParam = false;
      try {
        const searchParams = new URLSearchParams(window.location.search);
        isDesktopParam = searchParams.get("mode") === "desktop" || searchParams.get("source") === "desktop";
      } catch (e) {
        // Fallback if URLSearchParams fails
        if (window.location.href.indexOf("mode=desktop") !== -1 || window.location.href.indexOf("source=desktop") !== -1) {
          isDesktopParam = true;
        }
      }
      
      if (isDesktopParam) {
        try {
          localStorage.setItem("aura_standalone_mode", "true");
        } catch (e) {}
      }
      
      let hasStoredFlag = false;
      try {
        hasStoredFlag = localStorage.getItem("aura_standalone_mode") === "true";
      } catch (e) {}

      const standalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true || 
        isDesktopParam ||
        hasStoredFlag;
        
      setIsStandalone(standalone);
    };
    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        try {
          localStorage.setItem("aura_standalone_mode", "true");
        } catch (_) {}
        setIsStandalone(true);
      }
    };

    try {
      mediaQuery.addEventListener("change", listener);
    } catch (_) {
      try {
        (mediaQuery as any).addListener(listener);
      } catch (__) {}
    }

    return () => {
      try {
        mediaQuery.removeEventListener("change", listener);
      } catch (_) {
        try {
          (mediaQuery as any).removeListener(listener);
        } catch (__) {}
      }
    };
  }, []);

  // Maximum timeline span supported (seconds)
  const timelineDuration = 15;

  // Track ticker playhead loop
  useEffect(() => {
    if (!isPlaying) return;
    const tickHz = 100; // tick every 100ms
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + 0.1;
        if (nextTime >= timelineDuration) {
          setIsPlaying(false);
          return 0; // return to starting frame
        }
        return parseFloat(nextTime.toFixed(1));
      });
    }, tickHz);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Keyboard Shortcuts trigger effect
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ignore when writing in form text areas or inputs
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        if (activeClipId) {
          handleDeleteClip(activeClipId);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [isPlaying, activeClipId, tracks]);

  // Locate clip by its unique identification across tracks
  const getClipAndTrack = (clipId: string): { clip: Clip; track: Track } | null => {
    for (const t of tracks) {
      const c = t.clips.find((el) => el.id === clipId);
      if (c) return { clip: c, track: t };
    }
    return null;
  };

  const activeData = activeClipId ? getClipAndTrack(activeClipId) : null;
  const activeClip = activeData ? activeData.clip : null;
  const activeTrack = activeData ? activeData.track : null;

  // Add Asset from Media Library straight to Timeline Tracks
  const handleAddAssetToTimeline = (asset: any) => {
    // Find correct track based on file types
    let targetTrack = tracks.find((t) => t.type === asset.type);
    if (!targetTrack && tracks.length > 0) {
      targetTrack = tracks[0];
    }
    if (!targetTrack) return;

    const newClip: Clip = {
      id: `${asset.id}_clip_${Date.now()}`,
      name: asset.name,
      type: asset.type,
      startOffset: currentTime, // Place exactly at the horizontal playhead position
      duration: asset.duration,
      mediaUrl: asset.mediaUrl,
      thumbnailUrl: asset.thumbnailUrl || "🎬",
      properties: {
        volume: asset.type === "video" || asset.type === "audio" ? 100 : 0,
        speed: 1.0,
        scale: 100,
        posX: 0,
        posY: asset.type === "text" ? 80 : 0, // Placement below horizon for textual overlaps
        filterName: "None",
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        vignette: 0,
        opacity: 100,
      },
    };

    setTracks(
      tracks.map((t) => {
        if (t.id === targetTrack.id) {
          return { ...t, clips: [...t.clips, newClip] };
        }
        return t;
      })
    );

    setActiveClipId(newClip.id);
  };

  const onAddCustomClip = (trackId: string, customClip: Clip) => {
    setTracks(
      tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, clips: [...t.clips, customClip] };
        }
        return t;
      })
    );
    setActiveClipId(customClip.id);
  };

  // Update properties of the currently active clip
  const handleUpdateClipProperties = (clipId: string, updatedProps: any) => {
    setTracks(
      tracks.map((t) => {
        return {
          ...t,
          clips: t.clips.map((c) => {
            if (c.id === clipId) {
              return {
                ...c,
                properties: { ...c.properties, ...updatedProps },
              };
            }
            return c;
          }),
        };
      })
    );
  };

  // Delete clip from track completely
  const handleDeleteClip = (clipId: string) => {
    setTracks(
      tracks.map((t) => {
        return {
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        };
      })
    );
    setActiveClipId(null);
  };

  // Preset styler applications (Transitions / Text styles / Video filters)
  const handleApplyPresetStyle = (type: "filter" | "transition" | "textStyle", value: any) => {
    if (!activeClipId) return;

    if (type === "filter") {
      handleUpdateClipProperties(activeClipId, { filterName: value });
    } else if (type === "transition") {
      handleUpdateClipProperties(activeClipId, { transitionType: value, transitionDuration: 0.6 });
    } else if (type === "textStyle") {
      handleUpdateClipProperties(activeClipId, {
        fontFamily: value.fontFamily,
        fontColor: value.fontColor,
        fontSize: value.fontSize,
        fontBgColor: value.fontBgColor,
        textAnimation: value.textAnimation,
      });
    }
  };

  // Video renderer/Export process
  const triggerExportSimulation = () => {
    setIsExporting(true);
    setExportComplete(false);
    setExportStep(1);

    const stepTimer1 = setTimeout(() => setExportStep(2), 1200);
    const stepTimer2 = setTimeout(() => setExportStep(3), 2400);
    const stepTimer3 = setTimeout(() => setExportStep(4), 3800);
    const stepTimer4 = setTimeout(() => setExportStep(5), 5200);
    const stepTimer5 = setTimeout(() => {
      setExportStep(6);
      setExportComplete(true);
    }, 6200);
  };

  const handleDownloadStub = () => {
    setIsExporting(false);
    setExportComplete(false);
    setExportStep(0);
    
    // Trigger mock download file to notify user
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `AuraVideoEditor_Export_1080p.mp4`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="desktop_workspace" className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* PROFESSIONAL WINDOW HEADER / NAVIGATION BAR */}
      <header id="window_top_banner" className="h-12 bg-[#1A1A1A] border-b border-[#2A2A2A] px-4 flex items-center justify-between shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-2">
          {/* Solid blue professional branded banner icon */}
          <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center shadow-md shadow-black/80">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5 font-sans">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">AURA VIDEO EDITER</h1>
            <span className="text-[10px] text-blue-500 font-mono tracking-widest font-black uppercase">Pro</span>
          </div>

          {/* Desktop fake menus */}
          <div className="hidden md:flex items-center gap-1.5 ml-6 pl-5 border-l border-[#2A2A2A] text-[11px] font-medium text-gray-400">
            <span className="px-2 py-1 hover:bg-[#2A2A2A] hover:text-white rounded cursor-pointer transition">File</span>
            <span className="px-2 py-1 hover:bg-[#2A2A2A] hover:text-white rounded cursor-pointer transition">Timeline</span>
            <span
              onClick={() => setIsKeyboardOpen(true)}
              className="px-2 py-1 hover:bg-[#2A2A2A] hover:text-white rounded cursor-pointer transition flex items-center gap-1 text-blue-500 font-semibold"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </span>
          </div>
        </div>

        {/* Action controls items */}
        <div id="top_right_triggers" className="flex items-center gap-2">
          {/* Premium grey installer badge */}
          <div className="hidden lg:block bg-[#121212] border border-[#2A2A2A] px-3 py-1 rounded text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
            Project: Cinematic_Edit_01
          </div>

          {/* Simulated Install Trigger */}
          {!isStandalone && (
            <button
              id="install_pwa_button"
              onClick={() => setIsInstallOpen(true)}
              className="p-1.5 px-3 bg-[#2A2A2A] border border-[#3A3A3A] text-gray-300 hover:text-white hover:bg-[#3A3A3A] rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Install system onto your local machine"
            >
              <Laptop className="w-4 h-4" />
              <span className="hidden sm:inline">Install Offline build</span>
            </button>
          )}

          {/* Solid Royal Blue Export Button */}
          <button
            id="export_compile_button"
            onClick={triggerExportSimulation}
            className="p-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-sm shadow-md flex items-center gap-1.5 cursor-pointer transition"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Export Composition</span>
          </button>
        </div>
      </header>

      {/* CORE DESKTOP LAYOUT AND SECTIONS */}
      <main id="editor_main_frame" className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* LEFT COLUMN: Library + Smart AI Suite (colspan 5) */}
        <section id="left_panel_column" className="lg:col-span-5 flex flex-col gap-3 min-w-0">
          <div className="flex-1 min-h-[340px]">
            <MediaLibrary
              onAddAssetToTimeline={handleAddAssetToTimeline}
              onApplyPresetStyle={handleApplyPresetStyle}
              activeClipId={activeClipId}
            />
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <AISmartSuite
              tracks={tracks}
              setTracks={setTracks}
              currentTime={currentTime}
              onAddCustomClip={onAddCustomClip}
            />
          </div>
        </section>

        {/* MIDDLE COLUMN: Video Canvas visual Preview (colspan 4) */}
        <section id="preview_player_column" className="lg:col-span-4 flex flex-col min-w-0">
          <VisualEditor
            tracks={tracks}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            timelineDuration={timelineDuration}
            settings={settings}
            setSettings={setSettings}
          />
        </section>

        {/* RIGHT COLUMN: Inspector properties dashboard (colspan 3) */}
        <section id="inspector_panel_column" className="lg:col-span-3 flex flex-col min-w-0">
          <PropertiesPanel
            activeClip={activeClip}
            activeTrack={activeTrack}
            onUpdateClipProperties={handleUpdateClipProperties}
            onDeleteClip={handleDeleteClip}
            settings={settings}
            setSettings={setSettings}
          />
        </section>
      </main>

      {/* TIMELINE SECTION (Widescreen footer strip) */}
      <footer id="timeline_footer_strip" className="p-3 pt-0 shrink-0 select-none">
        <Timeline
          tracks={tracks}
          setTracks={setTracks}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          timelineDuration={timelineDuration}
          activeClipId={activeClipId}
          setActiveClipId={setActiveClipId}
        />
      </footer>

      {/* Bottom Status Bar from Professional Polish */}
      <footer className="h-6 bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between px-4 text-[10px] text-gray-500 shrink-0 select-none">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">Status: <strong className="text-gray-300">Ready</strong></span>
          <span className="text-emerald-500 flex items-center gap-1 font-medium select-none">● GPU Acceleration On</span>
        </div>
        <div className="flex gap-4">
          <span>Storage: 45.2 GB free</span>
          <span>Version: 4.2.0-stable</span>
        </div>
      </footer>

      {/* PWA PC App setup overlay */}
      <PWAInstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />

      {/* Keyboard shortcuts panel popup */}
      {isKeyboardOpen && (
        <div id="keyboard_modal" className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-sm p-6 relative">
            <button
              onClick={() => setIsKeyboardOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"
            >
              Close [X]
            </button>
            <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-1.5">
              <Keyboard className="w-5 h-5 text-blue-500" />
              <span>Keyboard Hotkey Commands</span>
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {KEYBOARD_SHORTCUTS.map((sh, index) => (
                <div key={index} className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1.5">
                  <kbd className="bg-[#121212] p-1.5 px-2.5 rounded font-mono text-[10px] text-blue-500 border border-[#2A2A2A]">
                    {sh.keys}
                  </kbd>
                  <span className="text-gray-400 text-right">{sh.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER PROGRESS EXPORT DIALOG POPUP */}
      {isExporting && (
        <div id="export_modal" className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] w-full max-w-md p-7 rounded-lg relative shadow-2xl space-y-4">
            
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <MonitorPlay className="w-5 h-5 animate-spin" />
              <h3 className="text-sm font-bold uppercase tracking-wide">Compiling Video Canvas Renders</h3>
            </div>

            <p className="text-xs text-gray-400 leading-normal font-sans">
              Merging multi-track sequence layers, transition frame animations, color LUT coefficients, and voice synthesis scripts into target high-definition output formats:
            </p>

            <div className="space-y-2 bg-[#121212] p-3.5 border border-[#2A2A2A] rounded font-mono text-[10.5px]">
              <div className="flex justify-between items-center">
                <span>1. Sequencing video clips</span>
                <span className={exportStep >= 2 ? "text-emerald-400 font-bold" : "text-gray-500"}>
                  {exportStep >= 2 ? "✓ DONE" : "processing..."}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>2. Interpolating transition frames</span>
                <span className={exportStep >= 3 ? "text-emerald-400 font-bold" : "text-gray-500"}>
                  {exportStep >= 3 ? "✓ DONE" : exportStep === 2 ? "processing..." : "queued"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>3. Applying LUT Color presets</span>
                <span className={exportStep >= 4 ? "text-emerald-400 font-bold" : "text-gray-400"}>
                  {exportStep >= 4 ? "✓ DONE" : exportStep === 3 ? "processing..." : "queued"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>4. Embedding BGM audio waveforms</span>
                <span className={exportStep >= 5 ? "text-emerald-400 font-bold" : "text-gray-400"}>
                  {exportStep >= 5 ? "✓ DONE" : exportStep === 4 ? "processing..." : "queued"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>5. Compressing H.264 codec file</span>
                <span className={exportStep >= 6 ? "text-emerald-400 font-bold" : "text-gray-400"}>
                  {exportStep >= 6 ? "✓ DONE" : exportStep === 5 ? "processing..." : "queued"}
                </span>
              </div>
            </div>

            {exportComplete ? (
              <div className="space-y-4 pt-1 animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Success! HD Frame render complete.</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsExporting(false)}
                    className="w-full bg-[#2A2A2A] text-gray-300 py-2.5 rounded-sm text-xs font-semibold hover:bg-[#3A3A3A] transition cursor-pointer"
                  >
                    Cancel / Back
                  </button>
                  <button
                    onClick={handleDownloadStub}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-sm text-xs font-bold hover:bg-blue-500 transition cursor-pointer"
                  >
                    Download Video (.MP4)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center py-2 text-xs font-mono text-blue-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Reticulating splines ... compiling</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
