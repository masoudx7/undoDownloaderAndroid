/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DownloadCategory = 'all' | 'video' | 'music' | 'document' | 'software' | 'compressed' | 'other';

export interface DownloadTask {
  id: string;
  url: string;
  name: string;
  size: number; // total bytes, -1 if unknown
  downloaded: number; // downloaded bytes
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'error' | 'stopped';
  category: Exclude<DownloadCategory, 'all'>;
  addedAt: string;
  completedAt: string | null;
  speed: number; // bytes/sec
  progress: number; // 0 to 100
  isScheduled: boolean;
  scheduledStartTime: string | null; // "HH:MM"
  scheduledEndTime: string | null; // "HH:MM"
  errorMessage?: string;
  ytDlpFormat?: string; // selected format for video downloads
  fileType: string; // extension (e.g. mp4, zip, mp3)
}

export interface AppSettings {
  speedLimit: number; // 0 for unlimited, or bytes/sec (e.g. 500000 for 500 KB/s)
  maxConcurrentDownloads: number; // default: 2
  nightScheduleEnabled: boolean;
  nightScheduleStart: string; // "02:00"
  nightScheduleEnd: string; // "07:00"
  notificationsEnabled: boolean;
}

export interface SpeedHistoryPoint {
  time: string;
  speed: number;
}
