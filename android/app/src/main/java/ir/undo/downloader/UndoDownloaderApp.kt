package ir.undo.downloader

import android.app.Application
import ir.undo.downloader.data.AppDatabase
import ir.undo.downloader.data.DownloadRepository
import ir.undo.downloader.utils.NotificationHelper

class UndoDownloaderApp : Application() {

    val database by lazy { AppDatabase.getDatabase(this) }
    val repository by lazy { DownloadRepository(database.downloadDao(), this) }

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannel(this)
    }
}
