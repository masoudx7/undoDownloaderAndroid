package ir.undo.downloader.data

import android.content.Context
import ir.undo.downloader.utils.NotificationHelper
import kotlinx.coroutines.flow.Flow

class DownloadRepository(
    private val downloadDao: DownloadDao,
    private val context: Context
) {
    val allDownloads: Flow<List<DownloadEntity>> = downloadDao.getAllDownloads()

    suspend fun addDownload(fileName: String, url: String, category: DownloadCategory, totalBytes: Long): Long {
        val download = DownloadEntity(
            fileName = fileName,
            url = url,
            category = category,
            totalBytes = totalBytes,
            downloadedBytes = 0,
            status = DownloadStatus.DOWNLOADING
        )
        val id = downloadDao.insertDownload(download)
        NotificationHelper.showDownloadStartedNotification(context, id, fileName)
        return id
    }

    suspend fun updateProgress(id: Long, downloadedBytes: Long, speedBps: Long) {
        val current = downloadDao.getDownloadById(id) ?: return
        val isDone = downloadedBytes >= current.totalBytes && current.totalBytes > 0
        val updated = current.copy(
            downloadedBytes = downloadedBytes,
            speedBps = speedBps,
            status = if (isDone) DownloadStatus.COMPLETED else DownloadStatus.DOWNLOADING,
            filePath = if (isDone) "/storage/emulated/0/Download/Undo/${current.fileName}" else current.filePath
        )
        downloadDao.updateDownload(updated)

        if (isDone) {
            NotificationHelper.showDownloadCompletedNotification(context, id, current.fileName)
        }
    }

    suspend fun cancelAndUndo(id: Long) {
        val download = downloadDao.getDownloadById(id)
        if (download != null) {
            downloadDao.deleteById(id)
            NotificationHelper.showDownloadCancelledNotification(context, download.fileName)
        }
    }

    suspend fun pauseDownload(id: Long) {
        val download = downloadDao.getDownloadById(id) ?: return
        downloadDao.updateDownload(download.copy(status = DownloadStatus.PAUSED, speedBps = 0))
    }

    suspend fun resumeDownload(id: Long) {
        val download = downloadDao.getDownloadById(id) ?: return
        downloadDao.updateDownload(download.copy(status = DownloadStatus.DOWNLOADING))
    }

    suspend fun restoreDownload(download: DownloadEntity) {
        downloadDao.insertDownload(download)
    }
}
