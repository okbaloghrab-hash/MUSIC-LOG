/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Check, X, ShieldCheck, Zap, HeartHandshake } from "lucide-react";
import { translations } from "../types";

interface MockPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
  lang: "ar" | "en";
}

export default function MockPremiumModal({ isOpen, onClose, onActivate, lang }: MockPremiumModalProps) {
  const [activated, setActivated] = useState(false);
  const t = translations[lang];
  const isRtl = lang === "ar";

  if (!isOpen) return null;

  const handleActivate = () => {
    setActivated(true);
    onActivate();
    setTimeout(() => {
      onClose();
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
      <div
        id="premium-card-modal"
        className="relative w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        {/* Decorative ambient background glows */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!activated && (
          <button
            id="close-premium"
            onClick={onClose}
            className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full border border-white/10 transition-all duration-200 cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {activated ? (
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-xl scale-125 animate-ping duration-1000" />
              <div className="p-4 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-400/40">
                <ShieldCheck className="w-10 h-10 animate-bounce" />
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide pt-2">
              {t.premiumSuccess}
            </h2>
            <p className="text-sm text-white/60 font-medium">
              {lang === "ar"
                ? "استعد لصوت تباطؤ ونقاء لا نهائي..."
                : "Get ready for cosmic bass depths and infinite reverb..."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-400 bg-white/5 border border-white/10 rounded-full shadow-inner">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "تفوق صوتي احترافي" : "HF SOUND UNLOCKED"}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                {t.premiumTitle}
              </h2>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                {t.premiumSubtitle}
              </p>
            </div>

            {/* Benefits list */}
            <div className={`space-y-3.5 ${isRtl ? "rtl" : "ltr"}`}>
              <div className={`flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className="p-1.5 rounded-lg bg-white/10 text-indigo-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className={`space-y-0.5 ${isRtl ? "text-right" : "text-left"}`}>
                  <h4 className="text-xs font-bold text-white/95">{lang === "ar" ? "تصدير فائق الدقة" : "Lossless WAV Render"}</h4>
                  <p className="text-[11px] text-white/50 leading-normal">{t.premiumBenefit2}</p>
                </div>
              </div>

              <div className={`flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className="p-1.5 rounded-lg bg-white/10 text-indigo-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className={`space-y-0.5 ${isRtl ? "text-right" : "text-left"}`}>
                  <h4 className="text-xs font-bold text-white/95">{lang === "ar" ? "أبعاد تباطؤ مضاعفة" : "Ultimate Decay Rates"}</h4>
                  <p className="text-[11px] text-white/50 leading-normal">{t.premiumBenefit1}</p>
                </div>
              </div>

              <div className={`flex items-start gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className="p-1.5 rounded-lg bg-white/10 text-indigo-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className={`space-y-0.5 ${isRtl ? "text-right" : "text-left"}`}>
                  <h4 className="text-xs font-bold text-white/95">{lang === "ar" ? "صوت بايس متكامل" : "Sledgehammer Bass Boost"}</h4>
                  <p className="text-[11px] text-white/50 leading-normal">{t.premiumBenefit3}</p>
                </div>
              </div>
            </div>

            {/* Premium CTA Button */}
            <button
               id="unlock-free-premium"
               onClick={handleActivate}
               className="w-full relative group/btn overflow-hidden rounded-2xl p-[1px] cursor-pointer transition-transform active:scale-[0.98]"
            >
              {/* Animated glowing border backdrop */}
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[spin_2.5s_linear_infinite]" />
              <div className="relative py-4 px-6 rounded-2xl bg-black/80 hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400 animate-pulse" />
                <span className="text-sm font-black text-white group-hover/btn:text-indigo-300 transition-colors">
                  {t.activateFree}
                </span>
              </div>
            </button>

            <div className={`flex items-center justify-center gap-1.5 text-[10px] text-white/40 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <HeartHandshake className="w-3.5 h-3.5 text-white/30" />
              <span>{lang === "ar" ? "تفعيل آمن وخالي من أي رسوم مخفية" : "Secure free sandbox activation"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
