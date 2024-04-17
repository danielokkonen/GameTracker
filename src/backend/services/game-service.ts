/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("@prisma/client");

import { Game } from "@prisma/client";
import GameDto from "../dtos/game-dto";

export default class GameService {
  prisma: typeof PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  list = async (): Promise<GameDto[]> => {
    const results = (await this.prisma.game.findMany()).map((g: Game) =>
      this.toDto(g)
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

  private toDbEntity = (g: GameDto) => ({
    name: g.name,
    franchise: g.franchise,
    start: new Date(g.started).toISOString(),
    end: g.completed ? new Date(g.completed).toISOString() : null,
    created: g.created ? new Date(g.created).toISOString() : null,
    updated: g.updated ? new Date(g.updated).toISOString() : null,
  });

  private toDto = (g: Game) =>
    new GameDto(
      g.id,
      g.name,
      g.franchise,
      "Started",
      g.start ? new Date(g.start) : null,
      g.end ? new Date(g.end) : null,
      g.created ? new Date(g.created) : null,
      g.updated ? new Date(g.updated) : null
    );
}
