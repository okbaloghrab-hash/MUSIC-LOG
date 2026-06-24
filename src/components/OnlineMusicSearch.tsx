import React, { useState } from "react";
import { Search, Download, Music, Link, AlertCircle, Sparkles, Filter, Database, Sliders, Play, Award } from "lucide-react";

interface OnlineTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  duration: number;
}

interface OnlineMusicSearchProps {
  lang: "ar" | "en";
  theme: "black" | "green" | "purple" | "white" | "gold";
  onTrackImport: (url: string, name: string, coverUrl?: string) => Promise<void>;
  isImporting: boolean;
}

export default function OnlineMusicSearch({
  lang,
  theme,
  onTrackImport,
  isImporting
}: OnlineMusicSearchProps) {
  const isRtl = lang === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<OnlineTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Advanced search states
  const [showFilters, setShowFilters] = useState(false);
  const [searchPlatform, setSearchPlatform] = useState<string>("all");
  const [musicStyle, setMusicStyle] = useState<string>("all");
  const [tempoClass, setTempoClass] = useState<string>("all");

  // Default suggested searches of high-quality slowed and reverb compatible soundscapes
  const suggestions = lang === "ar" 
    ? ["قرآن بصوت هادئ", "موسيقى لو ريفيرب", "شيلات جديدة", "شيلات حزينة", "لوفي", "ريكس عود"]
    : ["Lofi Relax", "Quran Calm", "Arabic Oud", "Piano Chill", "Desert Beats", "Synthwave"];

  const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const q = queryOverride !== undefined ? queryOverride : searchQuery;
    
    setLoading(true);
    setErrorStatus(null);
    setSearchTriggered(true);

    try {
      const url = `/api/music/search?q=${encodeURIComponent(q)}&platform=${searchPlatform}&style=${musicStyle}&tempo=${tempoClass}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search API responded with error status");
      
      const data = await response.json();
      if (data && data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Music search error:", err);
      setErrorStatus(lang === "ar" ? "فشل الاتصال بمحرك البحث السحابي. جاري التحميل من المكتبة المحلية." : "Cloud search engine failed. Loading from local database instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // Build a pretty generic name if not supplied
    const nameToUse = customName.trim() || `Internet Track - ${Math.random().toString(36).substring(7)}`;
    onTrackImport(customUrl.trim(), nameToUse, "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop");
    
    // Clear custom input fields
    setCustomUrl("");
    setCustomName("");
  };

  const formatSecs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div 
      id="online-downloader-card"
      className={`rounded-3xl border p-5 md:p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
        theme === "white" 
          ? "bg-white border-slate-200 text-slate-800" 
          : "bg-gradient-to-br from-[#0c0d12]/95 to-[#08090d]/95 border-indigo-505/20 text-white"
      }`}
    >
      {/* Visual background ambient gradient to give Snaptube vibe */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 blur-3xl pointer-events-none" />

      <div className={`flex items-start justify-between mb-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono block">
            {lang === "ar" ? "📡 مستكشف الإنترنت والتحميل المتطور" : "📡 ADVANCED CLOUD AUDIO DOWNLOADING ENGINE"}
          </span>
          <h3 className="text-sm md:text-base font-black tracking-tight flex items-center gap-1.5">
            <span>{lang === "ar" ? "منصة البحث والتحميل السريع (سنابتيوب)" : "Cloud Music Downloader & Snaptube Engine"}</span>
          </h3>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
        </div>
      </div>

      <div className="space-y-5">
        {/* Method 1: Search Form */}
        <form onSubmit={(e) => handleSearch(e)} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ar" ? "اكتب اسم الأغنية، الشيلة، الفنان أو أنشودة..." : "Type song title, artist name, vocals..."}
              className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-semibold outline-none transition-all ${
                isRtl ? "text-right pl-11 pr-4" : "text-left pl-4 pr-11"
              } ${
                theme === "white"
                  ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
                  : "bg-[#040508]/40 border-white/5 text-white placeholder-white/30 focus:border-indigo-500/50 focus:bg-black/20"
              }`}
            />
            <button
              type="submit"
              disabled={loading || isImporting}
              className={`absolute p-2.5 rounded-xl text-indigo-400 hover:text-white transition-all cursor-pointer ${
                isRtl ? "left-1.5" : "right-1.5"
              }`}
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Expandable Advanced Options / Choices Filters Hub */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all ${
                theme === "white"
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-indigo-300"
              } ${isRtl ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <Filter className="w-3.5 h-3.5 text-indigo-450" />
                <span>{lang === "ar" ? "خيارات البحث والفرز والمنصات المتطورة 🛠️" : "Advanced Filters & Download Platforms 🛠️"}</span>
              </div>
              <span className="text-[9px] opacity-75">{showFilters ? "▲" : "▼"}</span>
            </button>

            {showFilters && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl border ${
                theme === "white" ? "bg-slate-50 border-slate-150" : "bg-black/30 border-white/5"
              }`}>
                {/* 1. Platform Selector */}
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase text-indigo-400 block ${isRtl ? "text-right" : "text-left"}`}>
                    {lang === "ar" ? "📡 منصة البحث المتصلة" : "📡 Search Engine Server"}
                  </label>
                  <select
                    value={searchPlatform}
                    onChange={(e) => setSearchPlatform(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[10px] font-semibold border bg-transparent outline-none ${
                      theme === "white" ? "border-slate-350 text-slate-800" : "border-white/15 text-white/90"
                    }`}
                  >
                    <option value="all" className="bg-[#121319]">{lang === "ar" ? "كل المنصات (متشارك)" : "All Servers (Merged)"}</option>
                    <option value="jamendo" className="bg-[#121319]">{lang === "ar" ? "يوتيوب ميديام (Jamendo)" : "Cloud Stream (Jamendo)"}</option>
                    <option value="ccmixter" className="bg-[#121319]">{lang === "ar" ? "مؤثرات وإيقاع (CCMixter)" : "CC Beats (ccMixter)"}</option>
                    <option value="archive" className="bg-[#121319]">{lang === "ar" ? "أرشيف الصوتيات (Archive)" : "Audio Archives (Archive.org)"}</option>
                    <option value="curated" className="bg-[#121319]">{lang === "ar" ? "مكتبة ميوزك لوج الخاصة" : "Music Log Gold Selection"}</option>
                  </select>
                </div>

                {/* 2. Genre Selector */}
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase text-indigo-400 block ${isRtl ? "text-right" : "text-left"}`}>
                    {lang === "ar" ? "🎵 النمط والتصنيف الصوتي" : "🎵 Music Style/Genre"}
                  </label>
                  <select
                    value={musicStyle}
                    onChange={(e) => setMusicStyle(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[10px] font-semibold border bg-transparent outline-none ${
                      theme === "white" ? "border-slate-350 text-slate-800" : "border-white/15 text-white/90"
                    }`}
                  >
                    <option value="all" className="bg-[#121319]">{lang === "ar" ? "كل الأنواع" : "All Styles"}</option>
                    <option value="lofi" className="bg-[#121319]">{lang === "ar" ? "لوفي وهادئ (Lofi Chill)" : "Lofi Ambient"}</option>
                    <option value="beats" className="bg-[#121319]">{lang === "ar" ? "شيلات / مهرجانات / ضرب بيس" : "Beats & Desert Drifts"}</option>
                    <option value="vocals" className="bg-[#121319]">{lang === "ar" ? "أناشيد وصوتيات بدون موسيقى" : "Pure Vocals & Chants"}</option>
                    <option value="piano" className="bg-[#121319]">{lang === "ar" ? "بيانو وجيتار كلاسيكي هادئ" : "Piano & Guitar Acoustics"}</option>
                  </select>
                </div>

                {/* 3. Tempo Selector */}
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase text-indigo-400 block ${isRtl ? "text-right" : "text-left"}`}>
                    {lang === "ar" ? "⏱️ سرعة المقطع المطلوبة" : "⏱️ Match Speed Tempo"}
                  </label>
                  <select
                    value={tempoClass}
                    onChange={(e) => setTempoClass(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[10px] font-semibold border bg-transparent outline-none ${
                      theme === "white" ? "border-slate-350 text-slate-800" : "border-white/15 text-white/90"
                    }`}
                  >
                    <option value="all" className="bg-[#121319]">{lang === "ar" ? "أي سرعة" : "Any Tempo Speed"}</option>
                    <option value="slow" className="bg-[#121319]">{lang === "ar" ? "بطيء ومحيطي (أمبينت)" : "Slow & Ambient"}</option>
                    <option value="medium" className="bg-[#121319]">{lang === "ar" ? "معتدل (لوفي عادي)" : "Moderate (Daily Track)"}</option>
                    <option value="fast" className="bg-[#121319]">{lang === "ar" ? "حماسي وسريع" : "Upbeat / Fast Tempo"}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions Tags */}
          <div className={`flex flex-wrap gap-1.5 pt-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  setSearchQuery(sug);
                  handleSearch(undefined, sug);
                }}
                className={`py-1 px-3 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  theme === "white"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-150"
                    : "bg-[#11121b] hover:bg-[#1a1b28] text-white/60 border-white/5 hover:text-indigo-450"
                }`}
              >
                #{sug}
              </button>
            ))}
          </div>
        </form>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <span className="text-[11px] font-bold text-indigo-440 animate-pulse">
              {lang === "ar" ? "جاري جلب المقاطع وفحص محركات البحث السحابية... 📡" : "Streaming files & scanning cloud servers... 📡"}
            </span>
          </div>
        )}

        {/* IMPORTING INDICATOR */}
        {isImporting && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 p-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/10 border-t-indigo-400 animate-spin" />
              <Download className="w-4.5 h-4.5 text-indigo-400 animate-bounce" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs font-black text-indigo-450 block">
                {lang === "ar" ? "جاري سحب الملف السحابي وحقنه ⚡" : "Buffering & Processing Stream ⚡"}
              </span>
              <p className={`text-[10px] ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                {lang === "ar" 
                  ? "نقوم بفك تشفير الصبغة الرقمية لتكون جاهزة للتبطئ وتضخيم الصدى في الهاتف!"
                  : "Streaming soundwave data directly. Making high fidelity slow modifications ready!"}
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATUS */}
        {errorStatus && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 ${
            theme === "white" ? "bg-red-50 border-red-100 text-red-600" : "bg-red-500/5 border-red-500/10 text-red-400"
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold leading-tight">{errorStatus}</span>
          </div>
        )}

        {/* RESULTS SCROLLABLE LIST */}
        {!loading && !isImporting && searchTriggered && (
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${theme === "white" ? "text-slate-500" : "text-white/40"}`}>
                {lang === "ar" ? `قائمة الخيارات المتوفرة للتحميل السريع (${results.length})` : `Discovered Audio streams (${results.length})`}
              </span>
              <span className="text-[9px] bg-indigo-600/15 text-indigo-400 py-0.5 px-1.5 rounded-md font-bold">
                {searchPlatform.toUpperCase()}
              </span>
            </div>
            
            {results.length === 0 ? (
              <div className={`p-6 text-center rounded-2xl border text-xs font-bold leading-relaxed ${
                theme === "white" ? "bg-slate-50 border-slate-100 text-slate-400" : "bg-[#0e0f15]/30 border-white/5 text-white/30"
              }`}>
                {lang === "ar" ? "لم نجد نتائج مطابقة لجميع الفلاتر المحددة. يرجى تجربة كلمات أقل." : "No matching audio. Please try simpler words."}
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/5">
                {results.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all hover:scale-[1.01] ${
                      theme === "white"
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-150"
                        : "bg-black/20 hover:bg-white/5 border-white/5 hover:border-indigo-500/15"
                    } ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                      <img
                        src={track.coverUrl}
                        alt="cover"
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`overflow-hidden min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                        <div className="flex items-center gap-1">
                          <h4 className="text-[11px] font-extrabold truncate text-indigo-440 group-hover:text-white transition-colors">
                            {track.name}
                          </h4>
                        </div>
                        <span className={`text-[9px] font-bold block truncate opacity-70`}>
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 shrink-0 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                      <span dir="ltr" className="text-[10px] font-mono opacity-50 font-bold inline-block">
                        {formatSecs(track.duration)}
                      </span>
                      <button
                        onClick={() => onTrackImport(track.url, track.name, track.coverUrl)}
                        className="p-2 py-1.5 bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 animate-bounce" />
                        <span>{lang === "ar" ? "تحميل فوري ⤵️" : "Get ⤵️"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCORDION DIVIDER / METHOD 2: DIRECT URL DOWNLOAD */}
        <div className="pt-3 border-t border-white/5">
          <details className="group">
            <summary className={`list-none flex items-center justify-between font-bold text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 cursor-pointer transition-all ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <Link className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === "ar" ? "أو لصق رابط مباشر مباشرة للهاتف" : "Or Download Direct Link from Internet"}</span>
              </div>
              <span className="transition-transform group-open:rotate-180 text-indigo-400">▼</span>
            </summary>
            
            <form onSubmit={handleDirectImport} className="pt-3 space-y-2.5 animate-fadeIn">
              <input
                type="url"
                required
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
                className={`w-full py-2.5 px-3.5 rounded-xl border text-[11px] font-mono outline-none transition-all ${
                  theme === "white"
                    ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
                    : "bg-black/30 border-white/5 text-white placeholder-white/20 focus:border-indigo-500/40"
                }`}
              />
              
              <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={lang === "ar" ? "اسم الأغنية أو الملف..." : "Custom track name..."}
                  className={`flex-1 py-2 px-3 rounded-xl border text-[11px] font-semibold outline-none transition-all ${
                    isRtl ? "text-right" : "text-left"
                  } ${
                    theme === "white"
                      ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500"
                      : "bg-[#040508]/20 border-white/5 text-white/80 focus:border-indigo-500/40"
                  }`}
                />
                
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-[11px] font-black cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  {lang === "ar" ? "تحميل واستيراد" : "Stream File"}
                </button>
              </div>
            </form>
          </details>
        </div>
      </div>
    </div>
  );
}
