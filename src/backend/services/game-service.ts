import { open } from "node:fs/promises";
import { Database } from "../database/database";
import GameDto from "../dtos/game";
import DashboardDto from "../dtos/dashboard";
import dayjs from "dayjs";
import { DbGame } from "../types/db";
import { IgdbGame } from "../types/igdb";

export default class GameService {
  private database: Database;

  constructor() {
    this.database = new Database();
  }

  list = async (): Promise<GameDto[]> => {
    const results: GameDto[] = (this.database.instance
      .prepare("SELECT * FROM Game ORDER BY created DESC")
      .all())
      .map((g: DbGame) => this.toDto(g));

    return results;
  };

  get = async (id: number): Promise<GameDto> => {
    const results = this.database.instance.prepare("SELECT * FROM Game WHERE Id = ?").get(id);

    return this.toDto(results);
  };

  create = async (entity: GameDto): Promise<void> => {
    if (entity.appId) {
      const existing = this.database.instance
        .prepare("SELECT id FROM Game WHERE appId = @appId")
        .get({ appId: entity.appId });

      if (existing) {
        throw new Error("DUPLICATE");
      }
    }

    const data = this.toDbEntity(entity);
    data.id = null; // Id needs to be present, so for auto increment to work it needs to be assigned to null
    data.created = new Date().toISOString();

    const statement = this.database.instance.prepare(`
      INSERT INTO Game 
      VALUES(
        @id, 
        @name, 
        @franchise, 
        @start, 
        @end, 
        @created, 
        @updated, 
        @coverImage, 
        @developer, 
        @genres, 
        @platforms, 
        @publisher,
        @summary,
        @appId,
        @playtime_minutes,
        @status
      )
    `);
    statement.run(data);
  };

  update = async (entity: GameDto): Promise<void> => {
    const data = this.toDbEntity(entity);
    data.updated = new Date().toISOString();

    const statement = this.database.instance.prepare(`
      UPDATE Game 
      SET name = @name, 
        franchise = @franchise, 
        start = @start, 
        end = @end, 
        updated = @updated, 
        summary = @summary, 
        developer = @developer, 
        publisher = @publisher, 
        genres = @genres, 
        platforms = @platforms, 
        coverImage = @coverImage,
        appId = @appId,
        playtime_minutes = @playtime_minutes,
        status = @status
      WHERE id = @id`);
    statement.run({
      id: data.id,
      name: data.name,
      franchise: data.franchise, 
      start: data.start, 
      end: data.end, 
      updated: data.updated, 
      summary: data.summary, 
      developer: data.developer, 
      publisher: data.publisher, 
      genres: data.genres, 
      platforms: data.platforms, 
      coverImage: data.coverImage,
      appId: data.appId,
      playtime_minutes: data.playtime_minutes,
      status: data.status,
    });
  };

  delete = async (id: number): Promise<void> => {
    const statement = this.database.instance.prepare(
      "DELETE FROM Game WHERE Id = @Id"
    );
    statement.run({ Id: id });
  };

  deleteAll = async (): Promise<void> => {
    const statement = this.database.instance.prepare("DELETE FROM Game");
    statement.run();
  };

  dashboard = async (): Promise<DashboardDto> => {
    const data: DbGame[] = this.database.instance
      .prepare("SELECT * FROM Game")
      .all();

    const results = new DashboardDto();

    results.notStarted = data.filter((d) => d.status === "Not started").length;
    results.started = data.filter((d) => d.status === "Started").length;
    results.completed = data.filter((d) => d.status === "Completed").length;
    results.paused = data.filter((d) => d.status === "Paused").length;
    results.dropped = data.filter((d) => d.status === "Dropped").length;
    results.replaying = data.filter((d) => d.status === "Replaying").length;

    const threshold = dayjs().add(-30, "days").toDate().getTime();
    results.startedLast30Days = data.filter(
      (d) => d.start && !d.end && new Date(d.start!).getTime() >= threshold
    ).length;

    results.completedLast30Days = data.filter(
      (d) => d.start && new Date(d.end!).getTime() >= threshold
    ).length;

    const totalGames = data.length;
    results.completionRate = totalGames > 0 ? Math.round((results.completed / totalGames) * 100) : 0;

    const playtimes = data.map((d) => d.playtime_minutes || 0);
    results.totalPlaytime = playtimes.reduce((sum, t) => sum + t, 0);
    results.avgPlaytime = totalGames > 0 ? Math.round(results.totalPlaytime / totalGames) : 0;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startedByMonth: Record<string, number> = {};
    const completedByMonth: Record<string, number> = {};

    data.forEach((game) => {
      if (game.start) {
        const date = new Date(game.start);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        startedByMonth[key] = (startedByMonth[key] || 0) + 1;
      }
      if (game.end) {
        const date = new Date(game.end);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        completedByMonth[key] = (completedByMonth[key] || 0) + 1;
      }
    });

    results.gamesStartedByMonth = Object.entries(startedByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        return parseInt(bYear) - parseInt(aYear) || months.indexOf(aMonth) - months.indexOf(bMonth);
      })
      .slice(0, 12);

