import { PrismaClient } from "@prisma/client";
import Game from "../models/game";

export default class GameService {
  prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  listAllGames = async (): Promise<Game[]> => {
    const results = (await this.prisma.game.findMany()).map(
      (g) =>
        new Game(
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
