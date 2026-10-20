import { app } from "electron";
import { mkdir } from 'node:fs';
import path from 'path';

const { DatabaseSync } = require("node:sqlite");

// Bump when adding a new one-shot data migration to the Database constructor.
const MIGRATION_VERSION = 1;

export class Database {
  public instance: any;

  static getDbFolder(): string {
    if (app.isPackaged) {
      const isWindows = process.platform === "win32";
      if (isWindows) {
        return path.join(app.getPath("appData").replace("Roaming", "Local"), "GameTracker");
      }
      return app.getPath("userData");
    }
    return process.cwd();
  }

  constructor() {
    const dbFolder = Database.getDbFolder();

    if (app.isPackaged) {
      mkdir(dbFolder, (err) => {
        if (err?.code !== "EEXIST") {
          console.error(err);
        }
      });

      this.instance = new DatabaseSync(path.join(dbFolder, "GameTracker.db"));
    }
    else {
      this.instance = new DatabaseSync('dev.db');
    }

    this.instance.prepare(`
      CREATE TABLE IF NOT EXISTS "Game" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "franchise" TEXT NOT NULL,
        "start" TEXT,
        "end" TEXT,
        "created" TEXT NOT NULL,
        "updated" TEXT,
        "coverImage" TEXT,
        "developer" TEXT,
        "genres" TEXT,
        "platforms" TEXT,
        "publisher" TEXT,
        "summary" TEXT,
        "appId" TEXT,
        "playtime_minutes" INTEGER
      );
    `).run();

    this.instance.prepare(`
      CREATE TABLE IF NOT EXISTS "Tokens" (
        "service" TEXT NOT NULL PRIMARY KEY,
        "token" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "expires_at" INTEGER NOT NULL
      );
    `).run();

    this.instance.prepare(`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "json" TEXT NOT NULL,
        "credentialsEncrypted" INTEGER NOT NULL DEFAULT 0
      );
    `).run();

    try {
      this.instance.prepare(
        "ALTER TABLE Settings ADD COLUMN credentialsEncrypted INTEGER NOT NULL DEFAULT 0"
      ).run();
    } catch {
      // Column already exists
    }

    try {
      this.instance.prepare(
        "ALTER TABLE Game ADD COLUMN appId TEXT"
      ).run();
    } catch {
      // Column already exists
    }

    try {
      this.instance.prepare(
        "ALTER TABLE Game ADD COLUMN playtime_minutes INTEGER"
      ).run();
    } catch {
      // Column already exists
    }

    try {
      this.instance.prepare(
        "ALTER TABLE Game ADD COLUMN status TEXT NOT NULL DEFAULT 'Not started'"
      ).run();
    } catch {
      // Column already exists
    }

    // One-shot data migration: derive initial statuses from legacy start/end dates.
    // Gated by PRAGMA user_version so it runs exactly once per database, even though
    // the Database constructor runs multiple times per app launch. The version is
    // only bumped after both UPDATEs succeed, so an interrupted run retries cleanly.
    const { user_version: currentVersion } = this.instance.prepare(
      "PRAGMA user_version"
    ).get() as { user_version: number };

    if (currentVersion < MIGRATION_VERSION) {
      this.instance.prepare(
        "UPDATE Game SET status = 'Completed' WHERE status = 'Not started' AND end IS NOT NULL"
      ).run();
      this.instance.prepare(
        "UPDATE Game SET status = 'Started' WHERE status = 'Not started' AND start IS NOT NULL AND end IS NULL"
      ).run();

      this.instance.exec(`PRAGMA user_version = ${MIGRATION_VERSION}`);
    }

    this.instance.prepare(`
      CREATE TABLE IF NOT EXISTS "GameActivity" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "game_id" INTEGER NOT NULL,
        "action" TEXT NOT NULL,
        "old_status" TEXT,
        "new_status" TEXT NOT NULL,
        "created" TEXT NOT NULL
      );
    `).run();
  }
}
