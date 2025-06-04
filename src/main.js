const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#2E3440', // Dark theme base color
    title: 'Gallero - Folder Viewer'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  // Open the DevTools in development
  // mainWindow.webContents.openDevTools();

  // Remove the menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Helper function to check if a file is an image
function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const ext = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(ext);
}

// IPC handlers for file operations
ipcMain.handle('read-folder', async (event, folderPath) => {
  try {
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return { error: 'Not a directory' };
    }

    const contents = fs.readdirSync(folderPath, { withFileTypes: true });
    
    const items = contents.map(item => {
      const itemPath = path.join(folderPath, item.name);
      const itemStats = fs.statSync(itemPath);
      
      return {
        name: item.name,
        path: itemPath,
        isDirectory: item.isDirectory(),
        size: itemStats.size,
        createdAt: itemStats.birthtime,
        modifiedAt: itemStats.mtime,
        sourceFolder: folderPath,
        isImage: !item.isDirectory() && isImageFile(itemPath)
      };
    });

    return { items, folderPath };
  } catch (error) {
    console.error('Error reading folder:', error);
    return { error: error.message };
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections']
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { folderPaths: result.filePaths };
});

// Handle dropped folder paths
ipcMain.handle('handle-dropped-folder', async (event, folderPath) => {
  try {
    // On Windows, make sure the path is properly formatted
    const normalizedPath = folderPath.replace(/^file:\/\/\/?/, '');
    const decodedPath = decodeURIComponent(normalizedPath);
    
    // Check if path exists and is a directory
    const stats = fs.statSync(decodedPath);
    if (!stats.isDirectory()) {
      return { error: 'Not a directory' };
    }
    
    return { folderPath: decodedPath };
  } catch (error) {
    console.error('Error handling dropped folder:', error);
    return { error: error.message };
  }
}); 