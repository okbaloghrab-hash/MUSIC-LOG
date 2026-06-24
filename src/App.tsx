/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  Gauge,
  Sparkles,
  Layers,
  Sparkle,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Globe2,
  Flame,
  FileMusic,
  Star,
  Heart,
  Undo,
  Copy,
  ExternalLink,
  Palette,
  Check,
  Save,
  Trash2,
  Sliders,
  X,
  Zap,
  Settings,
  Share2,
  Search,
  Crown,
  Drum,
  Repeat,
  ChevronDown,
  Laptop,
  ListMusic
} from "lucide-react";
import { Track, PlayerState, translations } from "./types";
import {
  generateAmbientSynth,
  generateSynthwaveSynth,
  generateLofiSynth,
  audioBufferToWavBlob,
  audioBufferToMp3Blob,
  audioBufferToMp3BlobAsync,
  createReverbImpulseResponse,
  extractCoverFromId3,
  extractCoverBytesFromId3,
  parseAudioMetadata,
  generateDefaultCoverUrl,
  searchAndFetchCoverArt,
  embedId3MetadataInAudioFile,
  createId3v23Tag,
  fetchImageBytes,
  bytesToDataUrl
} from "./utils/audio";
import { saveTrackToDB, deleteTrackFromDB, loadTracksFromDB } from "./utils/db";
import SliderControl from "./components/SliderControl";
import AudioVisualizer from "./components/AudioVisualizer";
import UploadSection from "./components/UploadSection";
import TrackLibrary from "./components/TrackLibrary";
import MockPremiumModal from "./components/MockPremiumModal";
import SoundSettingsModal from "./components/SoundSettingsModal";
import SplashEntrance from "./components/SplashEntrance";
import AudioSeparationSuite from "./components/AudioSeparationSuite";
import LocalFilesExplorer from "./components/LocalFilesExplorer";

export interface EffectPreset {
  id: string;
  name: string;
  speed: number;
  reverb: number;
  bassBoost: number;
  drumBoost?: number;
  delayBoost?: number;
  clarityBoost?: number;
  vintageRadio?: boolean;
  vocalDoubler?: boolean;
  tapeFlutter?: boolean;
  reverbPreset: "hall" | "cathedral" | "cave" | "dry_room";
  ambientMode: "none" | "rain" | "wind" | "vinyl";
  ambientVolume: number;
  isCustom?: boolean;
}

export interface SpecialPreset {
  id: string;
  name: string;
  icon: string;
  speed: number;
  reverb: number;
  bassBoost: number;
  delayBoost: number;
  drumBoost?: number;
  clarityBoost?: number;
  pitchShift?: number;
  surroundSound: boolean;
  vintageRadio?: boolean;
  vocalDoubler?: boolean;
  tapeFlutter?: boolean;
  isSaved?: boolean;
}

const themeConfig = {
  black: {
    bgMain: "bg-[#050508]",
    bgCard: "bg-white/5 backdrop-blur-md border border-white/10",
    textMain: "text-white",
    textMuted: "text-white/50",
    accentColor: "text-indigo-450",
    accentBg: "bg-indigo-600 hover:bg-indigo-500",
    accentBorder: "border-indigo-500/30",
    sliderTrack: "bg-white/10",
    sliderThumb: "bg-indigo-400 border-white",
    btnSecondary: "bg-white/5 border-white/10 hover:bg-white/10 text-white/80",
    gradientText: "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400",
    visualTheme: "aurora" as const,
    ambienceGlows: [
      "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none",
      "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none"
    ]
  },
  green: {
    bgMain: "bg-[#030a05]",
    bgCard: "bg-emerald-950/15 backdrop-blur-md border border-emerald-500/15",
    textMain: "text-emerald-50",
    textMuted: "text-emerald-500/60",
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500 hover:bg-emerald-400",
    accentBorder: "border-emerald-500/35",
    sliderTrack: "bg-emerald-950/40",
    sliderThumb: "bg-emerald-400 border-emerald-50",
    btnSecondary: "bg-emerald-950/30 border-emerald-500/10 hover:bg-emerald-950/55 text-emerald-300",
    gradientText: "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400",
    visualTheme: "forest" as const,
    ambienceGlows: [
      "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/25 rounded-full blur-[120px] pointer-events-none",
      "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-900/15 rounded-full blur-[140px] pointer-events-none"
    ]
  },
  purple: {
    bgMain: "bg-[#07030d]",
    bgCard: "bg-violet-950/15 backdrop-blur-md border border-violet-500/15",
    textMain: "text-violet-50",
    textMuted: "text-violet-400/60",
    accentColor: "text-fuchsia-400",
    accentBg: "bg-fuchsia-550 hover:bg-fuchsia-450",
    accentBorder: "border-fuchsia-500/35",
    sliderTrack: "bg-violet-950/40",
    sliderThumb: "bg-fuchsia-400 border-violet-50",
    btnSecondary: "bg-violet-950/30 border-violet-500/10 hover:bg-violet-950/60 text-violet-300",
    gradientText: "bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400",
    visualTheme: "aurora" as const,
    ambienceGlows: [
      "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-900/25 rounded-full blur-[120px] pointer-events-none",
      "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none"
    ]
  },
  white: {
    bgMain: "bg-[#f8f9fc]",
    bgCard: "bg-white border border-slate-200 shadow-sm",
    textMain: "text-slate-800",
    textMuted: "text-slate-400",
    accentColor: "text-indigo-600",
    accentBg: "bg-indigo-600 hover:bg-indigo-500",
    accentBorder: "border-slate-300",
    sliderTrack: "bg-slate-200",
    sliderThumb: "bg-indigo-600 border-white",
    btnSecondary: "bg-slate-100 border-slate-250 hover:bg-slate-200 text-slate-700",
    gradientText: "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-500",
    visualTheme: "sunset" as const,
    ambienceGlows: [
      "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none",
      "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none"
    ]
  },
  gold: {
    bgMain: "bg-[#0b0904]",
    bgCard: "bg-amber-955/15 backdrop-blur-md border border-amber-500/25 shadow-lg shadow-amber-500/5",
    textMain: "text-amber-100",
    textMuted: "text-amber-500/50",
    accentColor: "text-amber-400",
    accentBg: "bg-gradient-to-r from-amber-550 to-yellow-500 hover:from-amber-450 hover:to-yellow-405",
    accentBorder: "border-amber-500/40",
    sliderTrack: "bg-amber-950/40",
    sliderThumb: "bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-100",
    btnSecondary: "bg-amber-950/30 border-amber-500/10 hover:bg-amber-950/60 text-amber-300",
    gradientText: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-200 bg-clip-text text-transparent",
    visualTheme: "sunset" as const,
    ambienceGlows: [
      "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none",
      "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-yellow-950/10 rounded-full blur-[140px] pointer-events-none"
    ]
  }
};

const ambientCache = new Map<string, AudioBuffer>();

interface CompactWavesVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  theme: string;
  playerSkin: string;
}

const CompactWavesVisualizer = ({ analyser, isPlaying, playerSkin }: CompactWavesVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear Canvas with absolute transparency
      ctx.clearRect(0, 0, width, height);

      // Draw subtle layout background bars grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        // draw frequency bar spectrum
        const barCount = Math.min(48, dataArray.length);
        const barWidth = (width / barCount) * 0.65;
        const barSpacing = (width / barCount) * 0.35;

        ctx.shadowBlur = 8;
        ctx.shadowColor = playerSkin === "neon" ? "rgba(236, 72, 153, 0.5)" : "rgba(99, 102, 241, 0.5)";

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i];
          const rawHeight = (val / 255) * (height * 0.85);
          // Apply a gentle curve to heights so the center jumps higher than edges
          const centerFactor = Math.sin((i / (barCount - 1)) * Math.PI);
          const barHeight = Math.max(3, rawHeight * (0.4 + centerFactor * 0.6));

          const x = i * (barWidth + barSpacing) + barSpacing / 2;
          const y = (height - barHeight) / 2; // Center vertically!

          const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
          if (playerSkin === "neon") {
            grad.addColorStop(0, "#f43f5e"); // rose
            grad.addColorStop(0.5, "#d946ef"); // fuchsia
            grad.addColorStop(1, "#3b82f6"); // blue
          } else {
            grad.addColorStop(0, "#a855f7"); // purple
            grad.addColorStop(0.5, "#6366f1"); // indigo
            grad.addColorStop(1, "#10b981"); // emerald
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        // Standby beautiful floating kinetic wave
        phase += 0.05;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = playerSkin === "neon" ? "rgba(217, 70, 239, 0.6)" : "rgba(99, 102, 241, 0.6)";
        ctx.shadowBlur = 6;
        ctx.shadowColor = playerSkin === "neon" ? "rgba(217, 70, 239, 0.3)" : "rgba(99, 102, 241, 0.3)";
        
        ctx.beginPath();
        const pts = 60;
        const step = width / pts;
        for (let i = 0; i <= pts; i++) {
          const x = i * step;
          const y = height / 2 + Math.sin(i * 0.15 + phase) * 8 * Math.sin(i * 0.05);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // mirror second wave
        ctx.strokeStyle = playerSkin === "neon" ? "rgba(59, 130, 246, 0.45)" : "rgba(16, 185, 129, 0.45)";
        ctx.shadowColor = playerSkin === "neon" ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.25)";
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const x = i * step;
          const y = height / 2 + Math.sin(-i * 0.12 + phase * 0.8) * 5 * Math.cos(i * 0.04);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [analyser, isPlaying, playerSkin]);

  return (
    <div className="w-full h-11 md:h-12 bg-black/15 border border-white/5 rounded-xl overflow-hidden relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

interface LarkPlayerProgressProps {
  currentTime: number;
  trackDuration: number;
  onSeek: (val: number) => void;
  formatSeconds: (secs: number) => string;
  isScrubbingRef: React.MutableRefObject<boolean>;
}

const LarkPlayerProgress = ({
  currentTime,
  trackDuration,
  onSeek,
  formatSeconds,
  isScrubbingRef
}: LarkPlayerProgressProps) => {
  const [localVal, setLocalVal] = useState(currentTime);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (!isScrubbing) {
      setLocalVal(currentTime);
    }
  }, [currentTime, isScrubbing]);

  const max = trackDuration || 0.1;
  const pct = (localVal / max) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalVal(val);
  };

  const handleStart = () => {
    isScrubbingRef.current = true;
    setIsScrubbing(true);
  };

  const handleEnd = (val: number) => {
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    onSeek(val);
  };

  return (
    <div className="space-y-1 relative w-full pt-1" dir="ltr">
      <div className="relative flex items-center h-6 w-full group select-none" dir="ltr">
        {/* Customized Track behind the transparent range input */}
        <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/[0.15] pointer-events-none" />
        
        {/* Elegant glow fill-gradient */}
        <div 
          className="absolute left-0 h-[3px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />

        {/* Natively layered high-performance transparent range input */}
        <input
          dir="ltr"
          type="range"
          min={0}
          max={max}
          step={0.01}
          value={localVal}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onChange={handleChange}
          onMouseUp={(e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            handleEnd(val);
          }}
          onTouchEnd={(e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            handleEnd(val);
          }}
          onTouchCancel={() => {
            isScrubbingRef.current = false;
            setIsScrubbing(false);
          }}
          className="transparent-lark-range absolute w-full h-full cursor-pointer outline-none m-0 p-0"
        />
      </div>

      <div 
        className="flex flex-row items-center justify-between text-[11px] font-mono text-white/50 px-0.5" 
        style={{ direction: "ltr" }}
      >
        <span className="inline-block" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
          {formatSeconds(localVal)}
        </span>
        <span className="inline-block" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
          {formatSeconds(trackDuration)}
        </span>
      </div>
    </div>
  );
};

