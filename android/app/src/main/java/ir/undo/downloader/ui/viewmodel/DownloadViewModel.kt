package ir.undo.downloader.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import ir.undo.downloader.data.DownloadCategory
import ir.undo.downloader.data.DownloadEntity
import ir.undo.downloader.data.DownloadRepository
import ir.undo.downloader.data.DownloadStatus
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class DownloadUiState(
    val downloads: List<DownloadEntity> = emptyList(),
    val selectedCategory: DownloadCategory = DownloadCategory.ALL,
    val searchQuery: String = "",
    val lastUndoneDownload: DownloadEntity? = null,
    val isDarkTheme: Boolean = true
)

class DownloadViewModel(private val repository: DownloadRepository) : ViewModel() {

    private val _selectedCategory = MutableStateFlow(DownloadCategory.ALL)
    private val _searchQuery = MutableStateFlow("")
    private val _lastUndone = MutableStateFlow<DownloadEntity?>(null)
    private val _isDarkTheme = MutableStateFlow(true)

    val uiState: StateFlow<DownloadUiState> = combine(
        repository.allDownloads,
        _selectedCategory,
        _searchQuery,
        _lastUndone,
        _isDarkTheme
    ) { downloads, category, query, lastUndone, dark ->
        val filtered = downloads.filter { item ->
            (category == DownloadCategory.ALL || item.category == category) &&
            (query.isEmpty() || item.fileName.contains(query, ignoreCase = true))
        }
        DownloadUiState(
            downloads = filtered,
            selectedCategory = category,
            searchQuery = query,
            lastUndoneDownload = lastUndone,
            isDarkTheme = dark
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DownloadUiState()
    )

    init {
        // Seed initial sample download if database is empty
        viewModelScope.launch {
            repository.allDownloads.firstOrNull()?.let { list ->
                if (list.isEmpty()) {
                    repository.addDownload(
                        fileName = "android_sdk_tools_v34.zip",
                        url = "https://dl.undo.ir/files/android_sdk_v34.zip",
                        category = DownloadCategory.SOFTWARE,
                        totalBytes = 145000000L
                    )
                    repository.addDownload(
                        fileName = "tutorial_jetpack_compose.mp4",
                        url = "https://dl.undo.ir/video/compose_tutorial.mp4",
                        category = DownloadCategory.VIDEO,
                        totalBytes = 320000000L
                    )
                }
            }
        }
    }

    fun onCategorySelected(category: DownloadCategory) {
        _selectedCategory.value = category
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun toggleTheme() {
        _isDarkTheme.value = !_isDarkTheme.value
    }

    fun startNewDownload(url: String, fileName: String, category: DownloadCategory) {
        viewModelScope.launch {
            val estimatedBytes = (50..500).random() * 1024 * 1024L
            repository.addDownload(
                fileName = if (fileName.isNotBlank()) fileName else "file_${System.currentTimeMillis()}",
                url = url,
                category = category,
                totalBytes = estimatedBytes
            )
        }
    }

    fun undoLastAction(download: DownloadEntity) {
        viewModelScope.launch {
            _lastUndone.value = download
            repository.cancelAndUndo(download.id)
        }
    }

    fun restoreUndoneDownload() {
        val last = _lastUndone.value ?: return
        viewModelScope.launch {
            repository.restoreDownload(last)
            _lastUndone.value = null
        }
    }

    fun clearUndoState() {
        _lastUndone.value = null
    }

    fun pauseDownload(id: Long) {
        viewModelScope.launch { repository.pauseDownload(id) }
    }

    fun resumeDownload(id: Long) {
        viewModelScope.launch { repository.resumeDownload(id) }
    }
}

class DownloadViewModelFactory(private val repository: DownloadRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DownloadViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DownloadViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
