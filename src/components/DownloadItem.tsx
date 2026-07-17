/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Play, Pause, Trash2, Video, Music, FileText, Cpu, Archive, FileQuestion, 
  Clock, AlertCircle, CheckCircle, RefreshCw, FolderOpen
} from "lucide-react";
import { DownloadTask } from "../types.js";
import { formatBytes, formatSpeed, formatTimeETA } from "./utils.js";

interface DownloadItemProps {
  key?: string | number;
  task: DownloadTask;
  isDark: boolean;
  onAction: (id: string, action: 'start' | 'pause' | 'stop' | 'delete' | 'resume') => void | Promise<void>;
  onOpenCompleted?: (task: DownloadTask) => void;
  onShowInFolder?: (task: DownloadTask) => void;
}

export default function DownloadItem({ task, isDark, onAction, onOpenCompleted, onShowInFolder }: DownloadItemProps) {
  // Category Icons
  const getCategoryIcon = () => {
    switch (task.category) {
      case "video":
        return <Video size={16} className="text-rose-500" />;
      case "music":
        return <Music size={16} className="text-purple-500" />;
      case "document":
        return <FileText size={16} className="text-amber-500" />;
      case "software":
        return <Cpu size={16} className="text-sky-500" />;
      case "compressed":
        return <Archive size={16} className="text-emerald-500" />;
      default:
        return <FileQuestion size={16} className="text-slate-500" />;
    }
  };

  const getStatusTextAndStyle = () => {
    switch (task.status) {
      case "downloading":
        return {
          text: "در حال دانلود",
          className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          progressColor: "bg-gradient-to-r from-emerald-400 to-teal-500"
        };
      case "queued":
        return {
          text: "در انتظار صف",
          className: "bg-slate-500/10 text-slate-400 border border-slate-700/40",
          progressColor: "bg-slate-600"
        };
      case "paused":
        return {
          text: "متوقف موقت",
          className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          progressColor: "bg-amber-500/60"
        };
      case "completed":
        return {
          text: "تکمیل شده",
          className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
          progressColor: "bg-blue-500"
        };
      case "error":
        return {
          text: "خطای سرور",
          className: "bg-rose-500/10 text-rose-400 border border-rose-500/10",
          progressColor: "bg-rose-500"
        };
      default:
        return {
          text: "متوقف شده",
          className: "bg-zinc-500/10 text-zinc-400 border border-zinc-600/30",
          progressColor: "bg-zinc-600"
        };
    }
  };

  const statusStyle = getStatusTextAndStyle();
  const bytesRemaining = Math.max(0, task.size - task.downloaded);

  return (
    <div 
      onClick={() => task.status === "completed" && onShowInFolder && onShowInFolder(task)}
      className={`p-4 rounded-xl border transition-all duration-300 relative ${
        task.status === "completed" ? "cursor-pointer hover:border-blue-500/40 active:scale-[0.99]" : ""
      } ${
        isDark 
          ? "bg-[#161618] border-white/10 hover:bg-[#1E1E22] shadow-sm" 
          : "bg-white border-slate-100 hover:shadow-md"
      }`} 
      id={`download-item-${task.id}`} 
      style={{ direction: "rtl" }}
    >
      
      {/* Upper info row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
        <div className="flex items-center gap-2.5 max-w-full overflow-hidden">
          <div className={`p-2 rounded-lg ${isDark ? "bg-[#0A0A0B]/80" : "bg-slate-100"}`}>
            {getCategoryIcon()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold truncate tracking-tight text-right text-white/90" title={task.name}>
              {task.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle.className}`}>
                {statusStyle.text}
              </span>
              {task.ytDlpFormat && (
                <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2 py-0.5 rounded-full font-sans">
                  کیفیت ویدیو: {task.ytDlpFormat}
                </span>
              )}
              {task.isScheduled && (
                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={8} />
                  <span>زمان‌بندی: {task.scheduledStartTime} الی {task.scheduledEndTime}</span>
                </span>
              )}
              <span className="text-[10px] font-mono text-white/30">{task.fileType.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          {task.status === "downloading" || task.status === "queued" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(task.id, "pause"); }}
              className={`p-2 rounded-lg transition-colors border ${
                isDark ? "bg-[#1C1C1F] border-white/5 hover:bg-[#252528] text-amber-500" : "bg-slate-100 hover:bg-slate-200 text-amber-600"
              }`}
              title="توقف دانلود"
            >
              <Pause size={12} />
            </button>
          ) : task.status !== "completed" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(task.id, "resume"); }}
              className={`p-2 rounded-lg transition-colors border ${
                isDark ? "bg-[#1C1C1F] border-white/5 hover:bg-[#252528] text-emerald-500" : "bg-slate-100 hover:bg-slate-200 text-emerald-600"
              }`}
              title="شروع مجدد"
            >
              <Play size={12} />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onShowInFolder && onShowInFolder(task); }}
                className={`p-2 rounded-lg transition-colors border flex items-center justify-center cursor-pointer ${
                  isDark ? "bg-[#1C1C1F] border-white/5 hover:border-blue-500/50 hover:bg-blue-600/10 text-blue-400" : "bg-blue-50/50 hover:bg-blue-100/80 border-blue-100/50 text-blue-600"
                }`}
                title="نمایش در پوشه"
              >
                <FolderOpen size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenCompleted && onOpenCompleted(task); }}
                className={`p-2 rounded-lg transition-colors border flex items-center justify-center cursor-pointer ${
                  isDark ? "bg-[#1C1C1F] border-white/5 hover:border-blue-500/50 hover:bg-blue-600/10 text-blue-400" : "bg-blue-50/50 hover:bg-blue-100/80 border-blue-100/50 text-blue-600"
                }`}
                title="پخش و اجرا"
              >
                <Play size={12} className="fill-current" />
              </button>
            </>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onAction(task.id, "delete"); }}
            className={`p-2 rounded-lg transition-colors border ${
              isDark ? "bg-[#1C1C1F] border-white/5 hover:bg-rose-950/20 text-rose-500" : "bg-slate-100 hover:bg-rose-50 text-rose-600"
            }`}
            title="حذف از لیست"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Progress Bar with glowing indicator */}
      <div className="space-y-1.5">
        <div className={`w-full rounded-full h-2 overflow-hidden relative ${isDark ? "bg-black/40" : "bg-slate-100"}`}>
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${statusStyle.progressColor}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        {/* Live Metrics: Speed, Size complete ratio, ETA, Percentage */}
        <div className="flex justify-between items-center text-[10px] md:text-[11px] text-white/55">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white/80 font-mono">%{task.progress.toLocaleString('fa-IR')}</span>
            <span className="text-white/40">منقضی: {formatBytes(task.downloaded)} از {formatBytes(task.size)}</span>
          </div>

          <div className="flex gap-3 font-mono">
            {task.status === "downloading" && (
              <>
                <span className="text-emerald-400 font-bold">{formatSpeed(task.speed)}</span>
                <span className="text-white/40">باقیمانده: {formatTimeETA(bytesRemaining, task.speed)}</span>
              </>
            )}
            {task.status === "completed" && (
              <span className="text-blue-400 flex items-center gap-1">
                <CheckCircle size={10} />
                <span>پایان دانلود</span>
              </span>
            )}
            {task.status === "paused" && <span className="text-amber-500">متوقف</span>}
            {task.status === "queued" && <span className="text-white/30">در صف انتظار بندویث...</span>}
            {task.status === "error" && (
              <span className="text-rose-500 flex items-center gap-1 font-sans">
                <AlertCircle size={10} />
                <span>{task.errorMessage || "خطای ناشناخته"}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
