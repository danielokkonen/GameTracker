import dayjs from "dayjs";

const { PrismaClient } = require("@prisma/client");

const clientId = "";
const clientSecret = "";

interface AccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class IgdbService {
  prisma: typeof PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  getGameDetails = async (title: string): Promise<string> => {
    const token = await this.getAccessToken();

    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Client-ID": clientId,
      },
      body: `fields name, artworks.url, genres.name, release_dates.date, release_dates.platform, summary; search "${title}";`,
    });

    if (!response.ok) {
      throw new Error(`Could not get game details: ${response.status} ${response.statusText}: ${await response.text()}`);
    }

    const body = await response.text();

    return body;
  };

  private getAccessToken = async (): Promise<AccessToken> => {
    let token = await this.prisma.tokens.findFirst({ where: { service: "IGDB" } });

    const now = dayjs().subtract(2, "hour").unix();

    if (!token || now >= token?.expires_at) {
      console.log("Renew token");

      const response = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
      });

      if (!response.ok) {
        throw new Error(`Could not get access token: ${response.status} ${response.statusText}: ${await response.text()}`);
      }

      token = JSON.parse(await response.text());

      await this.prisma.tokens.upsert({
        where: {
          service: "IGDB",
        },
        update: {
          token: token.access_token,
          type: token.token_type,
          expires_at: now + token.expires_in,
        },
        create: {
          service: "IGDB",
          token: token.access_token,
          type: token.token_type,
          expires_at: now + token.expires_in,
        },
      });
    }

    return {
      access_token: token.token,
      expires_in: token.expires_at,
      token_type: token.type,
    };
  };
}