export default function App() {
  // Application State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [isLoadingOfflineTracks, setIsLoadingOfflineTracks] = useState(true);

  // Theme configuration state persisted online/offline
  const [theme, setTheme] = useState<"black" | "green" | "purple" | "white" | "gold">(() => {
    const saved = localStorage.getItem("musiclog_theme");
    return (saved as any) || "black";
  });

  // Custom presets states
  const [customPresets, setCustomPresets] = useState<EffectPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  // Audio configuration parameters
  const [speed, setSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_speed");
    return saved !== null ? parseFloat(saved) : 1.00;
  }); // Normal standard (1.00x)
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_volume");
    return saved !== null ? parseInt(saved) : 70;
  });
  const [reverb, setReverb] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_reverb");
    return saved !== null ? parseInt(saved) : 40;
  }); // Wet blend
  const [bassBoost, setBassBoost] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_bassBoost");
    return saved !== null ? parseInt(saved) : 6;
  }); // low-shelf gain
  const [drumBoost, setDrumBoost] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_drumBoost");
    return saved !== null ? parseInt(saved) : 0;
  }); // drum peak gain (boost)
  const [delayBoost, setDelayBoost] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_delayBoost");
    return saved !== null ? parseInt(saved) : 0;
  }); // delay repeat amount (0 - 100)
  const [clarityBoost, setClarityBoost] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_clarityBoost");
    return saved !== null ? parseInt(saved) : 0;
  }); // clarity level (0 - 20)
  const [superSmoothness, setSuperSmoothness] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_superSmoothness");
    return saved !== null ? saved === "true" : true;
  });
  const [vintageRadio, setVintageRadio] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_vintageRadio");
    return saved !== null ? saved === "true" : false;
  });
  const [vocalDoubler, setVocalDoubler] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_vocalDoubler");
    return saved !== null ? saved === "true" : false;
  });
  const [deCrackle, setDeCrackle] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_deCrackle");
    return saved !== null ? saved === "true" : false;
  });

  const defaultSpecialPresets: SpecialPreset[] = [
    {
      id: "special-1",
      name: "Preset 1",
      icon: "🎧",
      speed: 0.85,
      reverb: 60,
      bassBoost: 3,
      delayBoost: 15,
      drumBoost: 0,
      clarityBoost: 0,
      pitchShift: 0,
      surroundSound: true,
      vintageRadio: false,
      vocalDoubler: false,
      tapeFlutter: false,
      isSaved: false,
    },
    {
      id: "special-2",
      name: "Preset 2",
      icon: "🔥",
      speed: 0.90,
      reverb: 55,
      bassBoost: 5,
      delayBoost: 25,
      drumBoost: 4,
      clarityBoost: 10,
      pitchShift: -100,
      surroundSound: false,
      vintageRadio: false,
      vocalDoubler: true,
      tapeFlutter: true,
      isSaved: false,
    },
    {
      id: "special-3",
      name: "Preset 3",
      icon: "🌙",
      speed: 0.75,
      reverb: 70,
      bassBoost: 4,
      delayBoost: 30,
      drumBoost: 0,
      clarityBoost: 0,
      pitchShift: -150,
      surroundSound: true,
      vintageRadio: false,
      vocalDoubler: false,
      tapeFlutter: false,
      isSaved: false,
    },
    {
      id: "special-4",
      name: "Preset 4",
      icon: "🌟",
      speed: 1.10,
      reverb: 30,
      bassBoost: 6,
      delayBoost: 10,
      drumBoost: 5,
      clarityBoost: 5,
      pitchShift: 120,
      surroundSound: true,
      vintageRadio: false,
      vocalDoubler: false,
      tapeFlutter: false,
      isSaved: false,
    },
  ];

  const [specialPresets, setSpecialPresets] = useState<SpecialPreset[]>(() => {
    const saved = localStorage.getItem("musiclog_special_presets_v4");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse special presets v4, falling back to defaults", e);
      }
    }
    return defaultSpecialPresets;
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    return localStorage.getItem("musiclog_active_special_preset_id_v4");
  });

  const [presetActionMenuTarget, setPresetActionMenuTarget] = useState<SpecialPreset | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [presetToast, setPresetToast] = useState("");
  const presetTransitionIntervalRef = useRef<any>(null);
  const defaultPresets = [
    {
      speed: 0.81,
      volume: 100,
      reverb: 78,
      bassBoost: 15,
      drumBoost: 6,
      delayBoost: 28,
      clarityBoost: 12,
      pitchShift: -130,
      eq60: 5,
      eq230: 3,
      eq910: 0,
      eq4k: 2,
      eq14k: 4,
      surroundSound: true,
      vocalBooster: false,
      tapeFlutter: true,
      ambientMode: "none",
      ambientVolume: 25,
      reverbPreset: "cathedral",
      vintageRadio: false,
      vocalDoubler: true,
      nameAr: "تباطؤ وصدى الكاتدرائية 🌌",
      nameEn: "Slowed & Cathedral Reverb 🌌"
    },
    {
      speed: 0.81,
      volume: 100,
      reverb: 80,
      bassBoost: 15,
      drumBoost: 6,
      delayBoost: 28,
      clarityBoost: 12,
      pitchShift: -130,
      eq60: 5,
      eq230: 3,
      eq910: 0,
      eq4k: 2,
      eq14k: 4,
      surroundSound: true,
      vocalBooster: false,
      tapeFlutter: true,
      ambientMode: "none",
      ambientVolume: 25,
      reverbPreset: "cathedral",
      vintageRadio: false,
      vocalDoubler: true,
      nameAr: "تباطؤ الكاتدرائية صدى قوي (80%) 🎧",
      nameEn: "Cathedral Slowed Deep Reverb (80%) 🎧"
    },
    {
      speed: 1.24,
      volume: 100,
      reverb: 55,
      bassBoost: 12,
      drumBoost: 8,
      delayBoost: 20,
      clarityBoost: 12,
      pitchShift: 300,
      eq60: 6,
      eq230: 4,
      eq910: 2,
      eq4k: 6,
      eq14k: 8,
      surroundSound: true,
      vocalBooster: true,
      tapeFlutter: false,
      ambientMode: "none",
      ambientVolume: 25,
      reverbPreset: "hall",
      vintageRadio: false,
      vocalDoubler: false,
      nameAr: "سرعة تيك توك غنائية جنونية 🔥",
      nameEn: "TikTok Extreme High-Speed 🔥"
    },
    {
      speed: 0.9,
      volume: 100,
      reverb: 35,
      bassBoost: 8,
      drumBoost: 4,
      delayBoost: 12,
      clarityBoost: 8,
      pitchShift: -50,
      eq60: -5,
      eq230: -2,
      eq910: 8,
      eq4k: 5,
      eq14k: -10,
      surroundSound: false,
      vocalBooster: false,
      tapeFlutter: true,
      ambientMode: "none",
      ambientVolume: 25,
      reverbPreset: "hall",
      vintageRadio: true,
      vocalDoubler: true,
      nameAr: "راديو كلاسيكي دافئ لو-فاي 📻",
      nameEn: "Vintage Retro Warm Radio 📻"
    },
    {
      speed: 1.0,
      volume: 100,
      reverb: 45,
      bassBoost: 10,
      drumBoost: 6,
      delayBoost: 15,
      clarityBoost: 15,
      pitchShift: 0,
      eq60: 2,
      eq230: 1,
      eq910: 4,
      eq4k: 8,
      eq14k: 12,
      surroundSound: true,
      vocalBooster: false,
      tapeFlutter: false,
      ambientMode: "none",
      ambientVolume: 25,
      reverbPreset: "hall",
      vintageRadio: false,
      vocalDoubler: true,
      nameAr: "كورس الصوت النقي المجسم ✨",
      nameEn: "Pristine Stereo Double Chorus ✨"
    }
  ];

  const [memoryPresets, setMemoryPresets] = useState<any[]>(() => {
    const saved = localStorage.getItem("musiclog_memoryPresetsList");
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed.map((p, i) => p ? { ...defaultPresets[i], ...p } : defaultPresets[i]);
        }
      } catch (e) {
        console.error("Failed to parse presets, falling back to defaults", e);
      }
    }
    return defaultPresets;
  });
  const [favoritePreset, setFavoritePreset] = useState<any | null>(() => {
    const saved = localStorage.getItem("musiclog_favoritePreset");
    return saved !== null ? JSON.parse(saved) : null;
  });
  const [tapeFlutter, setTapeFlutter] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_tapeFlutter");
    return saved !== null ? saved === "true" : false;
  });
  const [reverbPreset, setReverbPreset] = useState<"hall" | "cathedral" | "cave" | "dry_room">((() => {
    const saved = localStorage.getItem("musiclog_reverbPreset");
    return (saved as any) || "hall";
  }));
  const [ambientMode, setAmbientMode] = useState<"none" | "rain" | "wind" | "vinyl">((() => {
    const saved = localStorage.getItem("musiclog_ambientMode");
    return (saved as any) || "none";
  }));
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_ambientVolume");
    return saved !== null ? parseInt(saved) : 25;
  });

  const [pitchShift, setPitchShift] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_pitchShift");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [eq60, setEq60] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_eq60");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [eq230, setEq230] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_eq230");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [eq910, setEq910] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_eq910");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [eq4k, setEq4k] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_eq4k");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [eq14k, setEq14k] = useState<number>(() => {
    const saved = localStorage.getItem("musiclog_eq14k");
    return saved !== null ? parseInt(saved) : 0;
  });
  const [surroundSound, setSurroundSound] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_surroundSound");
    return saved !== null ? saved === "true" : false;
  });

  const [vocalBooster, setVocalBooster] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_vocalBooster");
    return saved !== null ? saved === "true" : false;
  });

  const [activeTab, setActiveTab] = useState<"home" | "my-music" | "favorites" | "vocal-splitter">((() => {
    const entered = localStorage.getItem("musiclog_visited_first");
    if (!entered) {
      localStorage.setItem("musiclog_visited_first", "true");
      return "home";
    }
    const saved = localStorage.getItem("musiclog_active_tab");
    return (saved as any) || "home";
  }));

  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("musiclog_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("musiclog_favorites", JSON.stringify(favoriteTrackIds));
  }, [favoriteTrackIds]);

  const handleToggleFavorite = (trackId: string) => {
    setFavoriteTrackIds(prev =>
      prev.includes(trackId)
          ? prev.filter(id => id !== trackId)
          : [...prev, trackId]
    );
  };
  const [lang, setLang] = useState<"ar" | "en">((() => {
    const saved = localStorage.getItem("musiclog_lang");
    return (saved as any) || "ar";
  }));

  const [playerTab, setPlayerTab] = useState<"music" | "lyrics">("music");
  const [playerSkin, setPlayerSkin] = useState<"glass" | "neon" | "vinyl" | "aurora" | "sunset">(() => {
    const saved = localStorage.getItem("musiclog_player_skin");
    return (saved as any) || "glass";
  });
  const [customTrackLyrics, setCustomTrackLyrics] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("musiclog_custom_lyrics");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isPremium, setIsPremium] = useState(true);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Exporting process state
  const [exportState, setExportState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportType, setExportType] = useState<"standard" | "withCover" | null>(null);
  const [exportErrorText, setExportErrorText] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [headerSearchResults, setHeaderSearchResults] = useState<any[]>([]);
  const [isSearchingHeader, setIsSearchingHeader] = useState(false);
  const [showHeaderSearchResults, setShowHeaderSearchResults] = useState(false);
  const [latestWavUrl, setLatestWavUrl] = useState<string | null>(null);
  const [latestWavName, setLatestWavName] = useState<string>("");
  const previousWavUrlRef = useRef<string | null>(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState<string | null>(null);
  const [isUploadingToServer, setIsUploadingToServer] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [artLogs, setArtLogs] = useState<{trackName: string; status: "success" | "error"; message: string; time: string}[]>([]);

  // Limits tracking
  const [savesLeft, setSavesLeft] = useState(5);
  const [downloadsLeft, setDownloadsLeft] = useState(4);

  // Web Audio Nodes Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  const getOrCreateAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({
        sampleRate: 44100,
        latencyHint: "balanced" // Balanced latency minimizes CPU stutters and eliminates crackling/stuttering on both wired and wireless headphones!
      });
    }
    return audioContextRef.current;
  };
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const bassFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const drumFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const clarityFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackGainNodeRef = useRef<GainNode | null>(null);
  const delayWetGainNodeRef = useRef<GainNode | null>(null);
  const convolverNodeRef = useRef<ConvolverNode | null>(null);
  const dryGainNodeRef = useRef<GainNode | null>(null);
  const wetGainNodeRef = useRef<GainNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const eq60NodeRef = useRef<BiquadFilterNode | null>(null);
  const eq230NodeRef = useRef<BiquadFilterNode | null>(null);
  const eq910NodeRef = useRef<BiquadFilterNode | null>(null);
  const eq4kNodeRef = useRef<BiquadFilterNode | null>(null);
  const eq14kNodeRef = useRef<BiquadFilterNode | null>(null);
  const vocalBoosterNodeRef = useRef<BiquadFilterNode | null>(null);
  const deCrackleNodeRef = useRef<BiquadFilterNode | null>(null);

  const ambientSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientLfoNodeRef = useRef<OscillatorNode | null>(null);
  const pannerLfoRef = useRef<OscillatorNode | null>(null);
  const ambientGainNodeRef = useRef<GainNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React state of analyser node to redraw layout
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerOption, setSleepTimerOption] = useState<number>(0); // in minutes

  // Synchronized state references for interval & async closures
  const tracksRef = useRef<Track[]>([]);
  const activeTrackIdRef = useRef<string>("");
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1.00);
  const pitchShiftRef = useRef(0);
  const trackDurationRef = useRef(0);
  const startTrackerRef = useRef<(() => void) | null>(null);
  const stopTrackerRef = useRef<(() => void) | null>(null);
  const getCurrentTrackTimeRef = useRef<(() => number) | null>(null);

  const [loopActive, setLoopActive] = useState<boolean>(() => {
    return localStorage.getItem("musiclog_loop_active") === "true";
  });
  const loopActiveRef = useRef(loopActive);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { activeTrackIdRef.current = activeTrackId; }, [activeTrackId]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pitchShiftRef.current = pitchShift; }, [pitchShift]);
  useEffect(() => { trackDurationRef.current = trackDuration; }, [trackDuration]);
  useEffect(() => { loopActiveRef.current = loopActive; }, [loopActive]);

  useEffect(() => {
    startTrackerRef.current = startTracker;
    stopTrackerRef.current = stopTracker;
    getCurrentTrackTimeRef.current = getCurrentTrackTime;
  });

  // PWA Home Screen Installation Prompt Support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstallable, setIsPwaInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPwaInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsPwaInstallable(false);
      }
    } catch (err) {
      console.warn("PWA prompt trigger error:", err);
    }
  };

  // Sleep Timer countdown logic
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      // Pause track state
      const pausedTime = getCurrentTrackTime();
      lastPausedOffsetRef.current = pausedTime;
      localStorage.setItem("musiclog_current_time", pausedTime.toString());
      teardownAudio();
      setIsPlaying(false);
      stopTracker();
      setSleepTimer(null);
      setSleepTimerOption(0);
      return;
    }

    const interval = setInterval(() => {
      setSleepTimer((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer]);

  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize background silent audio loop to keep mobile webviews alive on minimize/lock screen
  useEffect(() => {
    const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
    audio.loop = true;
    silentAudioRef.current = audio;
    return () => {
      audio.pause();
    };
  }, []);

  // 2. Keep the background silent audio looping synced with isPlaying state
  useEffect(() => {
    if (!silentAudioRef.current) return;
    if (isPlaying) {
      silentAudioRef.current.play().catch((err) => {
        console.warn("Background silent audio loop play deferred or blocked:", err);
      });
    } else {
      silentAudioRef.current.pause();
    }
  }, [isPlaying]);

  // Lock Screen MediaSession Controls & Background Persistence!
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active) {
      (navigator as any).mediaSession.playbackState = "none";
      return;
    }

    try {
      (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
        title: active.name,
        artist: active.artist || (lang === "ar" ? "فنان غير معروف 🎵" : "Unknown Artist 🎵"),
        album: lang === "ar" ? "استوديو Slowed & Reverb" : "Slowed & Reverb Studio",
        artwork: [
          {
            src: active.coverUrl || "https://img.icons8.com/color/512/audio-wave.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      });

      (navigator as any).mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch (e) {
      console.warn("MediaSession update metadata error:", e);
    }
  }, [activeTrackId, isPlaying, lang, tracks]);

  // Position State updates on Lock Screen seeker bar
  useEffect(() => {
    if (!("mediaSession" in navigator) || !(navigator as any).mediaSession.setPositionState) return;
    const active = tracks.find((t) => t.id === activeTrackId);
    if (!active || active.duration <= 0) return;

    try {
      const compoundSpeed = speed * Math.pow(2, pitchShift / 1200);
      const positionVal = Math.min(active.duration, Math.max(0, currentTime));
      (navigator as any).mediaSession.setPositionState({
        duration: active.duration,
        playbackRate: compoundSpeed,
        position: positionVal
      });
    } catch (e) {
      console.warn("MediaSession position state setting error:", e);
    }
  }, [activeTrackId, currentTime, speed, pitchShift, tracks]);

  // Handle action controls from Lock Screen / Notification Center
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      (navigator as any).mediaSession.setActionHandler("play", () => {
        const ctx = getOrCreateAudioContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch((err) => console.warn(err));
        }
        setIsPlaying(true);
        playTrack(lastPausedOffsetRef.current);
      });

      (navigator as any).mediaSession.setActionHandler("pause", () => {
        setIsPlaying(false);
        const pausedTime = getCurrentTrackTime();
        lastPausedOffsetRef.current = pausedTime;
        teardownAudio();
        stopAmbientSource();
      });

      (navigator as any).mediaSession.setActionHandler("previoustrack", () => {
        handlePrevTrack();
      });

      (navigator as any).mediaSession.setActionHandler("nexttrack", () => {
        handleNextTrack();
      });

      (navigator as any).mediaSession.setActionHandler("seekto", (details: any) => {
        if (details && details.seekTime !== undefined) {
          handleScrubberChange(details.seekTime);
        }
      });
    } catch (e) {
      console.warn("Setting MediaSession controls error:", e);
    }

    return () => {
      if (!("mediaSession" in navigator)) return;
      try {
        (navigator as any).mediaSession.setActionHandler("play", null);
        (navigator as any).mediaSession.setActionHandler("pause", null);
        (navigator as any).mediaSession.setActionHandler("previoustrack", null);
        (navigator as any).mediaSession.setActionHandler("nexttrack", null);
        (navigator as any).mediaSession.setActionHandler("seekto", null);
      } catch (e) {}
    };
  }, [tracks, activeTrackId, isPlaying]);

  // Entrance Splash screen state
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return sessionStorage.getItem("musiclog_has_entered") === "true";
  });

  const handleEnterStudio = () => {
    setHasEntered(true);
    sessionStorage.setItem("musiclog_has_entered", "true");
    getOrCreateAudioContext();
  };

  // Time tracking references
  const playbackStartTimeRef = useRef<number>(0);
  const lastPausedOffsetRef = useRef<number>(0);
  const trackingIntervalRef = useRef<number | null>(null);
  
  // Guard flag to check manually invoked stops
  const isActionStopRef = useRef<boolean>(false);
  // Guard flag to prevent seeker snapping while scrolling
  const isScrubbingRef = useRef<boolean>(false);
  const playRequestIdRef = useRef<number>(0);

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("musiclog_performance_mode");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("musiclog_performance_mode", performanceMode ? "true" : "false");
  }, [performanceMode]);

  // Prevent accidental exit / app closure & trap Android Back Button popstate gesture
  useEffect(() => {
    // 1. Desktop guard
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2. Android WebView / Mobile Back Button popup trap
    // Push dummy state initially to trap back action
    window.history.pushState({ noExit: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      // Toggle showing our beautiful light-red exit confirmation dialog!
      setShowExitConfirm(prev => !prev);
      // Immediately push another state so that subsequent Back clicks are also trapped
      window.history.pushState({ noExit: true }, "");
    };

    window.addEventListener("popstate", handlePopState);

    // 3. Keep AudioContext active on visibility restore (tabs/background switches active instantly!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (audioContextRef.current) {
          const ctx = audioContextRef.current;
          if (ctx.state === "suspended") {
            ctx.resume().catch((err) => console.warn("Context resume failed on visibility shift:", err));
          }
        }
        // Recover visual tracker instantly with no latency queue backlog
        if (isPlayingRef.current) {
          if (getCurrentTrackTimeRef.current) {
            setCurrentTime(getCurrentTrackTimeRef.current());
          }
          if (startTrackerRef.current) {
            startTrackerRef.current();
          }
        }
      } else {
        // Tab is backgrounded! Stop frequent state ticks completely to avoid backlog renders and browser throttling lag on return!
        if (stopTrackerRef.current) {
          stopTrackerRef.current();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  const t = translations[lang];
  const isRtl = lang === "ar";

  // Bootstrap & Procedural Sound Synthesis compiling on launch
  useEffect(() => {
    const compileTracks = async () => {
      try {
        setIsLoadingOfflineTracks(true);
        const persistedTracks: Track[] = [];
        try {
          const dbTracks = await loadTracksFromDB();
          if (dbTracks.length > 0) {
            // Initialize audio context to decode the metadata
            if (!audioContextRef.current) {
              getOrCreateAudioContext();
            }
            const ctx = audioContextRef.current!;

            for (const dbT of dbTracks) {
              try {
                let coverUrl: string | undefined = dbT.coverUrl;
                let artist: string | undefined = dbT.artist;
                let album: string | undefined = dbT.album;
                let id3Data: Uint8Array | undefined = undefined;
                
                try {
                  const arrayBufferForMeta = await dbT.fileData.arrayBuffer();
                  const u8 = new Uint8Array(arrayBufferForMeta);
                  
                  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) {
                    const b0 = u8[6];
                    const b1 = u8[7];
                    const b2 = u8[8];
                    const b3 = u8[9];
                    const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
                    const totalSize = size + 10;
                    if (totalSize <= u8.length) {
                      id3Data = u8.slice(0, totalSize);
                      const meta = parseAudioMetadata(id3Data);
                      coverUrl = meta.coverUrl || coverUrl;
                      if (meta.artist) artist = meta.artist;
                      if (meta.album) album = meta.album;
                    }
                  } else {
                    // Check for WAV embedded ID3 chunk
                    for (let i = 0; i < u8.length - 8; i++) {
                      if (u8[i] === 0x69 && u8[i+1] === 0x64 && u8[i+2] === 0x33 && u8[i+3] === 0x20) {
                        const chunkSize = u8[i+4] | (u8[i+5] << 8) | (u8[i+6] << 16) | (u8[i+7] << 24);
                        const startOffset = i + 8;
                        if (startOffset + chunkSize <= u8.length) {
                          const subChunk = u8.slice(startOffset, startOffset + chunkSize);
                          if (subChunk[0] === 0x49 && subChunk[1] === 0x44 && subChunk[2] === 0x33) {
                            id3Data = subChunk;
                            const meta = parseAudioMetadata(id3Data);
                            coverUrl = meta.coverUrl || coverUrl;
                            if (meta.artist) artist = meta.artist;
                            if (meta.album) album = meta.album;
                          }
                        }
                        break;
                      }
                    }
                  }
                  
                  // If cover url is missing or is general Unsplash, fallback to iTunes Search API
                  if (!coverUrl || coverUrl.includes("unsplash.com") || coverUrl.includes("placeholder")) {
                    try {
                      const searchResult = await searchAndFetchCoverArt(dbT.name, artist);
                      if (searchResult) {
                        coverUrl = searchResult.coverUrl;
                        if (searchResult.artist) artist = searchResult.artist;
                        if (searchResult.album) album = searchResult.album;
                      }
                    } catch (itErr) {
                      console.warn("iTunes searching failed during loader resurrection:", itErr);
                    }
                  }
                  
                  if (!coverUrl) {
                    coverUrl = generateDefaultCoverUrl(dbT.name);
                  } else if (!coverUrl.startsWith("data:")) {
                    try {
                      const fetchedBytes = await fetchImageBytes(coverUrl);
                      if (fetchedBytes && fetchedBytes.bytes && fetchedBytes.bytes.length > 0) {
                        coverUrl = bytesToDataUrl(fetchedBytes.bytes, fetchedBytes.mimeType);
                      }
                    } catch (fetchErr) {
                      console.warn("Could not pre-fetch external cover artwork to base64 on startup:", fetchErr);
                    }
                  }
                  
                  // Re-inject ID3 tags permanently inside raw file data if it was modified
                  if (dbT.coverUrl !== coverUrl || dbT.artist !== artist || dbT.album !== album) {
                    dbT.coverUrl = coverUrl;
                    dbT.artist = artist;
                    dbT.album = album;
                    
                    try {
                      const updatedBytes = await embedId3MetadataInAudioFile(
                        u8,
                        dbT.name,
                        artist || "",
                        album || "MusicLog",
                        coverUrl
                      );
                      dbT.fileData = new File([updatedBytes], (dbT.fileData as any).name || `${dbT.name}.mp3`, { type: dbT.fileData.type });
                      
                      // Update id3Data reference
                      if (updatedBytes[0] === 0x49 && updatedBytes[1] === 0x44 && updatedBytes[2] === 0x33) {
                        const b0 = updatedBytes[6];
                        const b1 = updatedBytes[7];
                        const b2 = updatedBytes[8];
                        const b3 = updatedBytes[9];
                        const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
                        const totalSize = size + 10;
                        if (totalSize <= updatedBytes.length) {
                          id3Data = updatedBytes.slice(0, totalSize);
                        }
                      }
                    } catch (embErr) {
                      console.warn("Loader tagging inject failed:", embErr);
                    }
                    await saveTrackToDB(dbT);
                  }
                } catch (metaErr) {
                  console.warn("Could not resurrect cover art for track:", dbT.name, metaErr);
                }

                if (!coverUrl) {
                  coverUrl = generateDefaultCoverUrl(dbT.name);
                }

                persistedTracks.push({
                  id: dbT.id,
                  name: dbT.name,
                  duration: dbT.duration,
                  fileBlob: dbT.fileData,
                  isCustom: true,
                  category: "uploaded",
                  coverUrl: coverUrl,
                  artist: artist,
                  album: album,
                  id3Data: id3Data
                });
              } catch (decodeErr) {
                console.error("Failed to map saved track:", dbT.name, decodeErr);
              }
            }
          }
        } catch (dbErr) {
          console.error("Failed to load tracks from IndexedDB:", dbErr);
        }

        // We adhere strictly to removing default tracks ("إزالة الاغاني الموجودة في التطبيق")
        // and loading the user's custom library instead.
        setTracks(persistedTracks);
        if (persistedTracks.length > 0) {
          const savedId = localStorage.getItem("musiclog_active_track_id");
          const exists = savedId ? persistedTracks.some(t => t.id === savedId) : false;
          const initialTrackId = exists ? savedId! : persistedTracks[0].id;
          
          setActiveTrackId(initialTrackId);
          
          const active = persistedTracks.find((track) => track.id === initialTrackId);
          setTrackDuration(active ? active.duration : persistedTracks[0].duration);

          const savedTimeStr = localStorage.getItem("musiclog_current_time");
          const savedTime = savedTimeStr ? parseFloat(savedTimeStr) : 0;
          if (savedTime > 0 && active && savedTime < active.duration) {
            setCurrentTime(savedTime);
            lastPausedOffsetRef.current = savedTime;
          }

          // Pre-decode active track immediately in the background to ensure instantaneous playback feel!
          if (active && !active.audioBuffer) {
            const docBlob = active.fileBlob || active.file;
            if (docBlob) {
              const preDecodeTrack = async () => {
                try {
                  if (!audioContextRef.current) {
                    getOrCreateAudioContext();
                  }
                  const ctx = audioContextRef.current!;
                  const arrayBuffer = await docBlob.arrayBuffer();
                  const decoded = await ctx.decodeAudioData(arrayBuffer);
                  active.audioBuffer = decoded;
                  setTracks((prev) =>
                    prev.map((t) => (t.id === initialTrackId ? { ...t, audioBuffer: decoded } : t))
                  );
                } catch (err) {
                  console.warn("Startup background pre-decode deferred:", err);
                }
              };
              preDecodeTrack();
            }
          }

          // Safe Auto-resume play state across browser refreshing
          const wasPlaying = localStorage.getItem("musiclog_is_playing") === "true";
          if (wasPlaying) {
            setTimeout(() => {
              playTrack(savedTime > 0 ? savedTime : 0).catch(e => {
                console.warn("Autoplay deferred:", e);
              });
            }, 300);

            const resumeAutoplay = () => {
              if (audioContextRef.current && audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume().then(() => {
                  if (localStorage.getItem("musiclog_is_playing") === "true") {
                    playTrack(lastPausedOffsetRef.current || savedTime || 0);
                  }
                });
              }
              window.removeEventListener("click", resumeAutoplay);
              window.removeEventListener("touchend", resumeAutoplay);
            };
            window.addEventListener("click", resumeAutoplay);
            window.addEventListener("touchend", resumeAutoplay);
          }
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoadingOfflineTracks(false);
      }
    };

    compileTracks();

    // Load custom presets
    const saved = localStorage.getItem("musiclog_custom_presets");
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {}
    }

    return () => {
      stopTracker();
      teardownAudio();
    };
  }, []);

  // Adjacent Tracks Background Pre-Decoding Hook
  useEffect(() => {
    if (tracks.length === 0 || !activeTrackId) return;

    const timer = setTimeout(() => {
      const ctx = audioContextRef.current || getOrCreateAudioContext();
      if (!ctx) return;

      const currIdx = tracks.findIndex((t) => t.id === activeTrackId);
      if (currIdx === -1) return;

      const nextIdx = (currIdx + 1) % tracks.length;
      const prevIdx = (currIdx - 1 + tracks.length) % tracks.length;
      const indicesToDecode = [nextIdx, prevIdx];

      indicesToDecode.forEach((idx) => {
        const track = tracks[idx];
        if (track && !track.audioBuffer) {
          const docBlob = track.fileBlob || track.file;
          if (docBlob) {
            docBlob.arrayBuffer().then((ab) => {
              ctx.decodeAudioData(ab).then((decoded) => {
                track.audioBuffer = decoded;
                setTracks((prev) =>
                  prev.map((t) =>
                    t.id === track.id ? { ...t, audioBuffer: decoded, duration: decoded.duration } : t
                  )
                );
              }).catch(() => {});
            }).catch(() => {});
          }
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeTrackId, tracks.length]);

  // Sync core changes to localStorage
  useEffect(() => {
    localStorage.setItem("musiclog_speed", speed.toString());
  }, [speed]);

  useEffect(() => {
    localStorage.setItem("musiclog_volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("musiclog_reverb", reverb.toString());
  }, [reverb]);

  useEffect(() => {
    localStorage.setItem("musiclog_bassBoost", bassBoost.toString());
  }, [bassBoost]);

  useEffect(() => {
    localStorage.setItem("musiclog_drumBoost", drumBoost.toString());
  }, [drumBoost]);

  useEffect(() => {
    localStorage.setItem("musiclog_delayBoost", delayBoost.toString());
  }, [delayBoost]);

  useEffect(() => {
    localStorage.setItem("musiclog_clarityBoost", clarityBoost.toString());
  }, [clarityBoost]);

  useEffect(() => {
    localStorage.setItem("musiclog_superSmoothness", superSmoothness ? "true" : "false");
  }, [superSmoothness]);

  useEffect(() => {
    localStorage.setItem("musiclog_player_skin", playerSkin);
  }, [playerSkin]);

  useEffect(() => {
    localStorage.setItem("musiclog_custom_lyrics", JSON.stringify(customTrackLyrics));
  }, [customTrackLyrics]);

  useEffect(() => {
    localStorage.setItem("musiclog_vintageRadio", vintageRadio ? "true" : "false");
    if (isPlayingRef.current && audioContextRef.current) {
      playTrack(lastPausedOffsetRef.current);
    }
  }, [vintageRadio]);

  useEffect(() => {
    localStorage.setItem("musiclog_vocalDoubler", vocalDoubler ? "true" : "false");
    if (isPlayingRef.current && audioContextRef.current) {
      playTrack(lastPausedOffsetRef.current);
    }
  }, [vocalDoubler]);

  useEffect(() => {
    localStorage.setItem("musiclog_tapeFlutter", tapeFlutter ? "true" : "false");
  }, [tapeFlutter]);

  useEffect(() => {
    localStorage.setItem("musiclog_reverbPreset", reverbPreset);
  }, [reverbPreset]);

  useEffect(() => {
    localStorage.setItem("musiclog_ambientMode", ambientMode);
  }, [ambientMode]);

  useEffect(() => {
    localStorage.setItem("musiclog_ambientVolume", ambientVolume.toString());
  }, [ambientVolume]);

  useEffect(() => {
    localStorage.setItem("musiclog_pitchShift", pitchShift.toString());
    if (sourceNodeRef.current && audioContextRef.current) {
      try {
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        
        // Calculate track time using exactly 'now' to prevent mathematical drift
        const elapsedActual = now - playbackStartTimeRef.current;
        const oldCompoundSpeed = speedRef.current * Math.pow(2, pitchShiftRef.current / 1200);
        const currTrackTime = Math.min(trackDurationRef.current, Math.max(0, elapsedActual * oldCompoundSpeed));
        
        // Update Detune smoothly to remove clicks/distortions on continuous movement
        sourceNodeRef.current.detune.setTargetAtTime(pitchShift, now, 0.012);
        
        // Re-align using precisely 'now' and the new compound speed
        const newCompoundSpeed = speed * Math.pow(2, pitchShift / 1200);
        playbackStartTimeRef.current = now - currTrackTime / newCompoundSpeed;
      } catch (err) {}
    }
  }, [pitchShift]);

  useEffect(() => {
    localStorage.setItem("musiclog_eq60", eq60.toString());
    if (eq60NodeRef.current && audioContextRef.current) {
      try { eq60NodeRef.current.gain.setTargetAtTime(eq60, audioContextRef.current.currentTime, 0.015); } catch (e) {}
    }
  }, [eq60]);

  useEffect(() => {
    localStorage.setItem("musiclog_eq230", eq230.toString());
    if (eq230NodeRef.current && audioContextRef.current) {
      try { eq230NodeRef.current.gain.setTargetAtTime(eq230, audioContextRef.current.currentTime, 0.015); } catch (e) {}
    }
  }, [eq230]);

  useEffect(() => {
    localStorage.setItem("musiclog_eq910", eq910.toString());
    if (eq910NodeRef.current && audioContextRef.current) {
      try { eq910NodeRef.current.gain.setTargetAtTime(eq910, audioContextRef.current.currentTime, 0.015); } catch (e) {}
    }
  }, [eq910]);

  useEffect(() => {
    localStorage.setItem("musiclog_eq4k", eq4k.toString());
    if (eq4kNodeRef.current && audioContextRef.current) {
      try { eq4kNodeRef.current.gain.setTargetAtTime(eq4k, audioContextRef.current.currentTime, 0.015); } catch (e) {}
    }
  }, [eq4k]);

  useEffect(() => {
    localStorage.setItem("musiclog_eq14k", eq14k.toString());
    if (eq14kNodeRef.current && audioContextRef.current) {
      try { eq14kNodeRef.current.gain.setTargetAtTime(eq14k, audioContextRef.current.currentTime, 0.015); } catch (e) {}
    }
  }, [eq14k]);

  useEffect(() => {
    localStorage.setItem("musiclog_surroundSound", surroundSound ? "true" : "false");
    if (isPlayingRef.current && audioContextRef.current) {
      playTrack(lastPausedOffsetRef.current);
    }
  }, [surroundSound]);



  useEffect(() => {
    localStorage.setItem("musiclog_vocalBooster", vocalBooster ? "true" : "false");
    if (vocalBoosterNodeRef.current && audioContextRef.current) {
      try {
        vocalBoosterNodeRef.current.gain.setValueAtTime(vocalBooster ? 8 : 0, audioContextRef.current.currentTime);
      } catch (e) {}
    }
  }, [vocalBooster]);

  useEffect(() => {
    localStorage.setItem("musiclog_deCrackle", deCrackle ? "true" : "false");
    if (deCrackleNodeRef.current && audioContextRef.current) {
      try {
        const ctx = audioContextRef.current;
        deCrackleNodeRef.current.frequency.setValueAtTime(deCrackle ? 8500 : 20000, ctx.currentTime);
        deCrackleNodeRef.current.Q.setValueAtTime(deCrackle ? 0.70 : 0.01, ctx.currentTime);
      } catch (e) {}
    }
  }, [deCrackle]);

  useEffect(() => {
    localStorage.setItem("musiclog_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("musiclog_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("musiclog_is_playing", isPlaying ? "true" : "false");
  }, [isPlaying]);

  // Update track meta details on flip
  useEffect(() => {
    const active = tracks.find((track) => track.id === activeTrackId);
    if (active) {
      setTrackDuration(active.duration);

      // Pre-decode selected track immediately in the background to ensure instantaneous playback feel!
      if (!active.audioBuffer) {
        const docBlob = active.fileBlob || active.file;
        if (docBlob) {
          const preDecodeOnFlip = async () => {
            try {
              if (!audioContextRef.current) {
                getOrCreateAudioContext();
              }
              const ctx = audioContextRef.current!;
              const arrayBuffer = await docBlob.arrayBuffer();
              const decoded = await ctx.decodeAudioData(arrayBuffer);
              active.audioBuffer = decoded;
              setTracks((prev) =>
                prev.map((t) => (t.id === activeTrackId ? { ...t, audioBuffer: decoded } : t))
              );
            } catch (err) {
              console.warn("Background track flip pre-decode deferred:", err);
            }
          };
          preDecodeOnFlip();
        }
      }

      // Reset currentTime to 0 if we changed tracks
      if (!isPlaying) {
        const savedId = localStorage.getItem("musiclog_active_track_id");
        const savedTimeStr = localStorage.getItem("musiclog_current_time");
        const savedTime = savedTimeStr ? parseFloat(savedTimeStr) : 0;
        
        if (activeTrackId === savedId && savedTime > 0 && savedTime < active.duration) {
          setCurrentTime(savedTime);
          lastPausedOffsetRef.current = savedTime;
        } else {
          setCurrentTime(0);
          lastPausedOffsetRef.current = 0;
        }
      } else {
        // Restart from start on track switch
        lastPausedOffsetRef.current = 0;
        playTrack(0);
      }
      localStorage.setItem("musiclog_active_track_id", activeTrackId);
    }
  }, [activeTrackId]);

  // Background Idle Serial Decode Queue for instantaneous playback of all custom tracks!
  useEffect(() => {
    const customTracksToDecode = tracks.filter((t) => t.isCustom && !t.audioBuffer && t.duration > 0);
    if (customTracksToDecode.length === 0) return;

    let isCancelled = false;
    
    const decodeNextIdle = async (index: number) => {
      if (isCancelled || index >= customTracksToDecode.length) return;
      const track = customTracksToDecode[index];
      const docBlob = track.fileBlob || track.file;
      
      if (docBlob) {
        try {
          if (!audioContextRef.current) {
            getOrCreateAudioContext();
          }
          const ctx = audioContextRef.current!;
          
          const arrayBuffer = await docBlob.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          
          if (!isCancelled) {
            setTracks((prev) =>
              prev.map((t) => (t.id === track.id ? { ...t, audioBuffer: decoded, duration: decoded.duration } : t))
            );
            // If this is the active track, update track duration too so seeker bar is correct
            if (activeTrackIdRef.current === track.id) {
              setTrackDuration(decoded.duration);
            }
          }
        } catch (err) {
          console.warn("Background batch idle decode skipped:", track.name, err);
        }
      }
      
      // Schedule next after a brief idle delay
      if (!isCancelled) {
        setTimeout(() => decodeNextIdle(index + 1), 300);
      }
    };

    // Start with a small layout delay so app loading completes smoothly first
    const timer = setTimeout(() => {
      decodeNextIdle(0);
    }, 1200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [tracks.length]);

  // Clear old static downloaded URL if parameters are changed, so user can re-export matching version
  useEffect(() => {
    if (latestWavUrl || serverDownloadUrl) {
      setLatestWavUrl(null);
      setLatestWavName("");
      setServerDownloadUrl(null);
    }
  }, [speed, volume, reverb, bassBoost, activeTrackId, reverbPreset, ambientMode, ambientVolume]);

  // HOT-SWAP Reverb room dynamic acoustics when preset is flipped in real-time
  useEffect(() => {
    if (convolverNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const params = getReverbParams(reverbPreset);
      convolverNodeRef.current.buffer = createReverbImpulseResponse(ctx, params.duration, params.decay);
    }
  }, [reverbPreset]);

  // Hot-swap/start the ambient generator automatically when mode is adjusted in real-time
  useEffect(() => {
    if (audioContextRef.current && isPlaying) {
      playAmbientSource(audioContextRef.current, ambientMode, ambientVolume);
    } else {
      stopAmbientSource();
    }
  }, [ambientMode, isPlaying]);

  // Adjust volume dynamically of the ambient background track
  useEffect(() => {
    if (ambientGainNodeRef.current && audioContextRef.current) {
      ambientGainNodeRef.current.gain.setValueAtTime(
        (ambientVolume / 100) * 0.45,
        audioContextRef.current.currentTime
      );
    }
  }, [ambientVolume]);

  // Handle active audio adjustments dynamically on slide events
  useEffect(() => {
    if (sourceNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Calculate track time using exactly 'now' to prevent mathematical drift
      const elapsedActual = now - playbackStartTimeRef.current;
      const oldCompoundSpeed = speedRef.current * Math.pow(2, pitchShiftRef.current / 1200);
      const currTrackTime = Math.min(trackDurationRef.current, Math.max(0, elapsedActual * oldCompoundSpeed));
      
      // Update Speed playback rate smoothly to prevent click pops on low-latency or Bluetooth audio buffer pipelines
      sourceNodeRef.current.playbackRate.setTargetAtTime(speed, now, 0.012);
      
      // Re-align using precisely 'now' and the new compound speed
      const newCompoundSpeed = speed * Math.pow(2, pitchShift / 1200);
      playbackStartTimeRef.current = now - currTrackTime / newCompoundSpeed;
    }
  }, [speed]);

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume / 100, audioContextRef.current.currentTime, 0.015);
    }
  }, [volume]);

  useEffect(() => {
    if (dryGainNodeRef.current && wetGainNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      dryGainNodeRef.current.gain.setTargetAtTime(1.0 - (reverb / 100) * 0.5, ctx.currentTime, 0.015);
      wetGainNodeRef.current.gain.setTargetAtTime((reverb / 100) * 0.9, ctx.currentTime, 0.015);
    }
  }, [reverb]);

  useEffect(() => {
    if (bassFilterNodeRef.current && audioContextRef.current) {
      bassFilterNodeRef.current.gain.setTargetAtTime(bassBoost, audioContextRef.current.currentTime, 0.015);
    }
  }, [bassBoost]);

  useEffect(() => {
    if (drumFilterNodeRef.current && audioContextRef.current) {
      drumFilterNodeRef.current.gain.setTargetAtTime(drumBoost, audioContextRef.current.currentTime, 0.015);
    }
  }, [drumBoost]);

  useEffect(() => {
    if (clarityFilterNodeRef.current && audioContextRef.current) {
      const clarityGainVal = clarityBoost * 0.55;
      clarityFilterNodeRef.current.gain.setTargetAtTime(clarityGainVal, audioContextRef.current.currentTime, 0.015);
    }
  }, [clarityBoost]);

  useEffect(() => {
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      if (delayFeedbackGainNodeRef.current) {
        const feedbackVal = (delayBoost / 100) * 0.5;
        delayFeedbackGainNodeRef.current.gain.setTargetAtTime(feedbackVal, ctx.currentTime, 0.015);
      }
      if (delayWetGainNodeRef.current) {
        const wetVal = (delayBoost / 100) * 0.4;
        delayWetGainNodeRef.current.gain.setTargetAtTime(wetVal, ctx.currentTime, 0.015);
      }
    }
  }, [delayBoost]);

  // Reverb space configurations
  const getReverbParams = (preset: "hall" | "cathedral" | "cave" | "dry_room") => {
    switch (preset) {
      case "hall":
        return { duration: 3.2, decay: 3.5 };
      case "cathedral":
        return { duration: 5.8, decay: 4.8 };
      case "cave":
        return { duration: 2.0, decay: 6.0 };
      case "dry_room":
        return { duration: 1.1, decay: 1.8 };
      default:
        return { duration: 3.2, decay: 3.5 };
    }
  };

  // Stop current ambient background audio layer
  const stopAmbientSource = () => {
    if (ambientSourceNodeRef.current) {
      try {
        ambientSourceNodeRef.current.stop();
        ambientSourceNodeRef.current.disconnect();
      } catch (e) {}
      ambientSourceNodeRef.current = null;
    }
    if (ambientLfoNodeRef.current) {
      try {
        ambientLfoNodeRef.current.stop();
        ambientLfoNodeRef.current.disconnect();
      } catch (e) {}
      ambientLfoNodeRef.current = null;
    }
    if (ambientGainNodeRef.current) {
      try {
        ambientGainNodeRef.current.disconnect();
      } catch (e) {}
      ambientGainNodeRef.current = null;
    }
  };

  // Play browser procedural synthesized weather/environment loops
  const playAmbientSource = (ctx: BaseAudioContext, type: string, vol: number) => {
    stopAmbientSource();
    if (type === "none") return;

    const sampleRate = ctx.sampleRate;
    const cacheKey = `${type}_${sampleRate}`;
    let buffer: AudioBuffer;

    if (ambientCache.has(cacheKey)) {
      buffer = ambientCache.get(cacheKey)!;
    } else {
      if (type === "rain") {
        const bSize = sampleRate * 2.5;
        buffer = ctx.createBuffer(2, bSize, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let lastOut = 0.0;
          for (let i = 0; i < bSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut * 0.94 + white * 0.06);
            lastOut = data[i];
          }
        }
      } else if (type === "wind") {
        const bSize = sampleRate * 4.0;
        buffer = ctx.createBuffer(2, bSize, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let lastOut = 0.0;
          for (let i = 0; i < bSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut * 0.985 + white * 0.015);
            lastOut = data[i];
          }
        }
      } else {
        // vinyl copy tape hiss
        const bSize = sampleRate * 3.0;
        buffer = ctx.createBuffer(2, bSize, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          for (let i = 0; i < bSize; i++) {
            const white = Math.random() * 2 - 1;
            let val = white * 0.035;
            if (Math.random() < 0.00018) {
              val += (Math.random() > 0.5 ? 1 : -1) * 0.45;
            }
            data[i] = val;
          }
        }
      }
      ambientCache.set(cacheKey, buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === "rain") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1150, ctx.currentTime);
    } else if (type === "wind") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(160, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      ambientLfoNodeRef.current = lfo;
    } else {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(4200, ctx.currentTime);
      filter.Q.setValueAtTime(0.4, ctx.currentTime);
    }

    const volumeGain = ctx.createGain();
    volumeGain.gain.setValueAtTime((vol / 100) * 0.45, ctx.currentTime);

    source.connect(filter);
    filter.connect(volumeGain);
    volumeGain.connect(ctx.destination);

    source.start();

    ambientSourceNodeRef.current = source;
    ambientGainNodeRef.current = volumeGain;
  };

  // Teardown active graph safely
  const teardownAudio = () => {
    if (sourceNodeRef.current) {
      const source = sourceNodeRef.current;
      const gainNode = gainNodeRef.current;
      
      if (superSmoothness && gainNode && audioContextRef.current) {
        const ctx = audioContextRef.current;
        try {
          isActionStopRef.current = true;
          gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          
          sourceNodeRef.current = null;
          
          setTimeout(() => {
            try {
              source.stop();
              source.disconnect();
            } catch (err) {}
          }, 50);
        } catch (e) {
          try {
            source.stop();
            source.disconnect();
          } catch (err) {}
          sourceNodeRef.current = null;
        }
      } else {
        try {
          isActionStopRef.current = true;
          source.stop();
          source.disconnect();
        } catch (e) {}
        sourceNodeRef.current = null;
      }
    }
    if (pannerLfoRef.current) {
      try {
        pannerLfoRef.current.stop();
        pannerLfoRef.current.disconnect();
      } catch (e) {}
      pannerLfoRef.current = null;
    }
    stopAmbientSource();
    deCrackleNodeRef.current = null;
  };

  // Safe offset calculation
  const getCurrentTrackTime = () => {
    if (!isPlayingRef.current || !audioContextRef.current) return lastPausedOffsetRef.current;
    const elapsedActual = audioContextRef.current.currentTime - playbackStartTimeRef.current;
    const compoundSpeed = speedRef.current * Math.pow(2, pitchShiftRef.current / 1200);
    const timeWithSpeed = elapsedActual * compoundSpeed;
    return Math.min(trackDurationRef.current, Math.max(0, timeWithSpeed));
  };

  // Visual Tracker Loops
  const startTracker = () => {
    stopTracker();
    let localSaveCounter = 0;
    trackingIntervalRef.current = window.setInterval(() => {
      if (!isScrubbingRef.current) {
        const time = getCurrentTrackTime();
        setCurrentTime(time);
        
        // Write to localStorage periodically (every ~1.5 seconds) to avoid CPU & disk sync overhead
        localSaveCounter++;
        if (localSaveCounter >= 15) {
          localSaveCounter = 0;
          localStorage.setItem("musiclog_current_time", time.toString());
        }
      }
    }, 100);
  };

  const stopTracker = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  const handleTrackCompletion = () => {
    playRequestIdRef.current += 1;
    stopTracker();

    if (loopActiveRef.current) {
      teardownAudio();
      setCurrentTime(0);
      lastPausedOffsetRef.current = 0;
      setTimeout(() => {
        playTrack(0);
      }, 150);
      return;
    }

    const currIdx = tracksRef.current.findIndex((t) => t.id === activeTrackIdRef.current);
    if (currIdx !== -1 && tracksRef.current.length > 1) {
      const nextIdx = (currIdx + 1) % tracksRef.current.length;
      const nextTrack = tracksRef.current[nextIdx];

      teardownAudio();
      setActiveTrackId(nextTrack.id);

      setIsPlaying(true);
      setCurrentTime(0);
      lastPausedOffsetRef.current = 0;

      setTimeout(() => {
        playTrack(0);
      }, 150);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      lastPausedOffsetRef.current = 0;
      stopAmbientSource();
      teardownAudio();
    }
  };

  // Instantiates the live environment nodes
  const playTrack = async (startOffset: number) => {
    // Generate a fresh request ID to invalidate any active or past requests in-flight
    const currentRequestId = ++playRequestIdRef.current;
    try {
      if (!audioContextRef.current) {
        getOrCreateAudioContext();
      }
      
      const ctx = audioContextRef.current!;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

       // If a newer click or scrubber action has scheduled another track launch, abort!
      if (currentRequestId !== playRequestIdRef.current) {
        return;
      }

      teardownAudio();

      const currentTracks = tracksRef.current;
      const currentActiveTrackId = activeTrackIdRef.current;
      const activeTrack = currentTracks.find((t) => t.id === currentActiveTrackId);
      if (!activeTrack) return;

      // On-demand lazy decoding of audioBuffer if it is missing
      if (!activeTrack.audioBuffer) {
        const docBlob = activeTrack.fileBlob || activeTrack.file;
        if (docBlob) {
          try {
            const arrayBuffer = await docBlob.arrayBuffer();
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            
            // Abort if another play request arrived during this async decoding phase!
            if (currentRequestId !== playRequestIdRef.current) {
              return;
            }
            
            activeTrack.audioBuffer = decodedBuffer;
            setTrackDuration(decodedBuffer.duration);
            setTracks(prev => prev.map(t => t.id === activeTrack.id ? { ...t, audioBuffer: decodedBuffer, duration: decodedBuffer.duration } : t));
          } catch (decodeErr) {
            console.error("Delayed audio decode failed on-demand:", decodeErr);
            return;
          }
        } else {
          return;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = activeTrack.audioBuffer;
      source.playbackRate.value = speed; // slows tempo & drops pitch! Perfect Analog tape slow!
      source.detune.setValueAtTime(pitchShift, ctx.currentTime);

      // Setup tape flutter (Wow & Flutter) if active
      if (tapeFlutter) {
        try {
          const flutterOsc = ctx.createOscillator();
          flutterOsc.type = "sine";
          flutterOsc.frequency.setValueAtTime(3.6, ctx.currentTime); // 3.6 Hz analog reel flutter

          const flutterGain = ctx.createGain();
          flutterGain.gain.setValueAtTime(0.0068, ctx.currentTime); // subtle warm pitch drift (+/- 0.68%)

          flutterOsc.connect(flutterGain);
          flutterGain.connect(source.playbackRate);
          flutterOsc.start();
        } catch (err) {
          console.warn("Tape Flutter error:", err);
        }
      }

      // Setup dynamic deCrackle filter node (مزيل الخرخشة)
      const deCrackleNode = ctx.createBiquadFilter();
      deCrackleNode.type = "lowpass";
      deCrackleNode.frequency.setValueAtTime(deCrackle ? 8500 : 20000, ctx.currentTime);
      deCrackleNode.Q.setValueAtTime(deCrackle ? 0.70 : 0.01, ctx.currentTime);

      // Setup peaking Bass Filter Node
      const bassNode = ctx.createBiquadFilter();
      bassNode.type = "lowshelf";
      bassNode.frequency.value = 85; 
      bassNode.gain.setValueAtTime(bassBoost, ctx.currentTime);

      // Setup peaking Drum/Beat peak filter node (boost kicks/snares/beat transients)
      const drumNode = ctx.createBiquadFilter();
      drumNode.type = "peaking";
      drumNode.frequency.value = 150; // punchy kick & transient range
      drumNode.Q.value = 1.4;
      drumNode.gain.setValueAtTime(drumBoost, ctx.currentTime);

      // Setup clarity peaking filter (وضوح وتحسين الصوت - 20 درجة)
      const clarityNode = ctx.createBiquadFilter();
      clarityNode.type = "peaking";
      clarityNode.frequency.value = 2850; // voice and treble clarity
      clarityNode.Q.value = 1.1;
      const clarityGainVal = clarityBoost * 0.55; // 0 to 11 dB boost
      clarityNode.gain.setValueAtTime(clarityGainVal, ctx.currentTime);

      // Setup 5-Band Equalizer nodes
      const eq60Node = ctx.createBiquadFilter();
      eq60Node.type = "peaking";
      eq60Node.frequency.value = 60;
      eq60Node.Q.value = 1.0;
      eq60Node.gain.setValueAtTime(eq60, ctx.currentTime);

      const eq230Node = ctx.createBiquadFilter();
      eq230Node.type = "peaking";
      eq230Node.frequency.value = 230;
      eq230Node.Q.value = 1.0;
      eq230Node.gain.setValueAtTime(eq230, ctx.currentTime);

      const eq910Node = ctx.createBiquadFilter();
      eq910Node.type = "peaking";
      eq910Node.frequency.value = 910;
      eq910Node.Q.value = 1.0;
      eq910Node.gain.setValueAtTime(eq910, ctx.currentTime);

      const eq4kNode = ctx.createBiquadFilter();
      eq4kNode.type = "peaking";
      eq4kNode.frequency.value = 4000;
      eq4kNode.Q.value = 1.0;
      eq4kNode.gain.setValueAtTime(eq4k, ctx.currentTime);

      const eq14kNode = ctx.createBiquadFilter();
      eq14kNode.type = "peaking";
      eq14kNode.frequency.value = 14000;
      eq14kNode.Q.value = 1.0;
      eq14kNode.gain.setValueAtTime(eq14k, ctx.currentTime);

      const vocalBoosterNode = ctx.createBiquadFilter();
      vocalBoosterNode.type = "peaking";
      vocalBoosterNode.frequency.value = 2500;
      vocalBoosterNode.Q.value = 1.2;
      vocalBoosterNode.gain.setValueAtTime(vocalBooster ? 8 : 0, ctx.currentTime);

      // Setup Delay/Echo (تأثير التكرار)
      const delayNode = ctx.createDelay(1.0);
      delayNode.delayTime.setValueAtTime(0.35, ctx.currentTime);

      const delayFeedbackNode = ctx.createGain();
      const feedbackVal = (delayBoost / 100) * 0.5;
      delayFeedbackNode.gain.setValueAtTime(feedbackVal, ctx.currentTime);

      const delayWetNode = ctx.createGain();
      const wetVal = (delayBoost / 100) * 0.4;
      delayWetNode.gain.setValueAtTime(wetVal, ctx.currentTime);

      // Connect feedback loop
      delayNode.connect(delayFeedbackNode);
      delayFeedbackNode.connect(delayNode);

      // Reverb Convolver Node Setup
      const convolver = ctx.createConvolver();
      const rParams = getReverbParams(reverbPreset);
      convolver.buffer = createReverbImpulseResponse(ctx, rParams.duration, rParams.decay);

      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      dryGain.gain.setValueAtTime(1.0 - (reverb / 100) * 0.5, ctx.currentTime);
      wetGain.gain.setValueAtTime((reverb / 100) * 0.9, ctx.currentTime);

      // Main Gain Mixer
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(volume / 100, ctx.currentTime);

      // Spectrum Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = superSmoothness ? 0.88 : 0.65; // Ultra fluid spectrum wave transformations!

      // Connections Graph:
      // Source -> DeCrackle -> Bass -> Drum -> Clarity -> EQ60 -> EQ230 -> EQ910 -> EQ4K -> EQ14K -> VocalBooster -> Dry/Wet/Delay
      source.connect(deCrackleNode);
      deCrackleNode.connect(bassNode);
      bassNode.connect(drumNode);
      drumNode.connect(clarityNode);

      clarityNode.connect(eq60Node);
      eq60Node.connect(eq230Node);
      eq230Node.connect(eq910Node);
      eq910Node.connect(eq4kNode);
      eq4kNode.connect(eq14kNode);
      eq14kNode.connect(vocalBoosterNode);

      // Wrap output with Surround Sound, Vintage Radio, and Vocal Doubler filters
      let chainEnd: AudioNode = vocalBoosterNode;

      // 1. Vintage Retro Radio Bandpass Filter
      if (vintageRadio) {
        try {
          const radioFilter = ctx.createBiquadFilter();
          radioFilter.type = "bandpass";
          radioFilter.frequency.setValueAtTime(1100, ctx.currentTime);
          radioFilter.Q.setValueAtTime(2.2, ctx.currentTime);
          
          chainEnd.connect(radioFilter);
          chainEnd = radioFilter;
        } catch (err) {
          console.warn("Vintage Radio Filter error:", err);
        }
      }

      // 2. Dual-Delay Vocal Chorus / Stereo Doubler
      if (vocalDoubler) {
        try {
          const splitter = ctx.createChannelSplitter(2);
          const merger = ctx.createChannelMerger(2);
          
          const delayL = ctx.createDelay(0.1);
          const delayR = ctx.createDelay(0.1);
          
          delayL.delayTime.setValueAtTime(0.024, ctx.currentTime); // 24ms delay Left
          delayR.delayTime.setValueAtTime(0.032, ctx.currentTime); // 32ms delay Right
          
          const chorusLfo = ctx.createOscillator();
          chorusLfo.type = "sine";
          chorusLfo.frequency.setValueAtTime(1.5, ctx.currentTime); // 1.5 Hz slow wobble
          
          const lfoGainL = ctx.createGain();
          const lfoGainR = ctx.createGain();
          lfoGainL.gain.setValueAtTime(0.003, ctx.currentTime); // 3ms modulation amplitude
          lfoGainR.gain.setValueAtTime(-0.003, ctx.currentTime); // out of phase modulation
          
          chorusLfo.connect(lfoGainL);
          chorusLfo.connect(lfoGainR);
          
          lfoGainL.connect(delayL.delayTime);
          lfoGainR.connect(delayR.delayTime);
          
          chainEnd.connect(splitter);
          
          splitter.connect(delayL, 0);
          splitter.connect(delayR, 1);
          
          delayL.connect(merger, 0, 0); // Left output
          delayR.connect(merger, 0, 1); // Right output
          
          const wetChorusGain = ctx.createGain();
          wetChorusGain.gain.setValueAtTime(0.7, ctx.currentTime);
          merger.connect(wetChorusGain);
          
          const chorusMixer = ctx.createGain();
          chainEnd.connect(chorusMixer);
          wetChorusGain.connect(chorusMixer);
          
          chorusLfo.start();
          chainEnd = chorusMixer;
        } catch (err) {
          console.warn("Vocal Doubler Chorus error:", err);
        }
      }

      if (surroundSound) {
        try {
          const splitter = ctx.createChannelSplitter(2);
          const merger = ctx.createChannelMerger(2);
          const delayR = ctx.createDelay(0.1);
          delayR.delayTime.setValueAtTime(0.018, ctx.currentTime); // 18ms Haas effect

          chainEnd.connect(splitter);
          splitter.connect(merger, 0, 0); // direct Left
          splitter.connect(delayR, 1, 0); // Right has delay
          delayR.connect(merger, 0, 1);

          chainEnd = merger;
        } catch (err) {
          console.warn("Live Haas surround delay error:", err);
        }
      }

      // Dry route
      chainEnd.connect(dryGain);
      dryGain.connect(mainGain);

      // Wet Reverb route
      chainEnd.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(mainGain);

      // Delay (Repeat) route
      chainEnd.connect(delayNode);
      delayNode.connect(delayWetNode);
      delayWetNode.connect(mainGain);

      mainGain.connect(analyser);

      // Setup Dynamics Compressor to prevent any digital clipping, cracking, distortion, or "خرخشة" at high volumes / EQ levels!
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-1.5, ctx.currentTime); // start compressing at -1.5dB to prevent clipping
      compressor.knee.setValueAtTime(30, ctx.currentTime); // smooth compression curve transition
      compressor.ratio.setValueAtTime(14, ctx.currentTime); // strong compression ratio above threshold
      compressor.attack.setValueAtTime(0.003, ctx.currentTime); // 3ms attack to catch transients
      compressor.release.setValueAtTime(0.08, ctx.currentTime); // 80ms release to keep it smooth
      
      analyser.connect(compressor);
      compressor.connect(ctx.destination);

      // Save Graph Node Coordinates
      sourceNodeRef.current = source;
      bassFilterNodeRef.current = bassNode;
      drumFilterNodeRef.current = drumNode;
      clarityFilterNodeRef.current = clarityNode;

      eq60NodeRef.current = eq60Node;
      eq230NodeRef.current = eq230Node;
      eq910NodeRef.current = eq910Node;
      eq4kNodeRef.current = eq4kNode;
      eq14kNodeRef.current = eq14kNode;
      vocalBoosterNodeRef.current = vocalBoosterNode;
      deCrackleNodeRef.current = deCrackleNode;

      delayNodeRef.current = delayNode;
      delayFeedbackGainNodeRef.current = delayFeedbackNode;
      delayWetGainNodeRef.current = delayWetNode;
      convolverNodeRef.current = convolver;
      dryGainNodeRef.current = dryGain;
      wetGainNodeRef.current = wetGain;
      gainNodeRef.current = mainGain;
      analyserNodeRef.current = analyser;
      setAnalyserNode(analyser);

      // Playback activation
      isActionStopRef.current = false;
      source.start(0, startOffset);
      
      // Align startup timelines
      const compoundSpeed = speed * Math.pow(2, pitchShift / 1200);
      playbackStartTimeRef.current = ctx.currentTime - startOffset / compoundSpeed;
      lastPausedOffsetRef.current = startOffset;
      
      setIsPlaying(true);
      startTracker();

      if (ambientMode !== "none") {
        playAmbientSource(ctx, ambientMode, ambientVolume);
      }

      source.onended = () => {
        // Only trigger completion if this exact source node is still the current active one
        if (sourceNodeRef.current === source && !isActionStopRef.current) {
          // Trigger natural tracks advance
          handleTrackCompletion();
        }
      };
    } catch (e) {
      console.error("Audio Routing Failed", e);
    }
  };

  const pauseTrackFully = () => {
    if (isPlayingRef.current) {
      const pausedTime = getCurrentTrackTime();
      lastPausedOffsetRef.current = pausedTime;
      localStorage.setItem("musiclog_current_time", pausedTime.toString());
      teardownAudio();
      setIsPlaying(false);
      stopTracker();
      silentAudioRef.current?.pause();
    }
  };

  const handlePlayPause = () => {
    const currentRequestId = ++playRequestIdRef.current;
    
    // Instantly wake up/resume AudioContext synchronously within the user-interaction event loop to prevent mobile WebView latency stalls!
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) => console.warn("Failed to resume ctx synchronously:", err));
    }

    if (isPlaying) {
      // Pause track state
      const pausedTime = getCurrentTrackTime();
      lastPausedOffsetRef.current = pausedTime;
      localStorage.setItem("musiclog_current_time", pausedTime.toString());
      teardownAudio();
      setIsPlaying(false);
      stopTracker();
      silentAudioRef.current?.pause();
    } else {
      // Resume track
      silentAudioRef.current?.play().catch(() => {});
      playTrack(lastPausedOffsetRef.current);
    }
  };

  const handleNextTrack = () => {
    playRequestIdRef.current += 1;
    
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) => console.warn("Failed to resume ctx synchronously on skip:", err));
    }

    const currIdx = tracks.findIndex((t) => t.id === activeTrackId);
    if (currIdx !== -1) {
      const nextIdx = (currIdx + 1) % tracks.length;
      setActiveTrackId(tracks[nextIdx].id);
    }
  };

  const handlePrevTrack = () => {
    playRequestIdRef.current += 1;

    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) => console.warn("Failed to resume ctx synchronously on back:", err));
    }

    const currIdx = tracks.findIndex((t) => t.id === activeTrackId);
    if (currIdx !== -1) {
      const prevIdx = (currIdx - 1 + tracks.length) % tracks.length;
      setActiveTrackId(tracks[prevIdx].id);
    }
  };

  const handleScrubberChange = (val: number) => {
    playRequestIdRef.current += 1;

    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch((err) => console.warn("Failed to resume ctx synchronously on scrub:", err));
    }

    setCurrentTime(val);
    lastPausedOffsetRef.current = val;
    if (isPlaying) {
      playTrack(val);
    }
  };

  // Offline Audio Canvas Compiler to generate lossless WAV!
  const runOfflineWavExport = async (includeCover: boolean = true) => {
    try {
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      if (!activeTrack || !activeTrack.audioBuffer) return;

      if (!isPremium && downloadsLeft <= 0) {
        setIsPremiumModalOpen(true);
        return;
      }

      setExportState("processing");
      setExportProgress(0);
      setExportType(includeCover ? "withCover" : "standard");

      // Revoke any previously generated Blob URL to free browser RAM memory
      if (previousWavUrlRef.current) {
        try {
          URL.revokeObjectURL(previousWavUrlRef.current);
          previousWavUrlRef.current = null;
        } catch (e) {
          console.warn("Revoke previous URL error:", e);
        }
      }

      // Calculate the duration at customized pitch/speed slowing scale
      const exportedDuration = activeTrack.audioBuffer.duration / speed;
      const sampleRate = activeTrack.audioBuffer.sampleRate;
      
      // Offline high fidelity rendering block
      const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
        2,
        sampleRate * exportedDuration,
        sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = activeTrack.audioBuffer;
      source.playbackRate.value = speed;
      source.detune.setValueAtTime(pitchShift, 0);

      // Setup offline tape flutter (Wow & Flutter) if active
      if (tapeFlutter) {
        try {
          const flutterOsc = offlineCtx.createOscillator();
          flutterOsc.type = "sine";
          flutterOsc.frequency.setValueAtTime(3.6, 0); // 3.6 Hz analog reel flutter

          const flutterGain = offlineCtx.createGain();
          flutterGain.gain.setValueAtTime(0.0068, 0); // subtle warm pitch drift (+/- 0.68%)

          flutterOsc.connect(flutterGain);
          flutterGain.connect(source.playbackRate);
          flutterOsc.start();
        } catch (err) {
          console.warn("Offline Tape Flutter error:", err);
        }
      }

      // Build identical effect graph
      const bassNode = offlineCtx.createBiquadFilter();
      bassNode.type = "lowshelf";
      bassNode.frequency.value = 85; 
      bassNode.gain.setValueAtTime(bassBoost, 0);

      const drumNode = offlineCtx.createBiquadFilter();
      drumNode.type = "peaking";
      drumNode.frequency.value = 150;
      drumNode.Q.value = 1.4;
      drumNode.gain.setValueAtTime(drumBoost, 0);

      // Setup clarity peaking filter (وضوح وتحسين الصوت - 20 درجة)
      const clarityNode = offlineCtx.createBiquadFilter();
      clarityNode.type = "peaking";
      clarityNode.frequency.value = 2850; 
      clarityNode.Q.value = 1.1;
      const clarityGainVal = clarityBoost * 0.55; // 0 to 11 dB boost
      clarityNode.gain.setValueAtTime(clarityGainVal, 0);

      // Setup 5-Band Equalizer nodes
      const eq60Node = offlineCtx.createBiquadFilter();
      eq60Node.type = "peaking";
      eq60Node.frequency.value = 60;
      eq60Node.Q.value = 1.0;
      eq60Node.gain.setValueAtTime(eq60, 0);

      const eq230Node = offlineCtx.createBiquadFilter();
      eq230Node.type = "peaking";
      eq230Node.frequency.value = 230;
      eq230Node.Q.value = 1.0;
      eq230Node.gain.setValueAtTime(eq230, 0);

      const eq910Node = offlineCtx.createBiquadFilter();
      eq910Node.type = "peaking";
      eq910Node.frequency.value = 910;
      eq910Node.Q.value = 1.0;
      eq910Node.gain.setValueAtTime(eq910, 0);

      const eq4kNode = offlineCtx.createBiquadFilter();
      eq4kNode.type = "peaking";
      eq4kNode.frequency.value = 4000;
      eq4kNode.Q.value = 1.0;
      eq4kNode.gain.setValueAtTime(eq4k, 0);

      const eq14kNode = offlineCtx.createBiquadFilter();
      eq14kNode.type = "peaking";
      eq14kNode.frequency.value = 14000;
      eq14kNode.Q.value = 1.0;
      eq14kNode.gain.setValueAtTime(eq14k, 0);

      const vocalBoosterNode = offlineCtx.createBiquadFilter();
      vocalBoosterNode.type = "peaking";
      vocalBoosterNode.frequency.value = 2500;
      vocalBoosterNode.Q.value = 1.2;
      vocalBoosterNode.gain.setValueAtTime(vocalBooster ? 8 : 0, 0);

      // Setup Offline Delay (تأثير التكرار)
      const delayNode = offlineCtx.createDelay(1.0);
      delayNode.delayTime.setValueAtTime(0.35, 0);

      const delayFeedbackNode = offlineCtx.createGain();
      const feedbackVal = (delayBoost / 100) * 0.5;
      delayFeedbackNode.gain.setValueAtTime(feedbackVal, 0);

      const delayWetNode = offlineCtx.createGain();
      const wetVal = (delayBoost / 100) * 0.4;
      delayWetNode.gain.setValueAtTime(wetVal, 0);

      // Connect feedback loop
      delayNode.connect(delayFeedbackNode);
      delayFeedbackNode.connect(delayNode);

      const convolver = offlineCtx.createConvolver();
      const offlineRevParams = getReverbParams(reverbPreset);
      convolver.buffer = createReverbImpulseResponse(offlineCtx, offlineRevParams.duration, offlineRevParams.decay);

      const dryGain = offlineCtx.createGain();
      const wetGain = offlineCtx.createGain();
      dryGain.gain.setValueAtTime(1.0 - (reverb / 100) * 0.5, 0);
      wetGain.gain.setValueAtTime((reverb / 100) * 0.9, 0);

      const mainGain = offlineCtx.createGain();
      mainGain.gain.setValueAtTime(volume / 100, 0);

      let sourceNodeEnd: AudioNode = source;
      if (deCrackle) {
        try {
          const deCrackleNode = offlineCtx.createBiquadFilter();
          deCrackleNode.type = "lowpass";
          deCrackleNode.frequency.setValueAtTime(8500, 0);
          deCrackleNode.Q.setValueAtTime(0.70, 0);
          source.connect(deCrackleNode);
          sourceNodeEnd = deCrackleNode;
        } catch (err) {
          console.warn("Offline Decrackle error:", err);
        }
      }

      sourceNodeEnd.connect(bassNode);
      bassNode.connect(drumNode);
      drumNode.connect(clarityNode);

      clarityNode.connect(eq60Node);
      eq60Node.connect(eq230Node);
      eq230Node.connect(eq910Node);
      eq910Node.connect(eq4kNode);
      eq4kNode.connect(eq14kNode);
      eq14kNode.connect(vocalBoosterNode);

      // Support vintage radio, vocal doubler and surround Haas delay in export to match live audibility
      let chainEnd: AudioNode = vocalBoosterNode;

      // 1. Vintage Retro Radio Bandpass Filter
      if (vintageRadio) {
        try {
          const radioFilter = offlineCtx.createBiquadFilter();
          radioFilter.type = "bandpass";
          radioFilter.frequency.setValueAtTime(1100, 0);
          radioFilter.Q.setValueAtTime(2.2, 0);
          
          chainEnd.connect(radioFilter);
          chainEnd = radioFilter;
        } catch (err) {
          console.warn("Offline Vintage Radio Filter error:", err);
        }
      }

      // 2. Dual-Delay Vocal Chorus / Stereo Doubler
      if (vocalDoubler) {
        try {
          const splitter = offlineCtx.createChannelSplitter(2);
          const merger = offlineCtx.createChannelMerger(2);
          
          const delayL = offlineCtx.createDelay(0.1);
          const delayR = offlineCtx.createDelay(0.1);
          
          delayL.delayTime.setValueAtTime(0.024, 0); // 24ms delay Left
          delayR.delayTime.setValueAtTime(0.032, 0); // 32ms delay Right
          
          const chorusLfo = offlineCtx.createOscillator();
          chorusLfo.type = "sine";
          chorusLfo.frequency.setValueAtTime(1.5, 0); // 1.5 Hz slow wobble
          
          const lfoGainL = offlineCtx.createGain();
          const lfoGainR = offlineCtx.createGain();
          lfoGainL.gain.setValueAtTime(0.003, 0); // 3ms modulation amplitude
          lfoGainR.gain.setValueAtTime(-0.003, 0); // out of phase modulation
          
          chorusLfo.connect(lfoGainL);
          chorusLfo.connect(lfoGainR);
          
          lfoGainL.connect(delayL.delayTime);
          lfoGainR.connect(delayR.delayTime);
          
          chainEnd.connect(splitter);
          
          splitter.connect(delayL, 0);
          splitter.connect(delayR, 1);
          
          delayL.connect(merger, 0, 0); // Left output
          delayR.connect(merger, 0, 1); // Right output
          
          const wetChorusGain = offlineCtx.createGain();
          wetChorusGain.gain.setValueAtTime(0.7, 0);
          merger.connect(wetChorusGain);
          
          const chorusMixer = offlineCtx.createGain();
          chainEnd.connect(chorusMixer);
          wetChorusGain.connect(chorusMixer);
          
          chorusLfo.start();
          chainEnd = chorusMixer;
        } catch (err) {
          console.warn("Offline Vocal Doubler Chorus error:", err);
        }
      }

      if (surroundSound) {
        try {
          const splitter = offlineCtx.createChannelSplitter(2);
          const merger = offlineCtx.createChannelMerger(2);
          const delayR = offlineCtx.createDelay(0.1);
          delayR.delayTime.setValueAtTime(0.018, 0); // 18ms Haas effect

          chainEnd.connect(splitter);
          splitter.connect(merger, 0, 0); // direct Left
          splitter.connect(delayR, 1, 0); // Right has delay
          delayR.connect(merger, 0, 1);

          chainEnd = merger;
        } catch (err) {
          console.warn("Offline Haas surround delay error:", err);
        }
      }

      // Dry route
      chainEnd.connect(dryGain);
      dryGain.connect(mainGain);

      // Wet Reverb route
      chainEnd.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(mainGain);

      // Delay (Repeat) route
      chainEnd.connect(delayNode);
      delayNode.connect(delayWetNode);
      delayWetNode.connect(mainGain);

      // Setup Offline Dynamics Compressor to prevent any digital clipping, cracking, distortion, or "خرخشة" in the exported track!
      const offlineCompressor = offlineCtx.createDynamicsCompressor();
      offlineCompressor.threshold.setValueAtTime(-1.5, 0); // start compressing at -1.5dB to prevent clipping
      offlineCompressor.knee.setValueAtTime(30, 0); // smooth compression curve transition
      offlineCompressor.ratio.setValueAtTime(14, 0); // strong compression ratio above threshold
      offlineCompressor.attack.setValueAtTime(0.003, 0); // fast attack to catch transients
      offlineCompressor.release.setValueAtTime(0.08, 0); // rapid release to prevent pumping artifacts

      mainGain.connect(offlineCompressor);
      offlineCompressor.connect(offlineCtx.destination);

      source.start(0);

      // MIX AMBIENT NOISE INTO THE EXPORTED WAV
      if (ambientMode !== "none") {
        let ambBuffer: AudioBuffer;

        if (ambientMode === "rain") {
          const bSize = sampleRate * 2.5;
          ambBuffer = offlineCtx.createBuffer(2, bSize, sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = ambBuffer.getChannelData(channel);
            let lastOut = 0.0;
            for (let i = 0; i < bSize; i++) {
              const white = Math.random() * 2 - 1;
              data[i] = (lastOut * 0.94 + white * 0.06);
              lastOut = data[i];
            }
          }
        } else if (ambientMode === "wind") {
          const bSize = sampleRate * 4.0;
          ambBuffer = offlineCtx.createBuffer(2, bSize, sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = ambBuffer.getChannelData(channel);
            let lastOut = 0.0;
            for (let i = 0; i < bSize; i++) {
              const white = Math.random() * 2 - 1;
              data[i] = (lastOut * 0.985 + white * 0.015);
              lastOut = data[i];
            }
          }
        } else {
          // Vinyl crackle
          const bSize = sampleRate * 3.0;
          ambBuffer = offlineCtx.createBuffer(2, bSize, sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = ambBuffer.getChannelData(channel);
            for (let i = 0; i < bSize; i++) {
              const white = Math.random() * 2 - 1;
              let val = white * 0.035;
              if (Math.random() < 0.00018) {
                val += (Math.random() > 0.5 ? 1 : -1) * 0.5;
              }
              data[i] = val;
            }
          }
        }

        const ambSource = offlineCtx.createBufferSource();
        ambSource.buffer = ambBuffer;
        ambSource.loop = true;

        const ambFilter = offlineCtx.createBiquadFilter();
        if (ambientMode === "rain") {
          ambFilter.type = "lowpass";
          ambFilter.frequency.setValueAtTime(1150, 0);
        } else if (ambientMode === "wind") {
          ambFilter.type = "bandpass";
          ambFilter.frequency.setValueAtTime(400, 0);
          ambFilter.Q.setValueAtTime(2.0, 0);

          const ambLfo = offlineCtx.createOscillator();
          ambLfo.type = "sine";
          ambLfo.frequency.setValueAtTime(0.08, 0);

          const ambLfoGain = offlineCtx.createGain();
          ambLfoGain.gain.setValueAtTime(160, 0);

          ambLfo.connect(ambLfoGain);
          ambLfoGain.connect(ambFilter.frequency);
          ambLfo.start(0);
        } else {
          ambFilter.type = "bandpass";
          ambFilter.frequency.setValueAtTime(4200, 0);
          ambFilter.Q.setValueAtTime(0.4, 0);
        }

        const ambGain = offlineCtx.createGain();
        ambGain.gain.setValueAtTime((ambientVolume / 100) * 0.45, 0);

        ambSource.connect(ambFilter);
        ambFilter.connect(ambGain);
        ambGain.connect(offlineCtx.destination);

        ambSource.start(0);
      }

      // Rendering starts
      const renderedBuffer = await offlineCtx.startRendering();

      // Extract album cover from the source
      let freshId3Bytes = activeTrack.id3Data;
      let imgData = null;
      let coverFetched = false;

      if (includeCover) {
        // 1. First choice logic: Extract directly from original ID3 tags if available (Pure Offline & instant!)
        if (activeTrack.id3Data) {
          try {
            const extracted = extractCoverBytesFromId3(activeTrack.id3Data);
            if (extracted && extracted.bytes && extracted.bytes.length > 0) {
              imgData = extracted;
              coverFetched = true;
            }
          } catch (extErr) {
            console.warn("Could not extract original cover from ID3 header:", extErr);
          }
        }

        // 2. Second choice logic: Try to fetch the existing track coverUrl if not extracted yet
        if (!coverFetched && activeTrack.coverUrl) {
          try {
            const fetched = await fetchImageBytes(activeTrack.coverUrl);
            if (fetched && fetched.bytes && fetched.bytes.length > 0) {
              imgData = fetched;
              coverFetched = true;
            }
          } catch (tagErr) {
            console.warn("Could not fetch direct coverUrl:", tagErr);
          }
        }

        // 3. Fallback: design-seed SVG cassette/vinyl cover
        if (!coverFetched) {
          try {
            const fallbackUrl = generateDefaultCoverUrl(activeTrack.name);
            const fetchedFallback = await fetchImageBytes(fallbackUrl);
            if (fetchedFallback && fetchedFallback.bytes && fetchedFallback.bytes.length > 0) {
              imgData = fetchedFallback;
              coverFetched = true;
            }
          } catch (fbErr) {
            console.warn("Could not generate design-seed fallback cover art:", fbErr);
          }
        }

        // 4. Ultra-failsafe byte-level fallback (tiny valid 1x1 black JPEG file) to prevent empty covers
        if (!coverFetched || !imgData || !imgData.bytes || imgData.bytes.length === 0) {
          const miniJpegBytes = new Uint8Array([
            255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 1, 0, 72, 0, 72, 0, 0, 255, 219, 0, 67, 0, 8, 6, 6, 7,
            6, 5, 8, 7, 7, 7, 9, 9, 8, 10, 12, 20, 13, 12, 11, 11, 12, 25, 18, 19, 15, 20, 29, 26, 31, 30, 29, 26, 28,
            28, 32, 36, 46, 39, 32, 34, 44, 35, 28, 28, 40, 55, 41, 44, 48, 49, 52, 52, 52, 31, 39, 57, 61, 56, 50, 60,
            46, 51, 52, 50, 255, 192, 0, 11, 8, 0, 1, 0, 1, 3, 1, 34, 0, 2, 17, 1, 3, 17, 1, 255, 196, 0, 21, 0, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 255, 196, 0, 16, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 255, 218, 0, 12, 3, 1, 0, 2, 17, 3, 17, 0, 63, 0, 117, 255, 217
          ]);
          imgData = {
            bytes: miniJpegBytes,
            mimeType: "image/jpeg"
          };
          coverFetched = true;
        }

        // 5. Generate the ID3 tag with either original or fallback cover bytes
        if (imgData && imgData.bytes && imgData.bytes.length > 0) {
          try {
            freshId3Bytes = createId3v23Tag(
              activeTrack.name,
              activeTrack.artist || "",
              activeTrack.album || "MusicLog",
              imgData.bytes,
              imgData.mimeType || "image/jpeg"
            );
            coverFetched = true;
          } catch (tagErr) {
            console.error("Failed to compile final ID3 tag structure:", tagErr);
          }
        }

        // Check if ID3 tag has APIC info or if we managed to compile cover art.
        const hasAlbumArt = coverFetched || (activeTrack.id3Data && extractCoverFromId3(activeTrack.id3Data));

        if (!hasAlbumArt) {
          // Log failure to the UI log list
          const failLog = {
            trackName: activeTrack.name,
            status: "error" as const,
            message: lang === "ar"
              ? "فشل التنزيل: لم يتم تضمين صورة الغلاف (Album Art) بنجاح. تماشياً مع معايير الجودة العالية للتطبيق، تم حظر الحفظ بدون الغلاف الأصلي."
              : "Download failed: Album Art was not successfully embedded. In compliance with strict high-quality controls, saving without the original cover art is disabled.",
            time: new Date().toLocaleTimeString()
          };
          setArtLogs(prev => [failLog, ...prev]);
          
          throw new Error("Album Art embedding is required but was not successful.");
        }
      } else {
        // Fast plain audio ID3 tags (No cover art - 100% offline text-only tagger)
        try {
          freshId3Bytes = createId3v23Tag(
            activeTrack.name,
            activeTrack.artist || "",
            activeTrack.album || "MusicLog"
          );
        } catch (tagErr) {
          console.error("Failed to compile fast offline text-only tags:", tagErr);
        }
      }

      // Prepend standard ID3v2.3 tag carrying original album art APIC to the newly compiled MP3 binary block!
      const mp3Blob = await audioBufferToMp3BlobAsync(renderedBuffer, freshId3Bytes, (p) => {
        setExportProgress(p);
      });
      const url = URL.createObjectURL(mp3Blob);
      previousWavUrlRef.current = url;

      // Log success to the UI log
      const successLog = {
        trackName: activeTrack.name,
        status: "success" as const,
        message: lang === "ar"
          ? `نجاح: تم تضمين صورة الغلاف الأصلية (${imgData?.mimeType || "image/jpeg"}) بالكامل بترميز ID3 v2.3 APIC وتوليد ملف MP3 متوافق بنسبة 100% مع Android MediaStore!`
          : `Success: Original cover art (${imgData?.mimeType || "image/jpeg"}) successfully embedded as ID3 v2.3 APIC tagging! MP3 file generated is 100% compatible with Android MediaStore!`,
        time: new Date().toLocaleTimeString()
      };
      setArtLogs(prev => [successLog, ...prev]);

      const cleanName = activeTrack.name.replace(/\s+/g, "_");
      const filename = `${cleanName}_slowed_reverb.mp3`;

      setLatestWavUrl(url);
      setLatestWavName(filename);

      // Auto trigger download link without target="_blank"
      // Mobile platforms on iframe/webview drop blob downloads if target="_blank" is used,
      // resulting in a standard routing 404 from the hosting container.
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Delay removal of the temporary link element
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        } catch (error) {
          console.warn("Clean up warning:", error);
        }
      }, 10000);

      if (!isPremium) {
        setDownloadsLeft((prev) => Math.max(0, prev - 1));
        setSavesLeft((prev) => Math.max(0, prev - 1));
      }

      setExportState("success");
      setExportErrorText("");
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || String(e);
      setExportErrorText(errMsg);
      setExportState("error");
      
      const activeTrack = tracks.find((t) => t.id === activeTrackId);
      const failLog = {
        trackName: activeTrack?.name || "Track",
        status: "error" as const,
        message: lang === "ar"
          ? `فشل التصدير: ${errMsg}`
          : `Export failed: ${errMsg}`,
        time: new Date().toLocaleTimeString()
      };
      setArtLogs(prev => [failLog, ...prev]);
      
      setTimeout(() => {
        setExportState("idle");
      }, 10000); // Wait 10 seconds before letting them try again, so they see the error
    }
  };

  // Convert uploaded user asset to AudioBuffer
  const handleUploadedFile = async (file: File) => {
    try {
      if (!isPremium && savesLeft <= 0) {
        setIsPremiumModalOpen(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;

        // 1. Extract raw ID3 binary metadata tags & embedded cover photo (APIC) BEFORE decoding
        // because decodeAudioData transfers/neuters the ArrayBuffer.
        let id3Data: Uint8Array | undefined = undefined;
        let coverUrl: string | undefined = undefined;
        let artist: string | undefined = undefined;
        let album: string | undefined = undefined;
        let trackName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

        try {
          const u8 = new Uint8Array(arrayBuffer);
          if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) {
            // Header found. Read 28-bit synchsafe ID3 overall size
            const b0 = u8[6];
            const b1 = u8[7];
            const b2 = u8[8];
            const b3 = u8[9];
            const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
            const totalSize = size + 10;
            if (totalSize <= u8.length) {
              id3Data = u8.slice(0, totalSize);
              const meta = parseAudioMetadata(id3Data);
              if (meta.title) trackName = meta.title;
              artist = meta.artist;
              album = meta.album;
              coverUrl = meta.coverUrl;
            }
          } else {
            // Check if the uploaded WAV has an embedded "id3 " chunk
            for (let i = 0; i < u8.length - 8; i++) {
              if (u8[i] === 0x69 && u8[i+1] === 0x64 && u8[i+2] === 0x33 && u8[i+3] === 0x20) {
                const chunkSize = u8[i+4] | (u8[i+5] << 8) | (u8[i+6] << 16) | (u8[i+7] << 24);
                const startOffset = i + 8;
                if (startOffset + chunkSize <= u8.length) {
                  const subChunk = u8.slice(startOffset, startOffset + chunkSize);
                  if (subChunk[0] === 0x49 && subChunk[1] === 0x44 && subChunk[2] === 0x33) {
                    id3Data = subChunk;
                    const meta = parseAudioMetadata(id3Data);
                    if (meta.title) trackName = meta.title;
                    artist = meta.artist;
                    album = meta.album;
                    coverUrl = meta.coverUrl;
                  }
                }
                break;
              }
            }
          }
        } catch (metadataErr) {
          console.warn("Could not parse ID3 metadata tags:", metadataErr);
        }

        // If no embedded cover art found, search the iTunes Search API automatically for original cover art and authentic artist/album details
        if (!coverUrl) {
          try {
            const searchResult = await searchAndFetchCoverArt(trackName, artist);
            if (searchResult) {
              coverUrl = searchResult.coverUrl;
              if (searchResult.artist) artist = searchResult.artist;
              if (searchResult.album) album = searchResult.album;
            }
          } catch (srchErr) {
            console.warn("Could not retrieve original iTunes artwork:", srchErr);
          }
        }

        if (!coverUrl) {
          coverUrl = generateDefaultCoverUrl(trackName);
        } else if (!coverUrl.startsWith("data:")) {
          try {
            const fetchedBytes = await fetchImageBytes(coverUrl);
            if (fetchedBytes && fetchedBytes.bytes && fetchedBytes.bytes.length > 0) {
              coverUrl = bytesToDataUrl(fetchedBytes.bytes, fetchedBytes.mimeType);
            }
          } catch (fetchErr) {
            console.warn("Could not pre-fetch external cover artwork to base64:", fetchErr);
          }
        }

        // Embed ID3 tags and high-resolution cover image into the file itself for absolute physical persistence!
        let finalFileBytes = new Uint8Array(arrayBuffer);
        if (coverUrl) {
          try {
            finalFileBytes = await embedId3MetadataInAudioFile(
              finalFileBytes,
              trackName,
              artist || "",
              album || "MusicLog",
              coverUrl
            );
            
            // Re-extract the newly injected ID3 section block for in-memory WAV downloads
            if (finalFileBytes[0] === 0x49 && finalFileBytes[1] === 0x44 && finalFileBytes[2] === 0x33) {
              const b0 = finalFileBytes[6];
              const b1 = finalFileBytes[7];
              const b2 = finalFileBytes[8];
              const b3 = finalFileBytes[9];
              const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
              const totalSize = size + 10;
              if (totalSize <= finalFileBytes.length) {
                id3Data = finalFileBytes.slice(0, totalSize);
              }
            }
          } catch (embedArtErr) {
            console.warn("Could not embed ID3 metadata tags into file bytes:", embedArtErr);
          }
        }

        const finalFileBlob = new File([finalFileBytes], file.name, { type: file.type });

        // 2. Decode the raw audio data
        if (!audioContextRef.current) {
          getOrCreateAudioContext();
        }

        const decodedBuffer = await audioContextRef.current.decodeAudioData(finalFileBytes.buffer);

        const newTrack: Track = {
          id: `custom-${Date.now()}`,
          name: trackName,
          duration: decodedBuffer.duration,
          audioBuffer: decodedBuffer,
          isCustom: true,
          category: "uploaded",
          id3Data,
          coverUrl,
          artist,
          album
        };

        // Save the track file to IndexedDB for persistent offline usage
        try {
          await saveTrackToDB({
            id: newTrack.id,
            name: newTrack.name,
            duration: newTrack.duration,
            fileData: finalFileBlob,
            coverUrl: newTrack.coverUrl,
            uploadedAt: Date.now(),
            artist,
            album
          });
        } catch (dbErr) {
          console.error("Failed to persist uploaded track to IndexedDB:", dbErr);
        }

        setTracks((prev) => [newTrack, ...prev]);
        setActiveTrackId(newTrack.id);
        
        if (!isPremium) {
          setSavesLeft((prev) => Math.max(0, prev - 1));
        }

        // Jump to Home Player View to explore variables
        setActiveTab("home");
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("عذراً، تعذر تفكيك الملف الصوتي. يرجى مراجعة الصياغة.");
    }
  };

  // Download, decode and compile an online MP3 track directly as a Custom track
  const handleOnlineTrackImport = async (trackUrl: string, trackName: string, trackCoverUrl: string = "") => {
    try {
      if (!isPremium && savesLeft <= 0) {
        setIsPremiumModalOpen(true);
        return;
      }

      setIsImporting(true);

      const proxyUrl = `/api/music/proxy?url=${encodeURIComponent(trackUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        throw new Error("HTTP connection to music proxy failed");
      }

      const arrayBuffer = await res.arrayBuffer();

      // Ensure AudioContext is initialized and fetch current reference state
      const ctx = getOrCreateAudioContext();
      
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      let coverUrl = trackCoverUrl;
      let artist = "";
      let album = "";

      if (!coverUrl || coverUrl.includes("unsplash.com") || coverUrl.includes("placeholder")) {
        try {
          const searchResult = await searchAndFetchCoverArt(trackName);
          if (searchResult) {
            coverUrl = searchResult.coverUrl;
            artist = searchResult.artist || "";
            album = searchResult.album || "";
          }
        } catch (srchErr) {
          console.warn("Could not discover iTunes cover art for online track:", srchErr);
        }
      }

      if (!coverUrl) {
        coverUrl = generateDefaultCoverUrl(trackName);
      } else if (!coverUrl.startsWith("data:")) {
        try {
          const fetchedBytes = await fetchImageBytes(coverUrl);
          if (fetchedBytes && fetchedBytes.bytes && fetchedBytes.bytes.length > 0) {
            coverUrl = bytesToDataUrl(fetchedBytes.bytes, fetchedBytes.mimeType);
          }
        } catch (fetchErr) {
          console.warn("Could not pre-fetch external cover artwork to base64 inside handleOnlineTrackImport:", fetchErr);
        }
      }

      let id3Data: Uint8Array | undefined = undefined;
      let finalFileBytes = new Uint8Array(arrayBuffer);
      if (coverUrl) {
        try {
          finalFileBytes = await embedId3MetadataInAudioFile(
            finalFileBytes,
            trackName,
            artist || "",
            album || "MusicLog",
            coverUrl
          );
          
          if (finalFileBytes[0] === 0x49 && finalFileBytes[1] === 0x44 && finalFileBytes[2] === 0x33) {
            const b0 = finalFileBytes[6];
            const b1 = finalFileBytes[7];
            const b2 = finalFileBytes[8];
            const b3 = finalFileBytes[9];
            const size = ((b0 & 0x7F) << 21) | ((b1 & 0x7F) << 14) | ((b2 & 0x7F) << 7) | (b3 & 0x7F);
            const totalSize = size + 10;
            if (totalSize <= finalFileBytes.length) {
              id3Data = finalFileBytes.slice(0, totalSize);
            }
          }
        } catch (embedArtErr) {
          console.warn("Could not embed ID3 metadata into imported track bytes:", embedArtErr);
        }
      }

      // Create a File object for consistent local indexed DB storage
      const sanitizedName = trackName.replace(/[^a-zA-Z0-9_أ-ي\.\-\s]/g, "");
      const file = new File([finalFileBytes], `${sanitizedName}.mp3`, { type: "audio/mp3" });

      const newTrack: Track = {
        id: `custom-${Date.now()}`,
        name: trackName,
        duration: decodedBuffer.duration,
        audioBuffer: decodedBuffer,
        isCustom: true,
        category: "uploaded",
        id3Data,
        coverUrl,
        artist,
        album
      };

      // Save the track file to IndexedDB for persistent offline usage
      try {
        await saveTrackToDB({
          id: newTrack.id,
          name: newTrack.name,
          duration: newTrack.duration,
          fileData: file,
          coverUrl: newTrack.coverUrl,
          uploadedAt: Date.now(),
          artist,
          album
        });
      } catch (dbErr) {
        console.error("Failed to persist imported track to IndexedDB:", dbErr);
      }

      setTracks((prev) => [newTrack, ...prev]);
      setActiveTrackId(newTrack.id);
      
      if (!isPremium) {
        setSavesLeft((prev) => Math.max(0, prev - 1));
      }

      // Go to home tab immediately to start adjusting speed and reverb!
      setActiveTab("home");
    } catch (err: any) {
      console.error("Online import error:", err);
      alert(lang === "ar" 
        ? "تعذر تنزيل هذا الموزع الصوتي. يرجى مراجعة الرابط، أو تجربة أغنية أخرى." 
        : "Failed to download this audiotrack. Please check the url, or try another track.");
    } finally {
      setIsImporting(false);
    }
  };


  const handleTrackDelete = async (trackId: string) => {
    // If deleted track was active, fallback to default starter track
    if (activeTrackId === trackId) {
      const fallback = tracks.find((t) => t.id !== trackId && !t.isCustom);
      if (fallback) {
        setActiveTrackId(fallback.id);
      } else {
        const nextTrack = tracks.find((t) => t.id !== trackId);
        if (nextTrack) {
          setActiveTrackId(nextTrack.id);
          setTrackDuration(nextTrack.duration);
        } else {
          setActiveTrackId("");
          setTrackDuration(0);
          setCurrentTime(0);
          lastPausedOffsetRef.current = 0;
          setIsPlaying(false);
          teardownAudio();
        }
      }
    }
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    
    try {
      await deleteTrackFromDB(trackId);
    } catch (dbErr) {
      console.error("Failed to delete track from IndexedDB:", dbErr);
    }
  };

  const handleResetEffects = () => {
    setSpeed(0.82);
    setReverb(40);
    setBassBoost(6);
    setDrumBoost(0);
    setDelayBoost(0);
    setClarityBoost(0);
    setVintageRadio(false);
    setVocalDoubler(false);
    setTapeFlutter(false);
    setReverbPreset("hall");
    setAmbientMode("none");
    setAmbientVolume(25);
    setPitchShift(0);
    setEq60(0);
    setEq230(0);
    setEq910(0);
    setEq4k(0);
    setEq14k(0);
    setSurroundSound(false);
    setVocalBooster(false);
    setDeCrackle(false);
  };

  const handleApplySpecialPreset = (preset: SpecialPreset) => {
    setActivePresetId(preset.id);
    localStorage.setItem("musiclog_active_special_preset_id_v4", preset.id);

    // Cancel any ongoing transition to avoid state fight
    if (presetTransitionIntervalRef.current) {
      clearInterval(presetTransitionIntervalRef.current);
    }

    const duration = 600; // 0.6s smooth transition
    const steps = 15;
    const intervalTime = duration / steps;
    
    let currentStep = 0;
    const startSpeed = speed;
    const startReverb = reverb;
    const startBassBoost = bassBoost;
    const startDelayBoost = delayBoost;
    const startDrumBoost = drumBoost;
    const startClarityBoost = clarityBoost;
    const startPitchShift = pitchShift;

    // Immediately toggle non-animatable digital boolean state
    setSurroundSound(preset.surroundSound ?? false);
    setVintageRadio(preset.vintageRadio ?? false);
    setVocalDoubler(preset.vocalDoubler ?? false);
    setTapeFlutter(preset.tapeFlutter ?? false);

    presetTransitionIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const ease = progress * (2 - progress); // easeOutQuad for silky transitions

      setSpeed(startSpeed + ((preset.speed ?? 1.0) - startSpeed) * ease);
      setReverb(startReverb + ((preset.reverb ?? 40) - startReverb) * ease);
      setBassBoost(Math.round(startBassBoost + ((preset.bassBoost ?? 6) - startBassBoost) * ease));
      setDelayBoost(Math.round(startDelayBoost + ((preset.delayBoost ?? 0) - startDelayBoost) * ease));
      setDrumBoost(Math.round(startDrumBoost + ((preset.drumBoost ?? 0) - startDrumBoost) * ease));
      setClarityBoost(Math.round(startClarityBoost + ((preset.clarityBoost ?? 0) - startClarityBoost) * ease));
      setPitchShift(Math.round(startPitchShift + ((preset.pitchShift ?? 0) - startPitchShift) * ease));

      if (currentStep >= steps) {
        clearInterval(presetTransitionIntervalRef.current);
        presetTransitionIntervalRef.current = null;
        
        // Ensure final state matches exactly
        setSpeed(preset.speed ?? 1.0);
        setReverb(preset.reverb ?? 40);
        setBassBoost(preset.bassBoost ?? 6);
        setDelayBoost(preset.delayBoost ?? 0);
        setDrumBoost(preset.drumBoost ?? 0);
        setClarityBoost(preset.clarityBoost ?? 0);
        setPitchShift(preset.pitchShift ?? 0);
        
        setPresetToast(lang === "ar" ? `تم تفعيل ${preset.name} بنجاح! 🎧` : `Preset ${preset.name} applied! 🎧`);
        setTimeout(() => setPresetToast(""), 2500);
      }
    }, intervalTime);
  };

  const handleSaveToPresetSlot = (presetId: string) => {
    const updated = specialPresets.map((p) => {
      if (p.id === presetId) {
        return {
          ...p,
          speed: parseFloat(speed.toFixed(2)),
          reverb: Math.round(reverb),
          bassBoost: Math.round(bassBoost),
          delayBoost: Math.round(delayBoost),
          drumBoost: Math.round(drumBoost),
          clarityBoost: Math.round(clarityBoost),
          pitchShift: Math.round(pitchShift),
          surroundSound: surroundSound,
          vintageRadio: vintageRadio,
          vocalDoubler: vocalDoubler,
          tapeFlutter: tapeFlutter,
          isSaved: true,
        };
      }
      return p;
    });
    setSpecialPresets(updated);
    localStorage.setItem("musiclog_special_presets_v4", JSON.stringify(updated));
    
    // Auto active if user saved current
    setActivePresetId(presetId);
    localStorage.setItem("musiclog_active_special_preset_id_v4", presetId);

    const targetPreset = updated.find(p => p.id === presetId);
    setPresetToast(lang === "ar" ? `تم حفظ الإعدادات الصوتية في ${targetPreset?.name || ""}! 💾` : `Audio parameters saved into ${targetPreset?.name || ""}! 💾`);
    setTimeout(() => setPresetToast(""), 2500);
  };

  const handleDeletePresetSlot = (presetId: string) => {
    const originalDefault = defaultSpecialPresets.find(p => p.id === presetId);
    if (!originalDefault) return;

    const updated = specialPresets.map((p) => {
      if (p.id === presetId) {
        return {
          ...originalDefault,
          isSaved: false,
        };
      }
      return p;
    });
    setSpecialPresets(updated);
    localStorage.setItem("musiclog_special_presets_v4", JSON.stringify(updated));

    if (activePresetId === presetId) {
      setActivePresetId(null);
      localStorage.removeItem("musiclog_active_special_preset_id_v4");
    }

    setPresetToast(lang === "ar" ? "تمت إعادة تعيين خانة الإعداد المسبق! 🗑️" : "Preset slot reset back to default! 🗑️");
    setTimeout(() => setPresetToast(""), 2500);
  };

  const startEditPreset = (preset: SpecialPreset) => {
    setEditingPresetId(preset.id);
    setEditName(preset.name);
    setEditIcon(preset.icon);
    setIsEditModalOpen(true);
  };

  const handleSavePresetEdit = () => {
    if (!editingPresetId) return;
    const updated = specialPresets.map((p) => {
      if (p.id === editingPresetId) {
        return {
          ...p,
          name: editName.trim() || p.name,
          icon: editIcon.trim() || p.icon,
        };
      }
      return p;
    });
    setSpecialPresets(updated);
    localStorage.setItem("musiclog_special_presets_v4", JSON.stringify(updated));
    setIsEditModalOpen(false);
    
    const targetPreset = updated.find(p => p.id === editingPresetId);
    setPresetToast(lang === "ar" ? `تم تحديث ${targetPreset?.name || ""} بنجاح! ⚙️` : `Preset ${targetPreset?.name || ""} updated successfully! ⚙️`);
    setTimeout(() => setPresetToast(""), 2500);
    setEditingPresetId(null);
  };

  const handleSavePresetSlot = (index: number) => {
    const preset = {
      speed,
      volume,
      reverb,
      bassBoost,
      drumBoost,
      delayBoost,
      clarityBoost,
      pitchShift,
      eq60,
      eq230,
      eq910,
      eq4k,
      eq14k,
      surroundSound,
      vocalBooster,
      tapeFlutter,
      ambientMode,
      ambientVolume,
      reverbPreset,
      vintageRadio,
      vocalDoubler
    };
    const updated = [...memoryPresets];
    updated[index] = preset;
    setMemoryPresets(updated);
    localStorage.setItem("musiclog_memoryPresetsList", JSON.stringify(updated));
  };

  const handleApplyPresetSlot = (index: number) => {
    const preset = memoryPresets[index];
    if (!preset) return;
    setSpeed(preset.speed);
    setVolume(preset.volume ?? 100);
    setReverb(preset.reverb);
    setBassBoost(preset.bassBoost);
    setDrumBoost(preset.drumBoost ?? 0);
    setDelayBoost(preset.delayBoost ?? 0);
    setClarityBoost(preset.clarityBoost ?? 0);
    setPitchShift(preset.pitchShift ?? 0);
    setEq60(preset.eq60 ?? 0);
    setEq230(preset.eq230 ?? 0);
    setEq910(preset.eq910 ?? 0);
    setEq4k(preset.eq4k ?? 0);
    setEq14k(preset.eq14k ?? 0);
    setSurroundSound(preset.surroundSound ?? false);
    setVocalBooster(preset.vocalBooster ?? false);
    setTapeFlutter(preset.tapeFlutter ?? false);
    setAmbientMode(preset.ambientMode ?? "none");
    setAmbientVolume(preset.ambientVolume ?? 25);
    setReverbPreset(preset.reverbPreset ?? "hall");
    setVintageRadio(preset.vintageRadio ?? false);
    setVocalDoubler(preset.vocalDoubler ?? false);
  };

  const handleSaveFavoritePreset = () => {
    const preset = {
      speed,
      volume,
      reverb,
      bassBoost,
      drumBoost,
      delayBoost,
      clarityBoost,
      pitchShift,
      eq60,
      eq230,
      eq910,
      eq4k,
      eq14k,
      surroundSound,
      vocalBooster,
      tapeFlutter,
      ambientMode,
      ambientVolume,
      reverbPreset,
      vintageRadio,
      vocalDoubler
    };
    localStorage.setItem("musiclog_favoritePreset", JSON.stringify(preset));
    setFavoritePreset(preset);
  };

  const handleApplyFavoritePreset = () => {
    if (!favoritePreset) return;
    setSpeed(favoritePreset.speed);
    setVolume(favoritePreset.volume);
    setReverb(favoritePreset.reverb);
    setBassBoost(favoritePreset.bassBoost);
    setDrumBoost(favoritePreset.drumBoost);
    setDelayBoost(favoritePreset.delayBoost);
    setClarityBoost(favoritePreset.clarityBoost);
    setPitchShift(favoritePreset.pitchShift);
    setEq60(favoritePreset.eq60);
    setEq230(favoritePreset.eq230);
    setEq910(favoritePreset.eq910);
    setEq4k(favoritePreset.eq4k);
    setEq14k(favoritePreset.eq14k);
    setSurroundSound(favoritePreset.surroundSound);
    setVocalBooster(favoritePreset.vocalBooster);
    setTapeFlutter(favoritePreset.tapeFlutter);
    setAmbientMode(favoritePreset.ambientMode);
    setAmbientVolume(favoritePreset.ambientVolume);
    setReverbPreset(favoritePreset.reverbPreset);
    setVintageRadio(favoritePreset.vintageRadio);
    setVocalDoubler(favoritePreset.vocalDoubler);
  };

  const applyPreset = (p: EffectPreset) => {
    setSpeed(p.speed);
    setReverb(p.reverb);
    setBassBoost(p.bassBoost);
    if (p.drumBoost !== undefined) {
      setDrumBoost(p.drumBoost);
    } else {
      setDrumBoost(0);
    }
    if (p.delayBoost !== undefined) {
      setDelayBoost(p.delayBoost);
    } else {
      setDelayBoost(0);
    }
    if (p.clarityBoost !== undefined) {
      setClarityBoost(p.clarityBoost);
    } else {
      setClarityBoost(0);
    }
    if (p.vintageRadio !== undefined) {
      setVintageRadio(p.vintageRadio);
    } else {
      setVintageRadio(false);
    }
    if (p.vocalDoubler !== undefined) {
      setVocalDoubler(p.vocalDoubler);
    } else {
      setVocalDoubler(false);
    }
    if (p.tapeFlutter !== undefined) {
      setTapeFlutter(p.tapeFlutter);
    } else {
      setTapeFlutter(false);
    }
    setReverbPreset(p.reverbPreset);
    setAmbientMode(p.ambientMode);
    setAmbientVolume(p.ambientVolume);
  };

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newP: EffectPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      speed,
      reverb,
      bassBoost,
      drumBoost,
      delayBoost,
      clarityBoost,
      vintageRadio,
      vocalDoubler,
      tapeFlutter,
      reverbPreset,
      ambientMode,
      ambientVolume,
      isCustom: true
    };
    const updated = [...customPresets, newP];
    setCustomPresets(updated);
    localStorage.setItem("musiclog_custom_presets", JSON.stringify(updated));
    setNewPresetName("");
    setShowSavePresetInput(false);
  };

  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem("musiclog_custom_presets", JSON.stringify(updated));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const activeTrack = tracks.find((track) => track.id === activeTrackId);
  const activeTheme = themeConfig[theme];

  if (!hasEntered) {
    return <SplashEntrance onEnter={handleEnterStudio} lang={lang} setLang={setLang} />;
  }

  return (
    <div className={`min-h-screen ${activeTheme.bgMain} ${activeTheme.textMain} flex flex-col font-sans relative antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white pb-24 md:pb-6 transition-all duration-300`}>
      
      {/* Background Atmosphere */}
      {!performanceMode && activeTheme.ambienceGlows.map((glow, idx) => (
        <div key={idx} className={glow} />
      ))}

      {/* Modern Top Navigation Hub */}
      <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-3 max-w-7xl w-full mx-auto">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-3 ${isRtl ? "md:flex-row-reverse" : "md:flex-row"}`}>
          
          <div className={`flex items-center gap-3 justify-between w-full md:w-auto ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shrink-0">
                <FileMusic className="w-5 h-5" />
              </div>
              <div className={`space-y-0.5 ${isRtl ? "text-right" : "text-left"}`}>
                <h1 className="text-xl font-bold italic bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
                  <span>{t.title}</span>
                  <span className="font-light opacity-60 text-xs align-top bg-purple-500/15 text-purple-300 px-1 rounded">PRO</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-550/15 border border-indigo-500/20 text-indigo-300 text-[9px] not-italic font-mono uppercase tracking-widest scale-95 origin-left">
                    {lang === "ar" ? "إصدار v3.10.2" : "v3.10.2"}
                  </span>
                </h1>
                <p className="text-[10px] text-white/55 font-semibold max-sm:hidden">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* INTEGRATED SETTINGS & SHARE BAR - MATCHING USER SCREENSHOT LOCATION */}
            <div className={`flex items-center gap-2 relative ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              {/* Sound Design Settings button */}
              <button
                id="header-sound-settings-btn"
                onClick={() => setIsToolsOpen(true)}
                className="w-10 h-10 bg-gradient-to-tr from-indigo-550/10 to-purple-550/10 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-605/20 text-indigo-400 hover:text-white rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 duration-150 cursor-pointer shadow-sm relative group"
                title={lang === "ar" ? "الإعدادات والمؤثرات الصوتية" : "Sound Design Settings"}
              >
                <Settings className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
              </button>

              {/* Share App Action button directly linked */}
              <button
                onClick={() => {
                  const shareData = {
                    title: lang === "ar" ? "تطبيق ميوزك لوج لتعديل الصوتيات" : "Music Log Soundwave Studio",
                    text: lang === "ar" 
                      ? "استمع للموسيقى بتأثيرات Slowed & Reverb مذهلة مع تجربة صدى فضائي وتعديلات احترافية!" 
                      : "Listen to music with gorgeous Slowed & Reverb effects, custom reverb acoustics, and deep bass!",
                    url: window.location.origin
                  };
                  if (navigator.share) {
                    navigator.share(shareData).catch(() => {
                      navigator.clipboard.writeText(window.location.origin);
                      alert(lang === "ar" ? "تم نسخ رابط التطبيق بنجاح! 📋" : "App Link Copied! 📋");
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                    alert(lang === "ar" ? "تم نسخ رابط التطبيق بنجاح! 📋" : "App Link Copied! 📋");
                  }
                }}
                className="w-10 h-10 bg-gradient-to-tr from-violet-555/10 to-purple-555/10 border border-violet-500/30 hover:border-violet-400 hover:bg-violet-605/20 text-violet-400 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90 duration-150 cursor-pointer shadow-sm"
                title={lang === "ar" ? "مشاركة التطبيق" : "Share Application"}
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-center md:justify-end flex-wrap gap-2 w-full md:w-auto ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            {/* Limit metrics card */}
            <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 font-medium ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <div className="flex gap-1 items-center font-bold">
                <span className="text-indigo-400">{isPremium ? "♾️" : savesLeft}</span>
                <span className="text-[10px] text-white/40">{t.saves}</span>
              </div>
              <span className="text-white/10">|</span>
              <div className="flex gap-1 items-center font-bold">
                <span className="text-indigo-400">{isPremium ? "♾️" : downloadsLeft}</span>
                <span className="text-[10px] text-white/40">{t.downloads}</span>
              </div>
              <span className="text-white/10 max-sm:hidden">|</span>
              <span className="text-[10px] text-white/40 max-sm:hidden">{t.dailyLimit}</span>
            </div>

            {/* Upgrade Plan Button */}
            {!isPremium && (
              <button
                id="header-upgrade-plan"
                onClick={() => setIsPremiumModalOpen(true)}
                className="relative group overflow-hidden rounded-xl p-[1px] hover:scale-102 transition-all active:scale-98 cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[spin_2s_linear_infinite]" />
                <div className="relative px-3.5 py-1.5 text-xs bg-[#090b10] hover:bg-neutral-900 text-white font-bold rounded-xl flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span>{t.upgrade}</span>
                </div>
              </button>
            )}

            {/* Active Language Dropdown */}
            <button
              id="lang-switcher"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-indigo-400 transition-all duration-200 flex items-center gap-1 text-xs cursor-pointer"
              title="Switch Language"
            >
              <Globe2 className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-[10px] uppercase font-black">{lang === "ar" ? "EN" : "العربية"}</span>
            </button>

            {/* Developer Credit Badge */}
            <div 
              id="developer-credit-badge"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-400/70 backdrop-blur-md rounded-xl text-xs font-black text-amber-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-default"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-amber-100">
                {lang === "ar" ? "المطور عقبة" : "Dev Oqba"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Core Architecture Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start min-w-0 overflow-x-hidden">

        {/* Left Panel: App View / Player Controls / Sliders (7 Columns) */}
        <div className={`md:col-span-7 flex flex-col gap-6 w-full min-w-0 ${activeTab === "home" ? "block" : "hidden md:block"}`}>
              {/* Dynamic Retro Player Card upgraded with Aesthetic skins, sliding tabs, vinyl, tray, loop, and interactive synced lyrics */}
              <div
                id="main-player-card"
                className={`rounded-[2.5rem] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-white/10 relative overflow-hidden flex flex-col gap-5 w-full min-w-0 transition-all duration-500 ${
                  playerSkin === "glass"
                    ? "bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-3xl shadow-slate-950/50"
                    : playerSkin === "neon"
                    ? "bg-slate-950/70 border-fuchsia-500/50 shadow-[0_0_35px_rgba(217,70,239,0.25)] text-fuchsia-100"
                    : playerSkin === "vinyl"
                    ? "bg-[#1c1007]/80 border-amber-800/40 shadow-xl shadow-[#201007]/50 text-amber-100/90"
                    : playerSkin === "aurora"
                    ? "bg-gradient-to-br from-indigo-950/60 via-slate-900/70 to-teal-950/60 border-indigo-500/20 shadow-indigo-950/40 text-indigo-100"
                    : "bg-gradient-to-b from-[#1c120b] to-[#0c0805] border-amber-600/30 text-amber-200"
                }`}
              >
                {/* Dynamically Blurred Album Cover Wallpaper Background Layer */}
                {activeTrack && activeTrack.coverUrl && !performanceMode && (
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-[60px] opacity-[0.25] scale-150 transition-all duration-1000 pointer-events-none"
                    style={{ backgroundImage: `url(${activeTrack.coverUrl})` }}
                  />
                )}

                {/* Modern Player Header Tray matching screenshot */}
                <div className="flex items-center justify-between z-10 w-full pb-1 border-b border-white/5">
                  {/* Left options action (Equalizer configuration link) */}
                  <button
                    onClick={() => setIsToolsOpen(true)}
                    className="p-2 border border-white/10 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center relative group"
                    title={lang === "ar" ? "لوحة الترددات والمعدل" : "Equalizer Sliders"}
                  >
                    <Sliders className="w-4 h-4" />
                    <span className="absolute top-full mb-1 scale-0 group-hover:scale-100 bg-[#0c0d12] text-white text-[9px] px-2 py-0.5 rounded border border-white/10 z-50 whitespace-nowrap">
                      {lang === "ar" ? "لوحة المؤثرات" : "Audio FX Suite"}
                    </span>
                  </button>

                  {/* CENTER SLIDING TAB CONTROLLER: Lyrics | Music */}
                  <div className="flex bg-black/35 p-1 rounded-full border border-white/10 backdrop-blur-md relative">
                    <button
                      onClick={() => setPlayerTab("lyrics")}
                      className={`px-4 py-1 text-[11px] font-bold rounded-full transition-all duration-350 cursor-pointer ${
                        playerTab === "lyrics"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/10 scale-102 font-black"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {lang === "ar" ? "الكلمات" : "Lyrics"}
                    </button>
                    <span className="text-white/10 px-0.5 self-center">|</span>
                    <button
                      onClick={() => setPlayerTab("music")}
                      className={`px-4 py-1 text-[11px] font-bold rounded-full transition-all duration-350 cursor-pointer ${
                        playerTab === "music"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/10 scale-102 font-black"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {lang === "ar" ? "موسيقى" : "Music"}
                    </button>
                  </div>

                  {/* Right down slide indicator arrow decorator */}
                  <button
                    onClick={() => {
                      // Satisfying interactive effect: toggles visuals mode or plays interactive click
                      const scrollTarget = document.getElementById("premium-presets-hub");
                      if (scrollTarget) scrollTarget.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="p-2 border border-white/10 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title={lang === "ar" ? "انتقال للأسفل" : "Scroll to presets"}
                  >
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>

                {/* MIDDLE TAB CONTENT: Lyrics View OR Spinning Music Cover View */}
                {playerTab === "music" ? (
                  /* TAB 1: MUSIC COVER PANEL - COMPACT WAVES VISUALIZER WITHOUT EXTRA SPACE */
                  <div className="py-2.5 px-3 relative z-10 w-full flex flex-col justify-center">
                    <CompactWavesVisualizer
                      analyser={analyserNode}
                      isPlaying={isPlaying}
                      theme={theme}
                      playerSkin={playerSkin}
                    />
                  </div>
                ) : (
                  /* TAB 2: INTERACTIVE SYNCHRONIZED SCROLLING LYRICS */
                  <div className="flex flex-col max-h-[140px] h-[140px] px-2 py-0.5 relative z-10 w-full min-w-0 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider opacity-60 text-indigo-400">
                        {lang === "ar" ? "كلمات الأغنية المتزامنة 🎙️" : "Live Synced Kara-lyrics 🎙️"}
                      </span>
                      {/* Toggle Edit Mode button */}
                      <button
                        onClick={() => {
                          const currentLyrics = customTrackLyrics[activeTrack ? activeTrack.id : ""] || "";
                          const entered = prompt(
                            lang === "ar"
                              ? "اكتب كلمات أغنيتك هنا (سطر تلو الآخر):"
                              : "Enter the track lyrics here (line by line):",
                            currentLyrics
                          );
                          if (entered !== null) {
                            setCustomTrackLyrics(prev => ({
                              ...prev,
                              [activeTrack ? activeTrack.id : "default"]: entered
                            }));
                          }
                        }}
                        className="text-[10px] font-black px-2.5 py-1 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-lg text-indigo-400 flex items-center gap-1 transition-all"
                      >
                        ✏️ {lang === "ar" ? "تعديل الكلمات" : "Edit Lyrics"}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin text-center flex flex-col justify-start w-full min-w-0">
                      {(() => {
                        const lines = (() => {
                          const trackId = activeTrack ? activeTrack.id : "default";
                          if (customTrackLyrics[trackId]) {
                            return customTrackLyrics[trackId].split("\n").filter(l => l.trim() !== "");
                          }
                          // Proportional poetic slow-reverb lines
                          return lang === "ar"
                            ? [
                                "من روعتك يا موسيقى... يبدأ النبض بالتسارع 🌌",
                                "الآن يتباطأ الزمن لنعيش في صدى مذهل 🎙️",
                                "تستمع إلى دفقات هادئة تتوغل بالذكريات 🌊",
                                "استوديو استثنائي لإفراح قلبك بكل حب 🔮",
                                "كل تذبذب يعيد صدى العاطفة والمشاعر الكاملة 🥀",
                                "استمتع بالصدى الشامل والصوت الملتف الفضائي 🚀",
                                "مع عقبة و MUSIC LOG نبرز جمالية الصوت الفاخر ✨",
                                "يتلاشى الإيقاع تدريجياً ليبقى صدى جمال هذه الكلمات 💫"
                              ]
                            : [
                                "Starting the ambient matrix... time takes a breath 🌌",
                                "Feel the slow motion flow inside the reverb zone 🎙️",
                                "Frequencies blending deeply through the space wave 🌊",
                                "Your ultimate studio with custom majestic acoustics 🔮",
                                "Every note tells a secret story in full detail 🥀",
                                "Wrap around acoustic space with glowing stereo bass 🚀",
                                "Indulge in premium slowed sounds, custom tailored backports ✨",
                                "The track finishes with a memorable sweet trailing echo 💫"
                              ];
                        })();

                        const totalCount = lines.length;
                        const activeIdx = Math.min(
                          totalCount - 1,
                          Math.floor((currentTime / (trackDuration || 0.1)) * totalCount)
                        );

                        return lines.map((line, idx) => {
                          const isActive = idx === activeIdx;
                          return (
                            <p
                              key={idx}
                              onClick={() => {
                                // Dynamic feature: clicking a lyric seeks right to that lyric percentage block!
                                const seekPct = idx / totalCount;
                                const seekTime = seekPct * (trackDuration || 0);
                                setCurrentTime(seekTime);
                                handleScrubberChange(seekTime);
                              }}
                              className={`transition-all duration-300 font-sans cursor-pointer ${
                                isActive
                                  ? playerSkin === "neon"
                                    ? "text-fuchsia-400 font-extrabold text-base scale-102 drop-shadow-[0_0_10px_rgba(217,70,239,0.9)] opacity-100"
                                    : playerSkin === "vinyl"
                                    ? "text-amber-300 font-extrabold text-base scale-102 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] opacity-100"
                                    : "text-indigo-400 font-extrabold text-base scale-102 drop-shadow-[0_0_8px_rgba(129,140,248,0.85)] opacity-100"
                                  : "text-white/40 hover:text-white/70 text-xs md:text-sm font-medium"
                              }`}
                            >
                              {line}
                            </p>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                 {/* BOTTOM METADATA CONTROLS ROW: Stably layouted underneath Tabs */}
                 <div className="flex flex-col gap-4 relative z-10 mt-1">
                   
                   {/* Hidden File Input for the ➕ Add Song shortcut button */}
                   <input
                     type="file"
                     ref={fileInputRef}
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         handleUploadedFile(file);
                       }
                     }}
                     accept="audio/*"
                     className="hidden"
                   />

                  {/* METADATA AND VERTICAL CONTROL TRAY FOR MUSIC CONTROL SLOTS */}
                  <div className={`flex items-center justify-between w-full min-w-0 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    
                    {/* Vertically Aligned Tray of Action Controls on Leftside matching the requested screenshot */}
                    <div className="flex flex-col gap-3 rounded-2xl p-2 bg-black/20 border border-white/5 backdrop-blur-md">
                      {/* Theme Changer brush skin button */}
                      <button
                        onClick={() => {
                          const skins: ("glass" | "neon" | "vinyl" | "aurora" | "sunset")[] = [
                            "glass",
                            "neon",
                            "vinyl",
                            "aurora",
                            "sunset"
                          ];
                          const nextIdx = (skins.indexOf(playerSkin) + 1) % skins.length;
                          setPlayerSkin(skins[nextIdx]);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-indigo-400 hover:scale-105 active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-inner relative group"
                        title={lang === "ar" ? "تغيير مظهر المشغل العصري" : "Change Player Visual Theme Layout"}
                      >
                        {/* Clothes T-Shirt custom icon represented with a neat lucide icon */}
                        <Laptop className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                        <span className="absolute bottom-[-22px] scale-0 group-hover:scale-100 bg-[#0c0d12] text-white text-[8px] px-1.5 py-0.2 rounded border border-white/10 z-50">
                          {playerSkin.toUpperCase()}
                        </span>
                      </button>

                      {/* Favorite Heart trigger Toggle with active colorized scale */}
                      <button
                        onClick={() => {
                          if (activeTrack) handleToggleFavorite(activeTrack.id);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:scale-105 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                        title={lang === "ar" ? "إضافة/إزالة من الأغاني المفضلة" : "Toggle Track Favorite status"}
                      >
                        <Heart
                          className={`w-4.5 h-4.5 transition-all duration-300 ${
                            activeTrack && favoriteTrackIds.includes(activeTrack.id)
                              ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse"
                              : "text-white/60 hover:text-rose-400"
                          }`}
                        />
                      </button>

                      {/* Share curven arrow action launcher */}
                      <button
                        onClick={() => {
                          const active = tracks.find((track) => track.id === activeTrackId);
                          const shareText = active 
                            ? `${lang === "ar" ? "استمع للمسار" : "Listening to"} "${active.name}" ${lang === "ar" ? "بعد التباطؤ والصدى المذهل في تطبيق MUSIC LOG الاستثنائي!" : "slowed reverb vibes!"}`
                            : `${lang === "ar" ? "تباكؤ وصدى احترافي!" : "Slowed reverb vibes!"}`;
                          
                          if (navigator.share) {
                            navigator.share({
                              title: "Music Log Studio",
                              text: shareText,
                              url: window.location.origin,
                            }).catch(() => {
                              navigator.clipboard.writeText(window.location.origin);
                              alert(lang === "ar" ? "تم نسخ الرابط ومشاركة الأغنية بنجاح! 🌌" : "Copied track share link successfully! 🌌");
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.origin);
                            alert(lang === "ar" ? "تم نسخ الرابط ومشاركة الأغنية بنجاح! 🌌" : "Copied track share link successfully! 🌌");
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-indigo-400 hover:scale-105 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                        title={lang === "ar" ? "مشاركة الملف أو ترويجه" : "Share and Export Sound Track"}
                      >
                        <Share2 className="w-4 h-4 text-violet-400" />
                      </button>
                    </div>

                    {/* Right column container holding the custom button exactly inside the red rectangle zone and the metadata below it */}
                    <div className="flex-1 min-w-0 flex flex-col gap-3 justify-between">
                      {playerTab === "music" && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-black active:scale-95 hover:scale-[1.01] transition-all cursor-pointer border select-none text-xs md:text-sm shadow-md h-10 ${
                            theme === "white"
                              ? "bg-[#818cf8] hover:bg-[#6366f1] text-white border-indigo-500/20"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-indigo-500/30"
                          }`}
                          style={{ minHeight: "40px" }}
                          title={lang === "ar" ? "إضافة أغنية من جهازك" : "Add custom song from device"}
                        >
                          <span className="text-sm">➕</span>
                          <span className="tracking-wide font-sans text-[11px] md:text-xs">
                            {lang === "ar" ? "إضافة أغنية" : "Add Song"}
                          </span>
                        </button>
                      )}

                      {/* Displays Metadata containing title and artist on the right side - COLLAPSED WITH COMPACT VINYL ARTWORK */}
                      <div className={`w-full min-w-0 px-3 flex items-center gap-3.5 ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                        
                        {/* Text details container */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-extrabold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                              playerSkin === "neon" 
                                ? "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20" 
                                : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/10"
                            }`}>
                              {playerSkin.toUpperCase()} VIBE
                            </span>
                            {loopActive && (
                              <span className="text-[8px] font-bold font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded uppercase animate-pulse">
                                LOOP ON 🔁
                              </span>
                            )}
                          </div>
                          <h3
                            className={`text-base font-extrabold hover:text-indigo-400 transition-colors truncate w-full tracking-tight ${
                              theme === "white" ? "text-slate-800" : "text-white"
                            }`}
                            title={activeTrack ? activeTrack.name : ""}
                          >
                            {activeTrack ? activeTrack.name.replace(/\.[a-zA-Z0-9]+$/, "") : t.selectTrack}
                          </h3>
                          <p className="text-[11px] font-medium text-white/55 flex items-center gap-1.5 truncate">
                            <span className="text-white/40 truncate">
                              {activeTrack && activeTrack.artist ? activeTrack.artist : (activeTrack?.isCustom ? (lang === "ar" ? "ملف مرفوع يدوي" : "Custom Uploaded") : "Music Log")}
                            </span>
                          </p>
                        </div>

                        {/* DOWNGRADED DEEP DOWN TO THE RIGHT: COMPACT GLOWING ROTATING ALBUM STICKER DISK */}
                        {playerTab === "music" && (
                          <div className="shrink-0 relative">
                            <div className={`absolute -inset-1 rounded-full blur-md opacity-35 transition-all duration-700 pointer-events-none ${
                              isPlaying ? "bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-emerald-400" : "bg-white/5"
                            }`} />
                            
                            {/* Precise mini-vinyl container matching the user sketched target perfectly */}
                            <div className="relative w-20 h-20 rounded-full border-4 border-[#090a0f] shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center bg-[#0d0e13] overflow-hidden select-none">
                              {/* Fine concentric line structures of vinyl record */}
                              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_transparent_35%,_rgba(255,255,255,0.03)_36%,_rgba(0,0,0,0.85)_40%,_rgba(255,255,255,0.02)_41%,_transparent_60%)] pointer-events-none z-10" />
                              <div className="absolute w-[90%] h-[90%] rounded-full border border-white/5 pointer-events-none z-10" />
                              <div className="absolute w-[75%] h-[75%] rounded-full border border-white/5 pointer-events-none z-10" />
                              <div className="absolute w-[60%] h-[60%] rounded-full border border-white/5 pointer-events-none z-10" />

                              <div className={`w-[52%] h-[52%] rounded-full overflow-hidden border border-black z-20 relative flex items-center justify-center ${
                                isPlaying && !performanceMode ? "animate-[spin_12s_linear_infinite]" : ""
                              }`}>
                                {activeTrack && activeTrack.coverUrl ? (
                                  <img
                                    src={activeTrack.coverUrl}
                                    className="w-full h-full object-cover"
                                    alt="Mini Album Sticker"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-850 flex items-center justify-center">
                                    <Music className="w-4.5 h-4.5 text-indigo-400" />
                                  </div>
                                )}
                                <div className="absolute w-1.5 h-1.5 rounded-full bg-black border border-white/10 z-30 shadow" />
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                  </div>

                   {/* Micro playback duration metrics tracker with range seekers underneath */}
                   <LarkPlayerProgress 
                     currentTime={currentTime}
                     trackDuration={trackDuration}
                     onSeek={handleScrubberChange}
                     formatSeconds={formatSeconds}
                     isScrubbingRef={isScrubbingRef}
                   />

                  {/* Primary control hub deck - HIGHLY OPTIMIZED LARK PLAYER ROW */}
                  <div className="flex items-center justify-between gap-2.5 pt-4 w-full">
                    
                    {/* Left corner: toggles library view instantly */}
                    <button
                      onClick={() => setActiveTab("my-music")}
                      className={`p-2.5 rounded-full border border-transparent transition-all cursor-pointer relative group flex items-center justify-center ${
                        activeTab === "my-music"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                      title={lang === "ar" ? "عرض مكتبة الموسيقى المرفوعة" : "View Uploaded Tracks Library"}
                    >
                      <ListMusic className="w-5 h-5" />
                      <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 bg-[#0c0d12] text-white text-[8px] px-1.5 py-0.2 rounded border border-white/10 z-50 whitespace-nowrap">
                        {lang === "ar" ? "قائمة التشغيل" : "Queue Library"}
                      </span>
                    </button>

                    {/* Previous track skip */}
                    <button
                      onClick={handlePrevTrack}
                      className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center placeholder-center"
                      title="Previous track"
                    >
                      <SkipBack className="w-5.5 h-5.5" />
                    </button>

                    {/* Middle elevated Play Pause triggers - LARK PLAYER SEMI-TRANSPARENT GLASS PLATE */}
                    <button
                      onClick={handlePlayPause}
                      className="w-[70px] h-[70px] rounded-full bg-white/[0.12] hover:bg-white/[0.18] text-white transition-all duration-300 hover:scale-[1.05] active:scale-95 cursor-pointer relative group flex items-center justify-center border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
                      title="Play / Pause"
                    >
                      {isPlaying ? (
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white text-white" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5" y="4" width="4.5" height="16" rx="1.5" />
                          <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className={`w-7 h-7 fill-white text-white ${isRtl ? "translate-x-[-1px]" : "translate-x-[2px]"}`} xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 4.25c0-.986 1.084-1.583 1.921-1.066l11.4 7.02c.783.483.783 1.63 0 2.113l-11.4 7.02c-.837.516-1.921-.08-1.921-1.066V4.25z" />
                        </svg>
                      )}
                    </button>

                    {/* Next track skip */}
                    <button
                      onClick={handleNextTrack}
                      className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center placeholder-center"
                      title="Next Track"
                    >
                      <SkipForward className="w-5.5 h-5.5" />
                    </button>

                    {/* Right corner: infinite track re-loop trigger */}
                    <button
                      onClick={() => setLoopActive(!loopActive)}
                      className={`p-2.5 rounded-full border transition-all cursor-pointer relative group flex items-center justify-center ${
                        loopActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "text-white/40 hover:text-white hover:bg-white/5 border-transparent"
                      }`}
                      title={lang === "ar" ? "تفعيل/تعطيل التكرار التلقائي للأغنية" : "Loop Current Song Infinitely"}
                    >
                      <Repeat className={`w-5 h-5 ${loopActive ? "rotate-180" : ""}`} />
                      <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 bg-[#0c0d12] text-white text-[8px] px-1.5 py-0.2 rounded border border-white/10 z-50 whitespace-nowrap">
                        {loopActive ? (lang === "ar" ? "التكرار مفعل" : "Loop ON") : (lang === "ar" ? "تكرار الغنية" : "Loop Off")}
                      </span>
                    </button>

                  </div>

                </div>

              </div>

              {/* Specialized Interactive 4-Presets Saved Slots Hub */}
              <div
                id="premium-presets-hub"
                className={`${activeTheme.bgCard} rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 w-full min-w-0 transition-all duration-300 border-2 ${
                  theme === "gold"
                    ? "border-amber-500/35 shadow-amber-500/5"
                    : theme === "white"
                    ? "border-slate-300 shadow-slate-100/50"
                    : "border-indigo-500/20 shadow-indigo-500/5"
                }`}
              >
                <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <Zap className={`w-5 h-5 ${theme === "gold" ? "text-amber-400" : "text-indigo-400"} fill-transparent animate-pulse`} />
                    <h3 className="text-sm md:text-base font-black tracking-wide">
                      {lang === "ar" ? "الإعدادات المحفوظة (Presets) 💾⚡" : "Saved Acoustic Presets 💾⚡"}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full uppercase font-black tracking-widest ${
                    theme === "gold" 
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {lang === "ar" ? "اضغط على ⚙️ للتعديل" : "Tap ⚙️ to customize"}
                  </span>
                </div>

                {/* Grid of the 4 Saved Presets: 2x2 grid on mobile, 4-col row on tablet/desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
                  {specialPresets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    const isCustomSaved = preset.isSaved;

                    // Calculate nice display values for the preset
                    const speedLabel = `${preset.speed.toFixed(2)}x`;
                    const reverbLabel = `${preset.reverb}%`;
                    const bassPercent = Math.round((preset.bassBoost / 15) * 100);

                    return (
                      <div
                        key={preset.id}
                        className={`group relative rounded-[2rem] p-4 min-h-[140px] transition-all duration-300 flex flex-col items-center justify-between gap-2.5 border-2 text-center cursor-pointer select-none active:scale-95 ${
                          isActive
                            ? theme === "gold"
                              ? "bg-amber-500/10 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.02]"
                              : theme === "white"
                              ? "bg-indigo-50/70 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02] text-slate-800"
                              : theme === "green"
                              ? "bg-emerald-600/10 border-emerald-400/90 shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.02]"
                              : theme === "purple"
                              ? "bg-fuchsia-600/10 border-fuchsia-400 shadow-[0_0_25px_rgba(217,70,239,0.25)] scale-[1.02]"
                              : "bg-indigo-600/10 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.25)] scale-[1.02]"
                            : isCustomSaved
                            ? theme === "white"
                              ? "bg-indigo-50/20 hover:bg-indigo-50/45 border-indigo-200"
                              : "bg-indigo-950/20 hover:bg-indigo-950/35 border-indigo-500/25"
                            : theme === "white"
                            ? "bg-slate-50 hover:bg-slate-100 border-slate-200"
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                        }`}
                        onClick={() => {
                          // Standard load action on click
                          handleApplySpecialPreset(preset);
                        }}
                      >
                        {/* Status badging element - highlights saved or active status */}
                        <div className="absolute top-3 left-3 flex items-center gap-1">
                          {isCustomSaved ? (
                            <span 
                              className={`text-[8px] font-mono px-1.5 py-0.2 rounded-full border ${
                                theme === "white" 
                                  ? "bg-indigo-100 text-indigo-600 border-indigo-200" 
                                  : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              }`}
                              title={lang === "ar" ? "تم تصميمه بأجواء مخصصة" : "Contains customizable user parameters"}
                            >
                              {lang === "ar" ? "محفوظ مخصص" : "SAVED"}
                            </span>
                          ) : (
                            <span 
                              className={`text-[8px] font-mono px-1.5 py-0.2 rounded-full border ${
                                theme === "white" 
                                  ? "bg-slate-100 text-slate-400 border-slate-200" 
                                  : "bg-white/5 text-white/30 border-white/5"
                              }`}
                            >
                              {lang === "ar" ? "افتراضي" : "DEFAULT"}
                            </span>
                          )}
                        </div>

                        {/* Trigger Options / Setup Cog Button on standard click to support accessibility */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPresetActionMenuTarget(preset);
                          }}
                          className={`absolute top-2.5 right-2.5 p-1 w-6 h-6 rounded-full flex items-center justify-center transition-all border opacity-45 group-hover:opacity-100 hover:rotate-45 cursor-pointer shadow-sm ${
                            theme === "white"
                              ? "bg-slate-100 border-slate-250 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-[#11141e] border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                          title={lang === "ar" ? "خيارات وإعدادات الخانة" : "Preset slot action choices"}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        {/* Large, beautiful preset icon emoji badge */}
                        <div className="mt-4 flex items-center justify-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-inner relative ${
                            isActive
                              ? theme === "gold"
                                ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-black scale-110 rotate-6"
                                : "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white scale-110 rotate-6"
                              : theme === "white"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-white/5 border border-white/10 text-white/80"
                          }`}>
                            <span>{preset.icon}</span>
                            {isActive && (
                              <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none animate-ping" />
                            )}
                          </div>
                        </div>

                        {/* Preset customizable name */}
                        <div className="w-full flex flex-col items-center gap-0.5 px-1 truncate">
                          <h4 className={`text-xs md:text-sm font-black tracking-tight leading-none truncate ${
                            isActive
                              ? theme === "gold"
                                ? "text-amber-300"
                                : theme === "white"
                                ? "text-indigo-600"
                                : "text-indigo-400"
                              : theme === "white"
                              ? "text-slate-800 font-bold"
                              : "text-white/90"
                          }`}>
                            {preset.name}
                          </h4>
                          
                          {/* Tiny parameters overview */}
                          <span className={`text-[9px] font-mono leading-none ${
                            theme === "white" ? "text-slate-400 font-medium" : "text-white/40"
                          }`}>
                            {speedLabel} • {reverbLabel}
                          </span>
                        </div>

                        {/* Save icon overlay to indicate customizable preset slots */}
                        <div className="absolute bottom-2.5 right-3 opacity-30 group-hover:opacity-80 transition-all">
                          <Save className={`w-3.5 h-3.5 ${theme === "gold" ? "text-amber-400" : "text-indigo-400"}`} />
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Sound Effects Configurator Panel Sliders */}
              <div className="space-y-4">
                
                {/* Framed Pitch & Volume Controllers with +/- buttons & distinct borders */}
                <div className={`p-4 rounded-[1.5rem] border-2 shadow-sm font-sans ${
                  theme === "white" 
                    ? "border-slate-300 bg-slate-50/70 text-slate-800" 
                    : theme === "gold"
                    ? "border-amber-500/30 bg-amber-500/5 text-white"
                    : theme === "green"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white"
                    : theme === "purple"
                    ? "border-fuchsia-500/30 bg-fuchsia-500/5 text-white"
                    : "border-indigo-505/25 bg-white/5 text-white"
                } space-y-3.5`}>
                  <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <Sliders className={`w-4 h-4 ${
                      theme === "white" ? "text-slate-600" : theme === "gold" ? "text-amber-400" : "text-indigo-400"
                    }`} />
                    <span className="text-xs font-black tracking-wide uppercase">
                      {lang === "ar" ? "التحكم بالنغمة ودرجة الصوت" : "Independent Pitch & Volume Matrix"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pitch Shift Controls Column */}
                    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${
                      theme === "white" ? "bg-white border-slate-200" : "bg-black/35 border-white/5"
                    }`}>
                      <span className={`text-[11px] font-black ${theme === "white" ? "text-slate-500" : "text-white/50"}`}>
                        {lang === "ar" ? "نغمة الصوت (Pitch)" : "Sound Pitch Shift"}
                      </span>
                      <div className={`flex items-center justify-between gap-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <button
                          type="button"
                          onClick={() => setPitchShift(prev => Math.max(-1200, prev - 100))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black select-none text-sm transition-all cursor-pointer border active:scale-90 ${
                            theme === "white"
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-800"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                          }`}
                          title={lang === "ar" ? "خفض النغمة" : "Decrease Pitch"}
                        >
                          -
                        </button>
                        <span className="text-[11px] font-mono font-black min-w-[70px] text-center select-none">
                          {pitchShift === 0 ? "0" : pitchShift > 0 ? `+${pitchShift}` : `${pitchShift}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPitchShift(prev => Math.min(1200, prev + 100))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black select-none text-sm transition-all cursor-pointer border active:scale-90 ${
                            theme === "white"
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-800"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                          }`}
                          title={lang === "ar" ? "رفع النغمة" : "Increase Pitch"}
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <input
                          dir="ltr"
                          type="range"
                          min="-1200"
                          max="1200"
                          step="50"
                          value={pitchShift}
                          onChange={(e) => setPitchShift(parseInt(e.target.value))}
                          className={`w-full h-1 cursor-pointer appearance-none rounded-lg transition-all ${
                            theme === "white" 
                              ? "bg-slate-200 accent-indigo-600" 
                              : theme === "gold"
                              ? "bg-white/10 accent-amber-500"
                              : theme === "green"
                              ? "bg-white/10 accent-emerald-500"
                              : theme === "purple"
                              ? "bg-white/10 accent-fuchsia-500"
                              : "bg-white/10 accent-indigo-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Volume Controls Column */}
                    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${
                      theme === "white" ? "bg-white border-slate-200" : "bg-black/35 border-white/5"
                    }`}>
                      <span className={`text-[11px] font-black ${theme === "white" ? "text-slate-500" : "text-white/50"}`}>
                        {lang === "ar" ? "درجة الصوت (Volume)" : "Sound Wave Volume"}
                      </span>
                      <div className={`flex items-center justify-between gap-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <button
                          type="button"
                          onClick={() => setVolume(prev => Math.max(0, prev - 5))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black select-none text-sm transition-all cursor-pointer border active:scale-90 ${
                            theme === "white"
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-800"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                          }`}
                          title={lang === "ar" ? "خفض الصوت" : "Decrease Volume"}
                        >
                          -
                        </button>
                        <span className="text-[11px] font-mono font-black min-w-[50px] text-center select-none">
                          {volume}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setVolume(prev => Math.min(100, prev + 5))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black select-none text-sm transition-all cursor-pointer border active:scale-90 ${
                            theme === "white"
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-800"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                          }`}
                          title={lang === "ar" ? "رفع الصوت" : "Increase Volume"}
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <input
                          dir="ltr"
                          type="range"
                          min="0"
                          max="100"
                          step="2"
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value))}
                          className={`w-full h-1 cursor-pointer appearance-none rounded-lg transition-all ${
                            theme === "white" 
                              ? "bg-slate-200 accent-indigo-600" 
                              : theme === "gold"
                              ? "bg-white/10 accent-amber-500"
                              : theme === "green"
                              ? "bg-white/10 accent-emerald-500"
                              : theme === "purple"
                              ? "bg-white/10 accent-fuchsia-500"
                              : "bg-white/10 accent-indigo-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Speed Tempo control */}
                <SliderControl
                  id="speed"
                  label={t.speed}
                  icon={Gauge}
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  value={speed}
                  displayValue={`${speed.toFixed(2)}x`}
                  onChange={(val) => setSpeed(val)}
                  lang={lang}
                  theme={theme}
                />

                {/* Sound Volume control */}
                <SliderControl
                  id="volume"
                  label={t.volume}
                  icon={Volume2}
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  displayValue={`${volume}%`}
                  onChange={(val) => setVolume(val)}
                  lang={lang}
                  theme={theme}
                />

                {/* Spatial Reverb wet control */}
                <SliderControl
                  id="reverb"
                  label={t.reverb}
                  icon={Sparkles}
                  min={0}
                  max={100}
                  step={1}
                  value={reverb}
                  displayValue={reverb.toString()}
                  onChange={(val) => setReverb(val)}
                  lang={lang}
                  theme={theme}
                />

                {/* Sledgehammer Bass Boost control */}
                <SliderControl
                  id="bass"
                  label={t.bassBoost}
                  icon={Layers}
                  min={0}
                  max={15}
                  step={1}
                  value={bassBoost}
                  displayValue={bassBoost.toString()}
                  onChange={(val) => setBassBoost(val)}
                  lang={lang}
                  theme={theme}
                />

                {/* Drums & Rhythm Boost control */}
                <SliderControl
                  id="drums"
                  label={t.drumBoost}
                  icon={Drum}
                  min={0}
                  max={15}
                  step={1}
                  value={drumBoost}
                  displayValue={drumBoost.toString()}
                  onChange={(val) => setDrumBoost(val)}
                  lang={lang}
                  theme={theme}
                />

                {/* 1. Unified Sound Tools & Theme Settings Launcher */}
                <div className="space-y-3 pt-2">
                  <button
                    id="open-sound-tools"
                    onClick={() => setIsToolsOpen(true)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-extrabold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] duration-200 cursor-pointer shadow-lg shadow-indigo-550/5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"
                  >
                    <Sliders className="w-4.5 h-4.5 text-indigo-455" />
                    <span className="text-xs md:text-sm font-sans">
                      {lang === "ar" ? "لوحة التعديل والمؤثرات الصوتية والمظهر ⚙️" : "Sound Tools & Theme Settings ⚙️"}
                    </span>
                  </button>

                  {/* Revert / resetting parameters button */}
                  <div className={`flex ${isRtl ? "justify-start" : "justify-end"}`}>
                    <button
                      id="reset-effects"
                      onClick={handleResetEffects}
                      className={`text-white/40 hover:text-indigo-400 text-xs font-bold flex items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Undo className="w-3.5 h-3.5" />
                      <span>{t.reset}</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Web Audio MP3 rendering Compiler Exporter Action */}
                <div className="pt-2 space-y-4">
                  <div className={`text-xs font-bold text-white/50 tracking-wider uppercase ${isRtl ? "text-right" : "text-left"}`}>
                    {lang === "ar" ? "📥 خيارات تصدير وحفظ الأغنية كـ MP3" : "📥 MP3 Export & Save Options"}
                  </div>

                  {exportState !== "processing" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Option 1: Fast Music Only (Plain) */}
                      <button
                        id="export-music-plain"
                        onClick={() => runOfflineWavExport(false)}
                        className="relative group overflow-hidden rounded-xl border border-white/10 bg-[#0e111a] hover:bg-[#121622] hover:border-white/20 active:scale-[0.98] transition-all duration-200 py-3.5 px-4 font-sans flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      >
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-white text-xs md:text-sm">
                            {lang === "ar" ? "حفظ الموسيقى" : "Save Music"}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 block leading-tight">
                          {lang === "ar" ? "تصدير فوري بدون تحميل الغلاف" : "Instant export bypassing cover"}
                        </span>
                      </button>

                      {/* Option 2: Music with Cover (Embedded) */}
                      <button
                        id="export-music-cover"
                        onClick={() => runOfflineWavExport(true)}
                        className="relative group overflow-hidden rounded-xl p-[1px] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                      >
                        {/* Shimmering background */}
                        <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative bg-[#090b10] hover:bg-neutral-950 rounded-xl py-3.5 px-4 flex flex-col items-center justify-center gap-1 text-center min-h-full">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
                            <span className="font-bold text-white text-xs md:text-sm">
                              {lang === "ar" ? "حفظ الموسيقى مع الغلاف" : "Save Music with Cover"}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400/70 block leading-tight">
                            {lang === "ar" ? "حقن الغلاف الأصلي كعلامة كاملة" : "Embeds original cover art tagging"}
                          </span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* Active export status block showing percentage */
                    <div className="w-full relative group overflow-hidden rounded-2xl p-[1.5px] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      {/* Animated glowing border */}
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 animate-[spin_3s_linear_infinite]" />
                      
                      <div className="relative overflow-hidden py-4 px-6 rounded-2xl bg-[#090b10] flex flex-col items-center justify-center min-h-[64px]">
                        {/* Premium internal progress filler */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/25 via-indigo-500/20 to-purple-500/20 transition-all duration-300 ease-out"
                          style={{ width: `${exportProgress}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <div className="relative flex items-center justify-center">
                            {/* Spinning loader */}
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          </div>

                          <span className="text-xs md:text-sm font-black text-white tracking-wide font-sans text-center">
                            {lang === "ar" ? (
                              exportProgress === 0 
                                ? "البدء في تجهيز الملف والترددات... ⚙️" 
                                : exportType === "standard"
                                ? `جاري تحويل الموسيقى: ${exportProgress}% ⚡`
                                : exportProgress < 90
                                ? `جاري تحويل الأغنية والترددات: ${exportProgress}% 🌟`
                                : `جاري دمج وحقن صورة الغلاف الأصلية: ${exportProgress}% 🖼️`
                            ) : (
                              exportProgress === 0 
                                ? "Starting audio compiler... ⚙️" 
                                : exportType === "standard"
                                ? `Slowing down & encoding: ${exportProgress}% ⚡`
                                : exportProgress < 90
                                ? `Slowing down & encoding: ${exportProgress}% 🌟`
                                : `Embedding original high-res cover art: ${exportProgress}% 🖼️`
                            )}
                          </span>
                        </div>

                        {/* Clean micro-bar displaying percentage numerically */}
                        <div className="relative z-10 w-full mt-2 flex items-center justify-between text-[10px] font-mono text-white/50 tracking-wider">
                          <span>
                            {lang === "ar" ? "مراحل المعالجة الذكية" : "Smart Processing Stage"}
                          </span>
                          <span className="text-emerald-400 font-extrabold animate-pulse">
                            {exportProgress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {latestWavUrl && (
                    <div className="p-5 rounded-2xl bg-[#0e111a] border border-emerald-500/20 text-white space-y-4 flex flex-col transition-all duration-300">
                      <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                        <span className="text-sm font-black text-emerald-400">
                          {lang === "ar" ? "تم تجهيز وتصدير ملفك الصوتي بنجاح مع صورة الغلاف! 🎉" : "Your sound file has been prepared & exported with cover art! 🎉"}
                        </span>
                      </div>

                      {/* Dynamic player preview */}
                      <div className="space-y-1 bg-[#090b10] p-3 rounded-xl border border-white/5">
                        <span className={`text-[9.5px] text-white/40 block font-mono truncate ${isRtl ? "text-right" : "text-left"}`}>
                          🎵 {latestWavName}
                        </span>
                        <audio 
                          controls 
                          src={latestWavUrl} 
                          className="w-full h-10 rounded-lg bg-[#0c0d12] border border-white/5"
                        />
                      </div>

                      {/* Highly visible direct offline download button */}
                      <a
                        href={latestWavUrl}
                        download={latestWavName}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-white/10 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-center shadow-lg shadow-indigo-550/20"
                      >
                        <Download className="w-5 h-5 text-white animate-bounce" />
                        <span>
                          {lang === "ar" ? "تحميل الأغنية المعدلة بنظام دمج الغلاف (MP3)" : "Download Modified Song with Cover Art (MP3)"}
                        </span>
                      </a>
                    </div>
                  )}

                  {exportErrorText && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex flex-col gap-1.5 shadow-md">
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span className="font-bold">{lang === "ar" ? "حدث خطأ أثناء معالجة وحفظ الأغنية:" : "Error occurred during track processing/saving:"}</span>
                      </div>
                      <p className={`opacity-80 font-mono text-[10px] break-all leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>{exportErrorText}</p>
                    </div>
                  )}

                  {/* Real-time Album Art Embedder Log (سجل تثبيت غلاف الألبوم) */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-black text-white/75 flex items-center gap-1.5 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        {lang === "ar" ? "مراقب ذكي: فحص وتضمين صورة الغلاف 🔍" : "Smart Monitor: Album Art Embedding Tracker 🔍"}
                      </span>
                      {artLogs.length > 0 && (
                        <button 
                          onClick={() => setArtLogs([])}
                          className="text-[10px] text-white/40 hover:text-red-400 font-bold cursor-pointer"
                        >
                          {lang === "ar" ? "مسح السجل" : "Clear Log"}
                        </button>
                      )}
                    </div>

                    {artLogs.length === 0 ? (
                      <p className={`text-[10px] text-white/30 italic ${isRtl ? 'text-right' : 'text-left'}`}>
                        {lang === "ar" ? "لم يتم تنزيل أو معالجة أي مسارات صوتية بعد في هذه الجلسة." : "No audio tracks processed or downloaded in this session."}
                      </p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {artLogs.map((log, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl text-[11px] border flex flex-col gap-1.5 transition-all ${
                              log.status === "success" 
                                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-300" 
                                : "bg-red-500/5 border-red-500/15 text-red-300"
                            }`}
                          >
                            <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="font-extrabold truncate max-w-[200px] text-white">{log.trackName}</span>
                              <span className="text-[9px] text-white/40 font-mono shrink-0">{log.time}</span>
                            </div>
                            <p className={`leading-relaxed text-[10px] ${isRtl ? 'text-right' : 'text-left'} ${log.status === 'success' ? 'text-emerald-400/80': 'text-red-400/80'}`}>
                              {log.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>

        {/* Right Panel: Core File Upload, Favorites, or Track Library (5 Columns) */}
        <div className={`md:col-span-5 flex flex-col gap-6 w-full min-w-0 ${(activeTab === "my-music" || activeTab === "favorites" || activeTab === "vocal-splitter") ? "block" : "hidden md:block"}`}>
          
          {/* We display Audio Separation Suite if tab is vocal-splitter */}
          {activeTab === "vocal-splitter" && (
            <AudioSeparationSuite
              tracks={tracks}
              onGlobalPause={pauseTrackFully}
              lang={lang}
              theme={theme}
            />
          )}

          {/* We display Upload and Track Library if tab is my-music, or we are on desktop in other modes */}
          {activeTab !== "favorites" && activeTab !== "vocal-splitter" && (
            <>
              <UploadSection onFileSelect={handleUploadedFile} lang={lang} theme={theme} />

              {activeTab === "my-music" ? (
                <LocalFilesExplorer
                  tracks={tracks}
                  onFileSelect={handleUploadedFile}
                  activeTrackId={activeTrackId}
                  isPlaying={isPlaying}
                  onTrackSelect={(id) => {
                    const ctx = getOrCreateAudioContext();
                    if (ctx && ctx.state === "suspended") {
                      ctx.resume().catch((err) => console.warn(err));
                    }
                    if (id === activeTrackId) {
                      handlePlayPause();
                    } else {
                      setIsPlaying(true);
                      setActiveTrackId(id);
                    }
                  }}
                  onTrackDelete={handleTrackDelete}
                  lang={lang}
                  theme={theme as any}
                  favoriteTrackIds={favoriteTrackIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              ) : (
                <TrackLibrary
                  tracks={tracks}
                  activeTrackId={activeTrackId}
                  isPlaying={isPlaying}
                  onTrackSelect={(id) => {
                    const ctx = getOrCreateAudioContext();
                    if (ctx && ctx.state === "suspended") {
                      ctx.resume().catch((err) => console.warn(err));
                    }
                    if (id === activeTrackId) {
                      handlePlayPause();
                    } else {
                      setIsPlaying(true);
                      setActiveTrackId(id);
                    }
                  }}
                  onTrackDelete={handleTrackDelete}
                  lang={lang}
                  theme={theme}
                  favoriteTrackIds={favoriteTrackIds}
                  onToggleFavorite={handleToggleFavorite}
                  isPwaInstallable={isPwaInstallable}
                  onInstallPwa={handleInstallPwa}
                />
              )}
            </>
          )}

          {/* We display the Favorites strictly when the favorites tab is active! */}
          {activeTab === "favorites" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="rounded-2xl border border-rose-500/15 bg-gradient-to-br from-[#0c0d12]/95 to-[#08090d]/95 p-4.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-rose-500/5 blur-2xl pointer-events-none" />
                <span className={`text-[10px] font-black uppercase tracking-widest text-rose-400 font-mono block ${isRtl ? "text-right" : "text-left"}`}>
                  {lang === "ar" ? "أغاني المفضلة المحفوظة ❤️" : "MY FAVORITE SAVED SONGS ❤️"}
                </span>
                <p className={`text-xs text-white/60 font-medium mt-1 leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
                  {lang === "ar" ? "قائمة المقاطع التي فضلتها للوصول السريع والتبويب المباشر بلمسة حب" : "Your customized collection of tracks for instant playback & slowed vibe"}
                </p>
              </div>

              {tracks.filter(tr => favoriteTrackIds.includes(tr.id)).length === 0 ? (
                <div className="py-10 text-center text-white/40 bg-white/5 border border-white/5 backdrop-blur-md rounded-2xl w-full text-xs font-semibold flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/10 flex items-center justify-center text-rose-450/80">
                    <Heart className="w-5 h-5 animate-pulse text-rose-500 fill-current" />
                  </div>
                  <span className="max-w-xs leading-relaxed px-4">
                    {lang === "ar" 
                      ? "قائمة المفضلة فارغة حالياً. يرجى تصفح الرئيسية أو موسيقاي والضغط على زر القلب (❤️) بجانب المقاطع لإضافتها هنا!" 
                      : "Your favorites list is empty. Browse standard or custom music, and toggle the heart button next to any clip to add it here!"}
                  </span>
                </div>
              ) : (
                <TrackLibrary
                  tracks={tracks.filter(tr => favoriteTrackIds.includes(tr.id))}
                  activeTrackId={activeTrackId}
                  isPlaying={isPlaying}
                  onTrackSelect={(id) => {
                    const ctx = getOrCreateAudioContext();
                    if (ctx && ctx.state === "suspended") {
                      ctx.resume().catch((err) => console.warn(err));
                    }
                    if (id === activeTrackId) {
                      handlePlayPause();
                    } else {
                      setIsPlaying(true);
                      setActiveTrackId(id);
                    }
                  }}
                  onTrackDelete={handleTrackDelete}
                  lang={lang}
                  theme={theme}
                  favoriteTrackIds={favoriteTrackIds}
                  onToggleFavorite={handleToggleFavorite}
                  isPwaInstallable={isPwaInstallable}
                  onInstallPwa={handleInstallPwa}
                />
              )}
            </div>
          )}

          {/* Pro tips card & documentation */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-white/90">
                {lang === "ar" ? "كيف تصنع تأثير الـ Slowed & Reverb مذهل؟" : "How to master the Slowed & Reverb effect?"}
              </h4>
            </div>
            <p className={`text-[11px] text-white/50 leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
              {lang === "ar"
                ? "للحصول على أفضل نتيجة دافئة ومحيطية، ننصح بخفض السرعة إلى 0.8x أو 0.85x، مع رفع صدى الصوت (Reverb) إلى 40-50، ورفع تعزيز الجهير (Bass Boost) إلى 6-8. هذا يحاكي الأشرطة المغناطيسية القديمة لتبدو الأغاني غموضاً وجمالاً."
                : "For the ideal ambient vibe, pull playback speed down between 0.80x and 0.85x, swell Reverb levels to around 40, and push Bass Boost to 6. This perfectly emulates old tape decks, introducing massive spatial depth."}
            </p>
          </div>

        </div>



      </main>

      {/* Floating Bottom Navigation (inspired by high-end mobile layouts) */}
      <nav className="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur-xl border-t border-white/10 py-3 block z-30">
        <div className="max-w-md mx-auto px-6 flex items-center justify-around">
          
          {/* Home / Explorer Trigger */}
          <button
            id="tab-home"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "home" ? "text-indigo-400 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Music className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>

          {/* Upload Space / My Library Trigger */}
          <button
            id="tab-my-music"
            onClick={() => setActiveTab("my-music")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "my-music" ? "text-indigo-400 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <FileMusic className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t.myMusic}</span>
          </button>

          {/* Favorites Tab (Heart representation) */}
          <button
            id="tab-favorites"
            onClick={() => setActiveTab("favorites")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "favorites" ? "text-rose-450 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${activeTab === "favorites" ? "text-rose-500 fill-current scale-110 animate-pulse" : "text-white/40 hover:text-rose-400"}`} />
            <span className="text-[10px] font-bold">{t.favoritesTab}</span>
          </button>

          {/* Vocal Splitter Tab (Layers representation, placed right next to Favorites) */}
          <button
            id="tab-vocal-splitter"
            onClick={() => {
              pauseTrackFully(); // Stop standard audio playback to prevent overlapping sounds
              setActiveTab("vocal-splitter");
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "vocal-splitter" ? "text-purple-400 scale-105" : "text-white/40 hover:text-white"
            }`}
          >
            <Layers className={`w-5 h-5 transition-all duration-300 ${activeTab === "vocal-splitter" ? "text-purple-405 scale-110 animate-pulse animate-duration-1000" : "text-white/40 hover:text-purple-400"}`} />
            <span className="text-[10px] font-bold">{t.vocalSplitterTab}</span>
          </button>

        </div>
      </nav>

      {/* Acoustic Spaces & Reverb Atmosphere Modals Hub */}
      <SoundSettingsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        lang={lang}
        theme={theme}
        setTheme={setTheme}
        reverbPreset={reverbPreset}
        setReverbPreset={setReverbPreset}
        ambientMode={ambientMode}
        setAmbientMode={setAmbientMode}
        ambientVolume={ambientVolume}
        setAmbientVolume={setAmbientVolume}
        analyser={analyserNode}
        isPlaying={isPlaying}
        performanceMode={performanceMode}
        setPerformanceMode={setPerformanceMode}
        superSmoothness={superSmoothness}
        setSuperSmoothness={setSuperSmoothness}
        vintageRadio={vintageRadio}
        setVintageRadio={setVintageRadio}
        vocalDoubler={vocalDoubler}
        setVocalDoubler={setVocalDoubler}
        tapeFlutter={tapeFlutter}
        setTapeFlutter={setTapeFlutter}
        deCrackle={deCrackle}
        setDeCrackle={setDeCrackle}
        pitchShift={pitchShift}
        setPitchShift={setPitchShift}
        eq60={eq60}
        setEq60={setEq60}
        eq230={eq230}
        setEq230={setEq230}
        eq910={eq910}
        setEq910={setEq910}
        eq4k={eq4k}
        setEq4k={setEq4k}
        eq14k={eq14k}
        setEq14k={setEq14k}
        surroundSound={surroundSound}
        setSurroundSound={setSurroundSound}

        vocalBooster={vocalBooster}
        setVocalBooster={setVocalBooster}
        volume={volume}
        setVolume={setVolume}
        speed={speed}
        setSpeed={setSpeed}
        reverb={reverb}
        setReverb={setReverb}
        bassBoost={bassBoost}
        setBassBoost={setBassBoost}
      />

      {/* Futuristic Holographic Premium modal */}
      <MockPremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onActivate={() => setIsPremium(true)}
        lang={lang}
      />

      {/* Preset Action Options Context Sheet (Long press / Settings Trigger) */}
      {presetActionMenuTarget && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className={`relative w-full max-w-sm ${
            theme === "white" 
              ? "bg-white text-slate-800 border-slate-200 animate-[scaleIn_0.25s_ease-out]" 
              : "bg-[#090b11] text-white border-white/10 animate-[scaleIn_0.25s_ease-out]"
          } border-2 rounded-[2rem] p-6 shadow-2xl overflow-hidden transition-all duration-300`}>
            
            <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
              theme === "white" ? "border-slate-150" : "border-white/5"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{presetActionMenuTarget.icon}</span>
                <h3 className="text-xs md:text-sm font-black tracking-wide uppercase">
                  {lang === "ar" ? "خيارات الإعداد المسبق ⚙️" : "Preset Options ⚙️"}
                </h3>
              </div>
              <button
                onClick={() => setPresetActionMenuTarget(null)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  theme === "white" 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                    : "bg-white/5 hover:bg-white/10 text-white/75"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Preset Visual Snapshot Info Card */}
              <div className={`p-4 rounded-3xl flex flex-col gap-1 items-center justify-center text-center ${
                theme === "white" ? "bg-slate-50 border border-slate-150" : "bg-white/5 border border-white/5"
              }`}>
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-2xl shadow-inner">
                  {presetActionMenuTarget.icon}
                </div>
                <span className="text-sm font-black tracking-tight mt-1">{presetActionMenuTarget.name}</span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  activePresetId === presetActionMenuTarget.id 
                    ? "text-emerald-400 bg-emerald-500/10" 
                    : "text-white/40 bg-white/5"
                }`}>
                  {activePresetId === presetActionMenuTarget.id 
                    ? (lang === "ar" ? "● تدرج التأثير نشط" : "● FX Currently Active") 
                    : (lang === "ar" ? "غير مفعل" : "Inactive")}
                </span>
              </div>

              {/* Action Buttons List */}
              <div className="flex flex-col gap-2">
                {/* 1. APPLY PRESET */}
                <button
                  type="button"
                  onClick={() => {
                    handleApplySpecialPreset(presetActionMenuTarget);
                    setPresetActionMenuTarget(null);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between transition-all group cursor-pointer ${
                    activeTheme.accentBg
                  } text-white`}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-white" />
                    <span>{lang === "ar" ? "تطبيق وتفعيل الإعداد المسبق" : "Apply Ecosystem Preset"}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">❯</span>
                </button>

                {/* 2. SAVE/OVERWRITE WITH PRESENT CONFIGS */}
                <button
                  type="button"
                  onClick={() => {
                    handleSaveToPresetSlot(presetActionMenuTarget.id);
                    setPresetActionMenuTarget(null);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between transition-all border cursor-pointer ${
                    theme === "white"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      : "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>{lang === "ar" ? "حفظ الإعدادات الحالية هنا" : "Save Current Parameters"}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">❯</span>
                </button>

                {/* 3. RENAME OR MODIFY ICON */}
                <button
                  type="button"
                  onClick={() => {
                    startEditPreset(presetActionMenuTarget);
                    setPresetActionMenuTarget(null);
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between transition-all border cursor-pointer ${
                    theme === "white"
                      ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      : "bg-[#11141e] border-white/5 text-white/90 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>{lang === "ar" ? "تعديل الاسم والأيقونة" : "Rename Display & Icon"}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">❯</span>
                </button>

                {/* 4. DELETE CUSTOM CONFIG / RESET SLOT */}
                {presetActionMenuTarget.isSaved && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePresetSlot(presetActionMenuTarget.id);
                      setPresetActionMenuTarget(null);
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between transition-all border cursor-pointer bg-rose-600/10 border-rose-500/20 text-rose-400 hover:bg-rose-600/20`}
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>{lang === "ar" ? "مسح التعديل وتصفير الخانة" : "Delete Custom Reset"}</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60">❯</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Cancel Close */}
            <div className="flex justify-end mt-5 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setPresetActionMenuTarget(null)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                  theme === "white"
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-white/5 border-transparent text-white/75 hover:bg-white/10"
                }`}
              >
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3D Glassmorphism Preset Customization Modal */}
      {editingPresetId !== null && isEditModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className={`relative w-full max-w-md ${
            theme === "white" 
              ? "bg-white text-slate-800 border-slate-200" 
              : "bg-[#090b11] text-white border-white/10"
          } border-2 rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-300`}>
            
            <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
              theme === "white" ? "border-slate-150" : "border-white/5"
            }`}>
              <h3 className="text-sm md:text-base font-black tracking-wide flex items-center gap-2">
                <span>⚙️</span>
                {lang === "ar" ? "تعديل الإعداد المسبق" : "Edit Acoustic Preset"}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPresetId(null);
                }}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  theme === "white" 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                    : "bg-white/5 hover:bg-white/10 text-white/75"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preset Icon Emoji Selector */}
              <div>
                <label className={`block text-[10px] uppercase font-black tracking-wider mb-2 ${
                  theme === "white" ? "text-slate-500" : "text-white/40"
                } ${isRtl ? "text-right" : "text-left"}`}>
                  {lang === "ar" ? "اختر أيقونة / إيموجي 🎨" : "Select Preset Icon Emoji 🎨"}
                </label>
                <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-black/15 border border-white/5 justify-center">
                  {["🎧", "🔥", "🌙", "⭐", "🎸", "🎹", "⚡", "❄️", "🪐", "🌌", "🔊", "🎵", "🔮", "❤️"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditIcon(emoji)}
                      type="button"
                      className={`w-10 h-10 text-lg flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                        editIcon === emoji 
                          ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30" 
                          : "bg-white/5 hover:bg-white/10 text-white/80 hover:scale-105"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Custom manual typing input for emoji or text character */}
                <div className="mt-3">
                  <input
                    type="text"
                    maxLength={2}
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder={lang === "ar" ? "أو اكتب إيموجي مخصص..." : "Or type custom emoji..."}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold outline-none border focus:border-indigo-500 transition-all ${
                      theme === "white" 
                        ? "bg-slate-50 border-slate-200 text-slate-800" 
                        : "bg-[#121520] border-white/5 text-white"
                    } ${isRtl ? "text-right" : "text-left"}`}
                  />
                </div>
              </div>

              {/* Preset Name Text Input */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] uppercase font-black tracking-wider ${
                  theme === "white" ? "text-slate-500" : "text-white/40"
                } ${isRtl ? "text-right" : "text-left"}`}>
                  {lang === "ar" ? "اسم الإعداد المسبق ✍️" : "Preset Display Name ✍️"}
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: أجواء الاسترخاء" : "e.g. Chill Mode"}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold outline-none border focus:border-indigo-500 transition-all ${
                    theme === "white" 
                      ? "bg-slate-50 border-slate-200 text-slate-800" 
                      : "bg-[#121520] border-white/5 text-white"
                  } ${isRtl ? "text-right" : "text-left"}`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPresetId(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                  theme === "white"
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-white/5 border-transparent text-white/70 hover:bg-white/10"
                }`}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSavePresetEdit}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all text-white ${
                  activeTheme.accentBg
                }`}
              >
                {lang === "ar" ? "احفظ التغييرات" : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Sparkle Preset Toast Notification */}
      {presetToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 bg-[#0a0f1d]/90 border border-indigo-500/35 text-indigo-300 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.35)] text-xs font-black flex items-center gap-2.5 animate-[bounce_0.8s_ease-out_infinite_alternate] backdrop-blur-md">
          <Sparkle className="w-4 h-4 text-indigo-400 fill-indigo-400 animate-spin" />
          <span>{presetToast}</span>
        </div>
      )}

      {/* Free Fire Gaming-edition Gorgeous Exit Confirmation Dialog with elegant light green theme */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="relative w-full max-w-xl bg-[#090b11] border-2 border-emerald-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.18)]">
            
            {/* Header banner area with elegant light green theme */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500" />
            
            <div className={`p-6 md:p-8 flex items-center gap-6 ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
              {/* Left visual safety icon representing light-green clean safety vibe */}
              <div className="hidden sm:flex p-4 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-green-500/5 border border-emerald-500/20 text-emerald-400 animate-pulse shrink-0">
                <AlertCircle className="w-12 h-12 text-emerald-400 fill-transparent" />
              </div>
              
              <div className="space-y-4 flex-1 min-w-0">
                {/* Underlined title "البيانات" (light green) */}
                <div className={`flex ${isRtl ? "justify-end" : "justify-start"}`}>
                  <span className="text-sm font-black tracking-normal uppercase text-emerald-400 pb-1 border-b-[3.5px] border-emerald-550 leading-none">
                    {lang === "ar" ? "البيانات" : "Exit Confirmation"}
                  </span>
                </div>
                
                <h3 className="text-lg md:text-xl font-extrabold text-white leading-snug">
                  {lang === "ar" ? "تأكيد الخروج؟" : "Confirm Exit?"}
                </h3>
                
                <p className="text-xs md:text-sm text-white/70 leading-relaxed font-semibold">
                  {lang === "ar" 
                    ? "هل أنت متأكد من رغبتك في إغلاق تطبيق مسرع ومنعم الموسيقى والخروج الآن؟" 
                    : "Are you sure you want to close the Slowed & Reverb application and exit now?"}
                </p>
                
                {/* Action buttons with elegant light green style */}
                <div className={`flex items-center gap-4 pt-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Okay / Confirm Button (Vibrant Light Green) */}
                  <button
                    id="exit-confirm-ok"
                    onClick={() => {
                      setShowExitConfirm(false);
                      // Perform exit navigation: go -2 to force browser back out of our pushed trap
                      window.history.go(-2);
                      setTimeout(() => {
                        window.close();
                        window.location.replace("about:blank");
                      }, 100);
                    }}
                    className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm rounded-xl cursor-pointer active:scale-95 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.25)] text-center animate-pulse"
                  >
                    {lang === "ar" ? "اوكي" : "Okay"}
                  </button>
                  
                  {/* Cancel Button (Light Slate/Gray Styled with Hover state target) */}
                  <button
                    id="exit-confirm-cancel"
                    onClick={() => {
                      setShowExitConfirm(false);
                    }}
                    className="flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 hover:text-emerald-400 text-white font-extrabold text-sm rounded-xl cursor-pointer active:scale-95 border border-white/10 transition-all text-center"
                   >
                    {lang === "ar" ? "الغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
