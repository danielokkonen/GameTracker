import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import path from "path";
import GameService from "./backend/services/game-service";
import GameDto from "./backend/dtos/game";
import { IgdbService } from "./backend/services/igdb-service";
import SettingsService from "./backend/services/settings-service";
import EncryptionService from "./backend/services/encryption-service";
import SettingsDto from "./backend/dtos/settings";
import SteamService from "./backend/services/steam-service";
const dialog = require("electron").dialog;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#121212" : "#FFF",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      mainWindow.show();
    }, 100);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle("dark-mode", () => {
  return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle("is-encryption-available", () => {
  const encryptionService = new EncryptionService();
  return encryptionService.isEncryptionAvailable;
});

const gameService = new GameService();
const igdbService = new IgdbService();
const settingService = new SettingsService();
const steamService = new SteamService(settingService);

ipcMain.on("list-games", async (event) => {
  const result = await gameService.list();
  event.reply("list-games-success", result);
});

ipcMain.on("get-game", async (event, data: number) => {
  const result = await gameService.get(data);
  event.reply("get-game-success", result);
});

ipcMain.on("create-game", async (event, data: GameDto) => {
  await gameService.create(data);
  event.reply("create-game-success");
});

ipcMain.on("update-game", async (event, data: GameDto) => {
  const result = await gameService.update(data);
  event.reply("update-game-success", result);
});

ipcMain.on("delete-game", async (event, data: number) => {
  await gameService.delete(data);
  event.reply("delete-game-success");
});

ipcMain.on("delete-all-games", async (event) => {
  await gameService.deleteAll();
  event.reply("delete-all-games-success");
});

ipcMain.on("dashboard-games", async (event) => {
  const result = await gameService.dashboard();
  event.reply("dashboard-games-success", result);
});

ipcMain.on("adddetails-game", async (event, id: number) => {
  const game = await gameService.get(id);
  const gameDetails = await igdbService.getGameDetails(game.name);
  await gameService.addGameDetails(
    id,
    gameDetails.filter((r: any) => !!r.cover)[0]
  );
  event.reply("adddetails-game-success", id);
});

ipcMain.on("import-games", async (event) => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "", extensions: ["csv"] }],
    })
    .then((value) => {
      const path = value.filePaths[0];
      if (!path) {
        throw new Error("Parameter path cannot be empty");
      }
      return gameService.import(path);
    })
    .then(() => event.reply("import-games-success"));
});

ipcMain.on("igdb-get-game", async (event, title: string) => {
  const result = await igdbService.getGameDetails(title);
  event.reply("igdb-get-game-success", result);
});

ipcMain.on("get-settings", async (event) => {
  const result = await settingService.get();
  event.reply("get-settings-success", result);
});

ipcMain.on("upsert-settings", async (event, payload: SettingsDto) => {
  await settingService.upsert(payload);
  event.reply("upsert-settings-success");
});

ipcMain.on("clear-tokens", async (event) => {
  await settingService.clearTokens();
  event.reply("clear-tokens-success");
});

ipcMain.on("get-steam-games", async (event) => {
  try {
    const games: GameDto[] = await steamService.getOwnedGames();
    event.reply("get-steam-games-success", games);
  } catch (error: any) {
    event.reply("get-steam-games-error", { error: error.message });
  }
});

ipcMain.on("import-steam-games", async (event, games: any) => {
  if (!Array.isArray(games)) {
    event.reply("import-steam-games-success", { imported: 0, skipped: 0, errors: ["Invalid payload: games must be an array"] });
    return;
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const game of games) {
    try {
      await gameService.create(game);
      imported++;
    } catch (error: any) {
      if (error.message === "DUPLICATE") {
        skipped++;
      } else {
        errors.push(`${game.name}: ${error.message || "Unknown error"}`);
      }
    }

    await new Promise((resolve) => setImmediate(resolve));
  }

  event.reply("import-steam-games-success", { imported, skipped, errors });
});
