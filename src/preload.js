const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
window.electron = {
  readFolder: (folderPath) => ipcRenderer.invoke('read-folder', folderPath),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog')
}; 