    results.gamesCompletedByMonth = Object.entries(completedByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        return parseInt(bYear) - parseInt(aYear) || months.indexOf(aMonth) - months.indexOf(bMonth);
      })
      .slice(0, 12);

    const genreCount: Record<string, number> = {};
    const platformCount: Record<string, number> = {};

    data.forEach((game) => {
      if (game.genres) {
        game.genres.split(";").forEach((genre) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
      if (game.platforms) {
        game.platforms.split(";").forEach((platform) => {
          platformCount[platform] = (platformCount[platform] || 0) + 1;
        });
      }
    });

    results.topGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    results.topPlatforms = Object.entries(platformCount)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    results.startedGames = data
      .filter((g) => g.status === "Started" || g.status === "Replaying")
      .slice(0, 8)
      .map((g) => ({
        id: g.id as number,
        name: g.name,
        coverImage: g.coverImage ?? null,
      }));

    return results;
  };

  import = async (path: string): Promise<void> => {
    const file = await open(path);

    let i = 0;
    for await (const item of file.readLines()) {
      const columns = item.split(";");

      if (i === 0) {
        i++;
        continue;
      }
      
      const game = new GameDto();
      game.name = columns[0];
      game.franchise = columns[1];
      game.started = columns[3] ? new Date(columns[3]) : null;
      game.completed = columns[4] ? new Date(columns[4]) : null;

      await this.create(game);
      i++;
    }
  };

  addGameDetails = async (id: number, gameDetails: IgdbGame): Promise<GameDto> => {
    const game = await this.get(id);
    if (!game) {
      throw new Error(`Game with id ${id} could not be found`);
    }

    let imageUrl = gameDetails.cover.url.replace("t_thumb", "t_720p");
    if (!imageUrl.startsWith("https://")) {
      imageUrl = `https:${
        imageUrl.startsWith("//") ? imageUrl : `//${imageUrl}`
      }`;
    }

    const updatedGame = await fetch(imageUrl)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        const coverImage = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;

        const updatedGame: GameDto = { ...game };
        updatedGame.summary = gameDetails.summary;
        updatedGame.developer = gameDetails?.involved_companies?.find(
          (i) => i.developer
        )?.company.name ?? null;
        updatedGame.publisher = gameDetails?.involved_companies?.find(
          (i) => i.publisher
        )?.company.name ?? null;
        updatedGame.genres = gameDetails.genres?.map(
          (g) => g.name
        ) ?? null;
        updatedGame.platforms = gameDetails.platforms?.map(
          (p) => p.name
        ) ?? null;
        updatedGame.coverImage = coverImage;

        return Promise.resolve(updatedGame);
      });

      await this.update(updatedGame);

      return updatedGame;
  };

  private toDbEntity = (g: GameDto): DbGame => ({
    id: g.id,
    name: g.name,
    franchise: g.franchise,
    start: g.started ? new Date(g.started).toISOString() : null,
    end: g.completed ? new Date(g.completed).toISOString() : null,
    created: g.created ? new Date(g.created).toISOString() : null,
    updated: g.updated ? new Date(g.updated).toISOString() : null,
    coverImage: g.coverImage ?? null,
    developer: g.developer ?? null,
    genres: g.genres?.join(";") ?? null,
    platforms: g.platforms?.join(";") ?? null,
    publisher: g.publisher ?? null,
    summary: g.summary ?? null,
    appId: g.appId ?? null,
    playtime_minutes: g.playtimeMinutes ?? 0,
    status: g.status ?? "Not started",
  });

  private toDto = (g: DbGame): GameDto => {
    const dto = new GameDto();
    dto.id = g.id as number;
    dto.name = g.name;
    dto.franchise = g.franchise;
    dto.status = g.status;
    dto.started = g.start ? new Date(g.start) : null;
    dto.completed = g.end ? new Date(g.end) : null;
    dto.summary = g.summary ?? null;
    dto.developer = g.developer ?? null;
    dto.publisher = g.publisher ?? null;
    dto.genres = g.genres?.split(";")?.map((genre) => genre) ?? null;
    dto.platforms = g.platforms?.split(";")?.map((platform) => platform) ?? null;
    dto.coverImage = g.coverImage ?? null;
    dto.created = g.created ? new Date(g.created) : null;
    dto.updated = g.updated ? new Date(g.updated) : null;
    dto.appId = g.appId || "";
    dto.playtimeMinutes = g.playtime_minutes || 0;

    return dto;
  };
}
