/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon, Minus, Plus } from "lucide-react";

interface SliderControlProps {
  id: string;
  label: string;
  icon: LucideIcon;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string;
  onChange: (val: number) => void;
  lang: "ar" | "en";
  theme?: string;
}

export default function SliderControl({
  id,
  label,
  icon: Icon,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
  lang,
  theme = "black",
}: SliderControlProps) {
  const isRtl = lang === "ar";

  // Calculate percentage for gradient background
  const percentage = ((value - min) / (max - min)) * 100;

  // Plus and Minus increments helper
  const handleDecrement = () => {
    const newVal = Math.max(min, parseFloat((value - step).toFixed(2)));
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, parseFloat((value + step).toFixed(2)));
    onChange(newVal);
  };

  // Theme adaptations
  let accentColorHex = "#6366f1"; // Default purple-indigo
  let accentTextClass = "text-indigo-400";
  let btnClasses = "bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white";
  let containerClasses = "bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/10 shadow-lg hover:shadow-indigo-500/5 text-white";
  let iconContainerClasses = "bg-white/10 text-indigo-400";
  let valueClasses = "text-indigo-400 bg-white/5 border-white/10";
  let thumbClass = "[&::-webkit-slider-thumb]:bg-indigo-450";

  if (theme === "green") {
    accentColorHex = "#10b981"; // Emerald
    accentTextClass = "text-emerald-400";
    btnClasses = "bg-emerald-950/30 border-emerald-500/10 hover:bg-emerald-950/55 text-emerald-300 hover:text-emerald-105 active:scale-95";
    containerClasses = "bg-emerald-950/15 backdrop-blur-md border border-emerald-500/15 hover:border-emerald-500/30 hover:bg-emerald-950/25 shadow-lg text-emerald-50";
    iconContainerClasses = "bg-emerald-500/10 text-emerald-400";
    valueClasses = "text-emerald-400 bg-emerald-950/30 border-emerald-500/10";
    thumbClass = "[&::-webkit-slider-thumb]:bg-emerald-400";
  } else if (theme === "purple") {
    accentColorHex = "#d946ef"; // Fuchsia
    accentTextClass = "text-fuchsia-400";
    btnClasses = "bg-violet-950/30 border-violet-500/10 hover:bg-violet-950/60 text-violet-300 hover:text-violet-105 active:scale-95";
    containerClasses = "bg-violet-950/15 backdrop-blur-md border border-violet-500/15 hover:border-violet-500/30 hover:bg-violet-950/25 shadow-lg text-violet-50";
    iconContainerClasses = "bg-violet-550/10 text-fuchsia-400";
    valueClasses = "text-fuchsia-400 bg-violet-950/30 border-violet-500/10";
    thumbClass = "[&::-webkit-slider-thumb]:bg-fuchsia-400";
  } else if (theme === "white") {
    accentColorHex = "#4f46e5"; // Indigo light
    accentTextClass = "text-indigo-600";
    btnClasses = "bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-950 active:scale-95";
    containerClasses = "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50/50 text-slate-800";
    iconContainerClasses = "bg-slate-100 text-indigo-600";
    valueClasses = "text-indigo-600 bg-indigo-50 border-indigo-100";
    thumbClass = "[&::-webkit-slider-thumb]:bg-indigo-600";
  }

  return (
    <div
      id={`slider-container-${id}`}
      className={`${containerClasses} rounded-2xl p-4 md:p-5 flex flex-col gap-4.5 transition-all duration-300 group w-full min-w-0`}
    >
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`p-2 rounded-xl transition-all duration-300 shadow-md group-hover:scale-105 ${iconContainerClasses}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">
            {label}
          </span>
        </div>
        
        <span className={`px-3 py-1 text-xs md:text-sm font-bold font-mono border rounded-lg shadow-inner ${valueClasses}`}>
          {displayValue}
        </span>
      </div>

      {/* Slider range input wrapped with fine +/- adjusting buttons */}
      <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`} dir={isRtl ? "rtl" : "ltr"}>
        {/* Decrement Button (-) */}
        <button
          onClick={handleDecrement}
          aria-label="Decrease"
          className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${btnClasses}`}
        >
          <Minus className="w-4 h-4 shrink-0" />
        </button>

        {/* The Slider Range Input */}
        <div className="relative flex-1 flex items-center min-w-0" dir="ltr">
          <input
            id={`slider-input-${id}`}
            dir="ltr"
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, ${accentColorHex} ${percentage}%, ${theme === "white" ? "rgba(0,0,0,0.06)" : "rgba(255, 255, 255, 0.1)"} ${percentage}%)`,
            }}
            className="w-full h-2 rounded-lg cursor-pointer outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/30 custom-3d-slider"
          />
        </div>

        {/* Increment Button (+) */}
        <button
          onClick={handleIncrement}
          aria-label="Increase"
          className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${btnClasses}`}
        >
          <Plus className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
