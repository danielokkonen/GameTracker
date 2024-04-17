// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import GameDto from "./backend/dtos/game-dto";

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
  list: () => ipcRenderer.send("list-games"),
  get: (id: number) => ipcRenderer.send("get-game", id),
  create: (entity: GameDto) => ipcRenderer.send("create-game", entity),
  update: (entity: GameDto) => ipcRenderer.send("update-game", entity),
  delete: (id: number) => ipcRenderer.send("delete-game", id),
});

