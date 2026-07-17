/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DownloadTask, AppSettings, SpeedHistoryPoint, DownloadCategory } from "./src/types.js";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Server state (In-Memory Database representing Cloud Synchronization)
let downloads: DownloadTask[] = [
  {
    id: "init-1",
    url: "https://example.com/files/debian-linux.iso",
    name: "debian-12.5.0-amd64-netinst.iso",
    size: 658000000,
    downloaded: 450000000,
    status: "paused",
    category: "software",
    addedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: null,
    speed: 0,
    progress: 68,
    isScheduled: true,
    scheduledStartTime: "02:00",
    scheduledEndTime: "07:00",
    fileType: "iso"
  },
  {
    id: "init-2",
    url: "https://www.aparat.com/v/v8492-training",
    name: "آموزش جامع جاوااسکریپت - آپارات",
    size: 145000000,
    downloaded: 145000000,
    status: "completed",
    category: "video",
    addedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    speed: 0,
    progress: 100,
    isScheduled: false,
    scheduledStartTime: null,
    scheduledEndTime: null,
    ytDlpFormat: "1080p MP4",
    fileType: "mp4"
  },
  {
    id: "init-3",
    url: "https://example.com/music/epic-orchestra.mp3",
    name: "Epic Orchestral Theme.mp3",
    size: 8400000,
    downloaded: 8400000,
    status: "completed",
    category: "music",
    addedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 0.95).toISOString(),
    speed: 0,
    progress: 100,
    isScheduled: false,
    scheduledStartTime: null,
    scheduledEndTime: null,
    fileType: "mp3"
  }
];

let appSettings: AppSettings = {
  speedLimit: 0, // 0 means unlimited
  maxConcurrentDownloads: 2,
  nightScheduleEnabled: true,
  nightScheduleStart: "02:00",
  nightScheduleEnd: "07:00",
  notificationsEnabled: true
};

