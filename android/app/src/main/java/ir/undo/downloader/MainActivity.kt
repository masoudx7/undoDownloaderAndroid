package ir.undo.downloader

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import ir.undo.downloader.data.DownloadCategory
import ir.undo.downloader.ui.screens.HomeScreen
import ir.undo.downloader.ui.screens.NewDownloadDialog
import ir.undo.downloader.ui.screens.SplashScreen
import ir.undo.downloader.ui.theme.UndoDownloaderTheme
import ir.undo.downloader.ui.viewmodel.DownloadViewModel
import ir.undo.downloader.ui.viewmodel.DownloadViewModelFactory

class MainActivity : ComponentActivity() {

    private val viewModel: DownloadViewModel by viewModels {
        val app = application as UndoDownloaderApp
        DownloadViewModelFactory(app.repository)
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Handle permission results
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate()

        checkAndRequestPermissions()

        setContent {
            val uiState by viewModel.uiState.collectAsState()

            UndoDownloaderTheme(darkTheme = uiState.isDarkTheme) {
                var showSplash by remember { mutableStateOf(true) }
                var showNewDownloadDialog by remember { mutableStateOf(false) }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (showSplash) {
                        SplashScreen(onSplashFinished = { showSplash = false })
                    } else {
                        HomeScreen(
                            viewModel = viewModel,
                            onAddDownloadClick = { showNewDownloadDialog = true }
                        )

                        if (showNewDownloadDialog) {
                            NewDownloadDialog(
                                onDismiss = { showNewDownloadDialog = false },
                                onSubmit = { url, fileName, category ->
                                    viewModel.startNewDownload(url, fileName, category)
                                    showNewDownloadDialog = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED
            ) {
                permissionsToRequest.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }
}
