/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, Download, Clipboard, AlertCircle, Clock, Check, RefreshCw, Sliders } from "lucide-react";
import { DownloadCategory } from "../types.js";

interface AddDownloadFormProps {
  isDark: boolean;
  onAddDownload: (task: {
    url: string;
    name: string;
    category: Exclude<DownloadCategory, 'all'>;
    size: number;
    isScheduled: boolean;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    ytDlpFormat?: string;
  }) => void;
  // Allows pre-filling from browser
  prefilled?: {
    url: string;
    name: string;
    category: string;
    size: number;
    ytDlpFormat?: string;
  } | null;
  onClearPrefilled?: () => void;
  ytDlpVersion?: string;
}

export default function AddDownloadForm({ isDark, onAddDownload, prefilled, onClearPrefilled, ytDlpVersion }: AddDownloadFormProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Exclude<DownloadCategory, 'all'>>("video");
  const [isScheduled, setIsScheduled] = useState(false);
  const [startTime, setStartTime] = useState("02:00");
  const [endTime, setEndTime] = useState("07:00");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    type: string;
    title: string;
    thumbnail?: string;
    formats?: { quality: string; size: number }[];
    category?: Exclude<DownloadCategory, 'all'>;
    fileType?: string;
    size?: number;
  } | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedFormatSize, setSelectedFormatSize] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState("");

  // Advanced yd (yt-dlp) options states
  const [extractionMode, setExtractionMode] = useState<"video_audio" | "video_only" | "audio_only">("video_audio");
  const [outputContainer, setOutputContainer] = useState<string>("mp4");
  const [embedSubtitles, setEmbedSubtitles] = useState(false);
  const [downloadThumbnail, setDownloadThumbnail] = useState(false);
  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [bypassSsl, setBypassSsl] = useState(true);
  const [connectionThreads, setConnectionThreads] = useState<number>(8);
  const [dnsBypass, setDnsBypass] = useState(true);

  // Sync state if prefilled from browser
  React.useEffect(() => {
    if (prefilled) {
      setUrl(prefilled.url);
      setName(prefilled.name);
      setCategory(prefilled.category as Exclude<DownloadCategory, 'all'>);
      if (prefilled.ytDlpFormat) {
        setSelectedFormat(prefilled.ytDlpFormat);
        setSelectedFormatSize(prefilled.size);
        setAnalysisResult({
          type: "video_platform",
          title: prefilled.name,
          formats: [
            { quality: prefilled.ytDlpFormat, size: prefilled.size }
          ]
        });
      } else {
        setAnalysisResult({
          type: "direct_link",
          title: prefilled.name,
          size: prefilled.size,
          category: prefilled.category as Exclude<DownloadCategory, 'all'>
        });
        setSelectedFormatSize(prefilled.size);
      }
    }
  }, [prefilled]);

  // Handle URL Paste directly
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMsg("");
      }
    } catch (err) {
      setErrorMsg("دسترسی به کلیپ‌بورد مرورگر محدود شده است. آدرس را دستی وارد کنید.");
    }
  };

  // Analyze URL through backend to see file metadata or yt-dlp streams
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setErrorMsg("لطفاً ابتدا یک آدرس پیوند معتبر وارد کنید");
      return;
    }
    setErrorMsg("");
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/detect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        throw new Error("خطا در تحليل لینک");
      }

      const data = await response.json();
      setAnalysisResult(data);
      setName(data.title || "دانلود_غیرمستقیم");
      
      if (data.type === "video_platform" && data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0].quality);
        setSelectedFormatSize(data.formats[0].size);
        setCategory("video");
      } else {
        if (data.category) setCategory(data.category);
        if (data.size) setSelectedFormatSize(data.size);
      }
    } catch (e) {
      setErrorMsg("ارتباط با پورتال استخراج با لغو مواجه شد. در حال بارگذاری دستی...");
      // Mock loading in failure modes
      setName(url.split("/").pop()?.split("?")[0] || "download_file");
      setSelectedFormatSize(15000000); // 15MB base
    } finally {
      setAnalyzing(false);
    }
  };

  // Clean-up and Reset Form
  const resetForm = () => {
    setUrl("");
    setName("");
    setCategory("video");
    setIsScheduled(false);
    setAnalysisResult(null);
    setSelectedFormat("");
    setSelectedFormatSize(-1);
    setErrorMsg("");
    setExtractionMode("video_audio");
    setOutputContainer("mp4");
    setEmbedSubtitles(false);
    setDownloadThumbnail(false);
    setHighQualityAudio(true);
    setBypassSsl(true);
    setConnectionThreads(8);
    setDnsBypass(true);
    if (onClearPrefilled) onClearPrefilled();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg("آدرس دانلود نمی‌تواند خالی باشد");
      return;
    }

    const finalName = name.trim() || url.split("/").pop()?.split("?")[0] || "فایل_دانلود";
    const finalSize = selectedFormatSize > 0 ? selectedFormatSize : Math.floor(25000000 + Math.random() * 150000000);

    const formatLabel = selectedFormat
      ? `${selectedFormat} | ${outputContainer.toUpperCase()}${embedSubtitles ? " + زیرنویس" : ""}${connectionThreads !== 8 ? ` | ${connectionThreads}اتصال` : ""}`
      : undefined;

    onAddDownload({
      url: url.trim(),
      name: finalName,
      category,
      size: finalSize,
      isScheduled,
      scheduledStartTime: isScheduled ? startTime : null,
      scheduledEndTime: isScheduled ? endTime : null,
      ytDlpFormat: formatLabel
    });

    resetForm();
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 rtl-grid ${
      isDark 
        ? "bg-[#161618] border-white/10 text-white shadow-2xl" 
        : "bg-white border-slate-100 text-slate-900 shadow-sm"
    }`} id="add-download-form-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-bold flex items-center gap-2">
          <Link className="text-blue-400" size={18} />
          {prefilled ? "شارژ خودکار لینک از مرورگر" : "درخواست و ایجاد دانلود جدید"}
        </h3>
        {prefilled && (
          <button 
            type="button" 
            onClick={resetForm}
            className="text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-3 py-1 rounded-full transition-all"
          >
            پاکسازی و ورودی دوباره
          </button>
        )}
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        {/* URL Input Box */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-slate-500"}`}>آدرس مستقیم (یا لینک یوتیوب، آپارات)</label>
          <div className="flex items-center gap-1.5 relative">
            <input
              type="text"
              placeholder="https://example.com/movie.mp4"
              className={`w-full text-xs font-mono rounded-lg outline-none border transition-all text-left pl-3 pr-24 ${
                isDark 
                  ? "bg-[#0A0A0B] border-white/10 focus:border-blue-500 text-slate-200 placeholder:text-white/20" 
                  : "bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
              } py-2.5`}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMsg("");
              }}
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handlePaste}
                className={`py-1.5 px-2.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 ${
                  isDark 
                    ? "bg-[#1C1C1F] hover:bg-[#252528] text-slate-300 border border-white/5" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
                title="جایگذاری از کلیپ‌بورد"
              >
                <Clipboard size={11} />
                <span>جایگذاری</span>
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !url}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                {analyzing ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                <span>آنالیز لینک</span>
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Analysis results based on yt-dlp */}
        {analysisResult && (
          <div className={`p-4 rounded-xl border border-dashed transition-all ${
            isDark ? "bg-[#0A0A0B]/80 border-white/10" : "bg-slate-100/50 border-slate-200"
          }`}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {analysisResult.thumbnail && (
                <img 
                  src={analysisResult.thumbnail} 
                  alt="محتوای لینک" 
                  className="w-24 h-16 rounded-lg object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 space-y-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  analysisResult.type === "video_platform" 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                }`}>
                  {analysisResult.type === "video_platform" ? "میدیا استریمر هوشمند" : "لینک مستقیم دانلود"}
                </span>
                
                {/* File Label editor */}
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[10px] text-white/40">ویرایش نام فایل ذخیره‌سازی</label>
                  <input
                    type="text"
                    className={`w-full text-xs font-medium rounded-md px-2.5 py-1.5 border ${
                      isDark 
                        ? "bg-[#1C1C1F] border-white/10 focus:border-blue-500 text-white" 
                        : "bg-white border-slate-200 focus:border-blue-500 text-slate-800"
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* If Video Platform, show format selector */}
            {analysisResult.type === "video_platform" && analysisResult.formats && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                <p className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-slate-500"}`}>انتخاب کیفیت تصویر و صوت ویدیو</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {analysisResult.formats.map((fmt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedFormat(fmt.quality);
                        setSelectedFormatSize(fmt.size);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col justify-center items-center text-center gap-1.5 transition-all relative ${
                        selectedFormat === fmt.quality
                          ? isDark 
                            ? "bg-blue-600/15 border-blue-500 text-blue-400" 
                            : "bg-blue-50 border-blue-500 text-blue-600"
                          : isDark 
                            ? "bg-[#1C1C1F] border-white/5 hover:bg-[#252528] text-white/70" 
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{fmt.quality}</span>
                      <span className="text-[9px] opacity-75 font-mono">{(fmt.size / (1024 * 1024)).toFixed(1)} MB</span>
                      {selectedFormat === fmt.quality && (
                        <span className="p-0.5 bg-blue-600 text-white rounded-full text-[8px] absolute top-1 right-1">
                          <Check size={8} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ADVANCED YT-DLP OPTIONS CARD */}
                <div className={`p-4 rounded-xl border space-y-4 text-right transition-all leading-normal ${
                  isDark ? "bg-[#0A0A0B]/80 border-white/5 text-white/90" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Sliders size={13} />
                      تنظیمات عمومی و گزینه‌های استخراج هوشمند (yt-dlp)
                    </span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                      yd engine v{ytDlpVersion || "2026.06.01"}
                    </span>
                  </div>

                  {/* Extraction Mode Segment button group */}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-semibold block ${isDark ? "text-white/50" : "text-slate-500"}`}>نوع استخراج و دریافت فایل (Extraction Mode)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExtractionMode("video_audio");
                          setCategory("video");
                          const hdFormat = analysisResult.formats?.find(f => f.quality.includes("1080")) || analysisResult.formats?.[0];
                          if (hdFormat) {
                            setSelectedFormat(hdFormat.quality);
                            setSelectedFormatSize(hdFormat.size);
                          }
                          const ext = outputContainer === "mp3" || outputContainer === "m4a" ? "mp4" : outputContainer;
                          if (outputContainer === "mp3" || outputContainer === "m4a") setOutputContainer("mp4");
                          setName(prev => prev.replace(/\.[a-zA-Z0-9]+$/, "") + "." + ext);
                        }}
                        className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                          extractionMode === "video_audio"
                            ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                            : isDark ? "bg-[#161618] border-white/5 hover:bg-[#202022] text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        ویدیو + صدا (اصلی)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractionMode("video_only");
                          setCategory("video");
                          const hdFormat = analysisResult.formats?.find(f => !f.quality.includes("Audio") && !f.quality.includes("صدا")) || analysisResult.formats?.[0];
                          if (hdFormat) {
                            setSelectedFormat(hdFormat.quality);
                            setSelectedFormatSize(hdFormat.size);
                          }
                          const ext = outputContainer === "mp3" || outputContainer === "m4a" ? "mp4" : outputContainer;
                          if (outputContainer === "mp3" || outputContainer === "m4a") setOutputContainer("mp4");
                          setName(prev => prev.replace(/\.[a-zA-Z0-9]+$/, "") + "." + ext);
                        }}
                        className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                          extractionMode === "video_only"
                            ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                            : isDark ? "bg-[#161618] border-white/5 hover:bg-[#202022] text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        فقط تصویر (بی‌صدا)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractionMode("audio_only");
                          setCategory("music");
                          const audioFmt = analysisResult.formats?.find(f => f.quality.includes("Audio") || f.quality.includes("صدا")) || analysisResult.formats?.[3];
                          if (audioFmt) {
                            setSelectedFormat(audioFmt.quality);
                            setSelectedFormatSize(audioFmt.size);
                          }
                          setOutputContainer("mp3");
                          setName(prev => prev.replace(/\.[a-zA-Z0-9]+$/, "") + ".mp3");
                        }}
                        className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all border text-center cursor-pointer ${
                          extractionMode === "audio_only"
                            ? "bg-rose-600/25 border-rose-500 text-rose-450 shadow-sm"
                            : isDark ? "bg-[#161618] border-white/5 hover:bg-[#202022] text-white/60" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        فقط موزیک / صدا (MP3)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Output container */}
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className={`text-[10px] font-semibold ${isDark ? "text-white/50" : "text-slate-500"}`}>فرمت نهایی کانتینر (Output Container)</label>
                      <select
                        value={outputContainer}
                        onChange={(e) => {
                          const ext = e.target.value;
                          setOutputContainer(ext);
                          setName(prev => prev.replace(/\.[a-zA-Z0-9]+$/, "") + "." + ext);
                          if (ext === "mp3" || ext === "m4a") {
                            setExtractionMode("audio_only");
                            setCategory("music");
                            const audioFmt = analysisResult.formats?.find(f => f.quality.includes("Audio") || f.quality.includes("صدا")) || analysisResult.formats?.[3];
                            if (audioFmt) {
                              setSelectedFormat(audioFmt.quality);
                              setSelectedFormatSize(audioFmt.size);
                            }
                          } else {
                            if (extractionMode === "audio_only") {
                              setExtractionMode("video_audio");
                              setCategory("video");
                              const hdFormat = analysisResult.formats?.find(f => f.quality.includes("1080")) || analysisResult.formats?.[0];
                              if (hdFormat) {
                                setSelectedFormat(hdFormat.quality);
                                setSelectedFormatSize(hdFormat.size);
                              }
                            }
                          }
                        }}
                        className={`w-full text-xs rounded-lg outline-none border py-2 px-3 transition-all font-mono rtl-grid ${
                          isDark ? "border-white/10 bg-[#161618] text-slate-300 focus:border-blue-500" : "border-slate-200 bg-white text-slate-700 focus:border-blue-500"
                        }`}
                      >
                        {extractionMode !== "audio_only" ? (
                          <>
                            <option value="mp4">MP4 (.mp4) - پیش‌فرض و سازگارترین</option>
                            <option value="mkv">MKV (.mkv) - حجم فشرده و کیفیت اصلی</option>
                            <option value="webm">WebM (.webm) - مخصوص کدک VP9/AV1</option>
                          </>
                        ) : (
                          <>
                            <option value="mp3">MP3 (.mp3) - صوتی ۳۲۰ کیلوبیت</option>
                            <option value="m4a">M4A (.m4a) - صوتی سبک AAC</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Thread connections slider */}
                    <div className="flex flex-col gap-1.5 justify-center">
                      <div className="flex justify-between items-center text-right">
                        <label className={`text-[10px] font-semibold ${isDark ? "text-white/50" : "text-slate-500"}`}>تعداد کانکشن موازی شبکه (Threads)</label>
                        <span className="text-[10px] text-blue-400 font-bold font-mono">{connectionThreads} Connections</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="16"
                          step="1"
                          value={connectionThreads}
                          onChange={(e) => setConnectionThreads(parseInt(e.target.value))}
                          className="flex-1 accent-blue-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                        />
                        <span className={`text-[9px] border px-2 py-0.5 rounded ${
                          isDark ? "bg-white/5 border-white/5 text-white/70" : "bg-slate-100 border-slate-100 text-slate-700"
                        }`}>{connectionThreads === 16 ? "حداکثر" : connectionThreads >= 8 ? "پربند" : "عادی"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Engine flags */}
                  <div className="pt-2 border-t border-white/5 text-right">
                    <p className={`text-[10px] font-semibold mb-2 ${isDark ? "text-white/55" : "text-slate-500"}`}>سوئیچ‌ها و فلگ‌های اجرایی انجین yd-dlp</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-right">
                      <label className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 border rounded-lg transition-all ${
                        isDark ? "bg-[#161618]/50 border-white/5 hover:bg-[#1C1C1F]" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={embedSubtitles}
                          onChange={(e) => setEmbedSubtitles(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                        />
                        <div className="flex flex-col text-right">
                          <span className={`text-[10px] font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>چسباندن زیرنویس هاردساب (--embed-subs)</span>
                          <span className={`text-[8px] ${isDark ? "text-white/35" : "text-slate-400"}`}>دانلود خودکار و ادغام مستقیم زیرنویس فارسی</span>
                        </div>
                      </label>
                      
                      <label className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 border rounded-lg transition-all ${
                        isDark ? "bg-[#161618]/50 border-white/5 hover:bg-[#1C1C1F]" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={downloadThumbnail}
                          onChange={(e) => setDownloadThumbnail(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                        />
                        <div className="flex flex-col text-right">
                          <span className={`text-[10px] font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>کپچر کاور ویدیو (--write-thumbnail)</span>
                          <span className={`text-[8px] ${isDark ? "text-white/35" : "text-slate-400"}`}>استخراج کاور پوستر ویدیو به صورت تصویر جدا</span>
                        </div>
                      </label>

                      <label className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 border rounded-lg transition-all ${
                        isDark ? "bg-[#161618]/50 border-white/5 hover:bg-[#1C1C1F]" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={bypassSsl}
                          onChange={(e) => setBypassSsl(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                        />
                        <div className="flex flex-col text-right">
                          <span className={`text-[10px] font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>نادیده گرفتن خطاهای گواهی SSL</span>
                          <span className={`text-[8px] ${isDark ? "text-white/35" : "text-slate-400"}`}>Bypassing certificate checks (--no-check-certificates)</span>
                        </div>
                      </label>

                      <label className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 border rounded-lg transition-all ${
                        isDark ? "bg-[#161618]/50 border-white/5 hover:bg-[#1C1C1F]" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={dnsBypass}
                          onChange={(e) => setDnsBypass(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                        />
                        <div className="flex flex-col text-right">
                          <span className={`text-[10px] font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>دور زدن تحریم‌های آی‌پی</span>
                          <span className={`text-[8px] ${isDark ? "text-white/35" : "text-slate-400"}`}>استفاده از DNSهای هماهنگ برای سرعت حداکثر</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categories, Schedules, trigger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categorization */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-slate-500"}`}>دسته‌بندی فایل</label>
            <select
              className={`w-full text-xs rounded-lg outline-none border px-3 py-2.5 transition-all ${
                isDark 
                  ? "bg-[#0A0A0B] border-white/10 text-slate-300 focus:border-blue-500" 
                  : "bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500"
              }`}
              value={category}
              onChange={(e) => setCategory(e.target.value as Exclude<DownloadCategory, 'all'>)}
            >
              <option value="video">ویدیو و کلیپ</option>
              <option value="music">موزیک و پادکست</option>
              <option value="document">اسناد و کتاب الکترونیکی</option>
              <option value="software">نرم‌افزار و سیستم‌عامل</option>
              <option value="compressed">بایگانی فشرده (Zip, Rar)</option>
              <option value="other">metferghe / deegar</option>
            </select>
          </div>

          {/* Toggle Scheduler */}
          <div className={`flex flex-col justify-center border rounded-xl p-3 transition-all ${
            isDark ? "border-white/10 bg-[#0A0A0B]/40" : "border-slate-200 bg-slate-50/20"
          }`}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isDark ? "text-white/80" : "text-slate-700"}`}>دانلود زمان‌بندی شده</span>
                <span className={`text-[10px] ${isDark ? "text-white/40" : "text-slate-450"}`}>شروع خودکار و دانلود در ساعات کم‌ترافیک شبانه</span>
              </div>
            </label>

            {isScheduled && (
              <div className="flex gap-2 mt-3 items-center justify-between border-t border-white/5 pt-2 animate-fadeIn">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${isDark ? "text-white/40" : "text-slate-450"}`}>شروع:</span>
                  <input
                    type="text"
                    className={`w-12 text-[10px] text-center font-mono rounded border py-1 ${
                      isDark ? "bg-[#1C1C1F] border-white/5 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                    }`}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${isDark ? "text-white/40" : "text-slate-450"}`}>پایان:</span>
                  <input
                    type="text"
                    className={`w-12 text-[10px] text-center font-mono rounded border py-1 ${
                      isDark ? "bg-[#1C1C1F] border-white/5 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                    }`}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <Clock size={12} className="text-blue-400" />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>افزودن لینک به صف دانلود و شروع همگام‌سازی</span>
        </button>
      </form>
    </div>
  );
}
