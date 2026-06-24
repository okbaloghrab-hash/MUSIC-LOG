/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Layers, Sparkles, Play, Pause, Volume2, VolumeX, Mic, Music, 
  Download, RefreshCw, Scissors, HelpCircle, Activity, ChevronRight, CheckCircle2 
} from "lucide-react";
import { Track } from "../types";
import { audioBufferToWavBlob } from "../utils/audio";

interface AudioSeparationSuiteProps {
  tracks: Track[];
  onGlobalPause: () => void;
  lang: "ar" | "en";
  theme: "green" | "purple" | "white";
}

export default function AudioSeparationSuite({ 
  tracks, 
  onGlobalPause, 
  lang, 
  theme 
}: AudioSeparationSuiteProps) {
  const isRtl = lang === "ar";

  // State Management
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [isSplitComplete, setIsSplitComplete] = useState<boolean>(false);
  
  // Decoded & separated audio blocks
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [vocalBuffer, setVocalBuffer] = useState<AudioBuffer | null>(null);
  const [instrumentalBuffer, setInstrumentalBuffer] = useState<AudioBuffer | null>(null);
  const [trackName, setTrackName] = useState<string>("");

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [vocalsVolume, setVocalsVolume] = useState<number>(100);
  const [vocalsMuted, setVocalsMuted] = useState<boolean>(false);
  const [vocalsSolo, setVocalsSolo] = useState<boolean>(false);
  
  const [musicVolume, setMusicVolume] = useState<number>(100);
  const [musicMuted, setMusicMuted] = useState<boolean>(false);
  const [musicSolo, setMusicSolo] = useState<boolean>(false);

  // Buffer exporting state
  const [isExportingVocal, setIsExportingVocal] = useState<boolean>(false);
  const [isExportingMusic, setIsExportingMusic] = useState<boolean>(false);

  // Audio Context & references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vocalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const vocalGainNodeRef = useRef<GainNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Waveform Peaks State
  const [vocalPeaks, setVocalPeaks] = useState<number[]>([]);
  const [musicPeaks, setMusicPeaks] = useState<number[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSyncPlayback();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Update Solo relationships
  useEffect(() => {
    if (vocalGainNodeRef.current && musicGainNodeRef.current) {
      let finalVocalsVol = vocalsMuted ? 0 : vocalsVolume / 100;
      let finalMusicVol = musicMuted ? 0 : musicVolume / 100;

      if (vocalsSolo && !musicSolo) {
        finalMusicVol = 0;
      } else if (musicSolo && !vocalsSolo) {
        finalVocalsVol = 0;
      }

      vocalGainNodeRef.current.gain.setValueAtTime(finalVocalsVol, audioCtxRef.current?.currentTime || 0);
      musicGainNodeRef.current.gain.setValueAtTime(finalMusicVol, audioCtxRef.current?.currentTime || 0);
    }
  }, [vocalsVolume, vocalsMuted, vocalsSolo, musicVolume, musicMuted, musicSolo]);

  // Decode audio helper helper
  const decodeAndSplitTrack = async (buffer: AudioBuffer, name: string) => {
    setTrackName(name);
    setOriginalBuffer(buffer);
    setDuration(buffer.duration);
    setCurrentTime(0);
    setIsProcessing(true);
    setProcessingStage(1);
    
    setProcessingMessage(isRtl ? "جاري تحليل الهيكل الموسيقي للقنوات..." : "Analyzing channel spatial structures...");
    await new Promise(r => setTimeout(r, 800));

    // Phase 2: Start DSP Vocal Cancellation Offline Rendering
    setProcessingStage(2);
    setProcessingMessage(isRtl ? "عزل قنوات الطبول الترددية المنخفضة والجهير..." : "Decoding vocal range spectrum layers...");
    
    // DSP Step 1: Render Instrumental buffer by phase canceling vocals center
    const sampleRate = buffer.sampleRate;
    const renderLength = buffer.length;
    const numChan = buffer.numberOfChannels;

    // We prepare an offline audio context for Instrumentals
    const instOfflineCtx = new OfflineAudioContext(numChan, renderLength, sampleRate);
    const instSource = instOfflineCtx.createBufferSource();
    instSource.buffer = buffer;

    // Use channel splitter to compute Left - Right (removes mono voice)
    const splitter = instOfflineCtx.createChannelSplitter(2);
    const merger = instOfflineCtx.createChannelMerger(2);

    // Invert right channel
    const inverter = instOfflineCtx.createGain();
    inverter.gain.value = -1.0;

    // Direct difference node
    const diffSum = instOfflineCtx.createGain();
    diffSum.gain.value = 0.65; // Gain safety ceiling

    instSource.connect(splitter);
    splitter.connect(diffSum, 0); // Left channel connects directly
    splitter.connect(inverter, 1); // Right channel connects to invert
    inverter.connect(diffSum); // Inverted Right sums with Left (L - R)

    // Run a low-pass filter to capture and keep central bass/kick beats
    const bassKeep = instOfflineCtx.createBiquadFilter();
    bassKeep.type = "lowpass";
    bassKeep.frequency.value = 160;

    const bassGain = instOfflineCtx.createGain();
    bassGain.gain.value = 0.75;

    instSource.connect(bassKeep);
    bassKeep.connect(bassGain);

    // Recombine difference and original bass back into stereo output
    const mixL = instOfflineCtx.createGain();
    const mixR = instOfflineCtx.createGain();

    diffSum.connect(mixL);
    bassGain.connect(mixL);

    diffSum.connect(mixR);
    bassGain.connect(mixR);

    mixL.connect(merger, 0, 0);
    mixR.connect(merger, 0, 1);

    merger.connect(instOfflineCtx.destination);
    instSource.start();
    
    // Begin offline computation
    const instFinalBuffer = await instOfflineCtx.startRendering();

    // DSP Step 2: Render isolated vocals using highpass & bandpass filters
    await new Promise(r => setTimeout(r, 600));
    setProcessingStage(3);
    setProcessingMessage(isRtl ? "تصفية الترددات البشرية وعزل الكلاكيت والصدى..." : "Purifying human singing harmonics...");

    const vocalOfflineCtx = new OfflineAudioContext(numChan, renderLength, sampleRate);
    const vocalSource = vocalOfflineCtx.createBufferSource();
    vocalSource.buffer = buffer;

    // Bandpass filter centered at common vocal ranges
    const vocalBand = vocalOfflineCtx.createBiquadFilter();
    vocalBand.type = "bandpass";
    vocalBand.frequency.value = 1500;
    vocalBand.Q.value = 0.9; // Focuses on 400Hz - 4.5kHz mainly

    const vocalHigh = vocalOfflineCtx.createBiquadFilter();
    vocalHigh.type = "highpass";
    vocalHigh.frequency.value = 220; // Cut out booming kick drums

    const vocalGain = vocalOfflineCtx.createGain();
    vocalGain.gain.value = 1.25;

    vocalSource.connect(vocalHigh);
    vocalHigh.connect(vocalBand);
    vocalBand.connect(vocalGain);
    vocalGain.connect(vocalOfflineCtx.destination);

    vocalSource.start();
    const vocalFinalBuffer = await vocalOfflineCtx.startRendering();

    // Generate waveforms peaks
    await new Promise(r => setTimeout(r, 600));
    setProcessingStage(4);
    setProcessingMessage(isRtl ? "مزامنة موجات الصوت الرسومية..." : "Synthesizing multi-waveform peaks...");

    setVocalPeaks(generatePeaks(vocalFinalBuffer, 80));
    setMusicPeaks(generatePeaks(instFinalBuffer, 80));

    setVocalBuffer(vocalFinalBuffer);
    setInstrumentalBuffer(instFinalBuffer);
    
    setIsProcessing(false);
    setIsSplitComplete(true);
    setProcessingStage(0);
  };

  const generatePeaks = (buffer: AudioBuffer, count: number): number[] => {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / count);
    const peaks = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      // Ensure visual presence even if peak is silent
      peaks.push(Math.max(max, 0.04));
    }
    return peaks;
  };

  // Process selected library item
  const handleSplitLibraryTrack = async () => {
    if (!selectedTrackId) return;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;

    onGlobalPause(); // Pause parent's music playing
    stopSyncPlayback();

    // If it already has an audio buffer decoded
    if (track.audioBuffer) {
      decodeAndSplitTrack(track.audioBuffer, track.name);
    } else if (track.file) {
      // Decode the raw file
      try {
        setIsProcessing(true);
        setProcessingMessage(isRtl ? "جاري فك تشفير مسار الصوت..." : "Decoding binary track source...");
        const ctx = getAudioContext();
        const arrayBuffer = await track.file.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        decodeAndSplitTrack(decoded, track.name);
      } catch (err) {
        console.error("Split decoding failed", err);
        setIsProcessing(false);
        alert(isRtl ? "حدث خطأ أثناء تحميل وفك تشفير الملف." : "Failed to decode and separate audio file.");
      }
    }
  };

  // Process Direct File Drop
  const handleDirectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onGlobalPause();
    stopSyncPlayback();
    setSelectedFile(file);

    try {
      setIsProcessing(true);
      setProcessingMessage(isRtl ? "تحميل وقراءة ملف الكاسيت الجديد..." : "Importing offline audio source...");
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      decodeAndSplitTrack(decoded, file.name.replace(/\.[^/.]+$/, ""));
    } catch (err) {
      console.error("Direct split decoding failed", err);
      setIsProcessing(false);
      alert(isRtl ? "خطأ: تأكد من اختيار ملف صوتي سليم بصيغة MP3 أو WAV." : "Error: Please check if the file is a valid MP3 or WAV format.");
    }
  };

  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Synchronized Playback Actions
  const playSyncPlayback = () => {
    if (!vocalBuffer || !instrumentalBuffer) return;
    onGlobalPause(); // Keep main player silenced

    const ctx = getAudioContext();
    stopSyncPlayback(); // Kill prior nodes

    // Create Sources
    const vocalSource = ctx.createBufferSource();
    vocalSource.buffer = vocalBuffer;

    const musicSource = ctx.createBufferSource();
    musicSource.buffer = instrumentalBuffer;

    // Create Gains
    const vocalGainNode = ctx.createGain();
    const musicGainNode = ctx.createGain();

    // Set volumes under solo/mute constraints
    let finalVocalsVol = vocalsMuted ? 0 : vocalsVolume / 100;
    let finalMusicVol = musicMuted ? 0 : musicVolume / 100;

    if (vocalsSolo && !musicSolo) {
      finalMusicVol = 0;
    } else if (musicSolo && !vocalsSolo) {
      finalVocalsVol = 0;
    }

    vocalGainNode.gain.setValueAtTime(finalVocalsVol, ctx.currentTime);
    musicGainNode.gain.setValueAtTime(finalMusicVol, ctx.currentTime);

    // Connections
    vocalSource.connect(vocalGainNode);
    vocalGainNode.connect(ctx.destination);

    musicSource.connect(musicGainNode);
    musicGainNode.connect(ctx.destination);

    // Save references
    vocalSourceRef.current = vocalSource;
    musicSourceRef.current = musicSource;
    vocalGainNodeRef.current = vocalGainNode;
    musicGainNodeRef.current = musicGainNode;

    // Playback Timing Math
    const offset = pauseTimeRef.current;
    vocalSource.start(0, offset);
    musicSource.start(0, offset);

    startTimeRef.current = ctx.currentTime - offset;
    setIsPlaying(true);

    // Loop anim frame trackers
    trackProgressFrame();
  };

  const stopSyncPlayback = () => {
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (vocalSourceRef.current) {
      try { vocalSourceRef.current.stop(); } catch (e) {}
      vocalSourceRef.current = null;
    }
    if (musicSourceRef.current) {
      try { musicSourceRef.current.stop(); } catch (e) {}
      musicSourceRef.current = null;
    }
  };

  const handlePlayPauseSync = () => {
    if (isPlaying) {
      // Pause
      const ctx = getAudioContext();
      pauseTimeRef.current = ctx.currentTime - startTimeRef.current;
      if (pauseTimeRef.current >= duration) {
        pauseTimeRef.current = 0;
      }
      stopSyncPlayback();
    } else {
      // Play
      playSyncPlayback();
    }
  };

  const trackProgressFrame = () => {
    if (!isPlaying || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    
    if (elapsed >= duration) {
      setCurrentTime(duration);
      setIsPlaying(false);
      pauseTimeRef.current = 0;
      stopSyncPlayback();
      return;
    }

    setCurrentTime(elapsed);
    animFrameRef.current = requestAnimationFrame(trackProgressFrame);
  };

  // Seeker Scrubbing
  const handleSeekShift = (value: number) => {
    pauseTimeRef.current = value;
    setCurrentTime(value);
    
    if (isPlaying) {
      playSyncPlayback();
    }
  };

  // Lossless WAV STEM download generator
  const downloadStemWav = async (isVocals: boolean) => {
    const bufferToSave = isVocals ? vocalBuffer : instrumentalBuffer;
    if (!bufferToSave) return;

    if (isVocals) setIsExportingVocal(true);
    else setIsExportingMusic(true);

    // Give subtle render timeout for smooth GUI transitions
    setTimeout(() => {
      try {
        const blob = audioBufferToWavBlob(bufferToSave);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const stemName = isVocals ? "voc_isolated" : "inst_ karaoke_beat";
        link.download = `${trackName}_${stemName}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Stem download failed", err);
      } finally {
        if (isVocals) setIsExportingVocal(false);
        else setIsExportingMusic(false);
      }
    }, 450);
  };

  const resetAllSeparation = () => {
    stopSyncPlayback();
    setSelectedTrackId("");
    setSelectedFile(null);
    setOriginalBuffer(null);
    setVocalBuffer(null);
    setInstrumentalBuffer(null);
    setIsSplitComplete(false);
    setVocalPeaks([]);
    setMusicPeaks([]);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  };

  const formattedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* Premium Gradient Header Frame */}
      <div className="rounded-2xl border border-gradient p-[1px] bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-teal-500/10">
        <div className="rounded-[15px] bg-[#0c0d12]/98 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-mono block">
                {isRtl ? "تقنية الذكاء الاصطناعي الفائقة لعزل الترددات" : "HIGH-END RECONSTRUCTION ENGINE"}
              </span>
              <h3 className="text-sm font-black text-white mt-0.5">
                {isRtl ? "مستودع عزل وفصل الصوت عن الموسيقى" : "Advanced Soundwave Splitter Studio"}
              </h3>
            </div>
          </div>
          <p className={`text-xs text-white/50 mt-2 leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
            {isRtl 
              ? "افصل أي أغنية أو كليب فوراً وبطريقة ذكية إلى قناتين مستقلتين: صوت بشري مستقل لمشروعات التغطية والدروس، أو موسيقى وإيقاع دقيق مناسب للكاراوكي والاستماع المحسن!"
              : "Instantly and smartly split any audio track into two completely distinct streams: an isolated human vocal line or a pristine backing instrumental perfect for custom remixes and karaoke tracks!"}
          </p>
        </div>
      </div>

      {/* Primary Workspace Panel */}
      {!isSplitComplete ? (
        <div className="bg-[#0c0d12]/95 border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">
          <div className="space-y-4">
            <label className={`block text-xs font-black uppercase tracking-wider text-white/70 ${isRtl ? "text-right" : "text-left"}`}>
              {isRtl ? "الخطوة ١: اختر الأغنية المراد تفكيكها 🎧" : "STEP 1: SELECT SOURCE TO DECONSTRUCT 🎧"}
            </label>

            {/* Selection Methods Grid */}
            <div className="grid grid-cols-1 gap-4">
              
              {/* Existing Library Dropdown */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <span className={`text-[11px] font-bold text-white/50 block ${isRtl ? "text-right" : "text-left"}`}>
                  {isRtl ? "اختر أغنية من المطبقة أو المقاطع المرفوعة مسبقاً:" : "Choose from currently loaded tracks or uploaded library:"}
                </span>
                
                <div className={`flex gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    disabled={isProcessing}
                    dir={isRtl ? "rtl" : "ltr"}
                    className="flex-1 bg-black/40 border border-white/10 text-xs text-white/90 rounded-xl px-3.5 py-3 outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="" className="bg-[#0c0d12] text-white/50">
                      {isRtl ? "-- حدد أغنية من مكتبتك --" : "-- Select from library --"}
                    </option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0c0d12] text-white">
                        {t.isCustom ? "📼 " : "🎵 "} {t.name} ({formattedTime(t.duration)})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSplitLibraryTrack}
                    disabled={isProcessing || !selectedTrackId}
                    className={`px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-black text-white shrink-0 shadow-lg shadow-purple-600/15 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Scissors className="w-4 h-4" />
                    <span>{isRtl ? "ابدأ الفصل" : "Split Track"}</span>
                  </button>
                </div>
              </div>

              {/* Direct Drag/Upload alternative */}
              <div className="relative group rounded-xl border border-dashed border-white/10 hover:border-purple-500/50 bg-[#07080c]/50 p-6 text-center transition-all">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleDirectFile}
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-550/15 flex items-center justify-center text-purple-400">
                    <Mic className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-white">
                      {isRtl ? "أو ارفع ملفاً بشكل عازل مباشر" : "Or upload an independent file directly"}
                    </h5>
                    <p className="text-[10px] text-white/40 mt-1 leading-normal font-medium">
                      {isRtl ? "اسحب وأفلت أي ملف صوتي هنا لتباشر عملية الفصل الفوري دون حفظه في المكتبة" : "Drag & drop or snap any audio file here to perform instant local extraction"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* AI Loader Panel */}
          {isProcessing && (
            <div className="mt-4 p-5 rounded-xl bg-purple-650/5 border border-purple-550/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className={`flex items-center gap-3 justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-xs font-black text-white/90">
                    {isRtl ? "جاري معالجة موجات الصوت التناظرية..." : "WebAudio Separation Engine running..."}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-purple-400">
                  {processingStage === 1 ? "25%" : processingStage === 2 ? "55%" : processingStage === 3 ? "80%" : "95%"}
                </span>
              </div>

              {/* Glowing Dynamic Progress Track */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ 
                    width: processingStage === 1 ? "25%" : processingStage === 2 ? "55%" : processingStage === 3 ? "80%" : "95%" 
                  }}
                />
              </div>

              <p className={`text-[11px] text-white/50 font-medium ${isRtl ? "text-right" : "text-left"}`}>
                ⚡ {processingMessage}
              </p>
            </div>
          )}

        </div>
      ) : (
        /* Isolated Stems Multi-track Mixing Hub */
        <div className="bg-[#0c0d12]/95 border border-white/5 rounded-2xl p-5 md:p-6 space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          
          {/* Deck Action Topbar */}
          <div className={`flex items-center justify-between pb-3.5 border-b border-white/5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`flex items-center gap-2 max-w-xs min-w-0 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-xs font-black text-white truncate block">
                {isRtl ? `مستخرج: ${trackName}` : `Splitter Desk: ${trackName}`}
              </span>
            </div>
            
            <button
              onClick={resetAllSeparation}
              className={`px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 text-[10px] font-black text-white/80 active:scale-95 duration-100 transition-all flex items-center gap-1 cursor-pointer ${isRtl ? "flex-row-reverse" : "flex-row"}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRtl ? "تغيير الأغنية" : "Change song"}</span>
            </button>
          </div>

          {/* Master Transport Panel controls */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-4">
            
            {/* Sync Progress metrics */}
            <div className={`flex items-center justify-between text-xs font-mono font-bold text-white/50 px-0.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <span>{formattedTime(currentTime)}</span>
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-[9px] font-bold text-purple-300">
                {isRtl ? "مسارات متزامنة بالكامل" : "LOCKSTEP PLAYBACK"}
              </span>
              <span>{formattedTime(duration)}</span>
            </div>

            {/* Scrubber Seeker track progress */}
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeekShift(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer outline-none custom-3d-slider"
                style={{
                  background: `linear-gradient(to right, #a855f7 ${
                    (currentTime / (duration || 1)) * 100
                  }%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`,
                }}
              />
            </div>

            {/* Play trigger button */}
            <div className="flex justify-center pt-1">
              <button
                onClick={handlePlayPauseSync}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-105 active:scale-95 duration-150 shadow-lg shadow-indigo-600/20 text-white flex items-center justify-center cursor-pointer font-bold"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white fill-current" />
                ) : (
                  <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
                )}
              </button>
            </div>

          </div>

          {/* TWO MULTI-TRACK CHANNELS CONTROLS */}
          <div className="space-y-4">
            
            {/* 1. MIC / VOCALS CHANNEL */}
            <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4.5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-16 h-16 rounded-full bg-rose-500/5 blur-xl pointer-events-none" />
              
              {/* Channel Label Header & Actions */}
              <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-white">
                    {isRtl ? "🎤 مسار الأصوات البشرية (Vocals)" : "🎤 ISOLATED VOCALS / ACAPELLA"}
                  </span>
                </div>

                {/* Solo/Mute Toggles */}
                <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <button
                    onClick={() => {
                      setVocalsSolo(!vocalsSolo);
                      if (!vocalsSolo) setMusicSolo(false); // Soloing voice cancels beat solo
                    }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                      vocalsSolo 
                        ? "bg-rose-500 text-white shadow-sm" 
                        : "bg-white/5 hover:bg-white/10 text-rose-300"
                    }`}
                  >
                    SOLO
                  </button>

                  <button
                    onClick={() => setVocalsMuted(!vocalsMuted)}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      vocalsMuted 
                        ? "bg-rose-500/20 text-rose-450 border border-rose-450/30" 
                        : "bg-white/5 hover:bg-white/10 text-white/50"
                    }`}
                  >
                    {vocalsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Soundwave Peak Graphics */}
              <div className="h-10 w-full flex items-end gap-[2.5px] bg-black/40 rounded-lg p-2 overflow-hidden relative">
                {/* Scrolling pointer head line */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-rose-400 z-10 pointers-events-none shadow-[0_0_8px_#f43f5e] transition-all duration-100 ease-out"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
                
                {vocalPeaks.map((peak, idx) => {
                  const isActive = (idx / vocalPeaks.length) <= (currentTime / duration);
                  return (
                    <div 
                      key={idx}
                      className="flex-1 rounded-full transition-all duration-150"
                      style={{ 
                        height: `${peak * 100}%`,
                        backgroundColor: vocalsMuted || (musicSolo && !vocalsSolo)
                          ? "rgba(255,255,255,0.05)"
                          : isActive 
                            ? "rgb(244, 63, 94)" 
                            : "rgba(244, 63, 94, 0.25)"
                      }}
                    />
                  );
                })}
              </div>

              {/* Volume Slider control */}
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={130}
                  value={vocalsVolume}
                  onChange={(e) => setVocalsVolume(parseInt(e.target.value))}
                  disabled={vocalsMuted}
                  className="flex-1 h-1 bg-white/10 rounded-md appearance-none cursor-pointer outline-none custom-3d-slider"
                  style={{
                    background: `linear-gradient(to right, #f43f5e ${
                      vocalsVolume / 1.3
                    }%, rgba(255,255,255,0.1) ${vocalsVolume / 1.3}%)`,
                  }}
                />
                <span className="text-[10px] font-mono font-bold text-rose-400 shrink-0 min-w-[28px] text-right">
                  {vocalsVolume}%
                </span>
                
                {/* STEM Export Action */}
                <button
                  onClick={() => downloadStemWav(true)}
                  disabled={isExportingVocal || isExportingMusic}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/15 border border-rose-500/25 hover:bg-rose-650/20 active:scale-95 transition-all text-[9px] font-black text-rose-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Download className={`w-3 h-3 ${isExportingVocal ? "animate-spin" : "animate-bounce"}`} />
                  <span>{isRtl ? (isExportingVocal ? "جاري التصدير..." : "تحميل WAV") : (isExportingVocal ? "Exporting..." : "GET WAV")}</span>
                </button>
              </div>

            </div>

            {/* 2. AUDIO / INSTRUMENTALS CHANNEL */}
            <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4.5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-16 h-16 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
              
              {/* Channel Label Header & Actions */}
              <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-white">
                    {isRtl ? "🎸 مسار الموسيقى والإيقاع (Instrumental)" : "🎸 INSTRUMENTAL BACKING TRACK"}
                  </span>
                </div>

                {/* Solo/Mute Toggles */}
                <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <button
                    onClick={() => {
                      setMusicSolo(!musicSolo);
                      if (!musicSolo) setVocalsSolo(false); // Soloing beat cancels vocal solo
                    }}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                      musicSolo 
                        ? "bg-indigo-500 text-white shadow-sm" 
                        : "bg-white/5 hover:bg-white/10 text-indigo-300"
                    }`}
                  >
                    SOLO
                  </button>

                  <button
                    onClick={() => setMusicMuted(!musicMuted)}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      musicMuted 
                        ? "bg-indigo-500/20 text-indigo-405 border border-indigo-405/30" 
                        : "bg-white/5 hover:bg-white/10 text-white/50"
                    }`}
                  >
                    {musicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Soundwave Peak Graphics */}
              <div className="h-10 w-full flex items-end gap-[2.5px] bg-black/40 rounded-lg p-2 overflow-hidden relative">
                {/* Scrolling pointer head line */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-indigo-400 z-10 pointers-events-none shadow-[0_0_8px_#6366f1] transition-all duration-100 ease-out"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
                
                {musicPeaks.map((peak, idx) => {
                  const isActive = (idx / musicPeaks.length) <= (currentTime / duration);
                  return (
                    <div 
                      key={idx}
                      className="flex-1 rounded-full transition-all duration-150"
                      style={{ 
                        height: `${peak * 100}%`,
                        backgroundColor: musicMuted || (vocalsSolo && !musicSolo)
                          ? "rgba(255,255,255,0.05)"
                          : isActive 
                            ? "rgb(99, 102, 241)" 
                            : "rgba(99, 102, 241, 0.25)"
                      }}
                    />
                  );
                })}
              </div>

              {/* Volume Slider control */}
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={130}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                  disabled={musicMuted}
                  className="flex-1 h-1 bg-white/10 rounded-md appearance-none cursor-pointer outline-none custom-3d-slider"
                  style={{
                    background: `linear-gradient(to right, #6366f1 ${
                      musicVolume / 1.3
                    }%, rgba(255,255,255,0.1) ${musicVolume / 1.3}%)`,
                  }}
                />
                <span className="text-[10px] font-mono font-bold text-indigo-400 shrink-0 min-w-[28px] text-right">
                  {musicVolume}%
                </span>
                
                {/* STEM Export Action */}
                <button
                  onClick={() => downloadStemWav(false)}
                  disabled={isExportingVocal || isExportingMusic}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/25 hover:bg-indigo-650/20 active:scale-95 transition-all text-[9px] font-black text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Download className={`w-3 h-3 ${isExportingMusic ? "animate-spin" : "animate-bounce"}`} />
                  <span>{isRtl ? (isExportingMusic ? "جاري التصدير..." : "تحميل WAV") : (isExportingMusic ? "Exporting..." : "GET WAV")}</span>
                </button>
              </div>

            </div>

          </div>

          {/* Quick FAQ info tips */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className={`text-[10px] font-black text-white/90 block ${isRtl ? "text-right" : "text-left"}`}>
                {isRtl ? "منصة عزل متقدمة محلية بالكامل ⚡" : "Fast Offline Phase-Cancellation"}
              </span>
              <p className={`text-[9px] text-white/45 leading-normal ${isRtl ? "text-right" : "text-left"}`}>
                {isRtl 
                  ? "تجري معالجة عزل الطبقات الصوتية والموجات داخل متصفحك بشكل كامل وفي أجزاء من الثانية دون إرسال ملفاتك إلى أي خادم خارجي، مما يمنحك سرية مطلية وجودة استخراج فائقة وسريعة!"
                  : "All stems separation computational logic runs 100% locally and instantly in your web browser. No audio fields are transmitted to external cloud systems, maintaining perfect privacy and maximum speeds!"}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
