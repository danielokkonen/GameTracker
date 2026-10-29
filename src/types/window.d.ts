export {};

declare global {
  interface Window {
    electronApi: ElectronApi;
    gameService: GameService;
    igdbService: IgdbService;
    settingsService: SettingsService;
  }
}
