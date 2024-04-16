/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("@prisma/client");

import { Game } from "@prisma/client";
import GameDto from "../dtos/game-dto";

export default class GameService {
  prisma: typeof PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  listAllGames = async (): Promise<GameDto[]> => {
    const results = (await this.prisma.game.findMany()).map(
      (g: Game) =>
        new GameDto(
          g.id,
          g.name,
          "Started",
          new Date(g.start),
          g.end ? new Date(g.end) : null
        )
    );

    return results;
  };
}
