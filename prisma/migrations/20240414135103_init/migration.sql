-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "franchise" TEXT NOT NULL,
    "start" TEXT,
    "end" TEXT,
    "created" TEXT NOT NULL,
    "updated" TEXT
);
