import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Crop, Sparkles, Sliders } from "lucide-react";
import { Track, Clip, VideoEditorSettings } from "../types";

interface VisualEditorProps {
  tracks: Track[];
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timelineDuration: number;
  settings: VideoEditorSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoEditorSettings>>;
}

export default function VisualEditor({
  tracks,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  timelineDuration,
  settings,
  setSettings,
}: VisualEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Map aspect ratios to specific canvas dimensions (max size is kept within container ranges)
  const getAspectRatioClasses = () => {
    switch (settings.aspectRatio) {
      case "9:16":
        return { width: 270, height: 480, aspect: "aspect-[9/16]" };
      case "1:1":
        return { width: 380, height: 380, aspect: "aspect-square" };
      case "21:9":
        return { width: 560, height: 240, aspect: "aspect-[21/9]" };
      case "4:5":
        return { width: 320, height: 400, aspect: "aspect-[4/5]" };
      case "16:9":
      default:
        return { width: 560, height: 315, aspect: "aspect-video" };
    }
  };

  const currentAspect = getAspectRatioClasses();

  // Procedural audio level generation (mocking live timeline tracks when playing)
  useEffect(() => {
    if (!isPlaying) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      // Find if any audio tracks are active
      const hasActiveAudio = tracks
        .filter((t) => t.type === "audio" && !t.isMuted)
        .some((t) =>
          t.clips.some(
            (c) => currentTime >= c.startOffset && currentTime <= c.startOffset + c.duration
          )
        );

      if (hasActiveAudio) {
        setAudioLevel(Math.random() * 0.4 + 0.3); // fluctuating values between 30%-70%
      } else {
        setAudioLevel(Math.random() * 0.08); // low ambient humming noise
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, tracks, currentTime]);

  // Frame rendering cycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set resolution explicitly
    canvas.width = currentAspect.width;
    canvas.height = currentAspect.height;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw solid dark background placeholder
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, width, height);

    // Draw visual grid inside player if safe margins activated
    if (showSafeMargins) {
      ctx.strokeStyle = "rgba(45, 212, 191, 0.25)";
      ctx.lineWidth = 1;
      
      // Vertical rules
      ctx.beginPath();
      ctx.moveTo(width * 0.1, 0); ctx.lineTo(width * 0.1, height);
      ctx.moveTo(width * 0.9, 0); ctx.lineTo(width * 0.9, height);
      // Horizontal rules
      ctx.moveTo(0, height * 0.1); ctx.lineTo(width, height * 0.1);
      ctx.moveTo(0, height * 0.9); ctx.lineTo(width, height * 0.9);
      // Midpoints
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Label margins
      ctx.fillStyle = "#2dd4bf";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText("90% Action Safe Zone", width * 0.1 + 5, height * 0.1 - 5);
    }

    // 2. Locate and render current active video layers
    const videoTracks = tracks.filter((t) => t.type === "video" && !t.isMuted);
    let activeVideoClips: { clip: Clip; transitionProg: number; transitionType: string }[] = [];

    videoTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const start = clip.startOffset;
        const end = start + clip.duration;
        if (currentTime >= start && currentTime <= end) {
          // Check for transition progress at start of clip
          const elapsedInClip = currentTime - start;
          const transDuration = clip.properties.transitionDuration || 0;
          const transType = clip.properties.transitionType || "none";
          let transitionProg = 1; // Fully rendered by default

          if (elapsedInClip < transDuration && transType !== "none") {
            transitionProg = elapsedInClip / transDuration;
          }

          activeVideoClips.push({ clip, transitionProg, transitionType: transType });
        }
      });
    });

    // Draw background video clips
    activeVideoClips.forEach(({ clip, transitionProg, transitionType }) => {
      const props = clip.properties;
      const mainCanvasCtx = canvas.getContext("2d")!;
      let targetCtx = canvas.getContext("2d")!;
      let tempCanvas: HTMLCanvasElement | null = null;
      let tempCtx: CanvasRenderingContext2D | null = null;
      
      if (props.chromaKeyEnabled) {
        tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.clearRect(0, 0, width, height);
          targetCtx = tempCtx;
        }
      }

      // Shadow ctx block-locally so existing drawing code defaults to targetCtx
      const ctx = targetCtx;

      ctx.save();

      // Configure global rendering properties
      ctx.globalAlpha = (props.opacity / 100);

      // Render transition animations
      if (transitionProg < 1) {
        if (transitionType === "fade") {
          ctx.globalAlpha *= transitionProg;
        } else if (transitionType === "zoom") {
          const scaleOffset = 1.6 - 0.6 * transitionProg;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scaleOffset, scaleOffset);
          ctx.translate(-width / 2, -height / 2);
        } else if (transitionType === "slide-left") {
          const xOffset = width * (1 - transitionProg);
          ctx.translate(xOffset, 0);
        } else if (transitionType === "slide-right") {
          const xOffset = -width * (1 - transitionProg);
          ctx.translate(xOffset, 0);
        } else if (transitionType === "wave") {
          const skewAngle = (1 - transitionProg) * 0.3;
          ctx.transform(1, skewAngle, skewAngle, 1, 0, 0);
        }
      }

      // Handle custom clip transforms (scale and relative coordinate positions)
      const scaleVal = props.scale / 100;
      if (scaleVal !== 1 || props.posX !== 0 || props.posY !== 0) {
        ctx.translate(width / 2 + props.posX, height / 2 + props.posY);
        ctx.scale(scaleVal, scaleVal);
        ctx.translate(-width / 2, -height / 2);
      }

      // Call standard HTML5 Canvas filters
      ctx.filter = `brightness(${props.brightness}%) contrast(${props.contrast}%) saturate(${props.saturation}%) blur(${props.blur}px)`;

      // Draw procedural scenic loop graphics based on loaded URL categories
      const key = clip.mediaUrl;
      const tSeed = currentTime * props.speed;

      if (key === "cyber-neon-drive") {
        // Draw deep purple horizon sunset with pink lasers
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#0e031a");
        grad.addColorStop(0.5, "#25023a");
        grad.addColorStop(1, "#050010");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Grid lines racing forward
        ctx.strokeStyle = "#ff007f";
        ctx.lineWidth = 1.5;
        const horizonY = height * 0.55;
        const linesCount = 14;
        const speedOffset = (tSeed * 50) % 40;

        ctx.beginPath();
        // Drawing vanishing grid lines
        for (let i = 0; i <= linesCount; i++) {
          const startX = (width / linesCount) * i;
          ctx.moveTo(startX, height);
          ctx.lineTo(width / 2, horizonY);
        }
        ctx.stroke();

        // Horizontal lines in road
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let y = horizonY; y < height; y += 22) {
          const animatedY = y + (speedOffset * ((y - horizonY) / (height - horizonY)));
          if (animatedY < height) {
            ctx.moveTo(0, animatedY);
            ctx.lineTo(width, animatedY);
          }
        }
        ctx.stroke();

        // Glowing sun disc
        const sunRad = Math.min(width, height) * 0.16;
        ctx.fillStyle = "#ff5e00";
        ctx.beginPath();
        ctx.arc(width / 2, horizonY - 10, sunRad, Math.PI, 0);
        ctx.fill();

        // City skyline silhouettes
        ctx.fillStyle = "#120224";
        for (let i = 1; i < 9; i++) {
          const bW = width * 0.08;
          const bH = (height * 0.2) + Math.sin(i * 3) * 20;
          ctx.fillRect(i * bW + (i * 2), horizonY - bH, bW, bH);
        }

      } else if (key === "calm-beach-waves") {
        // Nature ocean theme
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#5bc0be");
        grad.addColorStop(0.6, "#28527a");
        grad.addColorStop(1, "#1c3d5a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Rolling waves
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 10) {
          const y = height * 0.65 + Math.sin(x * 0.015 + tSeed * 1.8) * 14;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.fill();

        ctx.fillStyle = "rgba(43, 203, 186, 0.35)";
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 10) {
          const y = height * 0.72 + Math.cos(x * 0.02 + tSeed * 1.2) * 10;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.fill();

        // High gloss glistening rays
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(-10, -10); ctx.lineTo(width * 0.4, height + 10);
        ctx.moveTo(width * 0.2, -10); ctx.lineTo(width * 0.8, height + 10);
        ctx.stroke();

        // Sun
        ctx.fillStyle = "#fddb3a";
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, 25, 0, 2 * Math.PI);
        ctx.fill();

      } else if (key === "intense-power-gym") {
        // Red and black strobe sports graphics
        ctx.fillStyle = "#0c0205";
        ctx.fillRect(0, 0, width, height);

        // Flashing target waves
        ctx.strokeStyle = isPlaying && Math.floor(currentTime * 8) % 2 === 0 ? "#ff003c" : "#3d020d";
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Center concentric lines representation
        ctx.strokeStyle = "#ff003c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70 + Math.sin(tSeed * 5) * 15, 0, 2 * Math.PI);
        ctx.stroke();

        // Heavy steel barbell bars
        ctx.fillStyle = "#8a8d91";
        ctx.fillRect(width * 0.2, height * 0.46, width * 0.6, height * 0.08);
        ctx.fillStyle = "#1e2229";
        ctx.fillRect(width * 0.25, height * 0.38, 20, height * 0.24);
        ctx.fillRect(width * 0.72, height * 0.38, 20, height * 0.24);

        // Sparks fly
        if (isPlaying) {
          ctx.fillStyle = "#ffd200";
          for (let s = 0; s < 10; s++) {
            const rx = width / 2 + Math.sin(s * tSeed) * 90;
            const ry = height / 2 + Math.cos(s * tSeed * 2.2) * 60;
            ctx.fillRect(rx, ry, 3, 3);
          }
        }

      } else if (key === "morning-espresso") {
        // Cosy cafe brown aesthetic
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#2d1607");
        grad.addColorStop(1, "#120802");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Top view white mug rim
        ctx.strokeStyle = "#eceff1";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 85, 0, 2 * Math.PI);
        ctx.stroke();

        // Coffee froth content
        ctx.fillStyle = "#795548";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 79, 0, 2 * Math.PI);
        ctx.fill();

        // Latte art swirls
        ctx.fillStyle = "#ffecb3";
        ctx.beginPath();
        ctx.arc(width / 2 - 12, height / 2 - 8, 45, 0, Math.PI * 1.5);
        ctx.arc(width / 2 + 15, height / 2 + 5, 25, 0, Math.PI * 1.8);
        ctx.closePath();
        ctx.fill();

        // Rising vapor animations
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let s = 0; s < 3; s++) {
          const sx = width * 0.35 + (s * 45);
          const phase = tSeed + (s * 10);
          ctx.moveTo(sx, height * 0.85);
          ctx.bezierCurveTo(sx - 15, height * 0.6, sx + 15, height * 0.45, sx - 10, height * 0.15);
        }
        ctx.stroke();

      } else if (key === "gold-sunset-scenic") {
        // Red-golden scenic vista
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#fc354c");
        grad.addColorStop(0.5, "#fda085");
        grad.addColorStop(1, "#f4d03f");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Beautiful setting mountain rings
        ctx.fillStyle = "#83132e";
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(width * 0.35, height * 0.5, width * 0.7, height);
        ctx.lineTo(0, height);
        ctx.fill();

        ctx.fillStyle = "rgba(74, 5, 23, 0.88)";
        ctx.beginPath();
        ctx.moveTo(width * 0.4, height);
        ctx.quadraticCurveTo(width * 0.75, height * 0.58, width, height);
        ctx.lineTo(width * 0.4, height);
        ctx.fill();

        // Sun disc descending
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.48 + (currentTime * 4) % 100, 32, 0, 2 * Math.PI);
        ctx.fill();

        // Birds soaring
        ctx.strokeStyle = "#3a0210";
        ctx.lineWidth = 1.5;
        const bX = (tSeed * 50) % (width + 100) - 50;
        ctx.beginPath();
        ctx.moveTo(bX, height * 0.3); ctx.lineTo(bX + 8, height * 0.27); ctx.lineTo(bX + 16, height * 0.3);
        ctx.moveTo(bX + 25, height * 0.32); ctx.lineTo(bX + 33, height * 0.29); ctx.lineTo(bX + 41, height * 0.32);
        ctx.stroke();
      } else if (key === "aura-greenscreen-dino") {
        // Vibrant bright green screen background
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(0, 0, width, height);

        // Animated Dinosaur moving across screen
        const xRaw = (tSeed * 45) % (width + 120);
        const xDino = xRaw - 60;
        const yDino = height * 0.65 + Math.sin(tSeed * 8) * 8; // gentle bounce

        // Shadow under dino legs
        ctx.fillStyle = "rgba(0, 100, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(xDino, height * 0.8 + 10, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // T-Rex Body (orange/red to stand out against green screen)
        ctx.fillStyle = "#e65f2b";
        ctx.strokeStyle = "#b33c10";
        ctx.lineWidth = 2.5;

        // Tail
        ctx.beginPath();
        ctx.moveTo(xDino - 20, yDino + 10);
        ctx.quadraticCurveTo(xDino - 50, yDino - 15, xDino - 60, yDino - 10);
        ctx.quadraticCurveTo(xDino - 45, yDino + 20, xDino - 20, yDino + 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy legs
        const legSwing = Math.sin(tSeed * 12);
        ctx.fillStyle = "#bf4515";
        ctx.fillRect(xDino - 15 + legSwing * 5, yDino + 15, 8, 20);
        ctx.fillRect(xDino + legSwing * -5, yDino + 15, 8, 20);

        // Back feet
        ctx.fillStyle = "#8c2e0b";
        ctx.fillRect(xDino - 18 + legSwing * 5, yDino + 31, 14, 5);
        ctx.fillRect(xDino - 3 + legSwing * -5, yDino + 31, 14, 5);

        // Body oval
        ctx.fillStyle = "#e65f2b";
        ctx.beginPath();
        ctx.ellipse(xDino - 10, yDino + 5, 26, 18, Math.PI / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Big head block
        ctx.fillRect(xDino - 2, yDino - 24, 30, 20);
        ctx.strokeRect(xDino - 2, yDino - 24, 30, 20);
        // Snout
        ctx.fillRect(xDino + 15, yDino - 20, 16, 14);
        ctx.strokeRect(xDino + 15, yDino - 20, 16, 14);
        // Neck
        ctx.fillRect(xDino - 4, yDino - 12, 12, 16);

        // White Cartoon Eye
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(xDino + 10, yDino - 17, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(xDino + 11, yDino - 17, 2, 0, Math.PI * 2);
        ctx.fill();

        // Little yellow spikes
        ctx.fillStyle = "#fddb3a";
        for (let i = 0; i < 4; i++) {
          const spY = yDino - 12 + (i * 8);
          ctx.beginPath();
          ctx.moveTo(xDino - 25, spY);
          ctx.lineTo(xDino - 31, spY + 4);
          ctx.lineTo(xDino - 25, spY + 8);
          ctx.fill();
        }

        // Tiny T-Rex arm
        ctx.strokeStyle = "#8c2e0b";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(xDino + 12, yDino + 2);
        ctx.lineTo(xDino + 22, yDino + 2);
        ctx.lineTo(xDino + 20, yDino + 8);
        ctx.stroke();

        // Text label on green screen
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px ui-monospace, monospace";
        ctx.fillText("🦖 PRO CHROMA SIMULATOR (KEY TO REMOVE)", 15, height - 15);

      } else if (key === "aura-greenscreen-robot") {
        // Vibrant bright green screen background
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(0, 0, width, height);

        // Dancing Robot
        const xBot = width / 2 + Math.sin(tSeed * 3) * 45;
        const yBounce = Math.cos(tSeed * 6) * 12;
        const yBot = height * 0.5 + yBounce;

        // Shadow
        ctx.fillStyle = "rgba(0, 100, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(xBot, height * 0.82, 38 + yBounce * 0.3, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xBot, yBot - 35);
        ctx.lineTo(xBot, yBot - 52);
        ctx.stroke();
        // Antenna Light (Blinking)
        ctx.fillStyle = isPlaying && Math.floor(currentTime * 5) % 2 === 0 ? "#e74c3c" : "#f1c40f";
        ctx.beginPath();
        ctx.arc(xBot, yBot - 54, 5, 0, Math.PI * 2);
        ctx.fill();

        // Arms (Waving up & down)
        const armAngle = Math.sin(tSeed * 8) * 0.5;
        ctx.strokeStyle = "#95a5a6";
        ctx.lineWidth = 5;
        // Left Arm
        ctx.save();
        ctx.translate(xBot - 20, yBot - 12);
        ctx.rotate(-Math.PI / 4 + armAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-24, 0);
        ctx.stroke();
        // Claw
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(-28, -5, 5, 10);
        ctx.restore();

        // Right Arm
        ctx.save();
        ctx.translate(xBot + 20, yBot - 12);
        ctx.rotate(Math.PI / 4 - armAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(24, 0);
        ctx.stroke();
        // Claw
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(24, -5, 5, 10);
        ctx.restore();

        // Body block (Steel grey)
        ctx.fillStyle = "#bdc3c7";
        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 2.5;
        ctx.fillRect(xBot - 20, yBot - 20, 40, 36);
        ctx.strokeRect(xBot - 20, yBot - 20, 40, 36);

        // Dial indicator on body
        ctx.fillStyle = "#34495e";
        ctx.fillRect(xBot - 12, yBot - 5, 24, 12);
        // Animated waveform gauge
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xBot - 10, yBot + 1);
        for (let gx = 0; gx < 20; gx += 3) {
          ctx.lineTo(xBot - 10 + gx, yBot + 1 + Math.sin(tSeed * 10 + gx) * 4);
        }
        ctx.stroke();

        // Head block
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(xBot - 16, yBot - 36, 32, 16);
        ctx.strokeRect(xBot - 16, yBot - 36, 32, 16);

        // Electronic visor
        ctx.fillStyle = "#111111";
        ctx.fillRect(xBot - 12, yBot - 30, 24, 6);
        // Visor glare sweep
        ctx.fillStyle = "#3498db";
        const glX = xBot - 11 + ((tSeed * 25) % 18);
        ctx.fillRect(glX, yBot - 30, 5, 6);

        // Legs bouncing
        ctx.fillStyle = "#7f8c8d";
        const rLegSwing = Math.sin(tSeed * 12);
        ctx.fillRect(xBot - 12 + rLegSwing * 3, yBot + 16, 8, 20);
        ctx.fillRect(xBot + 4 + rLegSwing * -3, yBot + 16, 8, 20);

        // Big wheel / feet rollers
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(xBot - 16 + rLegSwing * 3, yBot + 34, 15, 6);
        ctx.fillRect(xBot + rLegSwing * -3, yBot + 34, 15, 6);

        // Text label on green screen
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px ui-monospace, monospace";
        ctx.fillText("🤖 CHROMA DANCING DROID (KEY TO REMOVE)", 15, height - 15);
      } else {
        // Basic placeholder if custom visual matching fails
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(20, 20, width - 40, height - 40);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px Inter";
        ctx.fillText(`🎬 Clip: ${clip.name}`, 35, 45);
      }

      // Handle preset styling overlays (VHS tracking, Noise effects, Vignettes)
      if (props.filterName === "Retro VHS") {
        // Draw static film noise lines
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const randY = Math.random() * height;
        ctx.moveTo(0, randY); ctx.lineTo(width, randY);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.04)";
        for (let n = 0; n < 150; n++) {
          ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }

        // Add classic red tracking alert text
        ctx.fillStyle = "#ff003c";
        ctx.font = "italic bold 10px ui-monospace, sans-serif";
        ctx.fillText("📼 VHS PLAY", 15, 25);
        
        ctx.fillStyle = "#ffffff";
        const d = new Date();
        ctx.fillText(`MAY 22 2026  ${d.toTimeString().substring(0, 8)}`, width - 150, height - 15);

      } else if (props.filterName === "Cyber Glitch") {
        // Slice specific rows to simulate scan distortion
        if (isPlaying && Math.random() < 0.25) {
          const sliceH = 25;
          const sliceY = Math.random() * (height - sliceH);
          const imgData = ctx.getImageData(0, sliceY, width, sliceH);
          ctx.putImageData(imgData, Math.sin(tSeed * 50) * 15, sliceY);

          ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
          ctx.fillRect(0, sliceY, width, sliceH);
        }
      } else if (props.filterName === "Cinema Teal") {
        // Teal and Orange warm tint overlay
        ctx.fillStyle = "rgba(0, 180, 216, 0.08)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(255, 120, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);

      } else if (props.filterName === "Noir") {
        // Grayscale conversion overlay style
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);

      } else if (props.filterName === "Vintage gold") {
        // Sepia yellow warm tone overlay
        ctx.fillStyle = "rgba(230, 126, 34, 0.14)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);

        // Film dust circles
        if (Math.random() < 0.3) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else if (props.filterName === "Chrome Acid") {
        // Inverse contrast style simulation
        ctx.fillStyle = "rgba(0, 255, 0, 0.12)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(255, 0, 255, 0.05)";
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Draw radial vignette shadow
      if (props.vignette > 0) {
        const radGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
        radGrad.addColorStop(0, "transparent");
        radGrad.addColorStop(1, `rgba(0, 0, 0, ${props.vignette / 100})`);
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();

      // IF CHROMA KEY SELECTED -> Run advanced pixel filter calculations
      if (props.chromaKeyEnabled && tempCanvas && tempCtx) {
        const imgData = tempCtx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Retrieve background RGB values of selected Key
        const keyHex = props.chromaColor || "#00ff00";
        const rKey = parseInt(keyHex.slice(1, 3), 16) || 0;
        const gKey = parseInt(keyHex.slice(3, 5), 16) || 0;
        const bKey = parseInt(keyHex.slice(5, 7), 16) || 0;

        const similarity = props.chromaSimilarity ?? 45;
        const smoothness = props.chromaSmoothness ?? 10;

        // Calculate Euclidean ranges
        const threshold = similarity * 2.5;
        const smoothRange = smoothness * 1.5;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const rDiff = r - rKey;
          const gDiff = g - gKey;
          const bDiff = b - bKey;
          const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

          if (distance < threshold) {
            if (smoothness > 0 && distance > (threshold - smoothRange)) {
              const ratio = (distance - (threshold - smoothRange)) / smoothRange;
              data[i + 3] = Math.min(a, Math.round(a * ratio));
            } else {
              data[i + 3] = 0;
            }
          }
        }

        // Put image values back and blend onto primary preview frame
        tempCtx.putImageData(imgData, 0, 0);
        mainCanvasCtx.drawImage(tempCanvas, 0, 0);
      }
    });

    // 3. Locate and render overlay text layers (captions & stickers)
    const overlayTracks = tracks.filter((t) => t.type === "text" && !t.isMuted);

    overlayTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const start = clip.startOffset;
        const end = start + clip.duration;
        if (currentTime >= start && currentTime <= end) {
          ctx.save();
          const props = clip.properties;

          // Compute canvas position with parent scale adjustments
          const fontText = props.textString || clip.mediaUrl || "TEXT";
          let fontFam = props.fontFamily || "Inter";
          let cx = width / 2 + props.posX;
          let cy = height * 0.78 + props.posY; // Centered near lower third automatically for captions

          // Text entrance / keyframe animation states
          if (props.textAnimation === "bounce") {
            cy += Math.sin(currentTime * 6.5) * 8;
          } else if (props.textAnimation === "typewriter") {
            const charRatio = (currentTime - start) / clip.duration;
            const fullLen = fontText.length;
            const subLen = Math.floor(fullLen * Math.min(1, charRatio * 1.5));
            ctx.fillStyle = props.fontColor || "#FFFFFF";
            ctx.font = `bold ${props.fontSize || 20}px ${fontFam}, sans-serif`;
            // Redraw with typewriter text
            drawTextElement(ctx, fontText.substring(0, subLen), cx, cy, props);
            ctx.restore();
            return;
          } else if (props.textAnimation === "scale") {
            const pulse = 1 + Math.sin(currentTime * 4) * 0.08;
            ctx.translate(cx, cy);
            ctx.scale(pulse, pulse);
            ctx.translate(-cx, -cy);
          } else if (props.textAnimation === "fade") {
            const tProg = (currentTime - start) / clip.duration;
            ctx.globalAlpha = tProg < 0.2 ? tProg * 5 : tProg > 0.85 ? (1 - tProg) * 6.6 : 1;
          }

          drawTextElement(ctx, fontText, cx, cy, props);

          ctx.restore();
        }
      });
    });

  }, [tracks, currentTime, currentAspect, showSafeMargins]);

  // Handle drawing formatted subtitle bars in canvas
  const drawTextElement = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    props: any
  ) => {
    ctx.font = `bold ${props.fontSize || 20}px "${props.fontFamily || "Inter"}", sans-serif`;
    ctx.textAlign = props.textAlignment || "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = props.fontSize || 20;

    // Background bounding box for aesthetic readability
    if (props.fontBgColor && props.fontBgColor !== "transparent") {
      ctx.fillStyle = props.fontBgColor;
      ctx.fillRect(
        x - textWidth / 2 - 8,
        y - textHeight / 2 - 4,
        textWidth + 16,
        textHeight + 8
      );
    }

    // High fidelity color stroke
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);

    // Text Fill
    ctx.fillStyle = props.fontColor || "#FFFFFF";
    ctx.fillText(text, x, y);
  };

  const handleRewind = () => {
    setCurrentTime(0);
  };

  return (
    <div
      id="visual_editor_container"
      ref={containerRef}
      className={`bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex flex-col justify-between items-center h-full transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 p-8 bg-[#0F0F0F]" : ""
      }`}
    >
      {/* Top Controls: Aspect Ratio + Resolutions */}
      <div id="player_toolbar" className="flex items-center justify-between w-full mb-3 pb-2 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-blue-950/40 text-blue-400 text-[11px] font-mono border border-blue-900/30 rounded flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5" />
            <span>Ratio {settings.aspectRatio}</span>
          </div>
          <div className="p-1 px-2.5 bg-[#1A1A1A] text-gray-300 text-[11px] font-mono border border-[#2A2A2A] rounded flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>{settings.resolution} @ {settings.fps}FPS</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="toggle_margins_btn"
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            className={`p-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              showSafeMargins ? "bg-blue-900/40 text-blue-400 border border-blue-800" : "text-gray-400 hover:bg-[#1A1A1A] hover:text-white"
            }`}
            title="Toggle Safe Margins Grid"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          {/* Quick Aspect Ratio Switcher */}
          <select
            id="aspect_ratio_picker"
            value={settings.aspectRatio}
            onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
            className="bg-[#1A1A1A] text-gray-200 text-xs rounded p-1 px-2 border border-[#2A2A2A] outline-none cursor-pointer"
          >
            <option value="16:9">Horizontal 16:9 (Desktop/YT)</option>
            <option value="9:16">Vertical 9:16 (TikTok/Reel)</option>
            <option value="1:1">Square 1:1 (Instagram)</option>
            <option value="21:9">Cinema Wide 21:9</option>
          </select>
        </div>
      </div>

      {/* Main Procedural Video Frame */}
      <div
        id="player_canvas_wrapper"
        className="flex-1 flex items-center justify-center bg-black/50 border border-slate-950 p-2 rounded-lg relative overflow-hidden w-full max-h-[380px]"
      >
        <canvas
          id="preview_canvas"
          ref={canvasRef}
          className={`shadow-2xl rounded shadow-black max-w-full max-h-full ${currentAspect.aspect} transition-all`}
        />

        {/* Floating audio signal spectrum on player right */}
        {isPlaying && (
          <div id="player_eq_signal" className="absolute right-4 bottom-4 bg-[#1A1A1A]/90 border border-[#2A2A2A] p-1.5 px-2 rounded-sm flex items-end gap-[2px] h-8 shadow-inner font-sans">
            <span className="w-[3px] bg-blue-500 rounded-sm transition-all" style={{ height: `${audioLevel * 100}%` }}></span>
            <span className="w-[3px] bg-blue-500 rounded-sm transition-all" style={{ height: `${audioLevel * 60}%` }}></span>
            <span className="w-[3px] bg-blue-500 rounded-sm transition-all" style={{ height: `${audioLevel * 120}%` }}></span>
            <span className="w-[3px] bg-blue-500 rounded-sm transition-all" style={{ height: `${audioLevel * 40}%` }}></span>
          </div>
        )}
      </div>

      {/* Time Tracking HUD + Core Control Triggers */}
      <div id="player_footer_hud" className="w-full mt-4">
        {/* Playback time counters */}
        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
          <span>
            {new Date(currentTime * 1000).toISOString().substring(14, 21)}s
          </span>
          <span className="text-gray-500">
            Total {new Date(timelineDuration * 1000).toISOString().substring(14, 21)}s
          </span>
        </div>

        {/* Media Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              id="rewind_timeline_btn"
              onClick={handleRewind}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded transition"
              title="Rewind to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="toggle_playback_btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 px-3 focus:outline-none rounded-sm text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                isPlaying ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A] hover:text-white"
              }`}
              title={isPlaying ? "Pause Video Playback" : "Play Video Playback"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>

          {/* Simulated Master Volume Bar & Equalizer */}
          <div className="flex items-center gap-2 bg-[#1A1A1A] p-1 px-3 border border-[#2A2A2A] rounded-sm">
            <button
              onClick={() => setSettings({ ...settings, masterVolume: settings.masterVolume > 0 ? 0 : 80 })}
              className="text-gray-400 hover:text-white"
            >
              {settings.masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => setSettings({ ...settings, masterVolume: parseInt(e.target.value) })}
              className="w-16 h-1 bg-[#282828] rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <button
            id="fullscreen_mock_btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded transition"
            title="Toggle Simulator Overlay Focus"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
