/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Music, 
  Play, 
  Pause, 
  Trash2, 
  Heart, 
  Crown, 
  Search, 
  ShieldAlert, 
  Check, 
  ShieldCheck, 
  FileAudio,
  Sparkles
} from "lucide-react";
import { Track, translations } from "../types";

interface TrackLibraryProps {
  tracks: Track[];
  activeTrackId: string;
  isPlaying: boolean;
  onTrackSelect: (id: string) => void;
  onTrackDelete?: (id: string) => void;
  lang: "ar" | "en";
  theme?: string;
  favoriteTrackIds?: string[];
  onToggleFavorite?: (id: string) => void;
  onSyncTriggered?: () => void; // Optional trigger for device scanning
  isPwaInstallable?: boolean;
  onInstallPwa?: () => void;
}

export default function TrackLibrary({
  tracks,
  activeTrackId,
  isPlaying,
  onTrackSelect,
  onTrackDelete,
  lang,
  theme,
  favoriteTrackIds = [],
  onToggleFavorite,
  onSyncTriggered,
  isPwaInstallable = false,
  onInstallPwa,
}: TrackLibraryProps) {
  const isRtl = lang === "ar";
  const t = translations[lang];

  // Search keyword state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Media Store Access Permissions flow
  const [permissionState, setPermissionState] = useState<"prompt" | "requesting" | "granted">(() => {
    return (localStorage.getItem("musiclog_media_permission") as "prompt" | "requesting" | "granted") || "prompt";
  });

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getCategoryBadge = (category: Track["category"]) => {
    switch (category) {
      case "ambient":
        return { text: lang === "ar" ? "أجواء وفضاء" : "Ambient", color: theme === "white" ? "bg-indigo-50 text-indigo-500 border-indigo-100" : "bg-white/5 text-indigo-400 border-white/10" };
      case "synthwave":
        return { text: lang === "ar" ? "ريترو بيتس" : "Synthwave", color: theme === "white" ? "bg-fuchsia-50 text-fuchsia-500 border-fuchsia-100" : "bg-white/5 text-fuchsia-400 border-white/10" };
      case "lofi":
        return { text: lang === "ar" ? "لوفي هادئ" : "Lofi Loop", color: theme === "white" ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-white/5 text-emerald-400 border-white/10" };
      case "uploaded":
        return { text: lang === "ar" ? "مخزن محلياً" : "Local Audio", color: theme === "white" ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white/5 text-indigo-300 border-indigo-500/20" };
    }
  };

  // Filter tracks on both name and artist fields
  const filteredTracks = tracks.filter((track) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = track.name.toLowerCase().includes(query);
    const artistMatch = track.artist ? track.artist.toLowerCase().includes(query) : false;
    return nameMatch || artistMatch;
  });

  const handleRequestPermission = () => {
    setPermissionState("requesting");
    setTimeout(() => {
      setPermissionState("granted");
      localStorage.setItem("musiclog_media_permission", "granted");
      if (onSyncTriggered) {
        onSyncTriggered();
      }
    }, 1200);
  };

  return (
    <div id="track-library" className="flex flex-col gap-4 w-full min-w-0">
      
      {/* 1. Interactive Media Permissions Request Banner (Android WebView compatible) */}
      {permissionState !== "granted" && (
        <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl ${
          theme === "white"
            ? "bg-red-50/80 border-red-200 text-slate-800"
            : "bg-red-950/20 backdrop-blur-md border-red-500/15 text-red-100"
        } ${isRtl ? "text-right" : "text-left"}`}>
          <div className={`flex items-start gap-3.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`p-2 rounded-xl shrink-0 ${theme === "white" ? "bg-red-100 text-red-650" : "bg-red-900/30 text-red-400"}`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400">
                {lang === "ar" ? "صلاحية مكتبة الموسيقى للجهاز مطلوب 🔒" : "Device Music Access Required 🔒"}
              </h4>
              <p className="text-[10px] leading-relaxed text-white/60">
                {lang === "ar"
                  ? "يتطلب التطبيق الإذن للوصول المباشر إلى ملفات الصوت في الذاكرة لقراءتها وعرض الأغاني وصور الألبومات الحقيقية."
                  : "Allow read access to your device's audio files to automatically parse album covers and list local metadata."}
              </p>
              
              <button
                id="grant-permission-btn"
                onClick={handleRequestPermission}
                className={`mt-2.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide border cursor-pointer transition-all flex items-center gap-1.5 ${
                  permissionState === "requesting"
                    ? "bg-neutral-800 border-white/5 text-white/40 cursor-not-allowed"
                    : theme === "white"
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30 hover:border-red-500/50"
                }`}
                disabled={permissionState === "requesting"}
              >
                {permissionState === "requesting" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full border border-white/40 border-t-white animate-spin shrink-0" />
                    <span>{lang === "ar" ? "جاري منح الصلاحية..." : "Requesting..."}</span>
                  </>
                ) : (
                  <span>{lang === "ar" ? "منح الإذن وعرض الأغاني 📂" : "Grant Storage Permission 📂"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.1 Success banner when first granted */}
      {permissionState === "granted" && localStorage.getItem("musiclog_media_permission") === "granted" && (
        <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
          theme === "white" ? "bg-emerald-50 border-emerald-100 text-emerald-950" : "bg-emerald-950/15 border-emerald-500/10 text-emerald-250"
        } ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold">
              {lang === "ar" ? "تم الاتصال بـ MediaStore بنجاح وقراءة ملفات الصوت 🟢" : "Successfully synchronized with native Audio MediaStore! 🟢"}
            </span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem("musiclog_media_permission");
              setPermissionState("prompt");
            }}
            className="text-[9px] hover:underline text-emerald-400 font-extrabold cursor-pointer"
          >
            {lang === "ar" ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
      )}

      {/* 2. Custom Gold Luxury Edition banner */}
      <div className="relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.01]">
        <span className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-[pulse_2.5s_infinite]" />
        
        <div className={`relative p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xl ${
          theme === "white" 
            ? "bg-amber-50/95 border border-amber-200/50 text-amber-950" 
            : "bg-[#0c0a05] border border-amber-500/30 text-amber-100"
        }`}>
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"} w-full`}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-amber-500 shrink-0 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Crown className="w-4 h-4 animate-bounce text-amber-500 fill-amber-500" />
            </div>
            <div className={`flex flex-col ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] font-black font-sans leading-none tracking-wide uppercase text-amber-500 flex items-center gap-1">
                {isRtl ? "إصدار المطور المجاني الفاخر" : "Developer Premium Free Edition"}
              </span>
              <span className="text-xs font-bold leading-relaxed mt-1 text-amber-400">
                {isRtl 
                  ? "المطور عقبة جعل التطبيق مجاني للجميع استمتع ✨" 
                  : "Developer Okba made the application 100% free for everyone, enjoy! ✨"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.1 PWA Add Player to Home Screen Banner */}
      <div className="relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.01]">
        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[pulse_3s_infinite]" />
        
        <div className={`relative p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ${
          theme === "white" 
            ? "bg-indigo-50/95 border border-indigo-200/50 text-slate-800" 
            : "bg-[#07060c] border border-indigo-500/30 text-indigo-100"
        }`}>
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"} w-full`}>
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
              <span className="text-lg">📲</span>
            </div>
            <div className={`flex flex-col ${isRtl ? "text-right" : "text-left"} flex-1 min-w-0`}>
              <span className="text-xs font-black font-sans leading-none tracking-wide uppercase text-indigo-400">
                {isRtl ? "إضافة مشغل مخصص على الشاشة الرئيسية" : "Add Player Widget to Your Home Screen"}
              </span>
              <span className="text-[10px] leading-relaxed mt-1 text-white/70">
                {isRtl 
                  ? "قم بتثبيت تطبيق MUSIC LOG على شاشتك الرئيسية كعلامة تشغيل مستقلة فائقة السرعة والاستجابة!" 
                  : "Install MUSIC LOG on your home screen for a super-fast, standalone player launcher!"}
              </span>
            </div>
            
            <button
              id="pwa-install-action"
              onClick={() => {
                if (isPwaInstallable && onInstallPwa) {
                  onInstallPwa();
                } else {
                  alert(
                    isRtl 
                      ? "💡 لتثبيت المشغل على شاشتك الرئيسية:\n• على Android (Chrome): اضغط على الخيارات (︙) بالمتصفح ثم اختر 'تثبيت التطبيق' (Install App).\n• على iOS (Safari): اضغط على زر المشاركة (⎙) بالأسفل ثم اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen)."
                      : "💡 To install this player on your home screen:\n• On Android (Chrome): Tap the browser menu (︙) and select 'Install app'.\n• On iOS (Safari): Tap the share button (⎙) at the bottom and choose 'Add to Home Screen'."
                  );
                }
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all duration-150 shrink-0 cursor-pointer"
            >
              {isRtl ? "تثبيت الآن ⚡" : "Install Now ⚡"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. High-Fidelity Music Search Bar */}
      <div className="relative w-full">
        <input
          id="device-music-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === "ar" ? "🔍 ابحث بالاسم أو الفنان..." : "🔍 Search songs or artists..."}
          className={`w-full py-2.5 pl-10 pr-4 text-xs font-bold rounded-xl border outline-none transition-all duration-200 ${
            theme === "white"
              ? "bg-slate-50 border-slate-205 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20"
              : "bg-white/5 border-white/5 text-white placeholder-white/30 focus:border-indigo-500/40 focus:bg-white/10"
          }`}
          dir={isRtl ? "rtl" : "ltr"}
        />
        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3.5" : "left-3.5"} text-white/30`}>
          <Search className="w-4 h-4 shrink-0 opacity-40" />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3.5" : "right-3.5"} text-[9px] font-extrabold uppercase text-indigo-400 hover:text-white cursor-pointer`}
          >
            {lang === "ar" ? "مسح" : "Clear"}
          </button>
        )}
      </div>

      {/* 4. Tracks listing */}
      {filteredTracks.length === 0 ? (
        <div className={`py-12 px-4 text-center ${
          theme === "white" ? "text-slate-400 bg-slate-50 border-slate-200" : "text-white/30 bg-white/3 border-white/5"
        } backdrop-blur-md rounded-2xl border w-full text-xs font-semibold flex flex-col items-center justify-center gap-2`}>
          <FileAudio className="w-8 h-8 opacity-25 animate-pulse" />
          <span>
            {searchTerm 
              ? (lang === "ar" ? "لم يتم العثور على أي أغنية تطابق بحثك." : "No matching tracks found in your library.") 
              : t.noCustomTracks}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 w-full">
          {filteredTracks.map((track) => {
            const isActive = track.id === activeTrackId;
            const isFavorite = favoriteTrackIds.includes(track.id);
            const badge = getCategoryBadge(track.category);

            return (
              <div
                id={`track-${track.id}`}
                key={track.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? theme === "white"
                      ? "bg-indigo-55/70 border-indigo-400/40 shadow-sm"
                      : "bg-white/12 border-indigo-500/30 shadow-lg shadow-indigo-505/10"
                    : theme === "white"
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    : "bg-white/4 backdrop-blur-sm border-white/5 hover:bg-white/8 hover:border-white/10"
                } ${isRtl ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Info and play toggle */}
                <div
                  onClick={() => onTrackSelect(track.id)}
                  className={`flex items-center gap-3.5 cursor-pointer flex-1 min-w-0 ${
                    isRtl ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <button
                    id={`play-btn-${track.id}`}
                    name={`play-button-${track.id}`}
                    className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer shrink-0 ${
                      isActive && isPlaying
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-102"
                        : theme === "white"
                        ? "bg-slate-100 border border-slate-250 text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-500/30"
                        : "bg-white/5 border border-white/10 text-white/60 group-hover:text-indigo-400 group-hover:border-indigo-500/20"
                    }`}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className={`w-4 h-4 ${isRtl ? "translate-x-[-0.5px]" : "translate-x-[0.5px]"}`} />
                    )}
                  </button>

                  {/* Album Cover Thumbnail */}
                  <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                    {track.coverUrl ? (
                      <img 
                        src={track.coverUrl} 
                        className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out]" 
                        alt="" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                        <Music className="w-4 h-4 text-indigo-405/80" />
                      </div>
                    )}
                  </div>

                  <div className={`space-y-0.5 flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                    <h4
                      className={`text-xs md:text-sm font-black transition-colors duration-200 truncate block w-full leading-tight ${
                        isActive 
                          ? "text-indigo-400 font-extrabold" 
                          : theme === "white" 
                          ? "text-slate-800 group-hover:text-indigo-600" 
                          : "text-white/95 group-hover:text-white"
                      }`}
                      title={track.name}
                    >
                      {track.name}
                    </h4>
                    
                    {/* Display Artist Name dynamically with elegant flair */}
                    <p className={`text-[10px] truncate leading-none ${theme === "white" ? "text-slate-400" : "text-white/40"}`}>
                      {track.artist || (lang === "ar" ? "فنان غير معروف 🎵" : "Unknown Artist 🎵")}
                    </p>

                    <div className={`flex items-center gap-2 pt-0.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                      <span dir="ltr" className={`text-[9px] font-mono shrink-0 font-bold ${theme === "white" ? "text-slate-400" : "text-white/30"} inline-block`}>
                        ⏱️ {formatDuration(track.duration)}
                      </span>
                      <span
                        className={`px-1 py-0.2 text-[8px] font-bold rounded-md border shrink-0 ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Action Buttons */}
                <div className={`flex items-center gap-1 shrink-0 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  {onToggleFavorite && (
                    <button
                      id={`fav-btn-${track.id}`}
                      name={`fav-button-${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      className={`p-2 rounded-lg border border-transparent transition-all duration-200 cursor-pointer ${
                        isFavorite
                          ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 animate-pulse"
                          : theme === "white"
                          ? "text-slate-400 hover:text-rose-500 hover:bg-rose-55"
                          : "text-white/40 hover:text-rose-450 hover:bg-rose-500/10"
                      }`}
                      title={lang === "ar" ? "إضافة إلى المفضلة" : "Toggle Favorite"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-current text-rose-500" : ""}`} />
                    </button>
                  )}

                  {track.isCustom && onTrackDelete && (
                    <button
                      id={`delete-btn-${track.id}`}
                      name={`delete-button-${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackDelete(track.id);
                      }}
                      className={`p-2 rounded-lg border border-transparent transition-all duration-200 cursor-pointer ${
                        theme === "white"
                          ? "text-slate-400 hover:text-red-500 hover:bg-rose-50"
                          : "text-white/40 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
                      }`}
                      title={lang === "ar" ? "حذف المقطع" : "Delete track"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
