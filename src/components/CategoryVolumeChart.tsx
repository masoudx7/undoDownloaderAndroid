/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { DownloadTask, DownloadCategory } from "../types.js";
import { Layers } from "lucide-react";

interface CategoryVolumeChartProps {
  tasks: DownloadTask[];
  isDark: boolean;
}

export default function CategoryVolumeChart({ tasks, isDark }: CategoryVolumeChartProps) {
  // Translate categories
  const CATEGORY_NAMES: Record<string, string> = {
    video: "ویدیو و کلیپ",
    music: "موسیقی",
    document: "اسناد",
    software: "برنامه‌ها",
    compressed: "بایگانی",
    other: "دیگر"
  };

  const CATEGORY_COLORS: Record<string, string> = {
    video: "#f43f5e",     // rose
    music: "#8b5cf6",     // purple
    document: "#f59e0b",  // amber
    software: "#3b82f6",  // blue
    compressed: "#10b981",// emerald
    other: "#64748b"      // slate
  };

  // Group task sizes by category (Only include tasks with a valid size)
  const categoryMap = tasks.reduce((acc, task) => {
    const cat = task.category || "other";
    const sizeInMB = task.size > 0 ? task.size / (1024 * 1024) : 0;
    acc[cat] = (acc[cat] || 0) + sizeInMB;
    return acc;
  }, {} as Record<string, number>);

  // Render all categories even if 0 MB
  const data = ["video", "music", "document", "software", "compressed", "other"].map(cat => ({
    name: CATEGORY_NAMES[cat] || cat,
    key: cat,
    volume: parseFloat(categoryMap[cat]?.toFixed(1) || "0"),
    color: CATEGORY_COLORS[cat] || "#3b82f6"
  }));

  const totalVolumeMB = data.reduce((sum, item) => sum + item.volume, 0);

  // Formatter for YAxis / Tooltip
  const formatVolume = (val: number) => {
    if (val >= 1024) {
      return `${(val / 1024).toFixed(2)} GB`;
    }
    return `${val.toFixed(1)} MB`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg border text-right text-xs shadow-xl ${
          isDark ? "bg-[#161618] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <p className="font-bold mb-1">{dataPoint.name}</p>
          <p className="font-mono text-blue-400">حجم کل: {formatVolume(dataPoint.volume)}</p>
          <p className="text-[10px] opacity-40 mt-1">
            {((dataPoint.volume / (totalVolumeMB || 1)) * 100).toFixed(1)}% از حجم کل صف دانلود
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isDark 
        ? "bg-[#161618] border-white/10 shadow-2xl" 
        : "bg-white border-slate-100 shadow-sm"
    }`} style={{ direction: "rtl" }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          <h3 className="font-bold text-sm">تفکیک حجمی فایل‌های دانلود شده</h3>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2.5 py-1 rounded-full font-sans font-bold">
          کل حجم: {formatVolume(totalVolumeMB)}
        </span>
      </div>

      {totalVolumeMB === 0 ? (
        <div className="h-[210px] flex flex-col items-center justify-center text-center text-slate-500 gap-1.5">
          <p className="text-xs font-semibold">داده‌های فایلی جهت توزیع حجمی وجود ندارد.</p>
          <p className="text-[10px] text-slate-600">پس از شروع به اضافه کردن دانلودها، نمودار تفکیک در اینجا ترسیم می‌شود.</p>
        </div>
      ) : (
        <div className="h-[210px] w-full mt-2" style={{ direction: "ltr" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", fontSize: 10, fontFamily: "sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(val) => val >= 1024 ? `${(val/1024).toFixed(0)}G` : `${val.toFixed(0)}M`}
                tick={{ fill: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", fontSize: 9, fontFamily: "sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }} />
              <Bar 
                dataKey="volume" 
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
