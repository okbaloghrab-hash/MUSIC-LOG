/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;
  name: string;
  duration: number; // in seconds
  file?: File;
  fileBlob?: Blob;
  audioBuffer?: AudioBuffer;
  isCustom: boolean;
  category: "ambient" | "synthwave" | "lofi" | "uploaded";
  id3Data?: Uint8Array;
  coverUrl?: string;
  artist?: string;
  album?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;      // 0.5x - 1.5x
  volume: number;     // 0% - 100%
  reverb: number;     // 0 - 100
  bassBoost: number;  // 0 - 15 (gain)
  activeTrackId: string;
  activeTab: "home" | "my-music" | "favorites" | "vocal-splitter";
  language: "ar" | "en";
  isPremium: boolean;
}

export type TranslationKeys =
  | "title"
  | "subtitle"
  | "speed"
  | "volume"
  | "reverb"
  | "bassBoost"
  | "drumBoost"
  | "delayBoost"
  | "clarityBoost"
  | "home"
  | "myMusic"
  | "dailyLimit"
  | "upgrade"
  | "downloads"
  | "saves"
  | "uploadTitle"
  | "uploadSubtitle"
  | "noCustomTracks"
  | "premiumTitle"
  | "premiumSubtitle"
  | "premiumBenefit1"
  | "premiumBenefit2"
  | "premiumBenefit3"
  | "premiumSuccess"
  | "activateFree"
  | "ambientMood"
  | "synthwaveMood"
  | "lofiMood"
  | "exportButton"
  | "ready"
  | "processing"
  | "exportSuccess"
  | "dragDrop"
  | "unlimited"
  | "selectTrack"
  | "builtIn"
  | "reset"
  | "languageLabel"
  | "downloadTip"
  | "downloadIframeAlert"
  | "vocalSplitterTab"
  | "favoritesTab";

export const translations: Record<"ar" | "en", Record<TranslationKeys, string>> = {
  ar: {
    title: "MUSIC LOG",
    subtitle: "استوديو تباطؤ وصدى احترافي",
    speed: "السرعة",
    volume: "الصوت",
    reverb: "الصدى (Reverb)",
    bassBoost: "تعزيز الجهير (Bass)",
    drumBoost: "تضخيم الطبول والإيقاع (Drum Boost)",
    delayBoost: "تأثير التكرار (Delay/Echo)",
    clarityBoost: "وضوح وتحسين الصوت (20 درجة)",
    home: "الرئيسية",
    myMusic: "موسيقاي",
    dailyLimit: "الحد اليومي:",
    upgrade: "ترقية",
    downloads: "تحميلات",
    saves: "حفظ",
    uploadTitle: "إضافة اغنية",
    uploadSubtitle: "اسحب الملف الصوتي هنا أو اضغط للاختيار من جهازك مباشرة",
    noCustomTracks: "لا توجد ملفات مرفوعة بعد. ارفع ملفاتك لتطبيق الفلاتر عليها!",
    premiumTitle: "انضم إلى النسخة الاحترافية الاحترافية 👑",
    premiumSubtitle: "افتح كافة الميزات بأبعاد صوتية غير محدودة وبدون قيود يومية",
    premiumBenefit1: "سرعة تباطؤ فائقة وتحكم بدرجات الصدى العميقة",
    premiumBenefit2: "تصدير الملفات بصيغة WAV نقية وبدون خسارة جودة",
    premiumBenefit3: "مستويات تعزيز بايس (Bass Boost) مضاعفة ومحرك صوتي متطور",
    premiumSuccess: "تهانينا! لقد أصبحت عضواً احترافياً بـ MUSICLOG مجاناً 🌌",
    activateFree: "تفعيل مجاني فوري",
    ambientMood: "ألحان فضائية هادئة - Ambient Loop",
    synthwaveMood: "نبضات ريترو سريعة - Cyber Beats",
    lofiMood: "أجواء لوفي هادئة - Cosmic Lofi",
    exportButton: "تصدير وتحميل كـ WAV",
    ready: "جاهز",
    processing: "جاري المعالجة والتصدير...",
    exportSuccess: "تم تنزيل الموسيقى بنجاح!",
    dragDrop: "اسحب الملف الصوتي وأفلته هنا",
    unlimited: "غير محدود",
    selectTrack: "اختر مقطعاً للتشغيل",
    builtIn: "المقاطع الجاهزة",
    reset: "إعادة تعيين التأثيرات",
    languageLabel: "العربية",
    downloadTip: "تلميح مهم 💡: إذا واجهت مشكلة (صفحة 404 أو لم يبدأ التحميل) على الهاتف أو داخل نافذة المعاينة، يرجى الضغظ على زر 'فتح في نافذة جديدة' بالأعلى لفتح التطبيق بشكل مستقل وتحميل ملفاتك بنجاح وسهولة دون أي قيود! 🔗",
    downloadIframeAlert: "تنبيه التحميل: يرجى التأكد من فتح التطبيق في علامة تبويب خارجية لتجنب مشكلة حظر التنزيلات بداخل النوافذ الفرعية.",
    vocalSplitterTab: "فصل الأصوات",
    favoritesTab: "المفضلة",
  },
  en: {
    title: "MUSIC LOG",
    subtitle: "Professional Slowed & Reverb Studio",
    speed: "Speed",
    volume: "Volume",
    reverb: "Reverb",
    bassBoost: "Bass Boost",
    drumBoost: "Drums & Rhythm (Drum Boost)",
    delayBoost: "Repeat / Echo Delay Effect",
    clarityBoost: "Vocal Clarity & Audio Enhancer (20 levels)",
    home: "Home",
    myMusic: "My Music",
    dailyLimit: "Daily Limit:",
    upgrade: "Upgrade",
    downloads: "Downloads",
    saves: "Saves",
    uploadTitle: "Add Song",
    uploadSubtitle: "Drag audio here or click to choose from your device",
    noCustomTracks: "No uploaded tracks yet. Upload your files to apply beautiful filters!",
    premiumTitle: "Upgrade to MUSICLOG Premium 👑",
    premiumSubtitle: "Unlock unlimited daily saves, high-fidelity WAV downloads, and advanced effects",
    premiumBenefit1: "Deeper slow transitions and advanced micro-echo parameters",
    premiumBenefit2: "Export lossless CD-quality WAV files instantly",
    premiumBenefit3: "Extreme bass distortion-free booster and immersive visuals",
    premiumSuccess: "Congratulations! You are now an MUSICLOG Premium Member 🌌",
    activateFree: "Activate Free Trial",
    ambientMood: "Galactic Serenity - Ambient Loop",
    synthwaveMood: "Cyber Pulse - Retro Beats",
    lofiMood: "Cosmic Cozy - Cozy Lofi",
    exportButton: "Export & Download WAV",
    ready: "Ready",
    processing: "Processing export...",
    exportSuccess: "Audio exported and downloaded successfully!",
    dragDrop: "Drag and drop your audio files here",
    unlimited: "Unlimited",
    selectTrack: "Select a track to play",
    builtIn: "Sample Library",
    reset: "Reset Effects",
    languageLabel: "English",
    downloadTip: "Important Tip 💡: If you encounter issues (404 error or download doesn't start) on mobile or inside the preview iframe, please tap the 'Open in new window' icon at the top of the screen to open the app in a standalone tab and download your tracks smoothly! 🔗",
    downloadIframeAlert: "Download Alert: Please run the application in an external independent tab to prevent the browser from blocking file downloads inside the embedded iframe.",
    vocalSplitterTab: "Vocal Splitter",
    favoritesTab: "Favorites",
  },
};
