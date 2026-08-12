export default class SettingsDto {
  public developerMode: boolean;
  public darkMode: boolean;
  public igdbClientId: string;
  public igdbSecret: string;
  public steamApiKey: string;
  public steamId: string;

  constructor(darkMode: boolean) {
    this.developerMode = false;
    this.darkMode = darkMode;
    this.igdbClientId = "";
    this.igdbSecret = "";
    this.steamApiKey = "";
    this.steamId = "";
  }
}
