import React, { useEffect, useState } from "react";
import { Music, Play, Sparkles, Volume2, Headphones } from "lucide-react";

interface SplashEntranceProps {
  onEnter: () => void;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
}

export default function SplashEntrance({ onEnter, lang, setLang }: SplashEntranceProps) {
  const [timeLeft, setTimeLeft] = useState(3.0);

  useEffect(() => {
    // Elegant automatic countdown to enter the studio autonomously
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      onEnter();
    }
  }, [timeLeft, onEnter]);

  // Compute percentage for a beautiful custom progress loader line
  const progressPercent = Math.max(0, Math.min(100, ((3.0 - timeLeft) / 3.0) * 100));

  return (
    <div className="fixed inset-0 z-[9999] bg-[#07080d] flex flex-col justify-between items-center text-white overflow-hidden p-6 select-none font-sans">
      {/* Immersive Cosmic backgrounds */}
      <div className="absolute top-[-20%] left-[-25%] w-[80%] h-[80%] bg-indigo-600/15 rounded-full blur-[180px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-purple-700/15 rounded-full blur-[180px] pointer-events-none animate-pulse duration-[6000ms]" />
      
      {/* Audio Visualizer Wave Line Accents in Background */}
      <div className="absolute top-1/2 inset-x-0 -translate-y-1/2 flex items-center justify-center opacity-10 gap-[5px] pointer-events-none">
        {[...Array(32)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-bounce"
            style={{
              height: `${Math.floor(Math.random() * 120) + 40}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${1 + Math.random() * 1.5}s`
            }}
          />
        ))}
      </div>

      {/* Top Bar: Quick language selectors & Version Info */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 pt-4 px-4">
        <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono tracking-widest text-indigo-300 uppercase shadow-md backdrop-blur-md flex items-center gap-2 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lang === "ar" ? "إصدار v3.10.2" : "MUSIC LOG v3.10.2"}</span>
        </div>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg backdrop-blur-md"
        >
          <span className="text-amber-400">🌐</span>
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>

      {/* Center Hero: Rotating Colorful Core & Headphone Representation */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 max-w-lg text-center px-4 relative mt-[-20px]">
        {/* Glow Spherical Base */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/30 to-pink-500/30 blur-3xl opacity-50 animate-pulse" />

        {/* Outer orbital rings */}
        <div className="relative flex items-center justify-center w-48 h-48 rounded-full border border-pink-500/20 shadow-[-5px_-5px_50px_rgba(219,39,119,0.15)] mb-8">
          <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/30 animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-gradient-to-tr from-pink-500 to-indigo-500 animate-[spin_15s_linear_infinite]" />
          
          {/* Main Visual Disc Hub */}
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 p-[3px] shadow-[0_0_50px_rgba(139,92,246,0.5)] transform hover:scale-105 transition-all duration-500">
            <div className="w-full h-full rounded-full bg-[#090b11] flex items-center justify-center relative overflow-hidden group">
              {/* Spinning/pulsing glossy vinyl effects */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-pink-500/10 opacity-30 group-hover:opacity-75 transition-opacity z-10 pointer-events-none" />
              
              {/* Beautiful Animated Waveform Generator Bars */}
              <div className="flex items-end justify-center gap-1 h-14 z-10 px-3 select-none pointer-events-none">
                {[3, 5, 8, 12, 16, 11, 7, 4, 6, 10, 15, 11, 8, 5, 3].map((maxHeight, idx) => (
                  <div
                    key={idx}
                    className="w-[3px] bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-bounce"
                    style={{
                      height: `${maxHeight * 2.5 + 8}px`,
                      animationDelay: `${idx * 0.05}s`,
                      animationDuration: "1.1s"
                    }}
                  />
                ))}
              </div>

              {/* Pulsing Central Icon Layer */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15 bg-black/25">
                <Music className="w-7 h-7 text-white/50 animate-pulse" />
              </div>
              
              {/* Elegant glossy record reflection layer overlays */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/35 pointer-events-none z-10" />
              
              {/* Inner Vinyl Groove Lines on top */}
              <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none z-20" />
              <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none z-20" />
              <div className="absolute inset-16 rounded-full border border-white/10 pointer-events-none z-20" />
              
              {/* Subtle tech center pin hole to represent a vinyl */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-black border-2 border-white/20 shadow-inner z-30 pointer-events-none" />
            </div>
          </div>
          
          {/* Embedded Small Sparkle Badge */}
          <span className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-pink-500 p-1.5 rounded-xl text-black shadow-lg animate-bounce z-45">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
        </div>

        {/* Elegant typography context */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300 font-mono">
              {lang === "ar" ? "أول استوديو تعديل احترافي متكامل" : "WORLD CLASS SOUND TUNING STUDIO"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {lang === "ar" ? (
              <>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic font-black">MUSIC LOG</span> استوديو
              </>
            ) : (
              <>
                Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic font-black">MUSIC LOG</span>
              </>
            )}
          </h1>

          <p className="text-sm text-gray-400/90 max-w-sm mx-auto font-medium leading-relaxed">
            {lang === "ar"
              ? "تمتع بمؤثرات التباطؤ والصدى المذهلة (Slowed & Reverb)، مع ميزة استخراج البيانات وتجربة استخدام خالية من الإعلانات تماماً!"
              : "Slow down your tracks, apply immersive reverberations, boost heavy sub-bass, and customize your acoustics to perfection."}
          </p>
        </div>

        {/* Beautiful Automated Loading System */}
        <div className="mt-8 w-full max-w-[320px] space-y-3">
          {/* Smooth linear horizontal loading track */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(139,92,246,0.5)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={onEnter}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 hover:border-white/20 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all text-white/90 flex items-center justify-center gap-3 shadow-xl cursor-pointer"
          >
            <span>
              {lang === "ar" 
                ? `جاري التحميل والدخول تلقائياً...` 
                : `Loading and entering automatically...`}
            </span>
            <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          </button>
        </div>
      </div>

      {/* Footer: Credit stamp with high design focus */}
      <div className="w-full text-center z-10 pb-4">
        <div className="text-[10px] text-white/35 uppercase tracking-widest font-mono">
          {lang === "ar" ? "برمجة وتصميم المطور عقبة 👑" : "ENGINEERED BY DEVELOPER OKBA 👑"}
        </div>
        <div className="text-[8px] text-white/20 mt-1">
          {lang === "ar" ? "استمتع بالتطبيق مجاناً بالكامل - إصدار متميز" : "PREMIUM LUXURY DESIGN - NO ADVERTISEMENTS"}
        </div>
      </div>
    </div>
  );
}
