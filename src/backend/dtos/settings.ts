export default class SettingsDto {
  public developerMode: boolean;
  public igdbClientId: string;
  public igdbSecret: string;

  constructor() {
    this.developerMode = false;
    this.igdbClientId = "";
    this.igdbSecret = "";
  }
}
