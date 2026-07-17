/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, Check, Smartphone, Info
} from "lucide-react";
import { DownloadTask, DownloadCategory } from "../types.js";

interface OpenFileModalProps {
  task: DownloadTask;
  isDark: boolean;
  onClose: () => void;
  onSuccess: (appName: string) => void;
  onShowInFolder?: (task: DownloadTask) => void;
}

interface AppOption {
  name: string;
  icon: string;
  desc: string;
  package?: string;
}

// Android apps capable of executing specific download categories
const ANDROID_APPS_BY_CATEGORY: Record<Exclude<DownloadCategory, 'all'>, AppOption[]> = {
  video: [
    { name: "MX Player", icon: "🎬", desc: "پخش‌کننده حرفه‌ای با شتاب‌دهنده سخت‌افزاری", package: "com.mxtech.videoplayer.ad" },
    { name: "VLC for Android", icon: "🧡", desc: "پخش رایگان و همه‌کاره ویدیو و زیرنویس فارسی", package: "org.videolan.vlc" },
    { name: "پخش‌کننده پیش‌فرض اندروید (گالری)", icon: "📱", desc: "پخش مستقیم با ابزار استاندارد سیستم‌عامل" },
    { name: "KMPlayer Mobile", icon: "📼", desc: "پخش ویدیوهای باکیفیت بالا روی موبایل", package: "com.kmplayer" }
  ],
  music: [
    { name: "Samsung Music", icon: "🎵", desc: "پخش‌کننده صوتی بومی و بهینه گوشی‌های سامسونگ", package: "com.sec.android.app.music" },
    { name: "YouTube Music", icon: "🔴", desc: "مدیریت و پخش فایل‌های صوتی محلی و ابری", package: "com.google.android.apps.youtube.music" },
    { name: "VLC for Audio", icon: "🎧", desc: "پخش صوتی بدون افت کیفیت", package: "org.videolan.vlc" },
    { name: "Google Files Player", icon: "📁", desc: "پخش سبک و سریع پس‌زمینه" }
  ],
  document: [
    { name: "Google PDF Viewer", icon: "📄", desc: "سریع‌ترین و سبک‌ترین نمایشگر اسناد گوگل", package: "com.google.android.apps.pdfviewer" },
    { name: "Adobe Acrobat Reader Mobile", icon: "📕", desc: "نمایشگر استاندارد و پیشرفته اسناد متنی ادوبی", package: "com.adobe.reader" },
    { name: "WPS Office", icon: "📝", desc: "مشاهده و ویرایش انواع فایل‌های ورد، اکسل و پی‌دی‌اف", package: "cn.wps.moffice_eng" }
  ],
  software: [
    { name: "Android Package Installer", icon: "⚙️", desc: "نصب‌کننده پیش‌فرض پکیج‌های اندروید (System Installer)" }
  ],
  compressed: [
    { name: "RAR for Android", icon: "📦", desc: "نرم‌افزار رسمی استخراج و فشرده‌سازی فایل‌های rar و zip", package: "com.rarlab.rar" },
    { name: "ZArchiver", icon: "🗜️", desc: "برنامه مدیریت و استخراج سریع فشرده با ظرفیت بالا", package: "ru.zdevs.zarchiver" }
  ],
  other: [
    { name: "Android System Browser", icon: "🌐", desc: "نمایش مستقیم پیش‌نمایش در مرورگر دستگاه" },
    { name: "Android System Share", icon: "🔗", desc: "ارسال فایل با اهداف اشتراک‌گذاری سیستم" }
  ]
};

