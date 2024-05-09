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

      const game = new GameDto(
        0,
        columns[0],
        columns[1],
        "",
        columns[3] ? new Date(columns[3]) : null,
        columns[4] ? new Date(columns[4]) : null
      );

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
  });

  private toDto = (g: Game) => {
    let status = "Not started";

    if (g.start && g.end) {
      status = "Completed";
    } else if (g.start) {
      status = "Started";
    }

    return new GameDto(
      g.id,
      g.name,
      g.franchise,
      status,
      g.start ? new Date(g.start) : null,
      g.end ? new Date(g.end) : null,
      g.created ? new Date(g.created) : null,
      g.updated ? new Date(g.updated) : null
    );
  };
}
