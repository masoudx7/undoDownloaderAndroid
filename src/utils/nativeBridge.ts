/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getPlatformName = (): string => {
  try {
    return Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
  } catch {
    return 'web';
  }
};

/**
 * Saves a file directly to native Android Downloads directory (/storage/emulated/0/Download/Undo/)
 */
export async function saveToAndroidStorage(fileName: string, base64Data: string): Promise<string> {
  if (!isNativeApp()) {
    console.log('[NativeBridge] Web mode - skipping Capacitor filesystem');
    return `/storage/emulated/0/Download/Undo/${fileName}`;
  }

  try {
    // Write to public Documents/Downloads directory on Android
    const result = await Filesystem.writeFile({
      path: `Undo/${fileName}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });
    return result.uri;
  } catch (error) {
    console.error('[NativeBridge] Failed to save file natively:', error);
    throw error;
  }
}

/**
 * Triggers native Android "Open With" (ACTION_VIEW) Intent using Share API or system intent
 */
export async function triggerAndroidOpenWith(fileName: string, fileUrl: string, mimeType?: string): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await Share.share({
        title: fileName,
        text: `باز کردن فایل ${fileName} در برنامه اندروید`,
        url: fileUrl,
        dialogTitle: 'بازکردن با (Open with)...'
      });
      return true;
    } catch (err) {
      console.warn('[NativeBridge] Share intent dismissed or failed:', err);
    }
  }

  // Fallback for Web/Browser
  if (navigator.share) {
    try {
      await navigator.share({
        title: fileName,
        text: `بازکردن فایل ${fileName}`,
        url: fileUrl
      });
      return true;
    } catch {
      // User cancelled or unsupported
    }
  }

  return false;
}
