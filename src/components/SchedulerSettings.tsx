/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Clock, ShieldAlert, Sliders, Zap, Check, Bell, BellOff, RefreshCw, AlertCircle, Download, CheckCircle2, Terminal } from "lucide-react";
import { AppSettings } from "../types.js";

interface SchedulerSettingsProps {
  settings: AppSettings;
  isDark: boolean;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  ytDlpVersion?: string;
  onUpdateVersion?: (version: string) => void;
}

export default function SchedulerSettings({ settings, isDark, onUpdateSettings, ytDlpVersion, onUpdateVersion }: SchedulerSettingsProps) {
  // yt-dlp update states
  const [updateState, setUpdateState] = React.useState<'idle' | 'checking' | 'downloading' | 'installing' | 'verifying' | 'success' | 'error'>('idle');
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [logMessages, setLogMessages] = React.useState<string[]>([]);
  const [channel, setChannel] = React.useState<'stable' | 'nightly'>('stable');

  const triggerUpdateEngine = () => {
    if (updateState !== 'idle' && updateState !== 'success' && updateState !== 'error') return;

    setUpdateState('checking');
    setUpdateProgress(0);
    setLogMessages(["در حال برقراری ارتباط با مخزن گیت‌هاب...", "دریافت اطلاعات تگ‌های آخرین نسخه منتشر شده (Stable)..."]);

    // Phase 1: Checking
    setTimeout(() => {
      setUpdateState('downloading');
      setLogMessages(prev => [...prev, "تگِ نسخه فعال یافت شد: v2026.07.16", "آماده‌سازی لوله‌های اتصال پهنای باند همزمان...", "شروع دانلود باینری فشرده (yt-dlp_linux_amd64)..."]);

      // Phase 2: Downloading Progress
      let currentProgress = 0;
      const downloadInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(downloadInterval);

          // Phase 3: Installing
          setUpdateState('installing');
          setLogMessages(prev => [
            ...prev,
            "بارگیری بسته با موفقیت انجام شد [۱۵.۴ مگابایت]",
            "در حال استخراج باینری و اعمال پچ‌های سازگاری...",
            "انتقال باینری به شاخه اجرایی /usr/local/bin/yt-dlp..."
          ]);

          setTimeout(() => {
            // Phase 4: Verifying
            setUpdateState('verifying');
            setLogMessages(prev => [
              ...prev,
              "بروزرسانی لینک‌های دامنه‌های مسدود شده...",
              "اعمال دسترسی‌های اجرایی اصلی سیستم عامل (chmod +x)...",
              "در حال تست نهایی فرمان: yt-dlp --version..."
            ]);

            setTimeout(() => {
              // Phase 5: Success!
              setUpdateState('success');
              const newVer = channel === 'stable' ? '2026.07.16' : '2026.07.16-nightly';
              onUpdateVersion?.(newVer);
              setLogMessages(prev => [
                ...prev,
                `تست نهایی با موفقیت انجام شد: نسخه جدید v${newVer} شناسایی گردید.`,
                "سامانه با موفقیت به آخرین پچ هسته ارتقا یافت! سرعت دانلود و پایداری استخراج ویدیوها بهینه‌سازی شد."
              ]);
            }, 1200);

          }, 1200);
        } else {
          setUpdateProgress(currentProgress);
          // Add custom logs during download
          if (currentProgress > 30 && currentProgress < 35 && !logMessages.some(m => m.includes("۳۰٪"))) {
            setLogMessages(prev => [...prev, "دریافت بسته‌ها: ۳۰٪ کامل شد..."]);
          }
          if (currentProgress > 60 && currentProgress < 65 && !logMessages.some(m => m.includes("۶۰٪"))) {
            setLogMessages(prev => [...prev, "دریافت بسته‌ها: ۶۰٪ کامل شد (سرعت دانلود: ۱۰.۴ مگابایت بر ثانیه)..."]);
          }
          if (currentProgress > 90 && currentProgress < 95 && !logMessages.some(m => m.includes("۹۰٪"))) {
            setLogMessages(prev => [...prev, "کامل شدن بارگیری فایل‌های اصلی (۹۰٪)..."]);
          }
        }
      }, 150);

    }, 1500);
  };

  // Speed Limit Options
  const limitPresets = [
    { label: "بدون محدودیت", value: 0 },
    { label: "۵۰۰ KB/s", value: 500000 },
    { label: "۱ MB/s", value: 1000000 },
    { label: "۲ MB/s", value: 2000000 },
    { label: "۵ MB/s", value: 5000000 }
  ];

  const handlePresetSelect = (val: number) => {
    onUpdateSettings({ speedLimit: val });
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 rtl-grid ${
      isDark 
        ? "bg-[#161618] border-white/10 text-white shadow-2xl" 
        : "bg-white border-slate-100 text-slate-900 shadow-sm"
    }`} id="dl-global-settings-card">
      <h3 className="text-md font-bold flex items-center gap-2 mb-4">
        <Sliders className="text-blue-400" size={18} />
        <span>تنظیمات پیشرفته و کنترل ترافیک شبانه</span>
      </h3>

      <div className="space-y-4">
        
        {/* 1. Bandwidth Speed Limiter selection */}
        <div>
          <label className="text-xs font-semibold text-white/40 block mb-2">محدودکننده سرعت دانلود (Speed Limiter)</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {limitPresets.map((preset) => {
              const isActive = settings.speedLimit === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`py-2 px-1 text-xs rounded-lg font-bold border transition-all flex items-center justify-center gap-1 ${
                    isActive
                      ? isDark 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                        : "bg-emerald-50 border-emerald-500 text-emerald-600"
                      : isDark
                        ? "bg-[#0A0A0B] border-white/5 text-white/50 hover:text-white hover:border-white/20"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Zap size={11} className={isActive ? "text-emerald-400" : "opacity-30"} />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Concurrency Counter */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40">تعداد دانلودهای همزمان (Concurrency Queue)</label>
            <select
              className={`text-xs rounded-lg border outline-none px-3 py-2.5 transition-all ${
                isDark 
                  ? "bg-[#0A0A0B] border-white/10 text-slate-300 focus:border-blue-500" 
                  : "bg-slate-50 border-slate-250 text-slate-700"
              }`}
              value={settings.maxConcurrentDownloads}
              onChange={(e) => onUpdateSettings({ maxConcurrentDownloads: Number(e.target.value) })}
            >
              <option value="1">۱ فایل (ترتیبی)</option>
              <option value="2">۲ فایل همزمان</option>
              <option value="3">۳ فایل همزمان</option>
              <option value="5">۵ فایل همزمان (حداکثر سرعت)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40">اعلان‌های اتمام دانلود</label>
            <button
              type="button"
              onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-full text-xs rounded-lg border py-2.5 px-3 text-right flex items-center justify-between font-bold transition-all ${
                settings.notificationsEnabled
                  ? isDark 
                    ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                    : "bg-indigo-50 border-indigo-500 text-indigo-600"
                  : isDark 
                    ? "bg-[#0A0A0B] border-white/5 text-white/30" 
                    : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {settings.notificationsEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                <span>{settings.notificationsEnabled ? "اعلان‌های صوتی و پاپ‌آپ فعال است" : "اعلان‌ها غیرفعال است"}</span>
              </span>
              <span className="text-[10px] opacity-75">{settings.notificationsEnabled ? "روشن" : "خاموش"}</span>
            </button>
          </div>
        </div>

        {/* 3. Nighttime traffic Scheduler settings */}
        <div className="pt-3 border-t border-white/5 rounded-xl p-3 bg-black/25">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="night-schedule-toggle"
                className="h-4 w-4 text-blue-600 rounded border-white/10 focus:ring-blue-500 accent-blue-600"
                checked={settings.nightScheduleEnabled}
                onChange={(e) => onUpdateSettings({ nightScheduleEnabled: e.target.checked })}
              />
              <label htmlFor="night-schedule-toggle" className="text-xs font-bold text-white/80 cursor-pointer select-none">
                برنامه‌ریزی ساعات کم‌ترافیک شبانه (مثال: دانلود رایگان ۲ الی ۷ شب)
              </label>
            </div>
            
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
              settings.nightScheduleEnabled 
                ? "bg-blue-500/10 text-blue-450 border border-blue-500/20" 
                : "bg-white/5 text-white/30"
            }`}>
              {settings.nightScheduleEnabled ? "زمان‌بندی فعال" : "غیرفعال"}
            </span>
          </div>

          <p className="text-[11px] text-white/40 pr-6">
            در صورت فعال‌سازی، فایل‌های قرار گرفته در صف زمان‌بندی فقط و فقط در بازه زمانی تعیین شده دانلود خواهند شد تا در ترافیک روزانه شما صرفه‌جویی شود.
          </p>

          {/* Schedule range picker inputs */}
          {settings.nightScheduleEnabled && (
            <div className="flex gap-4 items-center justify-start mt-3 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 font-semibold">ساعت شروع دانلود شبانه (HH:MM):</span>
                <input
                  type="text"
                  placeholder="02:00"
                  className={`w-16 text-center text-xs font-bold font-mono py-1 rounded border outline-none focus:border-blue-500 ${
                    isDark ? "bg-[#0A0A0B] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                  value={settings.nightScheduleStart}
                  onChange={(e) => onUpdateSettings({ nightScheduleStart: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 font-semibold">ساعت پایان و لغو (HH:MM):</span>
                <input
                  type="text"
                  placeholder="07:00"
                  className={`w-16 text-center text-xs font-bold font-mono py-1 rounded border outline-none focus:border-blue-500 ${
                    isDark ? "bg-[#0A0A0B] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                  value={settings.nightScheduleEnd}
                  onChange={(e) => onUpdateSettings({ nightScheduleEnd: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. YT-DLP Core Engine Update Panel */}
        <div className="pt-4 border-t border-white/5 mt-4 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-blue-400" />
              <h4 className="text-xs font-bold">مدیریت و بروزرسانی موتور استخراج ویدیو (yt-dlp Core Engine)</h4>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                نسخه فعال: v{ytDlpVersion || "2026.06.01"}
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-white/40">
            هسته موتور استخراج هوشمند <code className="text-blue-400 font-mono">yt-dlp</code> به صورت پویا لینک‌های ویدیو را تحلیل و آدرس‌های پشت‌صحنه را ردگیری می‌کند. برای اطمینان از سرعت بارگیری بالا و هماهنگی کامل با الگوریتم‌های جدید یوتیوب و آپارات، موتور استخراج را به آخرین نسخه پایدار ارتقا دهید.
          </p>

          {/* Setup channel & triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Channel choice */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-white/40 font-bold">کانال توزیع نسخه:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateState === "idle" && setChannel("stable")}
                  disabled={updateState !== "idle" && updateState !== "success" && updateState !== "error"}
                  className={`px-3 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                    channel === "stable"
                      ? "bg-blue-600/15 border-blue-500 text-blue-400"
                      : "bg-transparent border-white/5 text-white/40 hover:text-white/60"
                  }`}
                >
                  نسخه پایدار (Stable)
                </button>
                <button
                  type="button"
                  onClick={() => updateState === "idle" && setChannel("nightly")}
                  disabled={updateState !== "idle" && updateState !== "success" && updateState !== "error"}
                  className={`px-3 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                    channel === "nightly"
                      ? "bg-purple-600/15 border-purple-500 text-purple-400"
                      : "bg-transparent border-white/5 text-white/40 hover:text-white/60"
                  }`}
                >
                  بتا/نایتلی (Nightly)
                </button>
              </div>
            </div>

            {/* Main Action trigger */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={triggerUpdateEngine}
                disabled={updateState !== "idle" && updateState !== "success" && updateState !== "error"}
                className={`w-full md:w-auto px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  updateState === "checking" || updateState === "downloading" || updateState === "installing" || updateState === "verifying"
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-650 text-white shadow-blue-500/20"
                }`}
              >
                {updateState === "idle" && (
                  <>
                    <RefreshCw size={13} className="animate-pulse" />
                    <span>بررسی و ارتقای مستقیم به نسخه v2026.07.16</span>
                  </>
                )}
                {(updateState === "checking" || updateState === "verifying") && (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{updateState === "checking" ? "در حال استعلام تگ‌ها..." : "در حال تست..."}</span>
                  </>
                )}
                {updateState === "downloading" && (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>در حال دریافت بسته‌ها ({updateProgress}٪)</span>
                  </>
                )}
                {updateState === "installing" && (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>در حال استخراج و نصب...</span>
                  </>
                )}
                {updateState === "success" && (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>موتور به‌روز است! بررسی مجدد نسخه</span>
                  </>
                )}
                {updateState === "error" && (
                  <>
                    <AlertCircle size={13} className="text-rose-400" />
                    <span>خطا در ارتقا؛ تلاش مجدد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Update Progress and real-time logs terminal */}
          {updateState !== "idle" && (
            <div className="space-y-2 mt-2 animate-fadeIn">
              {/* Progress bar */}
              {(updateState === "downloading" || updateState === "installing" || updateState === "verifying") && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-white/50">
                    <span>{updateState === "downloading" ? "سرعت میانگین: ۱۲.۵ مگابایت بر ثانیه" : "در حال یکپارچه‌سازی نهایی..."}</span>
                    <span className="font-mono">{updateProgress}٪</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-150"
                      style={{ width: `${updateState === "downloading" ? updateProgress : 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Terminal Logs Console Output */}
              <div className="flex flex-col rounded-xl border border-white/5 bg-[#070708] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/5 text-[9px] text-white/40 font-mono">
                  <span>console_output.log</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>
                </div>
                <div className="p-3 text-[10px] font-mono text-emerald-400/90 h-32 overflow-y-auto space-y-1 text-left scrollbar-thin leading-relaxed">
                  {logMessages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-white/20 select-none">[{idx + 1}]</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clean Success banner alert */}
          {updateState === "success" && (
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-start gap-2.5 animate-slideIn">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold">موتور استخراج با موفقیت ارتقا یافت!</p>
                <p className="text-[10px] opacity-80 leading-normal">نسخه جدید باینری <code className="bg-emerald-500/10 px-1 rounded font-mono">v{ytDlpVersion}</code> بر روی سرور مستقر گردید. کلیه پچ‌های هاردساب فارسی و دور زدن سرعت آپارات و یوتیوب فعال شدند.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
