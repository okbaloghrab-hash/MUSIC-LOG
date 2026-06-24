import React from "react";
import { 
  X, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Palette, 
  Activity, 
  Check, 
  Zap, 
  Share2,
  Headphones,
  Sparkle,
  Flame,
  Music,
  Crown
} from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "ar" | "en";
  theme: "black" | "green" | "purple" | "white" | "gold";
  setTheme: (t: "black" | "green" | "purple" | "white" | "gold") => void;
  reverbPreset: "hall" | "cathedral" | "cave" | "dry_room";
  setReverbPreset: (p: "hall" | "cathedral" | "cave" | "dry_room") => void;
  ambientMode: "none" | "rain" | "wind" | "vinyl";
  setAmbientMode: (m: "none" | "rain" | "wind" | "vinyl") => void;
  ambientVolume: number;
  setAmbientVolume: (v: number) => void;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  performanceMode: boolean;
  setPerformanceMode: (b: boolean) => void;
  superSmoothness: boolean;
  setSuperSmoothness: (b: boolean) => void;
  vintageRadio: boolean;
  setVintageRadio: (b: boolean) => void;
  vocalDoubler: boolean;
  setVocalDoubler: (b: boolean) => void;
  tapeFlutter: boolean;
  setTapeFlutter: (b: boolean) => void;
  deCrackle: boolean;
  setDeCrackle: (b: boolean) => void;

  // New High-End Premium Sound Parameters
  pitchShift: number;
  setPitchShift: (v: number) => void;
  eq60: number;
  setEq60: (v: number) => void;
  eq230: number;
  setEq230: (v: number) => void;
  eq910: number;
  setEq910: (v: number) => void;
  eq4k: number;
  setEq4k: (v: number) => void;
  eq14k: number;
  setEq14k: (v: number) => void;
  surroundSound: boolean;
  setSurroundSound: (b: boolean) => void;

  vocalBooster: boolean;
  setVocalBooster: (b: boolean) => void;

  volume: number;
  setVolume: (v: number) => void;
  speed: number;
  setSpeed: (v: number) => void;
  reverb: number;
  setReverb: (v: number) => void;
  bassBoost: number;
  setBassBoost: (v: number) => void;
}

