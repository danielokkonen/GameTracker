export {};

declare global {
  interface Window {
    electronApi: IElectronApi;
  }
}

interface IElectronApi {
  ipcRenderer: IIpcRenderer;
}

interface IIpcRenderer {
  on: (
    channel: string,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => Electron.IpcRenderer;
  removeAllListeners: (channel: string) => Electron.IpcRenderer;
}
