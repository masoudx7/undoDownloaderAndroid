package ir.undo.downloader.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.undo.downloader.data.DownloadCategory
import ir.undo.downloader.data.DownloadEntity
import ir.undo.downloader.ui.components.DownloadItemCard
import ir.undo.downloader.ui.components.UndoSnackBar
import ir.undo.downloader.ui.viewmodel.DownloadUiState
import ir.undo.downloader.ui.viewmodel.DownloadViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: DownloadViewModel,
    onAddDownloadClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedItemForDetail by remember { mutableStateOf<DownloadEntity?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Undo Downloader",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "${uiState.downloads.size} فایل در لیست",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.toggleTheme() }) {
                        Icon(
                            imageVector = if (uiState.isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle Theme"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddDownloadClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "افزودن دانلود")
            }
        },
        bottomBar = {
            UndoSnackBar(
                undoneDownload = uiState.lastUndoneDownload,
                onRestore = { viewModel.restoreUndoneDownload() },
                onDismiss = { viewModel.clearUndoState() }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Search Bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("جستجو در دانلودها...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                shape = RoundedCornerShape(16.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.surfaceVariant,
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )

            // Filter Category Chips
            CategoryFilterChips(
                selected = uiState.selectedCategory,
                onSelect = { viewModel.onCategorySelected(it) }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Downloads List
            if (uiState.downloads.isEmpty()) {
                EmptyStateView()
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 88.dp)
                ) {
                    items(uiState.downloads, key = { it.id }) { item ->
                        DownloadItemCard(
                            download = item,
                            onUndoClick = { viewModel.undoLastAction(it) },
                            onPauseToggle = {
                                if (it.status == ir.undo.downloader.data.DownloadStatus.DOWNLOADING) {
                                    viewModel.pauseDownload(it.id)
                                } else {
                                    viewModel.resumeDownload(it.id)
                                }
                            },
                            onClick = { selectedItemForDetail = item }
                        )
                    }
                }
            }
        }
    }

    // Detail Dialog
    selectedItemForDetail?.let { download ->
        DownloadDetailDialog(
            download = download,
            onDismiss = { selectedItemForDetail = null },
            onUndo = {
                viewModel.undoLastAction(download)
                selectedItemForDetail = null
            }
        )
    }
}

@Composable
fun CategoryFilterChips(
    selected: DownloadCategory,
    onSelect: (DownloadCategory) -> Unit
) {
    val categories = DownloadCategory.values()

    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(categories) { category ->
            val isSelected = selected == category
            val label = when (category) {
                DownloadCategory.ALL -> "همه"
                DownloadCategory.VIDEO -> "ویدیو"
                DownloadCategory.MUSIC -> "موسیقی"
                DownloadCategory.DOCUMENT -> "اسناد"
                DownloadCategory.SOFTWARE -> "نرم‌افزار"
                DownloadCategory.COMPRESSED -> "فشرده"
                DownloadCategory.OTHER -> "سایر"
            }

            FilterChip(
                selected = isSelected,
                onClick = { onSelect(category) },
                label = { Text(label, fontSize = 12.sp) },
                shape = RoundedCornerShape(20.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = Color.White
                )
            )
        }
    }
}

@Composable
fun EmptyStateView() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.DownloadDone,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "هیچ دانلودی یافت نشد",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "برای شروع دانلود جدید روی دکمه + کلیک کنید",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
            )
        }
    }
}
