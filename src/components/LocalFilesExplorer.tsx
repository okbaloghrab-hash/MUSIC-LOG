/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from "react";
import { 
  Folder, FolderPlus, FileAudio, Search, ArrowLeft, MoreVertical, 
  Trash2, Play, Pause, Info, HardDrive, ShieldCheck, ShieldAlert,
  ChevronRight, ArrowUpRight, Music, Heart, Sparkles, FolderHeart
} from "lucide-react";
import { Track, translations } from "../types";

interface LocalFilesExplorerProps {
  tracks: Track[];
  onFileSelect: (file: File) => void;
  activeTrackId: string;
  isPlaying: boolean;
  onTrackSelect: (id: string) => void;
  onTrackDelete?: (id: string) => void;
  lang: "ar" | "en";
  theme: "green" | "purple" | "white";
  favoriteTrackIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

interface VirtualFolder {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "all" | "ambient" | "synthwave" | "lofi" | "uploaded" | "favorites" | "custom";
  icon: React.ElementType;
}

export default function LocalFilesExplorer({
  tracks,
  onFileSelect,
  activeTrackId,
  isPlaying,
  onTrackSelect,
  onTrackDelete,
  lang,
  theme,
  favoriteTrackIds = [],
  onToggleFavorite
}: LocalFilesExplorerProps) {
  const isRtl = lang === "ar";
  const t = translations[lang];

  // Current folder selection state ("device" is the root parent, otherwise a specific folder ID)
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFileDetails, setSelectedFileDetails] = useState<Track | null>(null);

  // Virtual storage used count
  const calculatedStorageMB = useMemo(() => {
    // Generate simulated MB sizes per duration/category
    let total = 12.4; 
    tracks.forEach(track => {
      if (track.isCustom) {
        total += Math.round((track.duration * 0.15) * 10) / 10; // 0.15MB per sec roughly
      } else {
        total += 4.5;
      }
    });
    return parseFloat(total.toFixed(1));
  }, [tracks]);

  // Media Stores Permission prompt simulation State
  const [permissionState, setPermissionState] = useState<"prompt" | "requesting" | "granted">(() => {
    return (localStorage.getItem("musiclog_media_permission") as "prompt" | "requesting" | "granted") || "granted";
  });

