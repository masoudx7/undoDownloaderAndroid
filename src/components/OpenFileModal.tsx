/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Smartphone, Check } from "lucide-react";
import { DownloadTask, DownloadCategory } from "../types.js";

interface OpenFileModalProps {
  task: DownloadTask;
  isDark: boolean;
  onClose: () => void;
  onSuccess: (appName: string) => void;
}

interface AppOption {
  name: string;
  icon: string;
  package?: string;
}

const ANDROID_APPS_BY_CATEGORY: Record<Exclude<DownloadCategory, 'all'>, AppOption[]> = {
  video: [
    { name: "MX Player", icon: "🎬", package: "com.mxtech.videoplayer.ad" },
    { name: "VLC Player", icon: "🧡", package: "org.videolan.vlc" },
    { name: "پخش‌کننده سیستمی", icon: "📱" }
  ],
  music: [
    { name: "Samsung Music", icon: "🎵", package: "com.sec.android.app.music" },
    { name: "Google Files", icon: "📁" },
    { name: "YouTube Music", icon: "🔴", package: "com.google.android.apps.youtube.music" }
  ],
  document: [
    { name: "Google PDF", icon: "📄", package: "com.google.android.apps.pdfviewer" },
    { name: "Adobe Reader", icon: "📕", package: "com.adobe.reader" },
    { name: "WPS Office", icon: "📝", package: "cn.wps.moffice_eng" }
  ],
  software: [
    { name: "Package Installer", icon: "⚙️" }
  ],
  compressed: [
    { name: "RAR Extractor", icon: "📦", package: "com.rarlab.rar" },
    { name: "ZArchiver", icon: "🗜️", package: "ru.zdevs.zarchiver" }
  ],
  other: [
    { name: "System Browser", icon: "🌐" },
    { name: "Android Share", icon: "🔗" }
  ]
};

export default function OpenFileModal({ task, isDark, onClose, onSuccess }: OpenFileModalProps) {
  const options = ANDROID_APPS_BY_CATEGORY[task.category] || ANDROID_APPS_BY_CATEGORY.other;
  const [selectedApp, setSelectedApp] = useState<AppOption | null>(null);
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLaunch = (app: AppOption) => {
    setSelectedApp(app);
    setLaunching(true);
    
    // Simulate intent transfer delay
    setTimeout(() => {
      setSuccess(true);
      
      try {
        const ua = navigator.userAgent.toLowerCase();
        const isAndroid = ua.includes("android");
        const isIOS = ua.includes("iphone") || ua.includes("ipad");

        if (isAndroid && app.package) {
          const mimeType = task.category === "video" ? "video/*" :
                           task.category === "music" ? "audio/*" :
                           task.category === "document" ? "application/pdf" : "*/*";
          
          const intentUrl = `intent:${task.url}#Intent;package=${app.package};action=android.intent.action.VIEW;type=${mimeType};S.title=${encodeURIComponent(task.name)};S.browser_fallback_url=${encodeURIComponent(task.url)};end`;
          window.location.href = intentUrl;
        } else if ((isAndroid || isIOS) && navigator.share) {
          navigator.share({
            title: task.name,
            text: `پخش فایل با ${app.name}`,
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
        onSuccess(app.name);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ direction: "rtl" }}>
      <div 
        className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border-t sm:border p-6 shadow-2xl transition-all ${
          isDark 
            ? "bg-[#18181B] border-white/10 text-white" 
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Top Handle for mobile Bottom Sheet look */}
        <div className="w-10 h-1 bg-neutral-500/30 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="text-right">
            <h3 className="font-bold text-sm text-white/90 flex items-center gap-1.5">
              <Smartphone size={16} className="text-emerald-400" />
              <span>باز کردن فایل با برنامه گوشی</span>
            </h3>
            <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[240px]" title={task.name}>
              {task.name}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main interactive area */}
        <div className="py-4">
          {!launching ? (
            <div className="grid grid-cols-1 gap-2">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLaunch(opt)}
                  className={`w-full p-3 rounded-xl border text-right flex items-center gap-3.5 transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#202024] border-white/5 text-white/80 hover:bg-[#27272C] hover:border-white/10"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-lg w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    {opt.icon}
                  </span>
                  <div className="text-right">
                    <h5 className="text-[11px] font-bold text-white/95">{opt.name}</h5>
                    <p className="text-[9px] text-white/40 mt-0.5">کلیک جهت اجرا در تلفن همراه</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Direct Loader */
            <div className="py-8 text-center flex flex-col items-center justify-center gap-4 animate-fadeIn">
              {!success ? (
                <>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-xl">{selectedApp?.icon}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-white/95">در حال فراخوانی {selectedApp?.name}...</h4>
                    <p className="text-[9px] text-white/45">ارسال آدرس مستقیم استریم به اندروید</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-scaleUp">
                    <Check size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white/95">با موفقیت ارسال شد</h4>
                    <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                      فایل در برنامه {selectedApp?.name} باز شد.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
