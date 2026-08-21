import { Database } from "../database/database";
import SettingsService from "./settings-service";
import dayjs from "dayjs";
import { DbToken } from "../types/db";
import { IgdbGame } from "../types/igdb";

interface AccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class IgdbService {
  private settingsService: SettingsService;
  private database: Database;
  
  constructor() {
    this.settingsService = new SettingsService();
    this.database = new Database();
  }

  getGameDetails = async (title: string): Promise<IgdbGame[]> => {
    const settings = await this.settingsService.get();

    if (!settings) {
      throw new Error("Settings not found. Please configure IGDB credentials first.");
    }

    const token = await this.getAccessToken(
      settings.igdbClientId,
      settings.igdbSecret
    );

    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Client-ID": settings.igdbClientId,
      },
      body: `fields name, cover.url, genres.name, release_dates.date, release_dates.platform, platforms.name, game_engines.name, 
        summary, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, involved_companies.supporting;
      search "${title}";`,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await this.getAccessToken(
          settings.igdbClientId,
          settings.igdbSecret,
          true
        );
      } else {
        throw new Error(
          `Could not get game details: ${response.status} ${
            response.statusText
          }: ${await response.text()}`
        );
      }
    }

    const body = (await response.json()) as IgdbGame[];

    return body;
  };

  private getAccessToken = async (
    clientId: string,
    secret: string,
    force = false
  ): Promise<AccessToken> => {
    const dbToken: DbToken = this.database.instance
      .prepare("SELECT * FROM Tokens WHERE service = @service")
      .get({ service: "IGDB" });

    const now = dayjs().subtract(2, "hour").unix();

    if (!dbToken || now >= dbToken?.expires_at || force) {
      const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: secret,
          grant_type: "client_credentials",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Could not get access token: ${response.status} ${
            response.statusText
          }: ${await response.text()}`
        );
      }

      const newToken = await response.json();

      const existingToken = this.database.instance
        .prepare("SELECT * FROM Tokens WHERE service = @service")
        .get({ service: "IGDB" });

      if (existingToken) {
        const statement = this.database.instance.prepare(
          "UPDATE Tokens SET token = @token, type = @type, expires_at = @expires_at WHERE service = @service"
        );

        statement.run({
          service: "IGDB",
          token: newToken.access_token,
          type: newToken.token_type,
          expires_at: now + newToken.expires_in,
        });
      } else {
        const statement = this.database.instance.prepare(
          "INSERT INTO Tokens VALUES(@service, @token, @type, @expires_at)"
        );

        statement.run({
          service: "IGDB",
          token: newToken.access_token,
          type: newToken.token_type,
          expires_at: now + newToken.expires_in,
        });
      }

      return newToken;
    }

    return {
      access_token: dbToken.token,
      expires_in: dbToken.expires_at,
      token_type: dbToken.type,
    };
  };
}
