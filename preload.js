// preload.js

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Puedes exponer funciones aquí si es necesario
});
