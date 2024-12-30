// main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Mantener deshabilitado por seguridad
      contextIsolation: true, // Mantener habilitado por seguridad
      
    }
  });

  win.loadFile('login.html');

  // Abre las herramientas de desarrollo (opcional)
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // En macOS es común recrear una ventana cuando se hace clic en el ícono del dock
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cierra la aplicación cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