  // Custom live folder creator
  const [customFolders, setCustomFolders] = useState<VirtualFolder[]>(() => {
    const saved = localStorage.getItem("musiclog_custom_folders");
    return saved ? JSON.parse(saved) : [];
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Define Preset Folders
  const systemFolders = useMemo<VirtualFolder[]>(() => {
    return [
      { id: "ambient", nameAr: "أصوات الطبيعة والخلفيات", nameEn: "Ambient Presets", category: "ambient", icon: Folder },
      { id: "synthwave", nameAr: "موسيقى سايبر ريترو", nameEn: "Retro Synthwave", category: "synthwave", icon: Folder },
      { id: "lofi", nameAr: "موجات لوفي الهادئة", nameEn: "Lofi Chillbeats", category: "lofi", icon: Folder },
      { id: "uploaded", nameAr: "الملفات والمسارات المرفوعة", nameEn: "Loaded Sound Files", category: "uploaded", icon: Folder },
      { id: "favorites", nameAr: "المقاطع الصوتية المفضلة", nameEn: "Favorite Folder", category: "favorites", icon: FolderHeart },
    ];
  }, []);

  const folders = useMemo(() => {
    return [...systemFolders, ...customFolders];
  }, [systemFolders, customFolders]);

  // Requesting mock storage permission
  const handleRequestPermission = () => {
    setPermissionState("requesting");
    setTimeout(() => {
      setPermissionState("granted");
      localStorage.setItem("musiclog_media_permission", "granted");
    }, 1100);
  };

  // Create customized user folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folderId = "folder_" + Math.random().toString(36).substring(2, 9);
    const updated: VirtualFolder[] = [
      ...customFolders,
      {
        id: folderId,
        nameAr: newFolderName,
        nameEn: newFolderName,
        category: "custom",
        icon: Folder
      }
    ];
    setCustomFolders(updated);
    localStorage.setItem("musiclog_custom_folders", JSON.stringify(updated));
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  // Filter Tracks to current path
  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  const folderTracks = useMemo(() => {
    if (currentFolderId === "root") return tracks;

    if (!currentFolder) return [];

    let filtered = tracks;
    if (currentFolder.category === "favorites") {
      filtered = tracks.filter(t => favoriteTrackIds.includes(t.id));
    } else if (currentFolder.category !== "custom" && currentFolder.category !== "all") {
      filtered = tracks.filter(t => t.category === currentFolder.category);
    } else if (currentFolder.category === "custom") {
      // For custom subfolders, distribute some tracks dynamically or display uploaded list
      filtered = tracks.filter(t => t.category === "uploaded");
    }

    return filtered;
  }, [tracks, currentFolderId, currentFolder, favoriteTrackIds]);

  // Keyword filter
  const displayedTracks = useMemo(() => {
    if (!searchTerm.trim()) return folderTracks;
    return folderTracks.filter(tr => 
      tr.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (tr.artist && tr.artist.toLowerCase().includes(searchTerm.toLowerCase().trim()))
    );
  }, [folderTracks, searchTerm]);

  // Helper formats
  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getSimulatedDetails = (track: Track) => {
    const size = track.isCustom 
      ? (Math.round((track.duration * 0.15) * 10) / 10).toFixed(1) + " MB"
      : "5.4 MB";
    const bitrate = track.isCustom ? "Lossless WAV (16-bit)" : "320kbps MP3";
    const addedDate = track.isCustom ? "Just newly imported" : "System preset cache";
    return { size, bitrate, addedDate };
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* Device Storage Status Bar & Header */}
      <div className="bg-[#0b0c11] border border-white/5 rounded-2xl p-4.5 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <HardDrive className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className={isRtl ? "text-right" : "text-left"}>
              <h4 className="text-xs font-black text-white">{isRtl ? "مستكشف الملفات والمشغل الذكي" : "Audio Files App & Local Player"}</h4>
              <span className="text-[9px] font-mono text-white/40 block">STORAGE PATH: /storage/emulated/0/Music</span>
            </div>
          </div>
          
          <span className="text-[10px] font-mono font-black text-[#50e3c2] bg-[#50e3c2]/5 px-2.5 py-1 border border-[#50e3c2]/10 rounded-lg">
            {calculatedStorageMB} MB / 512 MB
          </span>
        </div>

        {/* ProgressBar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${(calculatedStorageMB / 512) * 100}%` }}
            />
          </div>
          <div className={`flex items-center justify-between text-[9px] font-bold text-white/40 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <span>{isRtl ? "تطبيق مستندات الكاش المتكامل" : "Virtual device soundwave indexing active"}</span>
            <span>{Math.round((calculatedStorageMB / 512) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Permissions Notification */}
      {permissionState !== "granted" && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-3">
          <div className={`flex gap-3 items-start ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-black text-amber-500">{isRtl ? "مطلوب الإذن للوصول لملفات الجهاز 🔒" : "File Storage Scanner Off 🔒"}</h5>
              <p className="text-[10px] text-white/60 leading-normal">
                {isRtl 
                  ? "قم بمنح التطبيق حق قراءة ملفات الموسيقى لتشغيل مقاطع الصوت المخزنة في ذكرة هاتفك الحقيقية بشكل فوري."
                  : "Allow standalone storage indexing to directly list local audio files, download overlays, and read album covers."}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-0.5">
            <button 
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 text-[10px] font-black text-amber-400 active:scale-95 duration-100 transition-all cursor-pointer"
            >
              {isRtl ? "منح صلاحية الملفات الآن" : "Grant Files Permission"}
            </button>
          </div>
        </div>
      )}

      {/* Main Files Work Area */}
      <div className="bg-[#0c0d12]/95 border border-white/5 rounded-2xl p-4.5 md:p-5 space-y-4">
        
        {/* Navigation Breadcrumbs & Actions */}
        <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          
          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"} min-w-0`}>
            {currentFolderId !== "root" && (
              <button
                onClick={() => {
                  setCurrentFolderId("root");
                  setSelectedFileDetails(null);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            
            <div className={`flex items-center gap-1.5 text-xs font-bold leading-none ${isRtl ? "flex-row-reverse" : "flex-row"} min-w-0 truncate`}>
              <span className="text-white/40">{isRtl ? "جهازي" : "Device"}</span>
              <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
              <span className="text-indigo-400 truncate">
                {currentFolderId === "root" 
                  ? (isRtl ? "ملفات الصوت" : "Audio root") 
                  : (isRtl ? currentFolder?.nameAr : currentFolder?.nameEn)}
              </span>
            </div>
          </div>

          {/* New Folder trigger on root */}
          {currentFolderId === "root" && (
            <button
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black text-indigo-405 border border-white/5 flex items-center gap-1 transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isRtl ? "+ مجلد جديد" : "New Folder"}</span>
            </button>
          )}

        </div>

        {/* Folder Creator Input panel */}
        {isCreatingFolder && (
          <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex gap-2 animate-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={isRtl ? "اسم المجلد الجديد..." : "New folder name..."}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              dir={isRtl ? "rtl" : "ltr"}
            />
            <button
              onClick={handleCreateFolder}
              className="px-3 rounded-lg bg-indigo-600 text-xs font-black text-white hover:bg-indigo-500 transition-all cursor-pointer"
            >
              {isRtl ? "إنشاء" : "Create"}
            </button>
          </div>
        )}

        {/* Inline Folder Search Filter */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? "🔍 ابحث عن الملفات وعناوين الصوت..." : "🔍 Search audio files & cache..."}
            className="w-full py-2.5 pl-9 pr-4 text-xs font-bold rounded-xl bg-black/30 border border-white/5 text-white/90 placeholder-white/35 outline-none focus:border-indigo-500/40"
            dir={isRtl ? "rtl" : "ltr"}
          />
        </div>

        {/* Grid of Folders (only shown in Root) */}
        {currentFolderId === "root" && !searchTerm && (
          <div className="grid grid-cols-2 gap-3 pb-2.5">
            {folders.map(folder => {
              // Count songs in folder category
              let count = 0;
              if (folder.category === "favorites") {
                count = tracks.filter(t => favoriteTrackIds.includes(t.id)).length;
              } else if (folder.category !== "custom" && folder.category !== "all") {
                count = tracks.filter(t => t.category === folder.category).length;
              } else {
                count = tracks.filter(t => t.category === "uploaded").length;
              }

              const FIcon = folder.icon;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`group p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 hover:border-indigo-500/20 active:scale-98 transition-all cursor-pointer flex gap-3 items-center ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-505/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    <FIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className={`min-w-0 flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                    <h5 className="text-[11px] font-black leading-tight text-white/90 truncate block group-hover:text-indigo-400 transition-colors">
                      {isRtl ? folder.nameAr : folder.nameEn}
                    </h5>
                    <span className="text-[9px] font-mono text-white/40 block mt-0.5">
                      {count} {isRtl ? "عنصر" : "files"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Audio Files List rendering */}
        <div className="space-y-2.5">
          {displayedTracks.length === 0 ? (
            <div className="py-12 text-center text-white/30 bg-white/3 rounded-xl border border-white/5 text-xs font-semibold flex flex-col items-center justify-center gap-2">
              <FileAudio className="w-8 h-8 opacity-20 animate-pulse" />
              <span>
                {isRtl ? "لا توجد ملفات صوتية مدعومة داخل هذا المجلد." : "No audio files indexed in this folder."}
              </span>
            </div>
          ) : (
            displayedTracks.map(track => {
              const isActive = track.id === activeTrackId;
              const isFavorite = favoriteTrackIds.includes(track.id);
              const details = getSimulatedDetails(track);

              return (
                <div key={track.id} className="space-y-2">
                  <div
                    onClick={() => {
                      if (selectedFileDetails?.id === track.id) {
                        setSelectedFileDetails(null);
                      } else {
                        setSelectedFileDetails(track);
                      }
                    }}
                    className={`group p-3 rounded-xl border border-white/5 hover:border-white/10 active:bg-white/5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive ? "bg-indigo-550/10 border-indigo-500/20" : "bg-black/20"
                    } ${isRtl ? "flex-row-reverse" : "flex-row"}`}
                  >
                    
                    {/* Left: icon/play togglers & name */}
                    <div className={`flex items-center gap-3 min-w-0 flex-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackSelect(track.id);
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isActive && isPlaying 
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-white/5 hover:bg-white/10 text-white/70"
                        }`}
                      >
                        {isActive && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-px" />}
                      </button>

                      <div className="relative shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center shadow">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <Music className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>

                      <div className={`min-w-0 flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                        <h5 className={`text-[11px] font-black truncate block leading-tight ${isActive ? "text-indigo-400" : "text-white/90"}`}>
                          {track.name}
                        </h5>
                        <div className={`flex items-center gap-2 mt-0.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                          <span className="text-[9px] text-white/40 font-mono inline-block">{details.size}</span>
                          <span className="w-1 h-1 rounded-full bg-white/15" />
                          <span className="text-[9px] text-white/40 font-mono inline-block">{details.bitrate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: duration, heart, or contextual toggles */}
                    <div className={`flex items-center gap-1.5 shrink-0 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="text-[10px] font-mono text-white/35 font-bold">{formatSecs(track.duration)}</span>
                      
                      {/* Heart option */}
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(track.id);
                          }}
                          className={`p-1.5 rounded-md hover:bg-white/5 transition-all shrink-0 ${
                            isFavorite ? "text-rose-500 fill-current" : "text-white/20"
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Explicit Delete */}
                      {track.isCustom && onTrackDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTrackDelete(track.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Detailed File Inspector expanded underneath on Click */}
                  {selectedFileDetails?.id === track.id && (
                    <div className="p-3.5 bg-white/3 border border-white/5 rounded-xl space-y-3 font-sans animate-in slide-in-from-top-2 duration-150">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                          <span className="text-white/35">{isRtl ? "تاريخ الحفظ والإنشاء" : "Index Date"}</span>
                          <p className="text-white/80 font-bold mt-0.5">{details.addedDate}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                          <span className="text-white/35">{isRtl ? "قناة التردد والترميز" : "Codec & Channel"}</span>
                          <p className="text-white/80 font-bold mt-0.5">{track.isCustom ? "PCM Stereo" : "MPEG L3 Stereo"}</p>
                        </div>
                      </div>

                      {/* Open Soundwave modifications trigger action */}
                      <div className={`flex gap-2 justify-end ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <button
                          onClick={() => {
                            onTrackSelect(track.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black text-white cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          <span>{isRtl ? "تطبيق المؤثرات والتباطؤ 🎛️" : "Apply Effects Studio 🎛️"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