export default function SoundSettingsModal({
  isOpen,
  onClose,
  lang,
  theme,
  setTheme,
  reverbPreset,
  setReverbPreset,
  ambientMode,
  setAmbientMode,
  ambientVolume,
  setAmbientVolume,
  analyser,
  isPlaying,
  performanceMode,
  setPerformanceMode,
  superSmoothness,
  setSuperSmoothness,
  vintageRadio,
  setVintageRadio,
  vocalDoubler,
  setVocalDoubler,
  tapeFlutter,
  setTapeFlutter,
  deCrackle,
  setDeCrackle,

  // Advanced DSP hooks
  pitchShift,
  setPitchShift,
  eq60,
  setEq60,
  eq230,
  setEq230,
  eq910,
  setEq910,
  eq4k,
  setEq4k,
  eq14k,
  setEq14k,
  surroundSound,
  setSurroundSound,

  vocalBooster,
  setVocalBooster,
  volume,
  setVolume,
  speed,
  setSpeed,
  reverb,
  setReverb,
  bassBoost,
  setBassBoost,
}: SoundSettingsModalProps) {
  if (!isOpen) return null;

  const isRtl = lang === "ar";
  const [shareSuccess, setShareSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"fx" | "theme" | "eq">("fx");

  const handleShare = async () => {
    const shareData = {
      title: lang === "ar" ? "تطبيق تعديل وتبطئ الأصوات الاحترافي" : "Slowed & Reverb Premium Studio",
      text: lang === "ar" 
        ? "استمع للموسيقى بتأثيرات تبطئ وصدى مذهلة، مع مضخم باص وتعديل نغمة ومؤثرات مجسمة احترافية مذهلة!" 
        : "Listen to music with glorious Slowed & Reverb, 3D Surround, high-end Equalizers and professional audio modulations!",
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.origin);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  // Preset Application logic
  const applyPreset = (presetName: string) => {
    if (presetName === "deep_bass") {
      setEq60(12);
      setEq230(6);
      setEq910(0);
      setEq4k(-2);
      setEq14k(-4);
      setBassBoost(14);
      setVocalBooster(false);
    } else if (presetName === "vocal") {
      setEq60(-6);
      setEq230(-2);
      setEq910(4);
      setEq4k(11);
      setEq14k(3);
      setBassBoost(2);
      setVocalBooster(true);
    } else if (presetName === "lofi") {
      setSpeed(0.82);
      setEq60(4);
      setEq230(2);
      setEq910(0);
      setEq4k(-9);
      setEq14k(-12);
      setAmbientMode("vinyl");
      setAmbientVolume(30);
      setReverbPreset("hall");
      setReverb(45);
      setVocalBooster(false);
    } else if (presetName === "nightcore") {
      setSpeed(1.24);
      setPitchShift(350);
      setEq60(-2);
      setEq230(0);
      setEq910(2);
      setEq4k(8);
      setEq14k(6);
      setReverbPreset("dry_room");
      setReverb(25);
    } else if (presetName === "surround") {
      setSurroundSound(!surroundSound);
    } else if (presetName === "vol_boost") {
      // Safely boost audio limit
      if (volume < 130) {
        setVolume(180);
      } else {
        setVolume(70);
      }
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-xl rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 relative ${
          theme === "white" 
            ? "bg-white border-slate-200 text-slate-800"
            : theme === "gold"
            ? "bg-[#090804] border-amber-500/30 text-amber-100"
            : "bg-[#07080c] border-white/10 text-white"
        }`}
        onClick={stopPropagation}
        style={{ contentVisibility: "auto" }}
      >
        {/* Golden high luxury glow lines on gold theme */}
        {theme === "gold" && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 shadow-[0_2px_15px_rgba(245,158,11,0.5)]" />
        )}

        {/* Header bar */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
          theme === "white" ? "border-slate-100" : "border-white/5"
        }`}>
          <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center ${
              theme === "gold" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
            }`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight leading-none">
                {lang === "ar" ? "لوحة التحكم الفائقة والمؤثرات الصوتية" : "Ultra Sound FX & EQ Control Panel"}
              </h3>
              <p className={`text-[9px] mt-1 font-bold ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                {lang === "ar" ? "تحسين وتضخيم الصوت والألوان في الخلفية" : "Fine-tune frequencies & backgrounds"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              theme === "white" ? "bg-slate-100 hover:bg-slate-200 text-slate-600" : "bg-white/5 hover:bg-white/10 text-white/75"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal tabs */}
        <div className={`flex px-4 sm:px-5 mt-3 gap-2 border-b ${
          theme === "white" ? "border-slate-100" : "border-white/5"
        } pb-2`}>
          {[
            { id: "fx", nameAr: "مؤثرات ذكية ✨", nameEn: "Smart FX ✨" },
            { id: "eq", nameAr: "معدل الترددات 🎛️", nameEn: "Equalizer 🎛️" },
            { id: "theme", nameAr: "المظهر وعينات الألوان 🎨", nameEn: "Themes 🎨" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer active:scale-95 ${
                activeTab === tab.id
                  ? theme === "gold"
                    ? "bg-amber-500/15 border border-amber-500/45 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : theme === "white"
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-600/15 border border-indigo-500/40 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  : theme === "white"
                  ? "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500"
                  : "bg-white/5 border border-transparent text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {lang === "ar" ? tab.nameAr : tab.nameEn}
            </button>
          ))}
        </div>

        {/* Scrollable content block */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[64vh] space-y-5">

          {/* TAB 1: SMART FX */}
          {activeTab === "fx" && (
            <div className="space-y-4 animate-[fadeIn_0.15s_ease-out]">
              
              {/* Live Audio Visualizer */}
              <div className="space-y-1.5">
                <span className={`text-[9px] uppercase font-black tracking-wider block ${theme === "white" ? "text-slate-500" : "text-white/40"} ${isRtl ? "text-right" : "text-left"}`}>
                  {lang === "ar" ? "محلل الطيف والموجات التفاعلي 📊" : "Interactive Spectrograph 📊"}
                </span>
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/15 shadow-inner">
                  <AudioVisualizer analyser={analyser} isPlaying={isPlaying} lang={lang} />
                </div>
              </div>

              {/* One-Tap Presets removed as per user request */}

              {/* Advanced Environment Ambient Background Sound selectors */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-sm">📻</span>
                    <span className={`text-xs font-black uppercase tracking-wider ${theme === "white" ? "text-slate-600" : "text-white/70"}`}>
                      {lang === "ar" ? "مؤثرات البيئة والمطر والخلفيات 🌧️" : "Atmospheric Background Channels 🌧️"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", emoji: "🔇", labelAr: "صمت", labelEn: "Off" },
                    { id: "rain", emoji: "🌧️", labelAr: "مطر", labelEn: "Rain" },
                    { id: "wind", emoji: "🍃", labelAr: "رياح", labelEn: "Wind" },
                    { id: "vinyl", emoji: "📼", labelAr: "كاسيت", labelEn: "Tape" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setAmbientMode(m.id as any)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-155 border text-[10px] font-black cursor-pointer active:scale-95 ${
                        ambientMode === m.id
                          ? theme === "gold"
                            ? "bg-amber-500/20 border-amber-500 select-all text-amber-300 shadow-md scale-[1.01]"
                            : "bg-purple-600/20 border-purple-500/80 text-purple-400 shadow-md scale-[1.01]"
                          : theme === "white"
                          ? "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          : "bg-[#090b10] border-white/5 text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span>{lang === "ar" ? m.labelAr : m.labelEn}</span>
                    </button>
                  ))}
                </div>

                {/* Range slider for Ambient Volume */}
                {ambientMode !== "none" && (
                  <div className="pt-2 animate-fadeIn space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className={`flex justify-between text-[10px] font-bold ${theme === "white" ? "text-slate-500" : "text-white/50"}`}>
                      <span>{lang === "ar" ? "مستوى دمج صوت الخلفية" : "Atmospheric Mix volume"}</span>
                      <span className="font-mono text-purple-400 font-extrabold">{ambientVolume}%</span>
                    </div>
                    <input
                      dir="ltr"
                      type="range"
                      min="5"
                      max="80"
                      step="1"
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#151722] rounded-lg appearance-none cursor-pointer accent-purple-500 custom-3d-slider"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Performance Toggles */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                {/* Turbo touch speed toggler */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
                }`}>
                  <div className={`flex-1 pr-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-black">
                      {lang === "ar" ? "تعزيز سرعة الاستجابة واللمس 🏎️" : "Turbo Response & Fast Touch 🏎️"}
                    </h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {lang === "ar" 
                        ? "يعطل الخلفيات المضيئة والتحريكات الكثيفة لتوفير بطارية وسرعة غير مسبوقة."
                        : "Disables glows & animated gradients to deliver instantaneous responsive feel."}
                    </p>
                  </div>
                  <button
                    onClick={() => setPerformanceMode(!performanceMode)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      performanceMode ? "bg-[#00e676] border-[#00e676]" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      performanceMode ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Super Smoothness Mode */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
                }`}>
                  <div className={`flex-1 pr-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-black">
                      {lang === "ar" ? "ميزة السلاسة الصوتية الفائقة 🧊" : "Super Smooth transition 🧊"}
                    </h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {lang === "ar" 
                        ? "تهدئة تلاشي الصوت تدريجياً لعدم حدوث فرقعات أو انقطاع مفاجئ."
                        : "Smooth exponential volume fading prevents annoying popping sound artifacts."}
                    </p>
                  </div>
                  <button
                    onClick={() => setSuperSmoothness(!superSmoothness)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      superSmoothness ? "bg-cyan-500 border-cyan-400" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      superSmoothness ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Vintage radio effect toggle */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
                }`}>
                  <div className={`flex-1 pr-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-black">
                      {lang === "ar" ? "تأثير الراديو العتيق 📻" : "Vintage Retro Radio Filter 📻"}
                    </h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {lang === "ar" 
                        ? "تصفية الترددات الحادة والمنخفضة لمحاكاة المذياع والهواتف القديمة بجودة كلاسيكية مذهلة."
                        : "Focuses audio frequencies inside a warm 1.1kHz bandpass to emulate vintage Walkie-Talkies & AM Radios."}
                    </p>
                  </div>
                  <button
                    onClick={() => setVintageRadio(!vintageRadio)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      vintageRadio ? "bg-[#e040fb] border-[#e040fb]" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      vintageRadio ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Vocal Doubler Stereo Chorus preset toggle */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
                }`}>
                  <div className={`flex-1 pr-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-black">
                      {lang === "ar" ? "مضاعف الصوت غرف الكريستال 🎙️✨" : "Crystal Vocal Doubler Chorus 🎙️✨"}
                    </h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {lang === "ar" 
                        ? "تأخير زمني مزدوج وذبذبة ترددية لإنتاج كورس واسع وأصوات غناء مجسمة مذهلة."
                        : "Applies dual micro-delays modulated by stereo LFOs to create a wide, dreamy double chorus."}
                    </p>
                  </div>
                  <button
                    onClick={() => setVocalDoubler(!vocalDoubler)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      vocalDoubler ? "bg-[#00e5ff] border-[#00e5ff]" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      vocalDoubler ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* De-crackle / Denoise dynamic toggle */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
                }`}>
                  <div className={`flex-1 pr-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-black">
                      {lang === "ar" ? "مزيل الخرخشة وضوضاء الصوت 🧼" : "Dynamic Sound De-crackle 🧼"}
                    </h4>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {lang === "ar" 
                        ? "تصفية ذكية للضوضاء والفرقعات والخرخشة الكهربية من الصوت لجعل تشغيله فائق النقاء."
                        : "Intelligently filter high-frequency distortion, vinyl pops, static hiss, and crackling clicks."}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeCrackle(!deCrackle)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      deCrackle ? "bg-emerald-500 border-emerald-450" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      deCrackle ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EQUALIZER */}
          {activeTab === "eq" && (
            <div className="space-y-5 animate-[fadeIn_0.15s_ease-out]">
              
              {/* Pitch pitch Detuner control slider */}
              <div className="bg-white/5 p-4 rounded-2.5xl border border-white/5 space-y-3">
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <Sliders className="w-4 h-4 text-emerald-450" />
                  <span className="text-[11px] font-black uppercase text-slate-100">
                    {lang === "ar" ? "التحكم بالنغمة ودرجة الصوت المستقلة (Pitch) 🎚️" : "Independent Pitch detuner 🎚️"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-white/60 font-black">
                    <span>{lang === "ar" ? "رفع/خفض النغمة" : "detune Pitch Shifts"}</span>
                    <span className="font-mono text-emerald-400 font-extrabold bg-[#151722] px-2 py-0.5 rounded-md">
                      {pitchShift === 0 ? "0" : pitchShift > 0 ? `+${pitchShift} cents` : `${pitchShift} cents`}
                    </span>
                  </div>
                  <div className="relative pt-1 flex items-center pr-1 pl-1">
                    <input
                      dir="ltr"
                      type="range"
                      min="-1200"
                      max="1200"
                      step="50"
                      value={pitchShift}
                      onChange={(e) => setPitchShift(parseInt(e.target.value))}
                      className="w-full h-2.5 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-150 custom-3d-slider"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/30 font-bold px-1">
                    <span>{lang === "ar" ? "أوكتاف لأسفل (-12)" : "Octave Down"}</span>
                    <span>{lang === "ar" ? "طبيعي" : "Flat"}</span>
                    <span>{lang === "ar" ? "أوكتاف لأعلى (+12)" : "Octave Up"}</span>
                  </div>
                </div>
              </div>

              {/* Graphic 5-Band Equalizer */}
              <div className="bg-white/5 p-4 rounded-2.5xl border border-white/5 space-y-4">
                <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-black uppercase text-slate-100">
                      {lang === "ar" ? "معدل الترددات الصوتي الاحترافي (5 أشرطة)" : "Hifi 5-Band Graphic Equalizer"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEq60(0);
                      setEq230(0);
                      setEq910(0);
                      setEq4k(0);
                      setEq14k(0);
                    }}
                    className="text-[9px] text-indigo-400 hover:text-white underline font-bold transition-all cursor-pointer"
                  >
                    {lang === "ar" ? "تصفير الفلتر" : "Reset EQ"}
                  </button>
                </div>

                {/* Draw 5 Visual Vertical sliders like mixing consol desks! */}
                <div className="flex justify-between items-center h-48 bg-black/25 rounded-2xl p-4 sm:p-5 border border-white/5 relative">
                  {/* Decorative horizontal centerline */}
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5 pointer-events-none" />
                  
                  {[
                    { freq: "60Hz", labelAr: "الباص السفلي", val: eq60, set: setEq60 },
                    { freq: "230Hz", labelAr: "الحجم الباص", val: eq230, set: setEq230 },
                    { freq: "910Hz", labelAr: "الوسط", val: eq910, set: setEq910 },
                    { freq: "4kHz", labelAr: "وضوح الكلمات", val: eq4k, set: setEq4k },
                    { freq: "14kHz", labelAr: "الهواء واللمعان", val: eq14k, set: setEq14k }
                  ].map((band, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-between h-full w-1/5">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold bg-[#151722] px-1 rounded-md">
                        {band.val > 0 ? `+${band.val}` : band.val}
                      </span>
                      
                      {/* Vertical input slider */}
                      <div className="h-28 flex items-center justify-center my-1 relative">
                        <input
                          dir="ltr"
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={band.val}
                          onChange={(e) => band.set(parseInt(e.target.value))}
                          style={{
                            writingMode: "vertical-lr",
                            direction: "rtl"
                          }}
                          className="h-full w-4 cursor-pointer outline-none appearance-none bg-white/5 accent-indigo-500 custom-3d-slider"
                        />
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-xxs font-black text-white">{band.freq}</span>
                        <span className="text-[8px] text-white/35 font-bold hidden sm:inline truncate max-w-[50px]">
                          {lang === "ar" ? band.labelAr : band.freq === "60Hz" ? "Deep Bass" : band.freq === "230Hz" ? "Mid Bass" : band.freq === "910Hz" ? "Vocal Mid" : band.freq === "4kHz" ? "Presence" : "High Sparkle"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Vocal Booster filter */}
              <div className={`p-4 rounded-2.5xl border transition-all ${
                theme === "white" ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5 hover:bg-black/45"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-start gap-3 max-w-[75%] ${isRtl ? "text-right" : "text-left"}`}>
                    <Crown className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black">
                        {lang === "ar" ? "قناة تنقية الكلمات والأصوات المغناة 🎙️" : "Vocal Clarity Enhancement 🎙️"}
                      </h4>
                      <p className={`text-[10px] mt-0.5 leading-relaxed ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                        {lang === "ar" 
                          ? "يزيد من بروز صوت المغني ويقلل الضوضاء المحيطة لإبراز تفاصيل الآداء."
                          : "Amplifies lead vocals at 2.5kHz dynamically while removing disturbing mud."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVocalBooster(!vocalBooster)}
                    className={`w-12 h-6 rounded-full transition-all relative p-0.5 outline-none cursor-pointer border ${
                      vocalBooster ? "bg-amber-500 border-amber-400" : "bg-neutral-800 border-white/10"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-all duration-150 ${
                      vocalBooster ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: THEME SCHEME */}
          {activeTab === "theme" && (
            <div className="space-y-4 animate-[fadeIn_0.15s_ease-out]">
              
              <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <Palette className="w-4 h-4 text-indigo-400" />
                <span className={`text-xs font-black uppercase tracking-wider ${theme === "white" ? "text-slate-600" : "text-white/70"}`}>
                  {lang === "ar" ? "تغيير مظهر وعينات ألوان التطبيق 🎨" : "Custom Themes Catalog 🎨"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "black", nameAr: "أسود كوزميك 🌌", nameEn: "Cosmic Dark" },
                  { id: "green", nameAr: "أخضر سيريال 🟢", nameEn: "Forest Emerald" },
                  { id: "purple", nameAr: "بنفسجي غامض 🟣", nameEn: "Mystic Fuchsia" },
                  { id: "white", nameAr: "حديث وناصع ⚪", nameEn: "Clean Snow" },
                  { id: "gold", nameAr: "ذهبي ملكي 👑🔱", nameEn: "Imperial Gold Premium" }
                ].map((tScheme) => (
                  <button
                    key={tScheme.id}
                    onClick={() => {
                      setTheme(tScheme.id as any);
                      localStorage.setItem("musiclog_theme", tScheme.id);
                    }}
                    className={`px-3 py-3.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all duration-150 text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                      tScheme.id === "gold" && theme === "gold"
                        ? "bg-amber-400/20 border-amber-400 text-amber-300 scale-[1.01] shadow-[0_0_15px_rgba(245,158,11,0.25)] font-black"
                        : theme === tScheme.id
                        ? "bg-indigo-600/15 border-indigo-500 text-indigo-400 scale-[1.01] shadow-sm font-black"
                        : theme === "white"
                        ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        : "bg-black/30 border-white/5 text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{lang === "ar" ? tScheme.nameAr : tScheme.nameEn}</span>
                    {theme === tScheme.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Cozy active sharing system */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span className={`text-xs font-black uppercase tracking-wider ${theme === "white" ? "text-slate-600" : "text-white/70"}`}>
                    {lang === "ar" ? "مشاركة واستكشاف التطبيق 🔗" : "Share slow reverb setup with crew 🔗"}
                  </span>
                </div>

                <button
                  onClick={handleShare}
                  className={`w-full py-4 px-4 rounded-xl font-black text-xs transition-all duration-150 border flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    theme === "white"
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                      : "bg-gradient-to-tr from-indigo-600/10 to-purple-600/15 border-indigo-505/25 text-indigo-300 hover:text-white"
                  }`}
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>
                    {shareSuccess 
                      ? (lang === "ar" ? "تم نسخ رابط التطبيق بنجاح! 📋" : "Copied App link successfully! 📋")
                      : (lang === "ar" ? "مشاركة التطبيق مع الأصدقاء" : "Share this application with friends")}
                  </span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className={`p-4 bg-black/30 flex justify-end border-t ${
          theme === "white" ? "border-slate-150" : "border-white/5"
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 font-black text-xs rounded-xl hover:scale-102 transition-all cursor-pointer ${
              theme === "gold"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md shadow-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-550 text-white shadow-md shadow-indigo-650/10"
            }`}
          >
            {lang === "ar" ? "حفظ وإغلاق" : "Apply & Close"}
          </button>
        </div>

      </div>
    </div>
  );
}
