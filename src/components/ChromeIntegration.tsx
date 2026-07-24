/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Chrome, ShieldCheck, HelpCircle, ArrowLeftRight, ExternalLink, Play, Check } from "lucide-react";

interface ChromeIntegrationProps {
  isDark: boolean;
  onSimulateDownload: (url: string, name: string) => void;
}

export default function ChromeIntegration({ isDark, onSimulateDownload }: ChromeIntegrationProps) {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem("undo_chrome_capture");
    return saved !== "false"; // default to true
  });
  const [protocolRegistered, setProtocolRegistered] = useState(true);
  const [testUrl, setTestUrl] = useState("https://dl3.undovideo.xyz/archive/2026/film_jadid_720p.mp4");
  const [testName, setTestName] = useState("film_jadid_720p.mp4");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    localStorage.setItem("undo_chrome_capture", String(enabled));
  }, [enabled]);

  const handleTestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!enabled) {
      alert("لطفاً ابتدا مانیتورینگ خودکار کروم را فعال نمایید.");
      return;
    }
    
    // Simulate Undo hijacking Chrome download click
    setShowNotification(true);
    setTimeout(() => {
      onSimulateDownload(testUrl, testName || "captured_chrome_file.mp4");
      setShowNotification(false);
    }, 1500);
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isDark 
        ? "bg-[#161618] border-white/5 text-white" 
        : "bg-white border-slate-200 text-slate-800"
    }`} style={{ direction: "rtl" }}>
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <Chrome size={18} />
        </div>
        <div>
          <h4 className="text-xs font-bold font-sans">پیوند مستقیم با مرورگر گوگل کروم</h4>
          <p className="text-[10px] opacity-40 mt-0.5">ربودن خودکار لینک‌های دانلودی هنگام کلیک در مرورگر Chrome</p>
        </div>
      </div>

      {/* Main explanation toggle */}
      <div className="mt-4 space-y-3.5">
        <div className={`p-3 rounded-xl flex items-center justify-between gap-4 border ${
          isDark ? "bg-[#0E0E10]/80 border-white/5" : "bg-slate-50 border-slate-100"
        }`}>
          <div>
            <h5 className="text-[11px] font-bold">ره‌گیری زنده و مانیتورینگ دانلودها</h5>
            <p className="text-[9px] text-white/40 mt-0.5">رهگیری پسوند‌های zip, rar, mp4, mkv, pdf, exe در کروم</p>
          </div>
          
          {/* Custom toggle slider */}
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-10 h-5.5 rounded-full transition-colors relative duration-300 cursor-pointer ${
              enabled ? "bg-emerald-500" : "bg-slate-600"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${
              enabled ? "right-5.5" : "right-0.5"
            }`} />
          </button>
        </div>

        {/* Integration details steps */}
        <div className="space-y-2 text-[10px] text-white/55 pl-1 leading-relaxed">
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <p><b>ثبت وب‌پروتکل undo://</b> ثبت خودکار در ریجستری سیستم‌عامل جهت بازخوانی آنی اندو از کروم.</p>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <p><b>افزونه Chrome Extension:</b> هماهنگ با مرورگر جهت مانیتور و لغو دانلود پیش‌فرض کروم.</p>
          </div>
        </div>

        {/* Browser Link Capture Simulator / Tester Box */}
        <div className={`p-4 rounded-xl border space-y-2.5 mt-4 ${
          isDark ? "bg-[#0A0A0B]/60 border-white/5" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-blue-400" />
            <h5 className="text-[10px] font-bold">شبیه‌ساز تست کلیک در مرورگر Chrome</h5>
          </div>
          <p className="text-[9px] text-white/40 leading-relaxed">
            لینک زیر شبیه‌ساز یک دکمه یا فایل دانلودی در صفحه وب است. کلیک بر روی آن، فراخوانی پروتکل اندو توسط کروم را تست می‌کند:
          </p>

          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="نام شبیه‌ساز فایل"
                className={`px-2.5 py-1.5 rounded-lg text-[10px] border outline-none font-mono text-right w-full ${
                  isDark ? "bg-[#111113] border-white/5 text-white" : "bg-white border-slate-200"
                }`}
              />
              <span className="text-[9px] text-white/30 flex items-center justify-end">نام تستی فایل</span>
            </div>
            
            <input 
              type="text" 
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="آدرس دانلودی فایل تستی"
              className={`px-2.5 py-1.5 rounded-lg text-[10px] border outline-none font-mono text-left w-full ${
                isDark ? "bg-[#111113] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <button
            onClick={handleTestClick}
            disabled={showNotification}
            className={`w-full py-2 bg-blue-600 hover:bg-blue-500 transition-all font-bold text-white rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              showNotification ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {showNotification ? (
              <>
                <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                <span>کروم در حال انتقال درخواست به اندو...</span>
              </>
            ) : (
              <>
                <ExternalLink size={12} />
                <span>کلیک تستی جهت انتقال مستقیم به اندو</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
