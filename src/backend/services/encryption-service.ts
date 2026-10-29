const { safeStorage } = require("electron");

export default class EncryptionService {
  get isEncryptionAvailable(): boolean {
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
}
