/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { SpeedHistoryPoint } from "../types.js";
import { formatSpeed } from "./utils.js";

interface LiveSpeedChartProps {
  history: SpeedHistoryPoint[];
  isDark: boolean;
}

export default function LiveSpeedChart({ history, isDark }: LiveSpeedChartProps) {
  const maxSpeed = useMemo(() => {
    const max = Math.max(...history.map((p) => p.speed), 1000000); // minimum 1MB/s ceiling for visual scale
    return max;
  }, [history]);

  const currentSpeed = history.length > 0 ? history[history.length - 1].speed : 0;

  // Viewport dimensions
  const width = 600;
  const height = 150;
  const padding = 20;

  const points = useMemo(() => {
    if (history.length === 0) return "";
    const len = history.length;
    const dx = (width - padding * 2) / (len - 1 || 1);

    return history.map((point, i) => {
      const x = padding + i * dx;
      // Invert Y because SVG 0 is at the top
      const y = height - padding - (point.speed / maxSpeed) * (height - padding * 2);
      return { x, y };
    });
  }, [history, maxSpeed]);

  const sparkLinePath = useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Use cubic bezier curves for smooth lines
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const fillAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    return `${sparkLinePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }, [points, sparkLinePath]);

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isDark 
        ? "bg-[#161618] border-white/10 text-white shadow-2xl" 
        : "bg-white border-slate-100 text-slate-900 shadow-sm"
    }`} id="dl-speed-chart-card">
      <div className="flex justify-between items-center mb-4 rtl-grid">
        <div>
          <h3 className="text-xs font-bold text-white/40">سرعت دانلود لحظه‌ای کل</h3>
          <p className="text-2xl font-bold tracking-tight font-mono mt-1 text-emerald-400">
            {formatSpeed(currentSpeed)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold">
            حداکثر سرعت: {formatSpeed(maxSpeed)}
          </span>
        </div>
      </div>

      <div className="relative h-[150px] w-full mt-2" style={{ direction: "ltr" }}>
        {/* SVG Sparkline */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="1" />

          {/* Fill Area inside path */}
          {fillAreaPath && (
            <path d={fillAreaPath} fill="url(#chartGlow)" className="transition-all duration-500 ease-in-out" />
          )}

          {/* Glowing Line */}
          {sparkLinePath && (
            <path
              d={sparkLinePath}
              fill="none"
              stroke="url(#lineGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}

          {/* Hot Point Indicator */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4.5"
              fill="#10b981"
              stroke={isDark ? "#0f172a" : "#ffffff"}
              strokeWidth="2"
              className="animate-ping"
              style={{ transformOrigin: `${points[points.length - 1].x}px ${points[points.length - 1].y}px` }}
            />
          )}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill="#10b981"
              stroke={isDark ? "#0f172a" : "#ffffff"}
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 px-5">
        <span>٣٠ ثانیه پیش</span>
        <span>١۵ ثانیه پیش</span>
        <span>هم‌اکنون</span>
      </div>
    </div>
  );
}
