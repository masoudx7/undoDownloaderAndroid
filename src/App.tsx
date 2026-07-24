/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Download, Compass, Sliders, Sun, Moon, Plus, Bell, Radio, 
  Cloud, RefreshCw, Layers, ShieldAlert, CheckCircle2, Play, Pause, ListFilter, FolderOpen
} from "lucide-react";
import { DownloadTask, AppSettings, SpeedHistoryPoint, DownloadCategory } from "./types.js";
import LiveSpeedChart from "./components/LiveSpeedChart.js";
import InternalBrowser from "./components/InternalBrowser.js";
import AddDownloadForm from "./components/AddDownloadForm.js";
import DownloadItem from "./components/DownloadItem.js";
import SchedulerSettings from "./components/SchedulerSettings.js";
import DashboardStats from "./components/DashboardStats.js";
import OpenFileModal from "./components/OpenFileModal.js";
import CategoryVolumeChart from "./components/CategoryVolumeChart.js";
import ChromeIntegration from "./components/ChromeIntegration.js";
import FileExplorer from "./components/FileExplorer.js";
import NativeAppExporterModal from "./components/NativeAppExporterModal.js";
import { isNativeApp, getPlatformName } from "./utils/nativeBridge.js";

const undoLogo = "/src/assets/images/undo_suite_icon_1782225107018.jpg";

