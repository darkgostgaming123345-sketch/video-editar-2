import React, { useRef } from "react";
import { Scissors, StepBack, StepForward, Lock, Unlock, Eye, EyeOff, Plus, Trash, ArrowLeftRight, ChevronRight, ChevronLeft } from "lucide-react";
import { Track, Clip } from "../types";

interface TimelineProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  timelineDuration: number;
  activeClipId: string | null;
  setActiveClipId: (id: string | null) => void;
}

export default function Timeline({
  tracks,
  setTracks,
  currentTime,
  setCurrentTime,
  timelineDuration,
  activeClipId,
  setActiveClipId,
}: TimelineProps) {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const pxPerSecond = 24; // Width matching of 1 second on the timeline screen

  // Handle timeline seeking on click
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 180; // account for track name offsets on left
    if (clickX < 0) return;
    
    const clickTime = Math.max(0, Math.min(timelineDuration, clickX / pxPerSecond));
    setCurrentTime(parseFloat(clickTime.toFixed(2)));
  };

  // Find currently highlighted clip across all tracks
  const getActiveClipAndTrack = (): { clip: Clip; track: Track } | null => {
    if (!activeClipId) return null;
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === activeClipId);
      if (clip) return { clip, track };
    }
    return null;
  };

  const activeData = getActiveClipAndTrack();

  // SPLIT LOGIC (Standard AURA core action)
  const handleSplitClip = () => {
    if (!activeData) return;
    const { clip, track } = activeData;

    // Check if playhead sits inside the clip duration boundaries
    const offsetInClip = currentTime - clip.startOffset;
    if (offsetInClip <= 0.2 || offsetInClip >= clip.duration - 0.2) {
      // Cannot split if too close to borders
      return;
    }

    const firstDuration = parseFloat(offsetInClip.toFixed(2));
    const secondDuration = parseFloat((clip.duration - offsetInClip).toFixed(2));

    const leftClip: Clip = {
      ...clip,
      id: `${clip.id}_pt1_${Math.floor(Math.random() * 1000)}`,
      name: `${clip.name} (Split A)`,
      duration: firstDuration,
    };

    const rightClip: Clip = {
      ...clip,
      id: `${clip.id}_pt2_${Math.floor(Math.random() * 1000)}`,
      name: `${clip.name} (Split B)`,
      startOffset: parseFloat(currentTime.toFixed(2)),
      duration: secondDuration,
    };

    // Replace old clip with two sliced clips in tracks
    setTracks(
      tracks.map((t) => {
        if (t.id === track.id) {
          const newClips = t.clips.filter((c) => c.id !== clip.id);
          newClips.push(leftClip, rightClip);
          // Sort clips by chronological offsets
          newClips.sort((a, b) => a.startOffset - b.startOffset);
          return { ...t, clips: newClips };
        }
        return t;
      })
    );

    setActiveClipId(leftClip.id);
  };

  // Nudge selected clip left or right
  const handleNudgeClip = (direction: "left" | "right") => {
    if (!activeData) return;
    const { clip, track } = activeData;
    const nudgeAmount = direction === "left" ? -0.5 : 0.5;
    const nextOffset = Math.max(0, parseFloat((clip.startOffset + nudgeAmount).toFixed(2)));

    setTracks(
      tracks.map((t) => {
        if (t.id === track.id) {
          return {
            ...t,
            clips: t.clips.map((c) => (c.id === clip.id ? { ...c, startOffset: nextOffset } : c)),
          };
        }
        return t;
      })
    );
  };

  // Adjust duration of clip manually
  const handleScaleDuration = (action: "grow" | "shrink") => {
    if (!activeData) return;
    const { clip, track } = activeData;
    const delta = action === "grow" ? 0.5 : -0.5;
    const nextDuration = Math.max(0.5, parseFloat((clip.duration + delta).toFixed(2)));

    setTracks(
      tracks.map((t) => {
        if (t.id === track.id) {
          return {
            ...t,
            clips: t.clips.map((c) => (c.id === clip.id ? { ...c, duration: nextDuration } : c)),
          };
        }
        return t;
      })
    );
  };

  // Toggle Track properties like mute and lock
  const handleToggleMuteTrack = (trackId: string) => {
    setTracks(
      tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  const handleToggleLockTrack = (trackId: string) => {
    setTracks(
      tracks.map((t) => (t.id === trackId ? { ...t, isLocked: !t.isLocked } : t))
    );
  };

  // Grid tick rendering
  const ticks = Array.from({ length: Math.ceil(timelineDuration) + 1 });

  return (
    <div id="timeline_track_container" className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex flex-col w-full h-full font-sans">
      
      {/* Clip Slicing & Resizing Toolbar (Easy Desktop Controller) */}
      <div id="timeline_action_bar" className="flex items-center justify-between bg-[#1A1A1A] p-2.5 rounded-sm mb-3 border border-[#2A2A2A]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="timeline_split_btn"
            onClick={handleSplitClip}
            disabled={!activeData}
            className={`p-1.5 px-3 rounded-sm text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeData
                ? "bg-[#2A2A2A] text-blue-400 hover:bg-blue-900/30 hover:text-blue-200 border border-[#3A3A3A]"
                : "text-gray-600 bg-transparent border border-[#2A2A2A] cursor-not-allowed"
            }`}
            title="Split selected clip at current playhead position"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Split (S)</span>
          </button>

          <span className="h-6 w-[1px] bg-[#2A2A2A] mx-1"></span>

          {/* Sizing nudge button blocks */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNudgeClip("left")}
              disabled={!activeData}
              className="p-1 px-2.5 bg-[#121212] text-xs font-semibold hover:bg-[#2A2A2A] text-gray-300 border border-[#2A2A2A] rounded-sm disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition"
              title="Nudge clip 0.5s backward"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Nudge Left</span>
            </button>
            <button
              onClick={() => handleNudgeClip("right")}
              disabled={!activeData}
              className="p-1 px-2.5 bg-[#121212] text-xs font-semibold hover:bg-[#2A2A2A] text-gray-300 border border-[#2A2A2A] rounded-sm disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition"
              title="Nudge clip 0.5s forward"
            >
              <span>Nudge Right</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>

          <span className="h-6 w-[1px] bg-[#2A2A2A] mx-1"></span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleScaleDuration("shrink")}
              disabled={!activeData}
              className="p-1 px-2.5 bg-[#121212] text-xs font-semibold hover:bg-[#2A2A2A] text-amber-500 border border-[#2A2A2A] rounded-sm disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition"
              title="Shorten highlighted clip by 0.5s"
            >
              <span>Shorten</span>
            </button>
            <button
              onClick={() => handleScaleDuration("grow")}
              disabled={!activeData}
              className="p-1 px-2.5 bg-[#121212] text-xs font-semibold hover:bg-[#2A2A2A] text-emerald-500 border border-[#2A2A2A] rounded-sm disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition"
              title="Extend highlighted clip by 0.5s"
            >
              <span>Lengthen</span>
            </button>
          </div>
        </div>

        {/* Selected clip indicator */}
        <div className="text-[10px] text-gray-400 hidden sm:block">
          {activeData ? (
            <span>
              Active: <strong className="text-blue-400 font-bold">{activeData.clip.name}</strong>
            </span>
          ) : (
            <span className="text-gray-500">No clip highlighted</span>
          )}
        </div>
      </div>

      {/* HORIZONTAL SCROLL TIMELINE AREA */}
      <div
        id="scroll_layer_canvas"
        ref={rulerRef}
        className="flex-1 overflow-x-auto relative select-none border border-[#2A2A2A] rounded-sm bg-[#121212]"
        style={{ minHeight: "220px" }}
      >
        
        {/* Absolute red vertical playhead line */}
        <div
          id="playhead_red_marker"
          className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.7)]"
          style={{
            left: `${180 + currentTime * pxPerSecond}px`,
          }}
        >
          {/* Triangular playhead handle */}
          <div className="absolute top-0 left-[-4px] w-2.5 h-2.5 bg-blue-500 transform rotate-45 border-r border-b border-blue-400"></div>
        </div>

        {/* TIME TICK MARKERS (Horizontal scale ruler) */}
        <div
          id="time_scale_ruler"
          className="h-8 border-b border-[#2A2A2A] flex items-end relative cursor-ew-resize z-25 bg-[#1A1A1A]"
          onClick={handleRulerClick}
          style={{ width: `${180 + timelineDuration * pxPerSecond + 100}px` }}
        >
          {/* Pad the left headers spacer */}
          <div className="w-[180px] h-full border-r border-[#2A2A2A] flex items-center px-3 sticky left-0 bg-[#1A1A1A] z-20">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">TRACK STRUCTURES</span>
          </div>

          {/* Floating numbered seconds markers */}
          <div className="absolute left-[180px] right-0 h-full flex items-end">
            {ticks.map((_, i) => (
              <div
                key={i}
                className="absolute flex flex-col justify-end items-center h-full text-gray-400 text-[9px] font-mono"
                style={{ left: `${i * pxPerSecond}px`, transform: "translateX(-50%)" }}
              >
                <span className="mb-1">{i}s</span>
                <div className="w-[1px] h-2.5 bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>

        {/* VERTICAL TRACK LAYER ROWS */}
        <div id="timeline_layer_rows" style={{ width: `${180 + timelineDuration * pxPerSecond + 100}px` }}>
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-12 border-b border-[#2A2A2A] flex relative group bg-[#151515] hover:bg-[#1A1A1A] transition-colors duration-150"
            >
              {/* Left track configuration headers */}
              <div className="w-[180px] h-full border-r border-[#2A2A2A] flex items-center justify-between px-3 sticky left-0 bg-[#1A1A1A] z-10 text-xs shadow-md shadow-black/40">
                <div className="min-w-0 pr-1.5">
                  <h4 className="font-semibold text-gray-200 truncate text-[11px] font-sans">
                    {track.name}
                  </h4>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400 font-mono">
                    {track.type}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleToggleMuteTrack(track.id)}
                    className={`p-1 hover:bg-[#2A2A2A] rounded transition ${
                      track.isMuted ? "text-amber-500" : "text-gray-400"
                    }`}
                    title={track.isMuted ? "Unmute entire track" : "Mute entire track"}
                  >
                    {track.isMuted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleLockTrack(track.id)}
                    className={`p-1 hover:bg-[#2A2A2A] rounded transition ${
                      track.isLocked ? "text-red-400 font-bold" : "text-gray-400"
                    }`}
                    title={track.isLocked ? "Unlock track edits" : "Lock track edits"}
                  >
                    {track.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Clip visual tracks map */}
              <div className="flex-1 relative h-full bg-[#121212]/30">
                {track.clips.map((clip) => {
                  const isSelected = activeClipId === clip.id;
                  const leftPx = clip.startOffset * pxPerSecond;
                  const widthPx = clip.duration * pxPerSecond;

                  // Define dynamic styling gradients matching standard video editors
                  const getClipGradient = () => {
                    if (isSelected) {
                      return "bg-[#1C253B] border-2 border-blue-500 ring-2 ring-blue-500/20";
                    }
                    switch (clip.type) {
                      case "audio":
                        return "bg-[#102A43]/45 border border-blue-800/60 hover:bg-[#183E60]/50 text-blue-300";
                      case "text":
                        return "bg-[#433010]/45 border border-amber-800/60 hover:bg-[#5C4217]/50 text-amber-300";
                      case "effect":
                        return "bg-[#281043]/45 border border-purple-800/60 hover:bg-[#3D1864]/50 text-purple-300";
                      case "video":
                      default:
                        return "bg-[#241243]/45 border border-fuchsia-800/60 hover:bg-[#341B5E]/50 text-fuchsia-300";
                    }
                  };

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveClipId(clip.id);
                      }}
                      className={`absolute top-1.5 bottom-1.5 rounded-sm flex items-center justify-between px-2.5 group/clip select-none overflow-hidden text-xs shadow-sm cursor-pointer z-10 transition-all ${getClipGradient()}`}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`,
                      }}
                    >
                      {/* Left thumbnail marker */}
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-xs">{clip.thumbnailUrl || "🎬"}</span>
                        <span className="truncate font-sans font-medium text-[10.5px]">
                          {clip.properties.textString ? `"${clip.properties.textString}"` : clip.name}
                        </span>
                      </div>

                      {/* Display durations / filters inside body if wide enough */}
                      {widthPx > 60 && (
                        <div className="flex items-center gap-1 text-[8px] font-mono text-gray-400 shrink-0 select-none">
                          <span>{clip.duration}s</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
