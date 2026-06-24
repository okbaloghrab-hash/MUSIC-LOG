/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Activity, Layers } from "lucide-react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  lang: "ar" | "en";
}

const themes = {
  aurora: {
    wave1: "rgb(129, 140, 248)",      // Indigo
    wave1Glow: "rgba(99, 102, 241, 0.8)",
    wave2: "rgba(168, 85, 247, 0.6)",  // Purple
    standby1: "rgba(99, 102, 241, 0.4)",
    standby1Glow: "rgba(99, 102, 241, 0.3)",
    standby2: "rgba(168, 85, 247, 0.25)",
    barsTop: "#a855f7",               // Purple
    barsMid: "#6366f1",               // Indigo
    barsBase: "rgba(99, 102, 241, 0.1)",
  },
  sunset: {
    wave1: "rgb(244, 63, 94)",        // Rose
    wave1Glow: "rgba(244, 63, 94, 0.8)",
    wave2: "rgba(245, 158, 11, 0.6)",  // Amber / Orange
    standby1: "rgba(244, 63, 94, 0.4)",
    standby1Glow: "rgba(244, 63, 94, 0.3)",
    standby2: "rgba(245, 158, 11, 0.25)",
    barsTop: "#f43f5e",               // Rose
    barsMid: "#f59e0b",               // Amber
    barsBase: "rgba(244, 63, 94, 0.1)",
  },
  forest: {
    wave1: "rgb(16, 185, 129)",       // Emerald
    wave1Glow: "rgba(16, 185, 129, 0.8)",
    wave2: "rgba(14, 165, 233, 0.6)",  // Sky
    standby1: "rgba(16, 185, 129, 0.4)",
    standby1Glow: "rgba(16, 185, 129, 0.3)",
    standby2: "rgba(14, 165, 233, 0.25)",
    barsTop: "#10b981",               // Emerald
    barsMid: "#0ea5e9",               // Sky
    barsBase: "rgba(16, 185, 129, 0.1)",
  },
};

export default function AudioVisualizer({ analyser, isPlaying, lang }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visMode, setVisMode] = useState<"waveform" | "freq">("waveform");
  const [visTheme, setVisTheme] = useState<"aurora" | "sunset" | "forest">("aurora");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize observer to ensure responsive canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 600) * window.devicePixelRatio;
      canvas.height = (rect?.height || 160) * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with very slight alpha for a glowing trails motion-blur effect
      ctx.fillStyle = "rgba(10, 11, 16, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines in the background
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 0.5;
      
      // Horizontal mid line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // vertical lines
      const gridSpacing = width / 10;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const activeThemeConfig = themes[visTheme];

      if (analyser && isPlaying) {
        if (visMode === "waveform") {
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 3;
          ctx.strokeStyle = activeThemeConfig.wave1;
          
          // Outer glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = activeThemeConfig.wave1Glow;

          ctx.beginPath();
          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // Normalized -1.0 to 1.0
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;

          // Double reflection wave with purple color
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = activeThemeConfig.wave2;
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = height / 2 + (v * height / 2 - height / 2) * -0.6; // Inverted smaller replica
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();

        } else {
          // Frequency Bars Mode
          analyser.getByteFrequencyData(dataArray);

          const barCount = Math.min(64, bufferLength);
          const barWidth = (width / barCount) * 0.75;
          const barSpacing = (width / barCount) * 0.25;
          
          ctx.shadowBlur = 8;
          ctx.shadowColor = activeThemeConfig.wave1Glow;

          for (let i = 0; i < barCount; i++) {
            // Skew frequency height to make cinematic spectrum
            let mag = dataArray[i];
            const barHeight = (mag / 255) * (height * 0.85);

            const x = i * (barWidth + barSpacing);
            const y = height - barHeight - 5;

            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, activeThemeConfig.barsTop);
            grad.addColorStop(0.5, activeThemeConfig.barsMid);
            grad.addColorStop(1, activeThemeConfig.barsBase);

            ctx.fillStyle = grad;
            
            // Round top of bars
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      } else {
        // Standby floating visual wave
        phase += 0.04;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = activeThemeConfig.standby1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeThemeConfig.standby1Glow;
        ctx.beginPath();

        const samples = 100;
        const step = width / samples;
        for (let i = 0; i <= samples; i++) {
          const x = i * step;
          const y = height / 2 + Math.sin(i * 0.15 + phase) * 12 * Math.sin(i * 0.03);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Secondary ambient wave in opposite direction
        ctx.strokeStyle = activeThemeConfig.standby2;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const x = i * step;
          const y = height / 2 + Math.sin(-i * 0.1 + phase * 0.7) * 8 * Math.cos(i * 0.04);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [analyser, isPlaying, visMode, visTheme]);

  const isRtl = lang === "ar";

  return (
    <div
      id="visualizer-card"
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group shadow-2xl w-full min-w-0"
    >
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-widest font-mono">
            {lang === "ar" ? "محلل الطيف المباشر" : "Live Frequency Matrix"}
          </span>
        </div>

        {/* Theme and Mode switchers right-aligned container */}
        <div className="flex items-center gap-3">
          {/* Theme Circles */}
          <div className="flex bg-black/40 border border-white/5 p-1 rounded-lg items-center gap-1.5 h-7">
            {[
              { id: "aurora", bg: "bg-indigo-500", border: "border-indigo-400" },
              { id: "sunset", bg: "bg-pink-500", border: "border-orange-400" },
              { id: "forest", bg: "bg-emerald-500", border: "border-teal-400" },
            ].map((theme) => (
              <button
                key={theme.id}
                id={`vis-theme-${theme.id}`}
                onClick={() => setVisTheme(theme.id as any)}
                title={theme.id}
                className={`w-3 h-3 rounded-full ${theme.bg} cursor-pointer transition-all duration-200 relative ${
                  visTheme === theme.id 
                    ? "scale-[1.2] ring-1 ring-white/95" 
                    : "opacity-45 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          {/* Mode Toggler */}
          <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg text-white/50 gap-0.5">
            <button
              id="toggle-vis-waveform"
              onClick={() => setVisMode("waveform")}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer h-6 ${
                visMode === "waveform"
                  ? "bg-white/10 text-indigo-400 border border-white/5"
                  : "hover:text-white/80"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[9px]">{lang === "ar" ? "موجي" : "Wave"}</span>
            </button>
            <button
              id="toggle-vis-freq"
              onClick={() => setVisMode("freq")}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer h-6 ${
                visMode === "freq"
                  ? "bg-white/10 text-indigo-400 border border-white/5"
                  : "hover:text-white/80"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[9px]">{lang === "ar" ? "أعمدة" : "Bars"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-32 md:h-36 bg-black/40 rounded-xl border border-white/5 overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {/* Subtle grid accent glow overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-indigo-950/20 via-transparent to-transparent opacity-40" />
      </div>
    </div>
  );
}