export default function OpenFileModal({ task, isDark, onClose, onSuccess }: OpenFileModalProps) {
  const options = ANDROID_APPS_BY_CATEGORY[task.category] || ANDROID_APPS_BY_CATEGORY.other;
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [useAlways, setUseAlways] = useState(false);

  const handleLaunch = (isAlways: boolean) => {
    setUseAlways(isAlways);
    const selectedApp = options[selectedIdx];
    setLaunching(true);
    setLaunchProgress(15);
    
    // Animate progress bar simulation
    const interval = setInterval(() => {
      setLaunchProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSuccess(true);
          
          // Trigger correct native application or stream endpoint
          try {
            const ua = navigator.userAgent.toLowerCase();
            const isAndroid = ua.includes("android");
            const isIOS = ua.includes("iphone") || ua.includes("ipad");

            if (isAndroid && selectedApp.package) {
              const mimeType = task.category === "video" ? "video/*" :
                               task.category === "music" ? "audio/*" :
                               task.category === "document" ? "application/pdf" : "*/*";
              
              const intentUrl = `intent:${task.url}#Intent;package=${selectedApp.package};action=android.intent.action.VIEW;type=${mimeType};S.title=${encodeURIComponent(task.name)};S.browser_fallback_url=${encodeURIComponent(task.url)};end`;
              window.location.href = intentUrl;
            } else if ((isAndroid || isIOS) && navigator.share) {
              navigator.share({
                title: task.name,
                text: `پخش فایل با پخش‌کننده گوشی`,
                url: task.url
              }).catch(() => {
                window.open(task.url, "_blank");
              });
            } else {
              const link = document.createElement('a');
              link.href = task.url;
              link.target = '_blank';
              link.setAttribute("download", task.name);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } catch (err) {
            console.error("Failed to trigger native launcher target", err);
          }

          setTimeout(() => {
            onSuccess(selectedApp.name);
          }, 1200);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 15;
      });
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ direction: "rtl" }}>
      <div 
        className={`w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-3xl border-t sm:border p-6 sm:p-7 shadow-2xl transition-all ${
          isDark 
            ? "bg-[#1C1C1E] border-white/10 text-white" 
            : "bg-white border-slate-200 text-slate-800"
        } max-h-[92vh] flex flex-col`}
      >
        {/* Android bottom sheet indicator line on mobile screens */}
        <div className="w-12 h-1.5 bg-neutral-500/25 rounded-full mx-auto mb-5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-white/5 shrink-0">
          <div className="text-right">
            <h3 className="font-bold text-[15px] text-white/95 flex items-center gap-2">
              <Smartphone size={18} className="text-emerald-400" />
              <span>بازکردن با... (Open with)</span>
            </h3>
            <p className="text-[11px] text-white/50 mt-1 truncate max-w-[280px]" title={task.name}>
              فایل: {task.name}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors hover:bg-white/5 ${isDark ? "text-white/40" : "text-slate-400"}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
          {!launching ? (
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed text-emerald-400/95 bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-2.5 rounded-2xl flex items-start gap-2">
                <Info size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>برنامه مورد نظر خود را جهت باز کردن فایل انتخاب کنید:</span>
              </p>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-right flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      selectedIdx === idx
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm"
                        : isDark
                          ? "bg-[#252529] border-white/5 text-white/80 hover:bg-[#2c2c31] hover:border-white/10"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                        {opt.icon}
                      </span>
                      <div className="text-right">
                        <h5 className="text-[12px] font-bold text-white/95">{opt.name}</h5>
                        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>
                    {selectedIdx === idx && (
                      <span className="w-5.5 h-5.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Launching animation state */
            <div className="py-12 text-center flex flex-col items-center justify-center gap-4 animate-fadeIn">
              {!success ? (
                <>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-2xl">{options[selectedIdx].icon}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white/90">در حال ارسال دستور Intent به اندروید...</h4>
                    <p className="text-[10px] text-white/40">انتقال فایل به برنامه {options[selectedIdx].name}</p>
                  </div>
                  <div className={`w-44 h-1.5 rounded-full overflow-hidden relative ${isDark ? "bg-black/40" : "bg-slate-100"}`}>
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min(100, launchProgress)}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-scaleUp">
                    <Check size={26} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/90">
                      {useAlways ? "انتخاب به عنوان پخش‌کننده همیشگی ثبت شد" : "اجرا در پخش‌کننده گوشی"}
                    </h4>
                    <p className="text-[11px] text-emerald-400 mt-1.5 font-bold">
                      فایل با موفقیت به {options[selectedIdx].name} منتقل شد.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons styled like native Android system options */}
        {!launching && (
          <div className="pt-4 border-t border-white/5 flex gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => handleLaunch(false)}
              className="flex-1 py-3.5 bg-[#252529] hover:bg-[#2c2c31] border border-white/5 text-white/95 font-bold rounded-2xl text-[11px] cursor-pointer active:scale-95 transition-all text-center"
            >
              فقط همین بار (Just Once)
            </button>
            <button
              type="button"
              onClick={() => handleLaunch(true)}
              className="flex-1 py-3.5 bg-emerald-650 hover:bg-emerald-600 text-white font-bold rounded-2xl text-[11px] cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-center"
            >
              همیشه (Always)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
