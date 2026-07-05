import { app } from "electron";
import { mkdir } from 'node:fs';
import path from 'path';

const { DatabaseSync } = require("node:sqlite");

export class Database {
  public instance: any;
  
  constructor() {
    if (app.isPackaged) {
      const isWindows = process.platform === "win32";
      const dbName = "GameTracker.db";
      
      let dbPath: string;
      if (isWindows) {
        dbPath = path.join(app.getPath("appData").replace("Roaming", "Local"), "GameTracker");
      } else {
        dbPath = app.getPath("userData");
      }
  
      mkdir(dbPath, (err) => {
        if (err.code !== "EEXIST") {
          console.error(err);
        }
      });

      this.instance = new DatabaseSync(path.join(dbPath, dbName));
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
        "summary" TEXT
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
        "json" TEXT NOT NULL
      );
    `).run();
  }
}
