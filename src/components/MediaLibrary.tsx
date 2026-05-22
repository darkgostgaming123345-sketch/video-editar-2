import React, { useState, useEffect } from "react";
import { 
  FolderOpen, Film, Music, Type, Smile, Sparkles, Filter, PlusCircle, Check, 
  Upload, Trash2, Home, Activity, Sliders, Database, Info, FileDown, AppWindow
} from "lucide-react";
import { DEFAULT_ASSETS, TEXT_STYLES, FILTER_PRESETS, TRANSITION_TYPES } from "../data";
import { TrackType, LibraryAsset, Clip } from "../types";

interface MediaLibraryProps {
  onAddAssetToTimeline: (asset: any) => void;
  onApplyPresetStyle: (type: "filter" | "transition" | "textStyle", value: any) => void;
  activeClipId: string | null;
}

export default function MediaLibrary({
  onAddAssetToTimeline,
  onApplyPresetStyle,
  activeClipId,
}: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<string>("imports");
  const [addedItemFeedback, setAddedItemFeedback] = useState<string | null>(null);
  
  // Dashboard Editable Project Name
  const [projectTitle, setProjectTitle] = useState<string>(() => {
    return localStorage.getItem("aura_project_title") || "AURA_Cinematic_Edit_01";
  });

  // Track dragging state for file drop zone
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Loaded user files history matching user uploads
  const [importedAssets, setImportedAssets] = useState<LibraryAsset[]>(() => {
    try {
      const saved = localStorage.getItem("aura_imported_assets");
      return saved ? JSON.parse(saved) : [
        {
          id: "import_pre_1",
          name: "Tokyo_Neon_Vibe_Clip_1080p.mp4",
          type: "video" as TrackType,
          category: "User Uploads",
          mediaUrl: "cyber-neon-drive",
          thumbnailUrl: "📹",
          duration: 10,
          size: "14.5 MB"
        },
        {
          id: "import_pre_2",
          name: "Lofi_Aesthetic_Synth_Track.mp3",
          type: "audio" as TrackType,
          category: "User Audio",
          mediaUrl: "warm-cafe-soft-lofi",
          thumbnailUrl: "🎵",
          duration: 30,
          size: "4.8 MB"
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("aura_project_title", projectTitle);
  }, [projectTitle]);

  const triggerAddFeedback = (id: string) => {
    setAddedItemFeedback(id);
    setTimeout(() => {
      setAddedItemFeedback(null);
    }, 1200);
  };

  // Process files imported from local system
  const processFiles = async (fileList: File[]) => {
    const newAssets: LibraryAsset[] = [];

    for (const file of fileList) {
      let fileType: TrackType = "video";
      let category = "User Uploads";
      let thumbnail = "📹";

      if (file.type.startsWith("audio/")) {
        fileType = "audio";
        category = "User Audio";
        thumbnail = "🎵";
      } else if (file.type.startsWith("image/")) {
        fileType = "text";
        category = "User Overlays";
        thumbnail = "🖼️";
      }

      // Read real duration via browser background media loading
      let resolvedDuration = 8;
      try {
        resolvedDuration = await new Promise<number>((resolve) => {
          if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
            const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
            el.src = URL.createObjectURL(file);
            el.onloadedmetadata = () => {
              resolve(Math.round(el.duration) || 8);
              URL.revokeObjectURL(el.src);
            };
            el.onerror = () => resolve(8);
            setTimeout(() => resolve(8), 2000); // safety fallback
          } else {
            resolve(5); // images default display time
          }
        });
      } catch (err) {
        console.warn("Error reading exact media metadata duration:", err);
      }

      const humanSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      newAssets.push({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        type: fileType,
        category: category,
        mediaUrl: file.type.startsWith("video/") || file.type.startsWith("audio/") ? URL.createObjectURL(file) : "calm-beach-waves",
        thumbnailUrl: thumbnail,
        duration: resolvedDuration,
        size: humanSize
      });
    }

    if (newAssets.length > 0) {
      const updated = [...newAssets, ...importedAssets];
      setImportedAssets(updated);
      try {
        localStorage.setItem("aura_imported_assets", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage write failed:", e);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDeleteAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = importedAssets.filter((item) => item.id !== id);
    setImportedAssets(updated);
    try {
      localStorage.setItem("aura_imported_assets", JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  const videos = DEFAULT_ASSETS.filter((a) => a.type === "video");
  const music = DEFAULT_ASSETS.filter((a) => a.type === "audio" && a.category !== "Sound Effects");
  const sfx = DEFAULT_ASSETS.filter((a) => a.type === "audio" && a.category === "Sound Effects");
  const stickers = DEFAULT_ASSETS.filter((a) => a.type === "text" && a.category === "Stickers");

  return (
    <div id="media_library_panel" className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex flex-col h-full font-sans">
      
      {/* Category Tabs list */}
      <div id="library_nav" className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 border border-[#2A2A2A] rounded mb-3 overflow-x-auto scrollbar-none">
        
        <button
          onClick={() => setActiveTab("imports")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "imports" ? "bg-blue-600 text-white shadow-md font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard & Imports</span>
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "videos" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Videos</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "audio" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio & SFX</span>
        </button>

        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "text" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Titles</span>
        </button>

        <button
          onClick={() => setActiveTab("stickers")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "stickers" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Stickers</span>
        </button>

        <button
          onClick={() => setActiveTab("transitions")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 ${
            activeTab === "transitions" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab("filters")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold cursor-pointer transition shrink-0 relative ${
            activeTab === "filters" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Grid displays based on active state */}
      <div id="library_contents" className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px] max-h-[360px]">
        {/* DASHBOARD & IMPORTS VIEWER */}
        {activeTab === "imports" && (
          <div className="space-y-4">
            {/* 1. Cockpit Project Stats */}
            <div className="p-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider">AURA Project Environment</span>
                <span className="text-[10px] bg-blue-950/40 text-blue-400 border border-blue-900/30 px-1.5 py-0.5 rounded font-mono font-bold">ACTIVE</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-semibold block">Edit Project Title Name:</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value.replace(/\s+/g, '_'))}
                    className="flex-1 bg-[#121212] border border-[#2A2A2A] text-xs px-2.5 py-1.5 rounded-sm font-mono text-white focus:outline-none focus:border-blue-500 transition"
                    placeholder="Enter project name..."
                  />
                </div>
              </div>
              
              {/* Grid with 3 statistics indicators */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-[#121212] p-2 border border-[#232323] rounded-sm text-center">
                  <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-mono">My Imports</span>
                  <strong className="text-sm font-bold text-blue-400">{importedAssets.length}</strong>
                </div>
                <div className="bg-[#121212] p-2 border border-[#232323] rounded-sm text-center">
                  <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-mono">Max timeline</span>
                  <strong className="text-sm font-bold text-gray-300">15s</strong>
                </div>
                <div className="bg-[#121212] p-2 border border-[#232323] rounded-sm text-center">
                  <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-mono">Active Tracks</span>
                  <strong className="text-sm font-bold text-emerald-400">4</strong>
                </div>
              </div>
            </div>

            {/* 2. Drag & Drop File Upload Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("dashboard_file_input")?.click()}
              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? "bg-blue-950/40 border-blue-500 text-blue-400"
                  : "bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#1f1f1f] hover:border-[#3A3A3A] text-gray-400"
              }`}
            >
              <Upload className={`w-8 h-8 mb-2.5 ${isDragging ? "text-blue-400 scale-110 animate-bounce" : "text-gray-500"}`} />
              <p className="text-xs font-semibold text-gray-300">Drag & drop real video/audio here</p>
              <p className="text-[10px] text-gray-500 mt-1">Accepts MP4, MOV, MP3, WAV, PNG, JPG (Or click to browse files)</p>
              
              <input
                type="file"
                id="dashboard_file_input"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* 3. Imported elements listing ("ape infort karana video tika pennanna") */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono flex items-center gap-1.5">
                  📁 Imported Video & Media Assets
                </h4>
                {importedAssets.length > 0 && (
                  <button
                    onClick={() => {
                      setImportedAssets([]);
                      localStorage.setItem("aura_imported_assets", "[]");
                    }}
                    className="text-[9px] hover:text-red-400 text-gray-500 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {importedAssets.length === 0 ? (
                <div className="bg-[#1A1A1A]/40 border border-[#2A2A2A] rounded p-4 text-center text-xs text-gray-500">
                  No imported assets found. Import some videoclips or sound files above to fill your workspace!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                  {importedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded p-2 hover:border-[#3A3A3A] transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="p-1 min-w-[28px] text-center bg-[#121212] font-semibold text-base leading-none rounded border border-[#2A2A2A]">
                          {asset.thumbnailUrl}
                        </span>
                        <div className="min-w-0 flex-1 pr-1">
                          <h4 className="text-xs font-medium text-gray-200 truncate" title={asset.name}>
                            {asset.name}
                          </h4>
                          <p className="text-[9px] text-gray-500 flex gap-2">
                            <span>{asset.duration}s</span>
                            {asset.size && (
                              <>
                                <span className="text-gray-600">|</span>
                                <span>{asset.size}</span>
                              </>
                            )}
                            <span className="text-gray-600">|</span>
                            <span className="text-blue-500 uppercase font-bold text-[8px]">{asset.type}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Add timeline */}
                        <button
                          onClick={() => {
                            onAddAssetToTimeline(asset);
                            triggerAddFeedback(asset.id);
                          }}
                          className="bg-[#121212] border border-[#2A2A2A] hover:bg-blue-600 text-gray-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          {addedItemFeedback === asset.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <span>+ Add to editing</span>
                          )}
                        </button>
                        
                        {/* Delete asset */}
                        <button
                          onClick={(e) => handleDeleteAsset(asset.id, e)}
                          className="p-1 hover:bg-[#2A2A2A] hover:text-red-400 text-gray-500 rounded transition cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEFAULT STOCK VIDEO ASSETS */}
        {activeTab === "videos" && (
          <div className="grid grid-cols-2 gap-2.5">
            {videos.map((asset) => (
              <div
                key={asset.id}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-sm p-2.5 flex flex-col justify-between group hover:border-[#3A3A3A] transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">{asset.thumbnailUrl}</span>
                  <span className="text-[10px] bg-[#121212] text-gray-400 px-1.5 py-0.5 rounded font-mono border border-[#2A2A2A]">
                    {asset.duration}s
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200 mb-0.5 truncate">{asset.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-2">{asset.category}</p>
                </div>
                <button
                  onClick={() => {
                    onAddAssetToTimeline(asset);
                    triggerAddFeedback(asset.id);
                  }}
                  className="w-full bg-[#121212] border border-[#2A2A2A] hover:bg-blue-950/40 hover:border-blue-800 text-gray-300 hover:text-blue-400 py-1 rounded-sm text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  {addedItemFeedback === asset.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3 h-3" />
                      <span>Add to Video</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AUDIO ASSETS */}
        {activeTab === "audio" && (
          <div className="space-y-4">
            {/* Soundtracks sub-shelf */}
            <div>
              <h4 className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-bold font-mono">
                🎵 Ambient Soundtracks & Beats
              </h4>
              <div className="space-y-1.5">
                {music.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded p-2 hover:border-[#3A3A3A] transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-[#121212] font-mono text-sm leading-none rounded border border-[#2A2A2A]">
                        {asset.thumbnailUrl}
                      </span>
                      <div className="max-w-[140px]">
                        <h4 className="text-xs font-medium text-gray-200 truncate">{asset.name}</h4>
                        <p className="text-[9px] text-gray-500">{asset.duration}s loop beat</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAddAssetToTimeline(asset);
                        triggerAddFeedback(asset.id);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-[#121212] rounded transition cursor-pointer"
                    >
                      {addedItemFeedback === asset.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sound Effects sub-shelf */}
            <div>
              <h4 className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-bold font-mono">
                👾 Cinematic Video Sound Effects (SFX)
              </h4>
              <div className="space-y-1.5">
                {sfx.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded p-2 hover:border-[#3A3A3A] transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-[#121212] font-mono text-sm leading-none rounded border border-[#2A2A2A]">
                        {asset.thumbnailUrl}
                      </span>
                      <div className="max-w-[140px]">
                        <h4 className="text-xs font-medium text-gray-200 truncate">{asset.name}</h4>
                        <p className="text-[9px] text-gray-500">{asset.duration}s FX clip</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAddAssetToTimeline(asset);
                        triggerAddFeedback(asset.id);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-[#121212] rounded transition cursor-pointer"
                    >
                      {addedItemFeedback === asset.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TITLE TEXT CARD ASSETS */}
        {activeTab === "text" && (
          <div className="space-y-2">
            <button
              onClick={() => {
                onAddAssetToTimeline({
                  id: "custom_text_blank",
                  name: "New Subtitle Caption",
                  type: "text",
                  category: "Titles",
                  mediaUrl: "New Caption Text",
                  duration: 4,
                });
                triggerAddFeedback("blank_txt");
              }}
              className="w-full bg-blue-900/20 hover:bg-blue-600 text-blue-400 hover:text-white py-2.5 rounded text-xs font-semibold border border-blue-900/40 flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Insert Empty Subtitle Block</span>
            </button>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEXT_STYLES.map((style) => (
                <div
                  key={style.id}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm flex flex-col justify-between hover:border-[#3A3A3A] transition"
                >
                  <p className="text-[10px] text-gray-400 mb-2 truncate">Styling: {style.name}</p>
                  <h4
                    className="text-center font-bold text-sm py-1.5 rounded"
                    style={{
                      fontFamily: style.fontFamily,
                      color: style.fontColor,
                      backgroundColor: style.fontBgColor || "transparent",
                    }}
                  >
                    Aa Subtitle
                  </h4>
                  <button
                    onClick={() => {
                      onApplyPresetStyle("textStyle", style);
                      triggerAddFeedback(style.id);
                    }}
                    className="w-full bg-[#121212] border border-[#2A2A2A] text-gray-300 py-1 mt-2.5 rounded-sm text-[9px] font-semibold hover:text-white hover:bg-[#2A2A2A] cursor-pointer transition"
                  >
                    {activeClipId ? "Apply to Highlighted" : "Style Preset"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMOJI COMPONENT OVERLAYS */}
        {activeTab === "stickers" && (
          <div className="grid grid-cols-2 gap-2">
            {stickers.map((asset) => (
              <div
                key={asset.id}
                className="bg-[#1A1A1A] border border-[#2A2A2A] p-2.5 rounded-sm flex items-center justify-between hover:border-[#3A3A3A] transition"
              >
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-2xl leading-none">{asset.mediaUrl}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-300 truncate">{asset.name.split(" ")[1]}</h4>
                    <p className="text-[9px] text-gray-500">{asset.duration}s sticker</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onAddAssetToTimeline(asset);
                    triggerAddFeedback(asset.id);
                  }}
                  className="p-1 px-2 text-blue-500 hover:bg-[#121212] rounded transition cursor-pointer"
                >
                  {addedItemFeedback === asset.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CAMERA TRANSITION CARDS */}
        {activeTab === "transitions" && (
          <div className="space-y-1.5 font-sans">
            <p className="text-[10px] text-gray-500 mb-1 leading-snug">
              ℹ️ Choose a transition behavior below to overlay a beautiful camera swipe onto the highlighted video sequence.
            </p>
            {TRANSITION_TYPES.map((trans) => (
              <div
                key={trans.id}
                className="flex items-center justify-between bg-[#1A1A1A] p-2 border border-[#2A2A2A] rounded-sm hover:border-[#3A3A3A] transition"
              >
                <span className="text-xs text-gray-200">{trans.name}</span>
                <button
                  onClick={() => {
                    onApplyPresetStyle("transition", trans.id);
                    triggerAddFeedback(trans.id);
                  }}
                  className="p-1 px-2.5 bg-[#121212] text-blue-500 hover:bg-[#2A2A2A] hover:text-white rounded border border-[#2A2A2A] text-[10px] font-semibold cursor-pointer transition"
                >
                  {addedItemFeedback === trans.id ? "Success" : "Apply Transition"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LOMO & CHROMATIC FILTERS */}
        {activeTab === "filters" && (
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((filter) => (
              <div
                key={filter.id}
                className="bg-[#1A1A1A] p-2.5 border border-[#2A2A2A] rounded-sm flex flex-col justify-between hover:border-[#333333] transition"
              >
                <div className="text-center font-bold text-xs py-2 text-gray-300 rounded mb-2 bg-[#121212] border border-[#2A2A2A] font-mono">
                  {filter.name.split(" ")[0]}
                </div>
                <span className="text-[10px] text-gray-400 mb-2 text-center">{filter.name}</span>
                <button
                  onClick={() => {
                    onApplyPresetStyle("filter", filter.id);
                    triggerAddFeedback(filter.id);
                  }}
                  className="w-full bg-[#121212] border border-[#2A2A2A] text-gray-300 font-semibold hover:text-white hover:bg-[#2A2A2A] rounded-sm py-1 text-[9px] cursor-pointer transition"
                >
                  {addedItemFeedback === filter.id ? "Done!" : "Apply Filter"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Drag Instructions footer */}
      <div id="library_p_footer" className="mt-3 pt-2.5 border-t border-[#2A2A2A] text-[10px] text-gray-500 font-mono text-center">
        💡 Highlighting any item inside your multi-layer timeline on the right updates its properties dynamically.
      </div>
    </div>
  );
}
