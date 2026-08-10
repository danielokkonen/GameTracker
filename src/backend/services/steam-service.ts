import SettingsService from "./settings-service";
import GameDto from "../dtos/game";

interface SteamGame {
  appid: number;
  name: string;
  developer: string;
  publisher: string;
  playtime_forever: number;
}

export default class SteamService {
  private settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  getOwnedGames = async (): Promise<GameDto[]> => {
    const settings = await this.settingsService.get();    

    if (!settings?.steamApiKey) {
      throw new Error("Steam API key is not configured");
    }

    if (!settings?.steamId) {
      throw new Error("SteamID is not configured");
    }

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${settings.steamApiKey}&steamid=${settings.steamId}&include_appinfo=1&include_played_free_games=1&format=json`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Steam API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data?.response?.games) {
      return data.response.games.map((game: SteamGame) => this.mapToGameDto(game));
    }

    return [];
  };

  mapToGameDto = (steamGame: SteamGame): GameDto => {
    const dto = new GameDto();
    dto.appId = String(steamGame.appid);
    dto.name = steamGame.name || "";
    dto.developer = steamGame.developer || null;
    dto.publisher = steamGame.publisher || null;
    dto.playtimeMinutes = steamGame.playtime_forever || 0;
    dto.franchise = "";
    dto.status = "Not started";
    dto.started = null;
    dto.completed = null;
    dto.summary = null;
    dto.genres = null;
    dto.platforms = null;
    dto.coverImage = null;
    dto.created = null;
    dto.updated = null;
    return dto;
  };
}
