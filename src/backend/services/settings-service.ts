/* eslint-disable @typescript-eslint/no-var-requires */

import { Database } from "../database/database";
import SettingsDto from "../dtos/settings";

export default class SettingsService {
  private database: Database;

  constructor() {
    this.database = new Database();
  }

  get = async (): Promise<SettingsDto> => {
    const statement = this.database.instance.prepare("SELECT * FROM Settings WHERE id = @id");
    const result = statement.get({ id: 1 });
    return this.toDto(result);
  };

  upsert = async (entity: SettingsDto): Promise<void> => {
    const data = this.toDbEntity(entity);

    const existing = await this.get();

    if (existing) {
      const statement = this.database.instance.prepare("UPDATE Settings SET json = @json WHERE id = @id");
      statement.run(data);

    }
    else {
      const statement = this.database.instance.prepare("INSERT INTO Settings VALUES (@id, @json)");
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
