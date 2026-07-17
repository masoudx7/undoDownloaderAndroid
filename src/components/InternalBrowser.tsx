/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, RotateCw, ChevronLeft, ChevronRight, Globe, Download, Video, ShieldAlert } from "lucide-react";

interface InternalBrowserProps {
  isDark: boolean;
  onDetectLink: (detected: {
    url: string;
    name: string;
    category: string;
    size: number;
    ytDlpFormat?: string;
  }) => void;
}

// Simulated active pages
type PageKey = "aparat" | "soft98" | "github" | "music" | "search";

export default function InternalBrowser({ isDark, onDetectLink }: InternalBrowserProps) {
  const [urlBar, setUrlBar] = useState("https://www.aparat.com");
  const [currentPage, setCurrentPage] = useState<PageKey>("aparat");
  const [searchQuery, setSearchQuery] = useState("");
  const [browserAlert, setBrowserAlert] = useState<{
    message: string;
    name: string;
    url: string;
    category: string;
    size: number;
    streamOptions?: boolean;
    formats?: { quality: string; size: number }[];
  } | null>(null);

  // Simple history simulation
  const [historyList, setHistoryList] = useState<PageKey[]>(["aparat"]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateTo = (page: PageKey, fullUrl: string) => {
    const updatedHistory = historyList.slice(0, historyIndex + 1);
    updatedHistory.push(page);
    setHistoryList(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setCurrentPage(page);
    setUrlBar(fullUrl);
    setBrowserAlert(null);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevPage = historyList[prevIndex];
      setCurrentPage(prevPage);
      setUrlBar(getUrlFromKey(prevPage));
      setBrowserAlert(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < historyList.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextPage = historyList[nextIndex];
      setCurrentPage(nextPage);
      setUrlBar(getUrlFromKey(nextPage));
      setBrowserAlert(null);
    }
  };

  const getUrlFromKey = (key: PageKey): string => {
    switch (key) {
      case "aparat": return "https://www.aparat.com";
      case "soft98": return "https://soft98.ir";
      case "github": return "https://github.com";
      case "music": return "https://music-delha.ir";
      case "search": return `https://google.com/search?q=${encodeURIComponent(searchQuery)}`;
      default: return "";
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const lowerQuery = searchQuery.toLowerCase();
    if (lowerQuery.includes("aparat") || lowerQuery.includes("آپارات")) {
      navigateTo("aparat", "https://www.aparat.com");
    } else if (lowerQuery.includes("soft") || lowerQuery.includes("سافت")) {
      navigateTo("soft98", "https://soft98.ir");
    } else if (lowerQuery.includes("git") || lowerQuery.includes("گیت")) {
      navigateTo("github", "https://github.com");
    } else if (lowerQuery.includes("music") || lowerQuery.includes("موزیک") || lowerQuery.includes("آهنگ")) {
      navigateTo("music", "https://music-delha.ir");
    } else {
      navigateTo("search", `https://google.com/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const triggerLinkSniffer = (
    fileName: string, 
    url: string, 
    category: string, 
    sizeBytes: number,
    isYtDlp = false
  ) => {
    if (isYtDlp) {
      setBrowserAlert({
        message: "آدرس ویدیویی شناسایی شد! پشتیبانی استخراج توسط ویدیوگیر هوشمند اندو",
        name: fileName,
        url: url,
        category: "video",
        size: sizeBytes,
        streamOptions: true,
        formats: [
          { quality: "1080p Full HD (MP4)", size: sizeBytes },
          { quality: "720p HD (MP4)", size: Math.floor(sizeBytes * 0.55) },
          { quality: "480p SD (MP4)", size: Math.floor(sizeBytes * 0.25) },
          { quality: "صدا MP3 Audio", size: Math.floor(sizeBytes * 0.08) }
        ]
      });
    } else {
      setBrowserAlert({
        message: "یک لینک مستقیم قابل دانلود توسط ردیاب خودکار مرورگر کشف شد!",
        name: fileName,
        url: url,
        category: category,
        size: sizeBytes
      });
    }
  };

  return (
    <div className={`rounded-2xl border flex flex-col h-[520px] overflow-hidden transition-all duration-300 ${
      isDark ? "bg-[#161618] border-white/10" : "bg-slate-50 border-slate-100 shadow-inner"
    }`} id="internal-browser-box">
      {/* Browser address bar / controls */}
      <div className={`p-3 border-b flex items-center gap-2 rtl-grid ${
        isDark ? "bg-[#0E0E10] border-white/10" : "bg-white border-slate-100"
      }`}>
        <div className="flex gap-1.5 items-center">
          <button 
            type="button" 
            onClick={handleBack} 
            disabled={historyIndex === 0}
            className={`p-1.5 rounded-lg transition-colors ${
              historyIndex === 0 
                ? "text-slate-600 opacity-40 cursor-not-allowed" 
                : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button" 
            onClick={handleForward} 
            disabled={historyIndex === historyList.length - 1}
            className={`p-1.5 rounded-lg transition-colors ${
              historyIndex === historyList.length - 1 
                ? "text-slate-600 opacity-40 cursor-not-allowed" 
                : isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <ChevronRight size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => setBrowserAlert(null)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Quick URL shortcut tabs */}
        <div className="hidden lg:flex gap-1">
          <button 
            onClick={() => navigateTo("aparat", "https://www.aparat.com")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              currentPage === "aparat" 
                ? "bg-rose-500/10 text-rose-550" 
                : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Aparat
          </button>
          <button 
            onClick={() => navigateTo("soft98", "https://soft98.ir")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              currentPage === "soft98" 
                ? "bg-sky-500/10 text-sky-550" 
                : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Soft98
          </button>
          <button 
            onClick={() => navigateTo("github", "https://github.com")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              currentPage === "github" 
                ? "bg-emerald-500/10 text-emerald-555" 
                : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            GitHub
          </button>
          <button 
            onClick={() => navigateTo("music", "https://music-delha.ir")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              currentPage === "music" 
                ? "bg-blue-600/10 text-blue-400" 
                : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            موزیک‌سرا
          </button>
        </div>

        {/* Address Bar Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-auto flex items-center relative gap-1">
          <div className="absolute right-3 text-slate-400">
            <Globe size={14} />
          </div>
          <input
            type="text"
            className={`w-full text-xs font-mono rounded-lg outline-none border transition-all text-right ${
              isDark 
                ? "bg-[#0A0A0B] border-white/10 focus:border-blue-500 text-slate-200" 
                : "bg-slate-100 border-slate-200 focus:border-blue-500/30 text-slate-800"
            } py-1.5 pr-8 pl-3`}
            value={urlBar}
            onChange={(e) => setUrlBar(e.target.value)}
          />
          <button
            type="submit"
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center cursor-pointer"
          >
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Browser Viewport Area */}
      <div className="flex-1 relative overflow-y-auto p-4 flex flex-col rtl-grid">
        {/* Real-time Link Sniffer Banner overlay */}
        {browserAlert && (
          <div className={`p-4 rounded-xl border mb-4 animate-bounce relative flex flex-col md:flex-row gap-3 items-start justify-between ${
            isDark 
              ? "bg-blue-600/10 border-blue-500/35 text-white" 
              : "bg-[#f8fafc] border-slate-100 text-slate-900 shadow-md"
          }`} id="browser-link-detected-box">
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <ShieldAlert size={14} />
                <span>{browserAlert.message}</span>
              </div>
              <p className="text-xs font-bold font-mono text-white/40 truncate mt-1">
                آدرس: {browserAlert.url}
              </p>
              <p className="text-sm font-semibold mt-1">
                نام فایل: <span className="text-blue-400">{browserAlert.name}</span>
              </p>
              <p className="text-xs text-white/45 mt-0.5">
                حجم تخمینی: { (browserAlert.size / (1024 * 1024)).toFixed(1) } مگابایت
              </p>
            </div>

            {browserAlert.streamOptions ? (
              <div className="flex flex-wrap gap-2 items-center mt-2 md:mt-0">
                {browserAlert.formats?.map((fmt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onDetectLink({
                        url: browserAlert.url,
                        name: `${browserAlert.name.split(".")[0]}-${fmt.quality.split(" ")[0]}.mp4`,
                        category: "video",
                        size: fmt.size,
                        ytDlpFormat: fmt.quality
                      });
                      setBrowserAlert(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-xs text-white font-medium rounded-lg shadow-sm transition-all shadow-rose-900/10"
                  >
                    <Video size={12} />
                    <span>{fmt.quality}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onDetectLink({
                    url: browserAlert.url,
                    name: browserAlert.name,
                    category: browserAlert.category,
                    size: browserAlert.size
                  });
                  setBrowserAlert(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>افزودن به صف دانلود</span>
              </button>
            )}
            <button 
              onClick={() => setBrowserAlert(null)}
              className="absolute left-2 top-2 text-xs opacity-50 hover:opacity-100 px-1 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* SIMULATED WEB SITE PAGES */}

        {/* 1. APARAT SITE (VIDEO REPO) */}
        {currentPage === "aparat" && (
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">آپارات ویدیو</span>
                <h4 className="text-md font-bold mt-2">کلیپ آموزش پیشرفته کار با هوش مصنوعی و پایتون</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">مدتزمان: ٢۴ دقیقه | فرمت: MP4 | کیفیت: HD/FullHD</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("Python-AI-Course.mp4", "https://aparat.com/v/learn-python-ai-full", "video", 580000000, true)}
                className="bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Video size={14} />
                دانلود با ویدیوگیر اندو
              </button>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">آپارات ویدیو</span>
                <h4 className="text-md font-bold mt-2">مستند حیات وحش کهکشان‌های کویر ایران</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">مدتزمان: ١ ساعت | فرمت: webm/mp4 | کیفیت عالی 1080p</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("Iranian-WildLife-Documentary.mp4", "https://aparat.com/v/wildlife_iran_desert", "video", 1450000000, true)}
                className="bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Video size={14} />
                دانلود با ویدیوگیر اندو
              </button>
            </div>
            
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">آپارات موزیک</span>
                <h4 className="text-md font-bold mt-2">موزیک شنیدنی شجریان - سرو و چمن</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">مدت زمان: ۵ دقیقه | فرمت: MP3</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("Shajarian_Best_Performance.mp3", "https://aparat.com/v/shajarian-sarv-music", "video", 16000000, true)}
                className="bg-rose-600 hover:bg-rose-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Video size={14} />
                استخراج نسخه صوتی
              </button>
            </div>
          </div>
        )}

        {/* 2. SOFT98 SITE (SOFTWARE REPO) */}
        {currentPage === "soft98" && (
          <div className="space-y-4">
            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">سافت ۹۸</span>
                <h4 className="text-md font-bold mt-1">دانلود سیستم‌عامل اوبونتو لینوکس Ubuntu 24.04 LTS</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">حجم تقریبی: ٣.٨ گیگابایت | نسخه ۶۴ بیت دسکتاپ</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("ubuntu-24.04-desktop-amd64.iso", "https://soft98.ir/files/ubuntu-24.04-desktop-amd64.iso", "software", 3950000000)}
                className="bg-sky-600 hover:bg-sky-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Download size={14} />
                دانلود لینک مستقیم
              </button>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">اپلیکیشن کاربردی</span>
                <h4 className="text-md font-bold mt-1">مرورگر پرسرعت گوگل کروم نسخه نهایی Google Chrome</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">فرمت: exe برای ویندوز | حجم: ١١۵ مگابایت</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("GoogleChromeStandaloneEnterprise64.exe", "https://soft98.ir/internet/browser/GoogleChrome.exe", "software", 120500000)}
                className="bg-sky-600 hover:bg-sky-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Download size={14} />
                دانلود لینک سریع
              </button>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">بایگانی فشرده</span>
                <h4 className="text-md font-bold mt-1">نرم افزار فشرده‌سازی نسخه کرک شده WinRAR 7.02 Pro</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">فرمت: rar | حجم: ۵.۵ مگابایت</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("winrar-x64-702.rar", "https://soft98.ir/utility/compress/winrar-v702.rar", "compressed", 5700000)}
                className="bg-sky-600 hover:bg-sky-500 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-stretch justify-center md:self-auto cursor-pointer"
              >
                <Download size={14} />
                دانلود مستقیم
              </button>
            </div>
          </div>
        )}

        {/* 3. GITHUB SOURCE PORTAL */}
        {currentPage === "github" && (
          <div className="space-y-4">
            <p className="text-xs text-white/40 font-semibold mb-2">مخازن پروژه گیت هاب (کد منبع)</p>
            <div className="border p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between bg-[#1C1C1F] border-white/5">
              <div>
                <h5 className="text-sm font-bold font-mono text-white/90">microsoft/vscode</h5>
                <p className="text-xs text-white/40 mt-1">کد منبع ویرایشگر محبوب ویژوال استودیو کد نسخه نهایی</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("vscode-master.zip", "https://github.com/microsoft/vscode/archive/master.zip", "compressed", 340000000)}
                className="bg-emerald-650 hover:bg-emerald-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Download Zip
              </button>
            </div>

            <div className="border p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between bg-[#1C1C1F] border-white/5">
              <div>
                <h5 className="text-sm font-bold font-mono text-white/90">google/genai-sdk-node</h5>
                <p className="text-xs text-white/40 mt-1">کیت توسعه نرم افزار رسمی پورتال هوش مصنوعی جمینی در نود جی‌اس</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("genai-node-2.4.0.tar.gz", "https://github.com/google/genai-sdk-node/archive/v2.4.0.tar.gz", "compressed", 8500000)}
                className="bg-emerald-650 hover:bg-emerald-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Download Tarball
              </button>
            </div>
          </div>
        )}

        {/* 4. MUSIC CENTER PAGE */}
        {currentPage === "music" && (
          <div className="space-y-4">
            <p className="text-xs text-white/40 font-semibold mb-2">مرکز دانلود موسیقی اصیل ایرانی و بین‌الملل</p>
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-lg text-white">تصنیف زیبای بی همتا - همایون شجریان</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">کیفیت عالی ٣٢٠ مگابیت | فرمت: mp3 | حجم ١٢.۵ مگابایت</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("Homayoun_Shajarian_BiHamta_320.mp3", "https://music-delha.ir/classic/shajarian_bihamta_320.mp3", "music", 13100000)}
                className="bg-blue-650 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                دانلود موزیک MP3
              </button>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div>
                <h4 className="text-md font-bold text-lg text-white">سمفونی پنجم بتهوون موج‌دار کلاسیک</h4>
                <p className="text-xs text-white/50 mt-1 font-sans">کیفیت استودیو WAV | حجم: ۶٢ مگابایت</p>
              </div>
              <button
                onClick={() => triggerLinkSniffer("Beethoven_Symphony5_HiRes.wav", "https://music-delha.ir/orchestral/beethoven_symph5_hi_res.wav", "music", 64500000)}
                className="bg-blue-650 hover:bg-blue-600 text-white py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                دانلود فرمت صوتی WAV
              </button>
            </div>
          </div>
        )}

        {/* 5. GOOGLE SEARCH PAGE */}
        {currentPage === "search" && (
          <div className="space-y-4">
            <span className="text-xs text-white/40">نتایج آزمایشی جستجو برای: "{searchQuery}"</span>
            <div className="p-4 rounded-xl border bg-[#1C1C1F] border-white/5 space-y-1">
              <h5 className="text-sm font-bold text-blue-400 hover:underline cursor-pointer" onClick={() => navigateTo("aparat", "https://www.aparat.com")}>
                دانلود کلیپ‌های ویدیویی جالب در پورتال آپارات
              </h5>
              <p className="text-xs text-white/50">یک مخزن عالی از تمام ویدیوهای آموزش, موزیک ویدیوها و فیلم‌ها برای دانلود مستقیم با استخراج‌کننده هوشمند اندو.</p>
            </div>
            
            <div className="p-4 rounded-xl border bg-[#1C1C1F] border-white/5 space-y-1">
              <h5 className="text-sm font-bold text-blue-400 hover:underline cursor-pointer" onClick={() => navigateTo("soft98", "https://soft98.ir")}>
                مرکز بزرگ دانلود نرم‌افزارهای کاربردی سافت ۹۸
              </h5>
              <p className="text-xs text-white/50">بهترین برنامه‌های کاربردی دسکتاپ, تم سیستم‌عامل لینوکس دبیان و مرورگر کروم جهت دانلود با سرعت بالا.</p>
            </div>

            <button 
              onClick={() => navigateTo("aparat", "https://www.aparat.com")}
              className="mt-4 text-xs font-semibold px-4 py-2 bg-[#1C1C1F] border border-white/10 text-slate-300 rounded-lg hover:bg-[#252528] self-center cursor-pointer"
            >
              انتقال مستقیم به صفحه مرجع آپارات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
