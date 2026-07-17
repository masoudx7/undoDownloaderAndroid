/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatBytes(bytes: number): string {
  if (bytes < 0) return "نامشخص";
  if (bytes === 0) return "۰ بایت";
  const k = 1024;
  const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت", "ترابایت"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val.toLocaleString('fa-IR')} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "۰ کیلوبایت/ثانیه";
  const k = 1024;
  const sizes = ["بایت/ثانیه", "کیلوبایت/ثانیه", "مگابایت/ثانیه", "گیگابایت/ثانیه"];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  const val = parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1));
  return `${val.toLocaleString('fa-IR')} ${sizes[i]}`;
}

export function formatTimeETA(bytesRemaining: number, speed: number): string {
  if (speed <= 0) return "تعلیق";
  const seconds = Math.ceil(bytesRemaining / speed);
  if (seconds < 60) {
    return `${seconds.toLocaleString('fa-IR')} ثانیه`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return `${minutes.toLocaleString('fa-IR')} م و ${remainingSecs.toLocaleString('fa-IR')} ث`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours.toLocaleString('fa-IR')} ساعت و ${remainingMins.toLocaleString('fa-IR')} دقیقه`;
}
