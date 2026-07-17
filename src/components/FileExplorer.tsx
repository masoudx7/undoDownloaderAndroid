/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Folder, FolderOpen, File, Video, Music, FileText, Cpu, Archive, 
  FileQuestion, Home, ChevronRight, Search, Play, Trash2, Copy, 
  ExternalLink, ArrowLeft, Info, HelpCircle
} from "lucide-react";
import { DownloadTask, DownloadCategory } from "../types.js";
import { formatBytes } from "./utils.js";

interface FileExplorerProps {
  tasks: DownloadTask[];
  isDark: boolean;
  activeFolder: Exclude<DownloadCategory, 'all'> | "root";
  onChangeFolder: (folder: Exclude<DownloadCategory, 'all'> | "root") => void;
  highlightedFileId: string | null;
  onClearHighlight: () => void;
  onOpenCompleted: (task: DownloadTask) => void;
  onDeleteFile: (id: string) => void;
  triggerToast: (title: string, desc: string) => void;
}

export default function FileExplorer({ 
  tasks, 
  isDark, 
  activeFolder, 
  onChangeFolder, 
  highlightedFileId, 
  onClearHighlight,
  onOpenCompleted,
  onDeleteFile,
  triggerToast
}: FileExplorerProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter out completed tasks
  const completedTasks = tasks.filter(t => t.status === "completed");

  // Group config for folder rendering
  const foldersConfig = [
    { key: "video", label: "پوشه ویدیوها و کلیپ‌ها", path: "/downloads/videos/", icon: Video, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { key: "music", label: "پوشه موزیک و پادکست‌ها", path: "/downloads/music/", icon: Music, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { key: "document", label: "پوشه اسناد و فایل‌های متنی", path: "/downloads/documents/", icon: FileText, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { key: "software", label: "پوشه برنامه‌ها و فایل‌های اجرایی", path: "/downloads/software/", icon: Cpu, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
    { key: "compressed", label: "پوشه بسته‌های فشرده و آرشیو", path: "/downloads/archives/", icon: Archive, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { key: "other", label: "پوشه سایر فایل‌های متفرقه", path: "/downloads/others/", icon: FileQuestion, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  ] as const;

  // Clear highlighted file after 3 seconds
  useEffect(() => {
    if (highlightedFileId) {
      const timer = setTimeout(() => {
        onClearHighlight();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFileId]);

  // Scroll highlighted element into view
  useEffect(() => {
    if (highlightedFileId) {
      setTimeout(() => {
        const element = document.getElementById(`explorer-item-${highlightedFileId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [highlightedFileId, activeFolder]);

  // Get total completed tasks count and size per folder
  const getFolderStats = (folderKey: string) => {
    const files = completedTasks.filter(t => t.category === folderKey);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    return {
      count: files.length,
      sizeStr: formatBytes(totalSize)
    };
  };

  // Get current active folder config
  const activeFolderConfig = foldersConfig.find(f => f.key === activeFolder);

  // Get files listed in the active folder (filtered by local search query)
  const currentFolderFiles = completedTasks.filter(task => {
    if (activeFolder !== "root" && task.category !== activeFolder) return false;
    if (localSearchQuery.trim()) {
      return task.name.toLowerCase().includes(localSearchQuery.toLowerCase());
    }
    return true;
  });

  const handleCopyLink = (task: DownloadTask) => {
    navigator.clipboard.writeText(task.url);
    setCopiedId(task.id);
    triggerToast("کپی آدرس منبع", `لینک دانلود "${task.name}" با موفقیت در کلیپ‌بورد کپی شد.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "video": return <Video size={16} className="text-rose-400 animate-pulse" />;
      case "music": return <Music size={16} className="text-purple-400" />;
      case "document": return <FileText size={16} className="text-amber-400" />;
      case "software": return <Cpu size={16} className="text-sky-400" />;
      case "compressed": return <Archive size={16} className="text-emerald-400" />;
      default: return <FileQuestion size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6" style={{ direction: "rtl" }}>
      {/* Upper breadcrumbs & general layout bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isDark ? "bg-[#161618] border-white/10" : "bg-white border-slate-200 shadow-sm"
      }`}>
        {/* Breadcrumb links */}
        <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
          <button 
            type="button"
            onClick={() => onChangeFolder("root")}
            className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
              activeFolder === "root" 
                ? "text-blue-400" 
                : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Home size={14} />
            <span>خانه (سیستم فایل اندو)</span>
          </button>

          {activeFolder !== "root" && (
            <>
              <ChevronRight size={12} className="text-white/20 shrink-0" />
              <div className="flex items-center gap-1 text-blue-400 font-bold font-sans">
                <span>{activeFolderConfig?.label}</span>
                <span className="text-[10px] opacity-40 font-mono">({activeFolderConfig?.path})</span>
              </div>
            </>
          )}
        </div>

        {/* Global info or totals */}
        <div className="text-[11px] text-white/40 font-semibold self-end md:self-auto flex items-center gap-1.5">
          <Info size={12} className="text-blue-400/75 animate-bounce" />
          <span>مجموع فایل‌های بارگیری شده: <b>{completedTasks.length.toLocaleString('fa-IR')} عدد</b></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar navigation panel */}
        <div className="lg:col-span-1 space-y-3">
          <div className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#161618] border-white/10" : "bg-white border-slate-200"
          }`}>
            <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider">سلسله مراتب فایل‌ها</h4>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onChangeFolder("root")}
                className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeFolder === "root"
                    ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                    : "border border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home size={13} />
                  <span>پوشه ریشه (Root)</span>
                </div>
                <span className="text-[10px] font-mono opacity-50 bg-white/5 px-2 py-0.5 rounded-full">{completedTasks.length}</span>
              </button>

              <div className="h-px bg-white/5 my-2" />

              {foldersConfig.map((folder) => {
                const stats = getFolderStats(folder.key);
                const isActive = activeFolder === folder.key;
                const Icon = folder.icon;

                return (
                  <button
                    key={folder.key}
                    type="button"
                    onClick={() => onChangeFolder(folder.key)}
                    className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                      isActive
                        ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                        : "border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className={isActive ? "text-blue-400" : "text-white/40"} />
                      <span>{folder.label.replace("پوشه ", "")}</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-45 bg-white/5 px-2 py-0.5 rounded-full">{stats.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safe Storage Disk Info */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#161618] border-white/5 text-white/50" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold pb-2 border-b border-white/5 mb-3">
              <span>فضای درایو مجازی اندو</span>
              <span className="font-mono text-emerald-400">سالم</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span>کل ظرفیت دانلودها:</span>
                <span className="font-mono text-white/80">{formatBytes(completedTasks.reduce((s, t) => s + t.size, 0))}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full w-[38%]" />
              </div>
              <p className="text-[9px] opacity-60 leading-normal text-right">
                آدرس‌ها و باینری‌ها به صورت مجازی در فایل سیستم محلی و همگام‌ساز کلود قرار دارند.
              </p>
            </div>
          </div>
        </div>

        {/* Right side content area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 1. VIEW STATE: ROOT DIRECTORY CARD GRID */}
          {activeFolder === "root" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foldersConfig.map((folder, index) => {
                const stats = getFolderStats(folder.key);
                const Icon = folder.icon;

                return (
                  <motion.div
                    key={folder.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => onChangeFolder(folder.key)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-40 ${
                      isDark 
                        ? "bg-[#161618] border-white/10 hover:border-blue-500/40 hover:bg-[#1E1E22] hover:shadow-xl hover:shadow-blue-500/5" 
                        : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white/90">{folder.label}</h4>
                        <code className="text-[9px] text-blue-400 font-mono">{folder.path}</code>
                      </div>
                      <div className={`p-3 rounded-xl border ${folder.color}`}>
                        <Icon size={20} className="stroke-[2px]" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-white/30 block font-bold">تعداد فایل</span>
                        <span className="text-xs font-bold text-white/80">{stats.count.toLocaleString('fa-IR')} فایل</span>
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] text-white/30 block font-bold">حجم پوشه</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">{stats.sizeStr}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* 2. VIEW STATE: SPECIFIC CATEGORY FOLDER VIEW */}
          {activeFolder !== "root" && (
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
              isDark ? "bg-[#161618] border-white/10" : "bg-white border-slate-200"
            }`}>
              {/* Folder header and search inside */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-white/5 mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${activeFolderConfig?.color}`}>
                    {activeFolderConfig && React.createElement(activeFolderConfig.icon, { size: 18 })}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white/90">{activeFolderConfig?.label}</h3>
                    <code className="text-[10px] text-blue-400 font-mono tracking-tight">{activeFolderConfig?.path}</code>
                  </div>
                </div>

                {/* Local filter Search */}
                <div className="relative w-full md:w-64">
                  <Search size={12} className="absolute right-3 top-2.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="جستجو در این پوشه..."
                    className={`w-full outline-none text-xs pr-8 pl-3 py-1.5 rounded-lg border text-right focus:border-blue-500 transition-all ${
                      isDark 
                        ? "bg-[#0A0A0B] border-white/10 text-white placeholder:text-white/20" 
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Files Table / List */}
              {currentFolderFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center gap-2.5">
                  <FolderOpen size={40} className="opacity-10 text-blue-400" />
                  <p className="text-xs font-bold">پوشه خالی است!</p>
                  <p className="text-[10px] text-white/30 max-w-xs leading-normal">
                    {localSearchQuery ? "هیچ فایلی با این عبارت در پوشه فعلی پیدا نشد." : `هیچ دانلود تکمیلی در پوشه ${activeFolderConfig?.label} ثبت نگردیده است.`}
                  </p>
                  {localSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setLocalSearchQuery("")}
                      className="text-[10px] font-bold text-blue-400 hover:underline mt-1 cursor-pointer"
                    >
                      پاک کردن جستجو
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentFolderFiles.map((task) => {
                    const isHighlighted = task.id === highlightedFileId;

                    return (
                      <div
                        key={task.id}
                        id={`explorer-item-${task.id}`}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all duration-500 relative overflow-hidden ${
                          isHighlighted
                            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500 animate-pulse"
                            : isDark
                              ? "bg-[#0A0A0B]/40 border-white/5 hover:border-white/10 hover:bg-[#0A0A0B]/80"
                              : "bg-slate-50/50 border-slate-150 hover:bg-slate-50 hover:shadow-sm"
                        }`}
                      >
                        {/* Glowing left strip for highlighted items */}
                        {isHighlighted && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}

                        <div className="flex items-center gap-3 max-w-full overflow-hidden">
                          <div className={`p-2 rounded-lg bg-white/5 shrink-0 border border-white/5`}>
                            {getCategoryIcon(task.category)}
                          </div>
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-bold text-white/90 truncate max-w-[280px] md:max-w-[400px] text-right" title={task.name}>
                              {task.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-white/35 flex-wrap">
                              <span className="font-bold text-emerald-400">{formatBytes(task.size)}</span>
                              <span>•</span>
                              <span>فرمت: {task.fileType.toUpperCase()}</span>
                              {task.completedAt && (
                                <>
                                  <span>•</span>
                                  <span>دریافت: {new Date(task.completedAt).toLocaleTimeString('fa-IR', { hour: "2-digit", minute: "2-digit" })} - {new Date(task.completedAt).toLocaleDateString('fa-IR')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* File operations controllers */}
                        <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 mt-2 md:mt-0">
                          {/* Play / Exec option */}
                          <button
                            type="button"
                            onClick={() => onOpenCompleted(task)}
                            className="px-2.5 py-1.5 text-[10px] rounded-lg font-bold border flex items-center gap-1 transition-all bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md shadow-blue-500/10"
                            title="اجرای مستقیم فایل"
                          >
                            <Play size={10} className="fill-current" />
                            <span>پخش و اجرا</span>
                          </button>

                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(task)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              copiedId === task.id
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : isDark ? "bg-[#161618] border-white/5 hover:bg-white/5 text-white/50 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                            title="کپی آدرس منبع"
                          >
                            <Copy size={11} />
                          </button>

                          {/* Delete File */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`آیا مطمئن هستید که می‌خواهید فایل "${task.name}" را حذف فیزیکی کنید؟`)) {
                                onDeleteFile(task.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDark ? "bg-[#161618] border-white/5 hover:bg-rose-950/20 text-rose-500" : "bg-white border-slate-200 text-rose-600 hover:bg-rose-50"
                            }`}
                            title="حذف دائمی فایل"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Back navigation */}
              <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => onChangeFolder("root")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDark ? "bg-[#1C1C1F] border-white/5 hover:bg-[#252528] text-white/70" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <ArrowLeft size={12} />
                  <span>بازگشت به پوشه ریشه</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
