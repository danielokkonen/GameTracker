/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs/promises");

import { Game } from "@prisma/client";
import GameDto from "../dtos/game";
import DashboardDto from "../dtos/dashboard";
import dayjs from "dayjs";

export default class GameService {
  prisma: typeof PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  list = async (): Promise<GameDto[]> => {
    const options = {
      orderBy: [
        {
          created: "desc",
        },
      ],
    };

    const results: GameDto[] = (await this.prisma.game.findMany(options)).map(
      (g: Game) => this.toDto(g)
    );

    return results;
  };

  get = async (id: number): Promise<GameDto> => {
    const results = await this.prisma.game.findUnique({
      where: { id: id },
    });

    return this.toDto(results);
  };

  create = async (entity: GameDto): Promise<GameDto> => {
    const data = this.toDbEntity(entity);
    data.created = new Date().toISOString();

    const results = await this.prisma.game.create({
      data: data,
    });

    return this.toDto(results);
  };

  update = async (entity: GameDto): Promise<GameDto> => {
    const data = this.toDbEntity(entity);
    data.updated = new Date().toISOString();

    const results = await this.prisma.game.update({
      where: { id: entity.id },
      data: data,
    });

    return this.toDto(results);
  };

  delete = async (id: number): Promise<void> => {
    await this.prisma.game.delete({
      where: { id: id },
    });
  };

  dashboard = async (): Promise<DashboardDto> => {
    const data: Game[] = await this.prisma.game.findMany();

    const results = new DashboardDto();

    results.notStarted = data.filter((d) => !d.start && !d.end).length;
    results.started = data.filter((d) => d.start && !d.end).length;
    results.completed = data.filter((d) => d.start && d.end).length;

    const threshold = dayjs().add(-30, "days").toDate().getTime();
    results.startedLast30Days = data.filter(
      (d) => d.start && !d.end && new Date(d.start).getTime() >= threshold
    ).length;

    results.completedLast30Days = data.filter(
      (d) => d.start && new Date(d.end).getTime() >= threshold
    ).length;

    return results;
  };

  import = async (path: string): Promise<void> => {
    const file = await fs.open(path);

    let i = 0;
    for await (const item of file.readLines()) {
      const columns = item.split(";");

      if (i === 0) {
        continue;
      }

      const game = new GameDto();
      game.id = 0;
      game.name = columns[0];
      game.franchise = columns[1];
      game.started = columns[3] ? new Date(columns[3]) : null;
      game.completed = columns[4] ? new Date(columns[4]) : null;

      await this.create(game);
      i++;
    }
  };

  private toDbEntity = (g: GameDto) => ({
    name: g.name,
    franchise: g.franchise,
    start: g.started ? new Date(g.started).toISOString() : null,
    end: g.completed ? new Date(g.completed).toISOString() : null,
    created: g.created ? new Date(g.created).toISOString() : null,
    updated: g.updated ? new Date(g.updated).toISOString() : null,
    summary: g.summary,
    developer: g.developer,
    publisher: g.publisher,
    genres: g.genres?.join(";"),
    platforms: g.platforms?.join(";"),
    coverImage: g.coverImage,
  });

  private toDto = (g: Game) => {
    let status = "Not started";

    if (g.start && g.end) {
      status = "Completed";
    } else if (g.start) {
      status = "Started";
    }

    const dto = new GameDto();
    dto.id = g.id;
    dto.name = g.name;
    dto.franchise = g.franchise;
    dto.status = status;
    dto.started = g.start ? new Date(g.start) : null;
    dto.completed = g.end ? new Date(g.end) : null;
    dto.summary = g.summary;
    dto.developer = g.developer;
    dto.publisher = g.publisher;
    dto.genres = g.genres?.split(";")?.map((genre) => genre);
    dto.platforms = g.platforms?.split(";")?.map((platform) => platform);
    dto.coverImage = g.coverImage;
    dto.created = g.created ? new Date(g.created) : null;
    dto.updated = g.updated ? new Date(g.updated) : null;

    return dto;
  };
}
