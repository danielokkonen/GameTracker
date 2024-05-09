import GameDto from "../backend/dtos/game";

export {};

declare global {
  interface Window {
    electronApi: IElectronApi;
    gameService: IGameService;
    igdbService: IIgdbService;
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

interface IGameService {
  list: () => void;
  get: (id: number) => void;
  create: (game: GameDto) => void;
  update: (game: GameDto) => void;
  delete: (id: number) => void;
  dashboard: () => void;
  import: () => void;
}

interface IIgdbService {
  getGameDetails: (title: string) => string;
}
