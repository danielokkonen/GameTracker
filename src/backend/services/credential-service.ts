/* eslint-disable @typescript-eslint/no-var-requires */

const { safeStorage } = require("electron");

export default class CredentialService {
  private get isEncryptionAvailable(): boolean {
    try {
      return safeStorage.isEncryptionAvailable();
    } catch {
      return false;
    }
  }

  encryptString = (plainText: string): string => {
    if (!this.isEncryptionAvailable || !plainText) {
      return plainText;
    }
    const encrypted = safeStorage.encryptString(plainText);
    return encrypted.toString("base64");
  };

  decryptString = (encrypted: string): string => {
    if (!this.isEncryptionAvailable || !encrypted) {
      return encrypted;
    }
    try {
      const buffer = Buffer.from(encrypted, "base64");
      return safeStorage.decryptString(buffer);
    } catch {
      return encrypted;
    }
  };

  getCredentials = (json: any, credentialsEncrypted: boolean) => {
    const clientId = json.igdbClientId || "";
    const secret = json.igdbSecret || "";

    if (credentialsEncrypted) {
      return {
        igdbClientId: this.decryptString(clientId),
        igdbSecret: this.decryptString(secret),
        isMigrated: true,
      };
    }

    return {
      igdbClientId: clientId,
      igdbSecret: secret,
      isMigrated: false,
    };
  };

  setCredentials = (clientId: string, secret: string) => {
    const hasCredentials = Boolean(clientId) || Boolean(secret);

    if (!hasCredentials) {
      return {
        igdbClientId: "",
        igdbSecret: "",
        credentialsEncrypted: false,
      };
    }

    const encryptedClientId = this.encryptString(clientId);
    const encryptedSecret = this.encryptString(secret);

    return {
      igdbClientId: encryptedClientId,
      igdbSecret: encryptedSecret,
      credentialsEncrypted: this.isEncryptionAvailable,
    };
  };

  deleteCredentials = () => {
    return {
      igdbClientId: "",
      igdbSecret: "",
      credentialsEncrypted: false,
    };
  };
}
