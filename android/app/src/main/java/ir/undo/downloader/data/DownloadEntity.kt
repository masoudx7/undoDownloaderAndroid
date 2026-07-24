package ir.undo.downloader.data

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class DownloadStatus {
    DOWNLOADING,
    COMPLETED,
    PAUSED,
    CANCELLED,
    FAILED
}

enum class DownloadCategory {
    ALL,
    VIDEO,
    MUSIC,
    DOCUMENT,
    SOFTWARE,
    COMPRESSED,
    OTHER
}

@Entity(tableName = "downloads")
data class DownloadEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val fileName: String,
    val url: String,
    val category: DownloadCategory = DownloadCategory.OTHER,
    val status: DownloadStatus = DownloadStatus.DOWNLOADING,
    val totalBytes: Long = 0,
    val downloadedBytes: Long = 0,
    val speedBps: Long = 0,
    val filePath: String? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    val progressPercent: Float
        get() = if (totalBytes > 0) (downloadedBytes.toFloat() / totalBytes.toFloat()) * 100f else 0f
}
