/* eslint-disable @typescript-eslint/no-var-requires */

import { Database } from "../database/database";
import SettingsDto from "../dtos/settings";
import CredentialService from "./credential-service";

export default class SettingsService {
  private database: Database;
  private credentialService: CredentialService;

  constructor() {
    this.database = new Database();
    this.credentialService = new CredentialService();
  }

  get = async (): Promise<SettingsDto | null> => {
    const statement = this.database.instance.prepare("SELECT * FROM Settings WHERE id = @id");
    const result = statement.get({ id: 1 });
    
    if (!result) {
      return null;
    }

    const dto: SettingsDto = JSON.parse(result.json);
    dto.darkMode = Boolean(dto.darkMode);
    
    const credentials = this.credentialService.getCredentials(["igdbClientId", "igdbSecret"], dto, result.credentialsEncrypted === 1);
    
    dto.igdbClientId = credentials["igdbClientId"];
    dto.igdbSecret = credentials["igdbSecret"];
    
    return dto;
  };

  upsert = async (entity: SettingsDto): Promise<void> => {
    const credentials = this.credentialService.setCredentials({
      igdbClientId: entity.igdbClientId,
      igdbSecret: entity.igdbSecret,
    });

    const updatedEntity = {
      ...entity,
      igdbClientId: credentials.encryptedKeys["igdbClientId"],
      igdbSecret: credentials.encryptedKeys["igdbSecret"],
    };

    const data = {
      id: 1,
      json: JSON.stringify(updatedEntity),
      credentialsEncrypted: credentials.credentialsEncrypted ? 1 : 0,
    };

    const existing = await this.get();

    if (existing) {
      const statement = this.database.instance.prepare(
        "UPDATE Settings SET json = @json, credentialsEncrypted = @credentialsEncrypted WHERE id = @id"
      );
      statement.run(data);
    } else {
      const statement = this.database.instance.prepare(
        "INSERT INTO Settings (id, json, credentialsEncrypted) VALUES (@id, @json, @credentialsEncrypted)"
      );
      statement.run(data);
    }
  };

  clearTokens = async (): Promise<void> => {
    const statement = this.database.instance.prepare("DELETE FROM Tokens");
    statement.run();
  };
}
