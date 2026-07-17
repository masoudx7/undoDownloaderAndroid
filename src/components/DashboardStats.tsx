/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Download, CheckCircle, Clock, Disc, Radio, Cloud, Power
} from "lucide-react";
import { DownloadTask } from "../types.js";
import { formatBytes, formatSpeed } from "./utils.js";

interface DashboardStatsProps {
  tasks: DownloadTask[];
  currentTotalSpeed: number;
  isDark: boolean;
  onCompletedClick?: () => void;
}

export default function DashboardStats({ tasks, currentTotalSpeed, isDark, onCompletedClick }: DashboardStatsProps) {
  const totalCount = tasks.length;
  const downloading = tasks.filter(t => t.status === "downloading");
  const completed = tasks.filter(t => t.status === "completed");
  const queued = tasks.filter(t => t.status === "queued");

  // Sum bytes
  const totalCompletedBytes = tasks.reduce((acc, t) => acc + t.downloaded, 0);
  const totalSize = tasks.reduce((acc, t) => acc + (t.size > 0 ? t.size : 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 rtl-grid" id="dl-dashboard-stats-row">
      
      {/* 1. Speed & Active downloading */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        isDark 
          ? "bg-[#161618] border-emerald-500/10 text-emerald-400" 
          : "bg-emerald-50/50 border-emerald-100 text-emerald-700 shadow-sm"
      }`}>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">پهنای باند فعال</span>
          <h3 className="text-lg font-bold font-mono tracking-tight">{formatSpeed(currentTotalSpeed)}</h3>
          <p className="text-[10px] text-zinc-400 font-semibold">{downloading.length} فایل فعال در دانلود</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? "bg-emerald-500/10" : "bg-emerald-100/60"}`}>
          <Radio size={20} className={downloading.length > 0 ? "animate-pulse" : ""} />
        </div>
      </div>

      {/* 2. Total items & Wait queue */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        isDark 
          ? "bg-[#161618] border-white/5 text-white/90" 
          : "bg-white border-slate-100 text-slate-700 shadow-sm"
      }`}>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">لیست کل فایل‌ها</span>
          <h3 className="text-lg font-bold font-mono tracking-tight">{(totalCount).toLocaleString('fa-IR')} آیتم</h3>
          <p className="text-[10px] text-zinc-400 font-semibold">{queued.length} عدد در صف انتظار</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          <Download size={20} className="text-white/70" />
        </div>
      </div>

      {/* 3. Completed files */}
      <div 
        onClick={onCompletedClick}
        className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
          isDark 
            ? "bg-[#161618] border-white/5 text-white/90 hover:border-blue-500/30 hover:bg-[#1E1E22]" 
            : "bg-white border-slate-100 text-slate-700 shadow-sm hover:border-blue-405 hover:bg-slate-50"
        }`}
      >
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">دانلودهای موفق</span>
          <h3 className="text-lg font-bold font-mono tracking-tight">{completed.length.toLocaleString('fa-IR')} فایل</h3>
          <p className="text-[10px] text-zinc-400 font-semibold">مجموع حجم: {formatBytes(totalCompletedBytes)}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          <CheckCircle size={20} className="text-blue-400" />
        </div>
      </div>

      {/* 4. Cloud Synchronicity active indicator */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        isDark 
          ? "bg-blue-600/10 border-blue-500/20 text-blue-400" 
          : "bg-indigo-50/50 border-indigo-100 text-indigo-700 shadow-sm"
      }`}>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">وضعیت پایگاه ابری</span>
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-blue-400">
            <Cloud size={14} className="animate-bounce" />
            <span>متصل همگام (Cloud Node)</span>
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold">دسترس آنلاین در سراسر تب‌ها</p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? "bg-blue-600/15" : "bg-indigo-100/60"}`}>
          <Power size={18} className="text-blue-400" />
        </div>
      </div>

    </div>
  );
}