let speedHistory: SpeedHistoryPoint[] = Array.from({ length: 20 }, (_, i) => ({
  time: new Date(Date.now() - (20 - i) * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  speed: 0
}));

// Helper to determine category based on file suffix
function detectCategoryAndExtension(url: string, defaultName?: string): { category: Exclude<DownloadCategory, 'all'>, fileType: string, name: string } {
  let cleanUrl = url.split("?")[0].split("#")[0];
  let parts = cleanUrl.split("/");
  let filename = parts[parts.length - 1] || defaultName || "download_file";

  // Try to decode URI component
  try {
    filename = decodeURIComponent(filename);
  } catch (e) {}

  if (!filename.includes(".") && defaultName) {
    filename = defaultName;
  }

  let fileType = "bin";
  let extIndex = filename.lastIndexOf(".");
  if (extIndex !== -1) {
    fileType = filename.substring(extIndex + 1).toLowerCase();
  }

  // Categories
  const videoExts = ["mp4", "mkv", "webm", "avi", "mov", "flv", "3gp"];
  const musicExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
  const docExts = ["pdf", "docx", "xlsx", "pptx", "txt", "epub", "csv"];
  const softwareExts = ["exe", "msi", "dmg", "apk", "iso", "deb", "sh"];
  const compressExts = ["zip", "rar", "7z", "tar", "gz"];

  let category: Exclude<DownloadCategory, 'all'> = "other";
  if (videoExts.includes(fileType)) category = "video";
  else if (musicExts.includes(fileType)) category = "music";
  else if (docExts.includes(fileType)) category = "document";
  else if (softwareExts.includes(fileType)) category = "software";
  else if (compressExts.includes(fileType)) category = "compressed";

  return { category, fileType, name: filename };
}

// Check if a given HH:MM is inside start and end times (handles crossing midnight)
function isTimeInInterval(currentStr: string, startStr: string, endStr: string): boolean {
  const [curH, curM] = currentStr.split(":").map(Number);
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const curMin = curH * 60 + curM;
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (startMin <= endMin) {
    return curMin >= startMin && curMin <= endMin;
  } else {
    // Crosses midnight, e.g. 23:00 to 07:00
    return curMin >= startMin || curMin <= endMin;
  }
}

// Download Engine core timer loop (runs every second)
setInterval(() => {
  // Get current time in HH:MM format
  const now = new Date();
  const currentFarsiTime = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false });
  // Convert standard digits to English if necessary (sometimes fa-IR returns Persian digits)
  const toEnglishDigits = (str: string) => str.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728));
  const currentEnglishTime = toEnglishDigits(currentFarsiTime);

  const isNightScheduleActive = appSettings.nightScheduleEnabled &&
    isTimeInInterval(currentEnglishTime, appSettings.nightScheduleStart, appSettings.nightScheduleEnd);

  // Queue Manager: Start / Stop based on Scheduler and Concurrency limits
  const activeDownloads = downloads.filter(t => t.status === "downloading");
  const queuedTasks = downloads.filter(t => t.status === "queued");

  // If we can support more active downloads
  if (activeDownloads.length < appSettings.maxConcurrentDownloads && queuedTasks.length > 0) {
    // Find a task we can start
    for (const task of queuedTasks) {
      // If task is scheduled, we only start if night schedule is active OR its custom schedule is matching
      let canStart = true;
      if (task.isScheduled) {
        const start = task.scheduledStartTime || appSettings.nightScheduleStart;
        const end = task.scheduledEndTime || appSettings.nightScheduleEnd;
        if (!isTimeInInterval(currentEnglishTime, start, end)) {
          canStart = false; // Outside schedule window
        }
      } else if (appSettings.nightScheduleEnabled && isNightScheduleActive) {
        // If night scheduling is globally on, start non-scheduled items if desired,
        // but typically we can prioritize or let everything download or wait.
        canStart = true;
      }

      if (canStart) {
        task.status = "downloading";
        break; // Only start one per tick to control flow
      }
    }
  }

  // Automatic pausing of scheduled tasks that wander OUT of schedule window
  for (const task of downloads) {
    if (task.status === "downloading" && task.isScheduled) {
      const start = task.scheduledStartTime || appSettings.nightScheduleStart;
      const end = task.scheduledEndTime || appSettings.nightScheduleEnd;
      if (!isTimeInInterval(currentEnglishTime, start, end)) {
        task.status = "paused";
        task.speed = 0;
        task.errorMessage = "توقف خودکار به علت پایان زمان زمان‌بندی";
      }
    }
  }

  // Process data streaming simulation for downloading items
  const downloadingTasks = downloads.filter(t => t.status === "downloading");
  let totalTickSpeed = 0;

  if (downloadingTasks.length > 0) {
    // Allocate bandwidth
    let remainingBandwidth = appSettings.speedLimit > 0 ? appSettings.speedLimit : 12500000; // max 12.5 MB/s simulation base
    const bandwidthPerTask = Math.floor(remainingBandwidth / downloadingTasks.length);

    for (const task of downloadingTasks) {
      // Realistic download fluctuations
      const fluctuation = 0.8 + Math.random() * 0.4; // 80% to 120%
      let currentSpeed = Math.floor(bandwidthPerTask * fluctuation);

      // Slower speed for smaller file simulation or near completion
      const remainingBytes = task.size - task.downloaded;
      if (currentSpeed > remainingBytes) {
        currentSpeed = remainingBytes;
      }

      task.speed = currentSpeed;
      task.downloaded += currentSpeed;
      totalTickSpeed += currentSpeed;

      // Ensure progress calculation
      if (task.size > 0) {
        task.progress = Math.min(100, Math.floor((task.downloaded / task.size) * 100));
      } else {
        // Unknown size simulation
        task.progress = 50; // default loading indicator placeholder
      }

      // Completion check
      if (task.downloaded >= task.size && task.size > 0) {
        task.status = "completed";
        task.completedAt = new Date().toISOString();
        task.progress = 100;
        task.speed = 0;
      }
    }
  } else {
    // Set inactive speeds to zero
    downloads.forEach(t => {
      if (t.status !== "downloading") t.speed = 0;
    });
  }

  // Update collective speed history for real-time streaming charts
  const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  speedHistory.push({ time: timeStr, speed: totalTickSpeed });
  if (speedHistory.length > 30) {
    speedHistory.shift();
  }
}, 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -----------------------------------------------------------------
  // API ENDPOINTS
  // -----------------------------------------------------------------

  // 1. Get all downloads
  app.get("/api/downloads", (req, res) => {
    res.json(downloads);
  });

  // 2. Add new download (supports general links or yt-dlp simulation)
  app.post("/api/downloads", (req, res) => {
    const { url, name, size, category, isScheduled, scheduledStartTime, scheduledEndTime, ytDlpFormat } = req.body;

    if (!url) {
      return res.status(400).json({ error: "آدرس لینک الزامی است" });
    }

    const { category: detectedCat, fileType, name: detectedName } = detectCategoryAndExtension(url, name);

    // Simulated size if size is undefined
    const finalSize = size || Math.floor(5000000 + Math.random() * 450000000); // 5MB to 450MB random sizes
    const finalName = name || detectedName;
    const finalCategory = category || detectedCat;

    const newTask: DownloadTask = {
      id: generateId(),
      url,
      name: finalName,
      size: finalSize,
      downloaded: 0,
      status: "queued", // standard default, Queue Manager handles automatic launching
      category: finalCategory,
      addedAt: new Date().toISOString(),
      completedAt: null,
      speed: 0,
      progress: 0,
      isScheduled: !!isScheduled,
      scheduledStartTime: scheduledStartTime || null,
      scheduledEndTime: scheduledEndTime || null,
      ytDlpFormat: ytDlpFormat || undefined,
      fileType: fileType
    };

    downloads.unshift(newTask);
    res.status(201).json(newTask);
  });

  // 3. Trigger action on download (start, pause, stop, remove)
  app.post("/api/downloads/:id/action", (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    const task = downloads.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ error: "فایل مورد نظر یافت نشد" });
    }

    switch (action) {
      case "start":
      case "resume":
        task.status = "queued"; // set to queued so concurrency locks take action
        task.errorMessage = undefined;
        break;
      case "pause":
        task.status = "paused";
        task.speed = 0;
        break;
      case "stop":
        task.status = "stopped";
        task.speed = 0;
        break;
      case "delete":
        downloads = downloads.filter(t => t.id !== id);
        return res.json({ success: true, message: "فایل با موفقیت حذف شد" });
      default:
        return res.status(400).json({ error: "عملیات نامعتبر است" });
    }

    res.json(task);
  });

  // 4. Update configuration settings
  app.post("/api/settings", (req, res) => {
    appSettings = { ...appSettings, ...req.body };
    res.json(appSettings);
  });

  // 5. Read current settings
  app.get("/api/settings", (req, res) => {
    res.json(appSettings);
  });

  // 6. Get real-time speed diagram points
  app.get("/api/speed-history", (req, res) => {
    res.json(speedHistory);
  });

  // 7. yt-dlp & site content scanner link detector
  app.post("/api/detect-link", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "لینک ارسالی خالی است" });
    }

    const host = url.toLowerCase();
    
    // Simulate Video sources (YouTube, Aparat, Vimeo etc.)
    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("aparat.com") || host.includes("vimeo.com")) {
      const isAparat = host.includes("aparat.com");
      const title = isAparat 
        ? "ویدیو آموزشی استخراج شده از آپارات با yt-dlp" 
        : "YouTube Extracted Video Stream Client (yt-dlp)";

      return res.json({
        type: "video_platform",
        title: title,
        thumbnail: "https://picsum.photos/id/250/200/120.jpg",
        formats: [
          { quality: "1080p Full HD (MP4)", size: 450000000, ext: "mp4", format_id: "ext-1080" },
          { quality: "720p HD (MP4)", size: 220000000, ext: "mp4", format_id: "ext-720" },
          { quality: "480p SD (MP4)", size: 95000000, ext: "mp4", format_id: "ext-480" },
          { quality: "Audio Only (MP3)", size: 14000000, ext: "mp3", format_id: "ext-audio" }
        ]
      });
    }

    // Direct typical links
    const { category, fileType, name } = detectCategoryAndExtension(url);
    res.json({
      type: "direct_link",
      title: name,
      category,
      fileType,
      size: Math.floor(10000000 + Math.random() * 200000000) // simulated 10MB - 210MB
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
