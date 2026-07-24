/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Smartphone, Check, Copy, HardDrive, Terminal, Shield, Zap, Download } from "lucide-react";

interface NativeAppExporterModalProps {
  isDark: boolean;
  onClose: () => void;
}

export default function NativeAppExporterModal({ isDark, onClose }: NativeAppExporterModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const buildSteps = [
    {
      title: "۱. خروجی کدهای وب (Production Build)",
      cmd: "npm run build",
      desc: "تولید فایل‌های بهینه‌شده وب در پوشه dist"
    },
    {
      title: "۲. افزودن پلتفرم نیتیو اندروید",
      cmd: "npx cap add android",
      desc: "ساخت پروژه کامل Android Studio با Kotlin و Java"
    },
    {
      title: "۳. همگام‌سازی کدهای لایه وب با سیستم‌عامل",
      cmd: "npx cap sync",
      desc: "انتقال پلاگین‌های Filesystem و Share به لایه نیتیو"
    },
    {
      title: "۴. بازکردن در Android Studio جهت خروجی APK",
      cmd: "npx cap open android",
      desc: "تولید فایل خروجی Undo_Download_Manager.apk"
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" style={{ direction: "rtl" }}>
      <div 
        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl transition-all ${
          isDark 
            ? "bg-[#18181B] border-white/10 text-white" 
            : "bg-white border-slate-200 text-slate-800"
        } max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone size={22} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-base text-white/95">پیکربندی نسخه کاملا نیتیو (Native APK)</h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Package ID: ir.undo.downloadmanager</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin pr-1">
          {/* Native Features Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-right space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Zap size={14} />
              <span>قابلیت‌های نسخه مستقیم اندروید (Capacitor Native Engine)</span>
            </div>
            <ul className="text-[11px] text-white/70 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>ذخیره‌سازی مستقیم در حافظه اصلی گوشی: <code className="text-emerald-400 font-mono text-[10px]">/storage/emulated/0/Download/Undo/</code></li>
              <li>ارسال مستقیم به File Manager و بازکردن خودکار با نرم‌افزارهای نصب‌شده (Intent ACTION_VIEW)</li>
              <li>نوتیفیکیشن‌های پیش‌فرض نوار وضعیت اندروید (System Status Bar Notifications)</li>
              <li>پشتیبانی از دانلود در پس‌زمینه سیستم‌عامل حتی با بستن برنامه</li>
            </ul>
          </div>

          {/* Configuration Preview Box */}
          <div className="bg-[#101012] border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-2 text-right">
            <div className="flex justify-between items-center text-white/40 text-[10px] pb-2 border-b border-white/5">
              <span className="flex items-center gap-1">
                <HardDrive size={12} className="text-blue-400" />
                <span>فایل فایل پیکربندی capacitor.config.json</span>
              </span>
              <span className="text-emerald-400 font-bold">READY</span>
            </div>
            <pre className="text-[10px] text-emerald-400/90 overflow-x-auto p-2 bg-black/40 rounded-xl text-left font-mono scrollbar-none dir-ltr">
{`{
  "appId": "ir.undo.downloadmanager",
  "appName": "Undo Download Manager",
  "webDir": "dist",
  "plugins": {
    "Filesystem": { "androidPublicStorage": true }
  }
}`}
            </pre>
          </div>

          {/* Build steps for user */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white/90 flex items-center gap-1.5">
              <Terminal size={14} className="text-blue-400" />
              <span>دستورات ساخت خروجی APK در محیط Android Studio:</span>
            </h4>

            {buildSteps.map((step, idx) => (
              <div key={idx} className="bg-[#202024] border border-white/5 rounded-xl p-3 flex justify-between items-center gap-3">
                <div className="text-right">
                  <h5 className="text-[11px] font-bold text-white/95">{step.title}</h5>
                  <code className="text-[10px] text-emerald-400 font-mono block mt-1 dir-ltr text-right">{step.cmd}</code>
                  <p className="text-[9px] text-white/40 mt-0.5">{step.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(step.cmd, idx)}
                  className={`p-2 rounded-xl border text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all ${
                    copiedIndex === idx
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === idx ? "کپی شد" : "کپی"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-white/40">آماده کامپایل روی Android SDK 34+</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            متوجه شدم (تایید)
          </button>
        </div>
      </div>
    </div>
  );
}
