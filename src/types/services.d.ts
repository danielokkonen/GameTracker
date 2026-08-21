import SettingsDto from "../backend/dtos/settings";
import GameDto from "../backend/dtos/game";

export interface ElectronApi {
  ipcRenderer: IpcRenderer;
  theme: Theme;
  encryption: Encryption;
}

export interface Encryption {
  isAvailable: () => Promise<boolean>;
}

export interface IpcRenderer {
  on: (
    channel: string,
    listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
  ) => Electron.IpcRenderer;
  removeAllListeners: (channel: string) => Electron.IpcRenderer;
}

export interface Theme {
  darkMode: () => boolean;
}

export interface GameService {
  list: () => void;
  get: (id: number) => void;
  create: (game: GameDto) => void;
  update: (game: GameDto) => void;
  delete: (id: number) => void;
  deleteAll: () => void;
  dashboard: () => void;
  import: () => void;
  addGameDetails: (id: number) => void;
  getSteamGames: () => void;
  importSteamGames: (games: GameDto[]) => void;
}

export interface IgdbService {
  getGameDetails: (title: string) => string;
}

export interface SettingsService {
  get: () => SettingsDto;
  upsert: (settings: SettingsDto) => void;
  clearTokens: () => void;
}
