/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("@prisma/client");

import { Settings } from "@prisma/client";
import SettingsDto from "../dtos/settings";

export default class SettingsService {
  prisma: typeof PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  get = async (): Promise<SettingsDto> => {
    const results = await this.prisma.settings.findUnique({
      where: { id: 1 },
    });

    return this.toDto(results);
  };

  upsert = async (entity: SettingsDto): Promise<SettingsDto> => {
    const data = this.toDbEntity(entity);

    const results = await this.prisma.settings.upsert({
      where: { id: 1 },
      update: {
        json: data.json,
      },
      create: data,
    });

    return this.toDto(results);
  };

  private toDbEntity = (s: SettingsDto): Settings => ({
    id: 1,
    json: JSON.stringify(s),
  });

  private toDto = (s: Settings): SettingsDto => {
    if (!s) {
      return null;
    }

    const dto: SettingsDto = JSON.parse(s.json);
    return dto;
  };
}
