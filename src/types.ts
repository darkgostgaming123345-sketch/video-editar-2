export type TrackType = "video" | "audio" | "text" | "effect";

export interface ClipProperties {
  // Volume controls (0 to 100)
  volume: number;
  
  // Speed multiplier (0.25 to 4.0)
  speed: number;
  
  // Render scale percentage (10 to 200)
  scale: number;
  
  // Custom screen position (X and Y offsets)
  posX: number;
  posY: number;

  // Visual filters & adjustment settings (AURA-style presets)
  filterName: string; // e.g., "Cinema Teal", "Cyber Glitch", "Retro VHS", "Noir", "None"
  brightness: number; // 0 to 200 (100 = default)
  contrast: number;   // 0 to 200 (100 = default)
  saturation: number; // 0 to 200 (100 = default)
  blur: number;       // 0 to 100
  vignette: number;   // 0 to 100
  opacity: number;    // 0 to 100
  
  // Text & Caption specific styling
  textString?: string;
  fontSize?: number;
  fontFamily?: string; // Inter, Space Grotesk, JetBrains Mono, Playfair Display
  fontColor?: string;  // Hex color codes
  fontBgColor?: string; // Hex color background
  textAlignment?: "left" | "center" | "right";
  textAnimation?: "fade" | "scale" | "typewriter" | "bounce" | "none";
  
  // Audio specific configurations
  fadeDurationIn?: number;  // seconds
  fadeDurationOut?: number; // seconds
  
  // Transitions applied at the START of the clip
  transitionType?: "fade" | "dissolve" | "slide-left" | "slide-right" | "wave" | "zoom" | "none";
  transitionDuration?: number; // seconds

  // Chroma Key (green screen) parameters
  chromaKeyEnabled?: boolean;
  chromaColor?: string;     // Hex color of green/blue/etc key screen
  chromaSimilarity?: number; // 0 to 100
  chromaSmoothness?: number; // 0 to 100
}

export interface Clip {
  id: string;
  name: string;
  type: TrackType;
  
  // Timing variables (all in seconds)
  startOffset: number; // Position on the absolute timeline
  duration: number;    // Display length/playback span
  mediaUrl: string;    // Src to display/simulate rendering
  thumbnailUrl: string; // Custom vector/small visual thumbnail
  
  properties: ClipProperties;
  isMuted?: boolean;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isLocked?: boolean;
  isMuted?: boolean;
}

export interface LibraryAsset {
  id: string;
  name: string;
  type: TrackType;
  category: string; // e.g., "Trending", "Nature", "Vlog", "Sound Effects", "Beats", "Stickers"
  mediaUrl: string;
  thumbnailUrl: string;
  duration: number; // default duration
  colorScheme?: string;
  size?: string;
}

export interface AIStoryboardScene {
  duration: number;
  assetCategory: string;
  stockSearchQuery: string;
  caption: string;
  effect: string;
}

export interface AIStoryboard {
  title: string;
  soundtrackStyle: string;
  scenes: AIStoryboardScene[];
}

export interface AICaption {
  startTime: number;
  duration: number;
  text: string;
  suggestedColor: string;
}

export interface VideoEditorSettings {
  aspectRatio: "16:9" | "9:16" | "1:1" | "21:9" | "4:5";
  resolution: "1080p" | "720p" | "4K";
  fps: 30 | 60;
  masterVolume: number;
}
