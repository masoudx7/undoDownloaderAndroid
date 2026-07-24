package ir.undo.downloader.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.undo.downloader.data.DownloadCategory
import ir.undo.downloader.data.DownloadEntity
import ir.undo.downloader.data.DownloadStatus

@Composable
fun DownloadItemCard(
    download: DownloadEntity,
    onUndoClick: (DownloadEntity) -> Unit,
    onPauseToggle: (DownloadEntity) -> Unit,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    CategoryIconBadge(category = download.category)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = download.fileName,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "${formatBytes(download.downloadedBytes)} / ${formatBytes(download.totalBytes)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusBadge(status = download.status)
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    // Undo/Cancel Action Button
                    IconButton(
                        onClick = { onUndoClick(download) },
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                                CircleShape
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Undo,
                            contentDescription = "Undo / Cancel",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Progress bar
            LinearProgressIndicator(
                progress = { download.progressPercent / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = when (download.status) {
                    DownloadStatus.COMPLETED -> MaterialTheme.colorScheme.primary
                    DownloadStatus.PAUSED -> MaterialTheme.colorScheme.secondary
                    DownloadStatus.CANCELLED -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.primary
                },
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp)
            ) {
                Text(
                    text = "${download.progressPercent.toInt()}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                if (download.status == DownloadStatus.DOWNLOADING) {
                    Text(
                        text = "${formatBytes(download.speedBps)}/s",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }
}

@Composable
fun CategoryIconBadge(category: DownloadCategory) {
    val (icon, color) = when (category) {
        DownloadCategory.VIDEO -> Icons.Default.VideoLibrary to Color(0xFF8B5CF6)
        DownloadCategory.MUSIC -> Icons.Default.MusicNote to Color(0xFFEC4899)
        DownloadCategory.DOCUMENT -> Icons.Default.Description to Color(0xFF3B82F6)
        DownloadCategory.SOFTWARE -> Icons.Default.Code to Color(0xFF10B981)
        DownloadCategory.COMPRESSED -> Icons.Default.FolderZip to Color(0xFFF59E0B)
        else -> Icons.Default.InsertDriveFile to Color(0xFF64748B)
    }

    Box(
        modifier = Modifier
            .size(40.dp)
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = category.name,
            tint = color,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun StatusBadge(status: DownloadStatus) {
    val (text, bgColor, textColor) = when (status) {
        DownloadStatus.COMPLETED -> Triple("تکمیل شد", Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981))
        DownloadStatus.DOWNLOADING -> Triple("در حال دانلود", Color(0xFF3B82F6).copy(alpha = 0.15f), Color(0xFF3B82F6))
        DownloadStatus.PAUSED -> Triple("متوقف شد", Color(0xFFF59E0B).copy(alpha = 0.15f), Color(0xFFF59E0B))
        DownloadStatus.CANCELLED -> Triple("لغو شد", Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444))
        DownloadStatus.FAILED -> Triple("خطا", Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444))
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(20.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

fun formatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val kb = bytes / 1024.0
    val mb = kb / 1024.0
    val gb = mb / 1024.0
    return when {
        gb >= 1.0 -> String.format("%.2f GB", gb)
        mb >= 1.0 -> String.format("%.1f MB", mb)
        kb >= 1.0 -> String.format("%.0f KB", kb)
        else -> "$bytes B"
    }
}
