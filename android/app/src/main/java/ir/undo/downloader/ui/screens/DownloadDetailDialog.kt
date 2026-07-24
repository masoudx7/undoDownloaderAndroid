package ir.undo.downloader.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.undo.downloader.data.DownloadCategory
import ir.undo.downloader.data.DownloadEntity
import ir.undo.downloader.ui.components.formatBytes

@Composable
fun DownloadDetailDialog(
    download: DownloadEntity,
    onDismiss: () -> Unit,
    onUndo: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = download.fileName,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DetailRow(label = "لینک دانلود:", value = download.url)
                DetailRow(label = "حجم کل:", value = formatBytes(download.totalBytes))
                DetailRow(label = "دریافت شده:", value = formatBytes(download.downloadedBytes))
                DetailRow(label = "دسته‌بندی:", value = download.category.name)
                DetailRow(
                    label = "مسیر ذخیره:",
                    value = download.filePath ?: "/storage/emulated/0/Download/Undo/"
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onUndo,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Icon(Icons.Default.Undo, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("لغو و حذف فایل (Undo)")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("بستن")
            }
        },
        shape = RoundedCornerShape(20.dp)
    )
}

@Composable
fun NewDownloadDialog(
    onDismiss: () -> Unit,
    onSubmit: (url: String, fileName: String, category: DownloadCategory) -> Unit
) {
    var url by remember { mutableStateOf("") }
    var fileName by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(DownloadCategory.OTHER) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Download, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("افزودن دانلود جدید", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("آدرس مستقیم فایل (URL)") },
                    placeholder = { Text("https://example.com/file.zip") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = fileName,
                    onValueChange = { fileName = it },
                    label = { Text("نام فایل (اختیاری)") },
                    placeholder = { Text("my_file.zip") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (url.isNotBlank()) {
                        onSubmit(url, fileName, selectedCategory)
                    }
                },
                enabled = url.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("شروع دانلود")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("انصراف")
            }
        },
        shape = RoundedCornerShape(20.dp)
    )
}

@Composable
private fun DetailRow(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
        Text(text = value, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}
