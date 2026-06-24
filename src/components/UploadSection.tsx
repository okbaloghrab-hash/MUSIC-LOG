/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Plus, AlertCircle, ShieldCheck } from "lucide-react";
import { translations } from "../types";

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  lang: "ar" | "en";
  theme?: string;
}

export default function UploadSection({ onFileSelect, lang, theme = "black" }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = translations[lang];
  const isRtl = lang === "ar";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files: FileList) => {
    let validFilesFound = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        file.type.startsWith("audio/") ||
        file.name.endsWith(".m4a") ||
        file.name.endsWith(".mp3") ||
        file.name.endsWith(".wav") ||
        file.name.endsWith(".ogg")
      ) {
        validFilesFound++;
        onFileSelect(file);
      }
    }
    if (validFilesFound === 0 && files.length > 0) {
      setErrorMsg(
        lang === "ar"
          ? "يرجى اختيار ملفات صوتية صالحة (MP3, WAV, M4A, إلخ)"
          : "Please select valid audio files (e.g. MP3, WAV, M4A)"
      );
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Theme adaptabilities
  let zoneClasses = "border-white/10 bg-white/5 backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/10 text-white";
  let activeDragClasses = "border-indigo-500 bg-white/10 shadow-lg shadow-indigo-500/10 scale-[1.01]";
  let iconContainer = "bg-white/5 border border-white/10 text-indigo-400 group-hover:text-indigo-300 group-hover:border-white/20";
  let titleColor = "text-white/90 group-hover:text-indigo-400";
  let subtitleColor = "text-white/40";
  let badgeClasses = "bg-indigo-950/30 border-indigo-500/10 text-indigo-300";

  if (theme === "green") {
    zoneClasses = "border-emerald-500/15 bg-emerald-950/10 hover:border-emerald-400/40 hover:bg-emerald-950/20 text-emerald-100";
    activeDragClasses = "border-emerald-400 bg-emerald-950/35 shadow-lg shadow-emerald-500/10 scale-[1.01]";
    iconContainer = "bg-emerald-500/10 border border-emerald-500/15 text-emerald-405 group-hover:text-emerald-305";
    titleColor = "text-emerald-100 group-hover:text-emerald-400";
    subtitleColor = "text-emerald-300/40";
    badgeClasses = "bg-emerald-950/40 border-emerald-500/15 text-emerald-400";
  } else if (theme === "purple") {
    zoneClasses = "border-violet-500/15 bg-violet-950/10 hover:border-fuchsia-400/40 hover:bg-violet-950/20 text-violet-100";
    activeDragClasses = "border-fuchsia-400 bg-violet-950/35 shadow-lg shadow-fuchsia-500/10 scale-[1.01]";
    iconContainer = "bg-violet-550/10 border border-violet-500/15 text-fuchsia-400 group-hover:text-fuchsia-300";
    titleColor = "text-violet-100 group-hover:text-fuchsia-400";
    subtitleColor = "text-violet-300/40";
    badgeClasses = "bg-violet-950/40 border-violet-500/15 text-fuchsia-350";
  } else if (theme === "white") {
    zoneClasses = "border-slate-200 bg-slate-50 hover:border-indigo-500/40 hover:bg-indigo-50/20 text-slate-800";
    activeDragClasses = "border-indigo-600 bg-indigo-50/50 shadow-sm scale-[1.01]";
    iconContainer = "bg-slate-100 border border-slate-205 text-indigo-650 group-hover:text-indigo-700";
    titleColor = "text-slate-800 group-hover:text-indigo-600";
    subtitleColor = "text-slate-500";
    badgeClasses = "bg-indigo-50 border-indigo-100 text-indigo-600";
  }

  return (
    <div
      id="upload-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative cursor-pointer select-none rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 group ${
        isDragging ? activeDragClasses : zoneClasses
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3, audio/mpeg, audio/x-m4a, audio/m4a, audio/wav, audio/x-wav, audio/flac, .mp3, .m4a, .wav, .flac"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Decorative linear glow */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none rounded-2xl overflow-hidden">
        <div className="h-0.5 w-[50%] mx-auto bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent group-hover:via-indigo-400 group-hover:w-[80%] transition-all duration-700" />
      </div>

      <div className="relative">
        {/* Soft glowing concentric rings */}
        <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className={`w-20 h-20 rounded-full shadow-lg border group-hover:scale-110 transition-all duration-300 flex items-center justify-center ${iconContainer}`}>
          <Plus className="w-12 h-12 transition-transform duration-300 group-hover:rotate-90" />
        </div>
      </div>

      <div className={`space-y-1.5 ${isRtl ? "text-right" : "text-left"} flex flex-col items-center`}>
        <h3 className={`text-sm md:text-base font-bold transition-colors duration-200 ${titleColor}`}>
          {t.uploadTitle}
        </h3>
        <p className={`text-xs font-semibold ${subtitleColor}`}>
          {t.uploadSubtitle}
        </p>
      </div>

      {/* Persistence confirmation badge explicitly clarifying that cover image is preserved */}
      <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] md:text-xs font-semibold leading-none shadow-sm transition-all duration-300 ${badgeClasses} ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isRtl
            ? "يتم قراءة غلاف الموسيقى وحفظه بشكل دائم ولا ينحذف عند التحديث 💾"
            : "Artwork details are permanently parsed & kept intact across refreshes! 💾"}
        </span>
      </div>

      {errorMsg && (
        <div className={`mt-2 flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-xl ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
