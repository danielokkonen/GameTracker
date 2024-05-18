/* eslint-disable @typescript-eslint/no-var-requires */
const db = require("better-sqlite3")("dev.db");

import SettingsDto from "../dtos/settings";

export default class SettingsService {
  get = async (): Promise<SettingsDto> => {
    const statement = db.prepare("SELECT * FROM Settings");
    const result = statement.get();
    return this.toDto(result);
  };

  upsert = async (entity: SettingsDto): Promise<void> => {
    const data = this.toDbEntity(entity);

    const existing = this.get();

    if (existing) {
      const statement = db.prepare("UPDATE Settings SET json = @json WHERE id = @id)");
      statement.run(data);

    }
    else {
      const statement = db.prepare("INSERT INTO Settings VALUES (@id, @json)");
      statement.run(data);
    }
  };

  private toDbEntity = (s: SettingsDto): any => ({
    id: 1,
    json: JSON.stringify(s),
  });

  private toDto = (s: any): SettingsDto => {
    if (!s) {
      return null;
    }

    const dto: SettingsDto = JSON.parse(s.json);
    return dto;
  };
}