// Audio synthesized completion tone for robust iframe notifications
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    // Chime 1: C5 Note
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Chime 2: E5 Note (staggered slightly)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn("Web Audio chime blocked by user interaction policy");
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "browser" | "settings" | "explorer">("dashboard");
  const [explorerFolder, setExplorerFolder] = useState<Exclude<DownloadCategory, 'all'> | "root">("root");
  const [highlightedFileId, setHighlightedFileId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [themeColor, setThemeColor] = useState<"blue" | "rose" | "emerald" | "purple" | "amber">(
    () => (localStorage.getItem("undo_theme_color") as any) || "blue"
  );
  const [openingTask, setOpeningTask] = useState<DownloadTask | null>(null);
  const [showNativeModal, setShowNativeModal] = useState<boolean>(false);
  
  const [ytDlpVersion, setYtDlpVersion] = useState<string>(
    () => localStorage.getItem("undo_ytdlp_version") || "2026.06.01"
  );

  const handleUpdateVersion = (newVer: string) => {
    setYtDlpVersion(newVer);
    localStorage.setItem("undo_ytdlp_version", newVer);
    triggerToast("بروزرسانی موتور استخراج", `هسته yt-dlp با موفقیت به نسخه v${newVer} ارتقا یافت.`);
  };

  const handleShowInFolder = (task: DownloadTask) => {
    setExplorerFolder(task.category as any);
    setHighlightedFileId(task.id);
    setActiveTab("explorer");
    triggerToast("نمایش در پوشه", `وارد دایرکتوری پوشه "${task.category === 'video' ? 'ویدیوها' : task.category === 'music' ? 'موزیک‌ها' : 'فایل‌ها'}" شدید.`);
  };
  
  // App states
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    speedLimit: 0,
    maxConcurrentDownloads: 2,
    nightScheduleEnabled: true,
    nightScheduleStart: "02:00",
    nightScheduleEnd: "07:00",
    notificationsEnabled: true
  });
  const [speedHistory, setSpeedHistory] = useState<SpeedHistoryPoint[]>([]);
  
  // Link prefilled state from internal web browser
  const [prefilledBrowserLink, setPrefilledBrowserLink] = useState<{
    url: string;
    name: string;
    category: string;
    size: number;
    ytDlpFormat?: string;
  } | null>(null);

  // In-app floating toast state
  const [toasts, setToasts] = useState<{ id: string; title: string; desc: string }[]>([]);
  
  // Search and Category filtering lists
  const [selectedCategory, setSelectedCategory] = useState<DownloadCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const triggerToast = (title: string, desc: string) => {
    const toastId = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id: toastId, title, desc }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4500);
  };

  // HTML5 Notification permissions
  useEffect(() => {
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Poll database on loop to ensure real-time Cloud Synchronization
  useEffect(() => {
    let completedTracker = new Set<string>();

    const fetchState = async () => {
      try {
        const [dlRes, settingsRes, speedRes] = await Promise.all([
          fetch("/api/downloads"),
          fetch("/api/settings"),
          fetch("/api/speed-history")
        ]);

        if (dlRes.ok && settingsRes.ok && speedRes.ok) {
          const dlTasks: DownloadTask[] = await dlRes.json();
          const appSettings: AppSettings = await settingsRes.json();
          const speedData: SpeedHistoryPoint[] = await speedRes.json();

          // Transition completions alerts checker
          if (settings.notificationsEnabled) {
            dlTasks.forEach((task) => {
              if (task.status === "completed") {
                // If this task was downloading according to our previous state or we didn't track it
                const matchedTask = downloads.find(prev => prev.id === task.id);
                if (matchedTask && matchedTask.status !== "completed") {
                  playSuccessChime();
                  triggerToast("اتمام موفقیت‌آمیز فایل", `فایل "${task.name}" با موفقیت دریافت و بایگانی شد.`);
                  
                  if (window.Notification && Notification.permission === "granted") {
                    new Notification("سامانه هوشمند اندو", {
                      body: `دانلود ${task.name} به پایان رسید.`,
                      icon: "https://picsum.photos/id/250/100/100.jpg"
                    });
                  }
                }
              }
            });
          }

          setDownloads(dlTasks);
          setSettings(appSettings);
          setSpeedHistory(speedData);
        }
      } catch (err) {
        console.error("Cloud synchronization timeout. Re-polling...", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [downloads, settings.notificationsEnabled]);

  // Operations triggers
  const handleAddDownload = async (task: {
    url: string;
    name: string;
    category: Exclude<DownloadCategory, 'all'>;
    size: number;
    isScheduled: boolean;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    ytDlpFormat?: string;
  }) => {
    try {
      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
      });

      if (response.ok) {
        triggerToast("فایل با موفقیت افزوده شد", `لینک به بخش ${task.isScheduled ? 'زمان‌بندی شده' : 'صف فعال دانلود'} ارسال شد.`);
      }
    } catch (e) {
      triggerToast("خطا در ایجاد تسک", "برقراری ارتباط با هسته سرور لغو گردید.");
    }
  };

  const handleTaskAction = async (id: string, action: 'start' | 'pause' | 'stop' | 'delete' | 'resume') => {
    try {
      const response = await fetch(`/api/downloads/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        if (action === "delete") {
          triggerToast("حذف آیتم", "فایل با موفقیت از لیست پاکسازی شد.");
        } else {
          triggerToast("به‌روزرسانی وضعیت", `عملیات ${action} با موفقیت صادر شد.`);
        }
      }
    } catch (e) {
      triggerToast("عملیات ناموفق", "خطا در برقراری تراکنش ابری به سمت دیسپاچر سرور.");
    }
  };

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const nextSettings = await response.json();
        setSettings(nextSettings);
        triggerToast("بروزرسانی ترافیک", "تنظیمات سرعت‌سنج و زمان‌بندی با پایگاه ابری ست شد.");
      }
    } catch (e) {
      triggerToast("خطا در همگام‌سازی", "عدم دسترسی به پنل تنظیمات سرور نود.");
    }
  };

  // Catch dynamic sniff links from simulated Browser
  const handleSniffedLink = (detected: {
    url: string;
    name: string;
    category: string;
    size: number;
    ytDlpFormat?: string;
  }) => {
    setPrefilledBrowserLink(detected);
    setActiveTab("dashboard");
    triggerToast("لینک شناسایی شد", "آدرس ردیابی شده روی فرم پیش‌فرض تزریق گردید.");
  };

  // Simulate global browser link hijacking (Chrome Extension / Protocol click)
  const handleChromeCaptureSimulator = (url: string, name: string) => {
    const extension = name.split('.').pop()?.toLowerCase() || '';
    let category: Exclude<DownloadCategory, 'all'> = "other";
    if (["mp4", "mkv", "webm", "avi", "mov", "flv"].includes(extension)) {
      category = "video";
    } else if (["mp3", "wav", "aac", "ogg", "flac"].includes(extension)) {
      category = "music";
    } else if (["pdf", "docx", "xlsx", "pptx", "txt"].includes(extension)) {
      category = "document";
    } else if (["exe", "dmg", "msi", "pkg", "deb", "apk"].includes(extension)) {
      category = "software";
    } else if (["zip", "rar", "tar.gz", "7z"].includes(extension)) {
      category = "compressed";
    }

    const randomSize = Math.floor(Math.random() * (220 * 1024 * 1024 - 15 * 1024 * 1024)) + (15 * 1024 * 1024);

    handleAddDownload({
      url,
      name,
      category,
      size: randomSize,
      isScheduled: false,
      scheduledStartTime: null,
      scheduledEndTime: null
    });

    setActiveTab("dashboard");
    triggerToast("فراخوانی پروتکل کروم", `فایل با موفقیت از مرورگر Chrome کپچر و به صف دانلود اندو افزوده شد: ${name}`);
  };

  // Calculate stats
  const activeDownloadsList = downloads.filter((task) => {
    // 1. Category Filter
    if (selectedCategory !== "all" && task.category !== selectedCategory) return false;
    
    // 2. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = task.name.toLowerCase().includes(query);
      const matchUrl = task.url.toLowerCase().includes(query);
      return matchName || matchUrl;
    }
    return true;
  });

  const totalCurrentSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].speed : 0;

  // Render Theme tags on document
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("undo_theme_color", themeColor);
  }, [themeColor]);

  const styleString = `
    :root {
      --accent-primary: ${
        themeColor === "blue" ? "#3b82f6" : 
        themeColor === "rose" ? "#f43f5e" : 
        themeColor === "emerald" ? "#10b981" : 
        themeColor === "purple" ? "#8b5cf6" : 
        "#d97706"
      };
      --accent-hover: ${
        themeColor === "blue" ? "#60a5fa" : 
        themeColor === "rose" ? "#fb7185" : 
        themeColor === "emerald" ? "#34d399" : 
        themeColor === "purple" ? "#a78bfa" : 
        "#fbbf24"
      };
      --accent-light: ${
        themeColor === "blue" ? "rgba(59, 130, 246, 0.15)" : 
        themeColor === "rose" ? "rgba(244, 63, 94, 0.15)" : 
        themeColor === "emerald" ? "rgba(16, 185, 129, 0.15)" : 
        themeColor === "purple" ? "rgba(139, 92, 246, 0.15)" : 
        "rgba(217, 119, 6, 0.15)"
      };
      --accent-rgb: ${
        themeColor === "blue" ? "59, 130, 246" : 
        themeColor === "rose" ? "244, 63, 94" : 
        themeColor === "emerald" ? "16, 185, 129" : 
        themeColor === "purple" ? "139, 92, 246" : 
        "217, 119, 6"
      };
    }
  
    /* Dynamic Tailwind Class Override Rules */
    .bg-blue-600 { background-color: var(--accent-primary) !important; }
    .bg-blue-650 { background-color: var(--accent-hover) !important; }
    .hover\\:bg-blue-500:hover { background-color: var(--accent-hover) !important; }
    .text-blue-400 { color: var(--accent-hover) !important; }
    .text-blue-450 { color: var(--accent-primary) !important; }
    .border-blue-500\\/25 { border-color: rgba(var(--accent-rgb), 0.25) !important; }
    .border-blue-500\\/15 { border-color: rgba(var(--accent-rgb), 0.15) !important; }
    .bg-blue-600\\/10 { background-color: var(--accent-light) !important; }
    .bg-blue-500\\/10 { background-color: var(--accent-light) !important; }
    .shadow-blue-500\\/20 { box-shadow: 0 10px 15px -3px rgba(var(--accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--accent-rgb), 0.2) !important; }
    .shadow-blue-500\\/25 { box-shadow: 0 10px 15px -3px rgba(var(--accent-rgb), 0.25), 0 4px 6px -4px rgba(var(--accent-rgb), 0.25) !important; }
    .accent-blue-600 { accent-color: var(--accent-primary) !important; }
    .focus\\:border-blue-500:focus { border-color: var(--accent-primary) !important; }
  `;

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans pb-16 relative flex flex-col ${
      isDark ? "bg-[#0A0A0B] text-white" : "bg-slate-50 text-slate-800"
    }`} id="main-application-frame">
      <style dangerouslySetInnerHTML={{ __html: styleString }} />
      
      {/* GLOWING AMBIENT BACKGROUND FOR THEME DEPTH */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div 
            className="absolute top-[5%] left-[20%] w-[35%] h-[35%] rounded-full blur-[140px] opacity-20" 
            style={{ backgroundColor: "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* FLOAT ALERTS TOAST LIST */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none" style={{ direction: "rtl" }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`p-4 rounded-xl border shadow-2xl flex flex-col gap-0.5 animate-slideIn border-r-4 border-r-blue-600 pointer-events-auto ${
              isDark ? "bg-[#1C1C1F] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h5 className="text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-blue-400" />
              <span>{toast.title}</span>
            </h5>
            <p className="text-[10px] text-white/50 pr-5 mt-0.5">{toast.desc}</p>
          </div>
        ))}
      </div>

      {/* NAVBAR */}
      <header className={`border-b transition-all ${
        isDark ? "bg-[#0E0E10] border-white/10" : "bg-white border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 rtl-grid">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0E0E10] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <img 
                src={undoLogo} 
                alt="Undo Suite Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold tracking-tight font-sans italic text-white">Undo<span className="not-italic font-normal opacity-50">Suite</span></span>
                <span className="text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded-md">اندو</span>
              </div>
              <p className="text-[9px] text-white/40 tracking-wider">سریع، زمان‌بندی شده، با پشتیبانی استخراج ویدیو</p>
            </div>
          </div>

          {/* Tab Selection Navigation links */}
          <nav className={`flex gap-1 p-1 rounded-xl border ${
            isDark ? "bg-[#1C1C1F] border-white/5" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : isDark ? "text-white/50 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Download size={14} />
              <span>میزکار دانلود</span>
            </button>
            <button
              onClick={() => setActiveTab("browser")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "browser"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : isDark ? "text-white/50 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass size={14} />
              <span>مرورگر ردیاب</span>
            </button>
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : isDark ? "text-white/50 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen size={14} />
              <span>پوشه‌ها و فایل‌ها</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : isDark ? "text-white/50 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders size={14} />
              <span>تنظیمات</span>
            </button>
          </nav>

          {/* Theme Switcher and State Cloud Status */}
          <div className="flex items-center gap-3">
            {/* Native APK Config Button */}
            <button
              onClick={() => setShowNativeModal(true)}
              className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-all active:scale-95 shadow-sm"
              title="مشاهده ساختار و خروجی نسخه نیتیو اندروید"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>پیکربندی APK اندروید</span>
            </button>

            {/* Sync connection status visual badge */}
            <span className={`text-[10px] hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full font-mono uppercase tracking-wider ${
              isDark ? "bg-[#1C1C1F] text-white/60 border border-white/5" : "bg-emerald-100 text-emerald-800"
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Cloud Sync: Active</span>
            </span>

            {/* Color Accent Settings Palette */}
            <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
              isDark ? "bg-[#1C1C1F] border-white/5" : "bg-white border-slate-200"
            }`}>
              {(["blue", "rose", "emerald", "purple", "amber"] as const).map((color) => {
                const colorClasses = {
                  blue: "bg-blue-500",
                  rose: "bg-rose-500",
                  emerald: "bg-emerald-500",
                  purple: "bg-purple-500",
                  amber: "bg-amber-500"
                };
                return (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`w-3.5 h-3.5 rounded-full ${colorClasses[color]} transition-all cursor-pointer ${
                      themeColor === color ? "scale-125 ring-2 ring-offset-2 ring-blue-500" : "opacity-60 hover:opacity-100"
                    }`}
                    title={`تم رنگی: ${
                      color === "blue" ? "آبی" : 
                      color === "rose" ? "سرخ" : 
                      color === "emerald" ? "سبز" : 
                      color === "purple" ? "بنفش" : "عسلی"
                    }`}
                  />
                );
              })}
            </div>

            {/* Dark light toggler */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border transition-all ${
                isDark 
                  ? "bg-[#1C1C1F] border-white/5 text-yellow-400 hover:bg-[#252528]" 
                  : "bg-white border-slate-200 text-[#5C5C5F] hover:bg-slate-50"
              }`}
              title={isDark ? "تغییر به تم روشن" : "تغییر به تم تیره"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTAINER BODY */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6 flex-1 space-y-6">
        
        {/* Statistics block top line */}
        <DashboardStats 
          tasks={downloads} 
          currentTotalSpeed={totalCurrentSpeed} 
          isDark={isDark} 
          onCompletedClick={() => {
            setActiveTab("dashboard");
            setTimeout(() => {
              const element = document.getElementById("download-listing-card");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          }}
        />

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Adding links container left side / bottom */}
            <div className="col-span-1 space-y-6">
              <AddDownloadForm
                isDark={isDark}
                onAddDownload={handleAddDownload}
                prefilled={prefilledBrowserLink}
                onClearPrefilled={() => setPrefilledBrowserLink(null)}
                ytDlpVersion={ytDlpVersion}
              />

              <SchedulerSettings
                settings={settings}
                isDark={isDark}
                onUpdateSettings={handleUpdateSettings}
                ytDlpVersion={ytDlpVersion}
                onUpdateVersion={handleUpdateVersion}
              />
            </div>

            {/* Active downloading queues, visual spark graphs, categories filters */}
            <div className="col-span-2 space-y-6">
              
              {/* Speed graph tracking visual */}
              <LiveSpeedChart 
                history={speedHistory} 
                isDark={isDark} 
              />

              {/* Volume breakdown by category chart */}
              <CategoryVolumeChart 
                tasks={downloads} 
                isDark={isDark} 
              />

              {/* Advanced Filter, search and tasks list container */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                isDark 
                  ? "bg-[#161618] border-white/10 shadow-2xl" 
                  : "bg-white border-slate-100 shadow-sm"
              }`} id="download-listing-card">
                
                {/* Search / filter layout line */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 rtl-grid">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-blue-400" />
                    <h3 className="font-bold text-sm">لیست صف تسک‌های دانلود شده</h3>
                  </div>
 
                  {/* Search bar inside list */}
                  <div className="w-full md:w-auto flex items-center relative gap-1.5">
                    <input
                      type="text"
                      placeholder="جستجوی نام یا آدرس فایل..."
                      className={`text-xs px-3 py-1.5 rounded-lg border outline-none text-right w-full md:w-56 focus:border-blue-500 transition-all ${
                        isDark 
                          ? "bg-[#0A0A0B] border-white/10 text-slate-200 placeholder:text-white/30" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
 
                {/* Categories filtering tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-thin border-b border-white/5 rtl-grid">
                  <span className="text-[10px] uppercase font-bold text-white/30 ml-2 hidden md:block">فیلتر دسته:</span>
                  {[
                    { key: "all", label: "همه فایل‌ها" },
                    { key: "video", label: "ویدیو" },
                    { key: "music", label: "موسیقی" },
                    { key: "document", label: "اسناد" },
                    { key: "software", label: "برنامه‌ها" },
                    { key: "compressed", label: "بایگانی" },
                    { key: "other", label: "دیگر" }
                  ].map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key as DownloadCategory)}
                        className={`px-3 py-1.5 text-[10px] rounded-full font-bold transition-all shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                            : isDark
                              ? "bg-[#1C1C1F] text-white/50 hover:text-white border border-white/5"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Queue tasks loop list */}
                <div className="space-y-4 mt-5">
                  {activeDownloadsList.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center gap-2">
                      <ListFilter size={32} className="opacity-15" />
                      <p className="text-xs font-semibold">هیچ فایل دانلودی در این فیلتر یا جستجو یافت نشد.</p>
                      <p className="text-[10px] text-slate-600">می‌توانید لینک جدیدی اضافه کنید یا از مرورگر برای استخراج فایل‌ها بهره بگیرید.</p>
                    </div>
                  ) : (
                    activeDownloadsList.map((task) => (
                      <DownloadItem
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        onAction={handleTaskAction}
                        onOpenCompleted={(t) => setOpeningTask(t)}
                        onShowInFolder={handleShowInFolder}
                      />
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* INTEGRATED WEB SNIFFER BROWSING PANEL TAB */}
        {activeTab === "browser" && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border rtl-grid ${
              isDark ? "bg-[#161618] border-white/10 text-white/80" : "bg-white border-slate-200 text-slate-700"
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400">
                <Compass size={16} />
                <span>مرورگر ردیاب خودکار لینک برای دانلود مستقیم و دانلود ویدیویی پیشرفته</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                بر روی سایت‌های شبیه‌سازی شده زیر کلیک کنید. با زدن دکمه <b>"دانلود ویدیو"</b> یا <b>"دانلود مستقیم"</b>، ردیاب زنده مرورگر فوراً اطلاعات متادیتا، نام فایل، فرمت و حجم را کشف می‌کند و برای ایجاد آسان دانلود در اختیارتان می‌گذارد.
              </p>
            </div>

            <InternalBrowser 
              isDark={isDark} 
              onDetectLink={handleSniffedLink} 
            />
          </div>
        )}

        {/* SETTINGS AND TIME BLOCKED SCHEDULERS TAB */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="col-span-2">
              <SchedulerSettings
                settings={settings}
                isDark={isDark}
                onUpdateSettings={handleUpdateSettings}
                ytDlpVersion={ytDlpVersion}
                onUpdateVersion={handleUpdateVersion}
              />
            </div>

            <div className="col-span-1 space-y-6">
              {/* Google Chrome Link Hijack capturing Integration tool */}
              <ChromeIntegration 
                isDark={isDark} 
                onSimulateDownload={handleChromeCaptureSimulator} 
              />

              {/* Helpful user hints card */}
              <div className={`p-5 rounded-2xl border rtl-grid leading-relaxed ${
                isDark ? "bg-[#161618] border-white/5 text-white/70" : "bg-white border-slate-150 text-slate-700"
              }`}>
                <h4 className="text-xs font-bold text-white/40 mb-2">راهنمای هوشمند سامانه فناوری اندو</h4>
                <div className="text-[11px] space-y-2 text-white/55">
                  <p>
                    <b>دانلود همزمان:</b> می‌توانید مشخص کنید چه تعداد فایل در آن واحد از باند شما بهره ببرند. سایر فایلهای صف در انتظار نوبت می‌مانند.
                  </p>
                  <p>
                    <b>محدودیت سرعت:</b> اگر نیاز به وبگردی دارید، سرعت دانلود را کنترل کنید تا سایر فعالیت‌های اینترنتی شما دچار افت پهنای باند نشود.
                  </p>
                  <p>
                    <b>شبیه‌ساز استخراج ویدیو:</b> لینک‌های سایت‌های پرطرفدار ویدیوخوان (یوتیوب، آپارات و کلیه سایت‌های تماشای آنلاین فیلم و ویدیو که خودشان دکمه دانلود ندارند) را به اندو بسپارید؛ این ابزار هوشمند با کاوش زنده، تمام فایل‌های صوتی و تصویری پس‌زمینه را استخراج کرده و بالاترین کیفیت‌ها را آماده دانلود مستقیم می‌کند.
                  </p>
                  <p>
                    <b>همگام‌سازی ابری:</b> لیست کارها به‌طور کامل روی گره ابری ذخیره شده و با باز کردن تب‌های دیگر بلافاصله یکسان می‌گردد.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* FILE EXPLORER TAB */}
        {activeTab === "explorer" && (
          <FileExplorer
            tasks={downloads}
            isDark={isDark}
            activeFolder={explorerFolder}
            onChangeFolder={setExplorerFolder}
            highlightedFileId={highlightedFileId}
            onClearHighlight={() => setHighlightedFileId(null)}
            onOpenCompleted={(t) => setOpeningTask(t)}
            onDeleteFile={(id) => handleTaskAction(id, "delete")}
            triggerToast={triggerToast}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full text-center text-[10px] text-slate-600 mt-10">
        Undo Technology Suite &copy; 2026 - طراحی شده با استقرا همگام‌ساز و بازبین هوشمند فناوری
      </footer>

      {openingTask && (
        <OpenFileModal
          task={openingTask}
          isDark={isDark}
          onClose={() => setOpeningTask(null)}
          onSuccess={(appName) => {
            triggerToast("اجرای فایل", `فایل با موفقیت با استفاده از برنامه ${appName} شروع به کار کرد.`);
            setOpeningTask(null);
          }}
        />
      )}

      {showNativeModal && (
        <NativeAppExporterModal
          isDark={isDark}
          onClose={() => setShowNativeModal(false)}
        />
      )}

    </div>
  );
}
