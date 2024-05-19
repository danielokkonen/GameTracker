const db = require("better-sqlite3");

export class Database {
  public instance: any;
  
  constructor() {
    this.instance = db("dev.db");

    console.log('Database ctor()');

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
