// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApi", {
  ipcRenderer: {
    on: (
      channel: string,
      listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
    ) => ipcRenderer.on(channel, listener),
    removeAllListeners: (
      channel: string
    ) => ipcRenderer.removeAllListeners(channel),
  },
});

contextBridge.exposeInMainWorld("gameService", {
  listGames: () => ipcRenderer.send("list-games"),
});
