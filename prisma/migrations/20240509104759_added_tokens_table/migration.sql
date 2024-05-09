/*
  Warnings:

  - The primary key for the `Tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Tokens` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tokens" (
    "service" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL
);
INSERT INTO "new_Tokens" ("expires_at", "service", "token", "type") SELECT "expires_at", "service", "token", "type" FROM "Tokens";
DROP TABLE "Tokens";
ALTER TABLE "new_Tokens" RENAME TO "Tokens";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
