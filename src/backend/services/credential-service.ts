import EncryptionService from "./encryption-service";

export default class CredentialService {
  private encryptionService: EncryptionService;

  constructor(encryptionService?: EncryptionService) {
    this.encryptionService = encryptionService || new EncryptionService();
  }

  getCredentials = (keys: string[], json: any, credentialsEncrypted: boolean): Record<string, string> => {
    const result: Record<string, string> = {};

    for (const key of keys) {
      const value = json[key] || "";
      if (credentialsEncrypted) {
        result[key] = this.encryptionService.decryptString(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  setCredentials = (keys: Record<string, string>): { encryptedKeys: Record<string, string>; credentialsEncrypted: boolean } => {
    const hasCredentials = Object.values(keys).some(Boolean);

    if (!hasCredentials) {
      const emptyKeys: Record<string, string> = {};
      for (const key of Object.keys(keys)) {
        emptyKeys[key] = "";
      }
      return {
        encryptedKeys: emptyKeys,
        credentialsEncrypted: false,
      };
    }

    const encryptedKeys: Record<string, string> = {};
    for (const [key, value] of Object.entries(keys)) {
      encryptedKeys[key] = this.encryptionService.encryptString(value || "");
    }

    return {
      encryptedKeys,
      credentialsEncrypted: this.encryptionService.isEncryptionAvailable,
    };
  };

}
