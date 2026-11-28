import { app, BrowserWindow, ipcMain, nativeTheme, shell } from "electron";
import path from "path";
import { Database } from "./backend/database/database";
import GameService from "./backend/services/game-service";
import GameDto from "./backend/dtos/game";
import { IgdbService } from "./backend/services/igdb-service";
import SettingsService from "./backend/services/settings-service";
import EncryptionService from "./backend/services/encryption-service";
import SettingsDto from "./backend/dtos/settings";
import SteamService from "./backend/services/steam-service";
import AiService from "./backend/services/ai-service";
import { DownloadCancelledError } from "./backend/services/model-manager";
import SquirrelStartupService from "./backend/services/squirrel-startup-service";

const dialog = require("electron").dialog;

const squirrelStartupService = new SquirrelStartupService();

// The installer drives the app through Squirrel events to create/remove shortcuts and waits for it to exit,
// so this has to terminate the process before any window, database or IPC setup runs.
const squirrelExitCode = squirrelStartupService.handleStartupEvent();
if (squirrelExitCode !== undefined) {
  process.exit(squirrelExitCode);
}

const DARK_WINDOW_BACKGROUND = "#121212";
const LIGHT_WINDOW_BACKGROUND = "#FFFFFF";

const applyThemeSource = (darkMode?: boolean | null) => {
  if (darkMode === null || darkMode === undefined) {
    return;
  }
  nativeTheme.themeSource = darkMode ? "dark" : "light";
  for (const win of BrowserWindow.getAllWindows()) {
    win.setBackgroundColor(darkMode ? DARK_WINDOW_BACKGROUND : LIGHT_WINDOW_BACKGROUND);
  }
};

const createWindow = async () => {
  try {
    applyThemeSource((await settingService.get())?.darkMode);
  } catch {
    // A broken Settings row must never block the window; fall back to the system theme.
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    backgroundColor: nativeTheme.shouldUseDarkColors ? DARK_WINDOW_BACKGROUND : LIGHT_WINDOW_BACKGROUND,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Keeps the renderer on the document that carries our CSP meta tag; hash-router
  // navigations share the same base URL and stay allowed.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const [targetBase] = url.split("#");
    const [currentBase] = mainWindow.webContents.getURL().split("#");
    if (targetBase !== currentBase) {
      event.preventDefault();
    }
  });

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
const aiService = new AiService();

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

ipcMain.on("dashboard", async (event) => {
  const dashboard = await gameService.dashboard();
  event.reply("dashboard-success", dashboard);
});

ipcMain.on("adddetails-game", async (event, id: number) => {
  const game = await gameService.get(id);
  const gameDetails = await igdbService.getGameDetails(game.name);
  await gameService.addGameDetails(
    id,
    gameDetails.filter((r) => !!r.cover)[0]
  );
  event.reply("adddetails-game-success", id);
});

ipcMain.on("import-games", async (event) => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "", extensions: ["csv"] }],
    })
    .then((value: Electron.OpenDialogReturnValue) => {
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
  applyThemeSource(payload.darkMode);
  event.reply("upsert-settings-success");
});

ipcMain.on("clear-tokens", async (event) => {
  await settingService.clearTokens();
  event.reply("clear-tokens-success");
});

ipcMain.on("open-database-folder", async (event) => {
  const error = await shell.openPath(Database.getDbFolder());
  if (error) {
    event.reply("open-database-folder-error", { error });
  } else {
    event.reply("open-database-folder-success");
  }
});

ipcMain.on("get-steam-games", async (event) => {
  try {
    const games: GameDto[] = await steamService.getOwnedGames();
    event.reply("get-steam-games-success", games);
  } catch (error: any) {
    event.reply("get-steam-games-error", { error: error.message });
  }
});

ipcMain.on("import-steam-games", async (event, games: GameDto[]) => {
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

const replyToSender = (event: Electron.IpcMainEvent, channel: string, payload?: unknown): void => {
  if (!event.sender.isDestroyed()) {
    event.reply(channel, payload);
  }
};

ipcMain.on("ai-status", async (event) => {
  try {
    const result = await aiService.getStatus();
    replyToSender(event, "ai-status-success", result);
  } catch (error: any) {
    replyToSender(event, "ai-status-error", { error: error.message });
  }
});

ipcMain.on("ai-insight-generate", async (event, data?: { force?: boolean }) => {
  try {
    const insight = await aiService.generateInsight(data?.force ?? false);
    replyToSender(event, "ai-insight-generate-success", insight);
  } catch (error: any) {
    replyToSender(event, "ai-insight-generate-error", { error: error.message });
  }
});

ipcMain.on("ai-insight-dismiss", (event) => {
  aiService.dismissInsight();
  event.reply("ai-insight-dismiss-success");
});

ipcMain.on("ai-model-list", async (event) => {
  try {
    const result = await aiService.listModels();
    replyToSender(event, "ai-model-list-success", result);
  } catch (error: any) {
    replyToSender(event, "ai-model-list-error", { error: error.message });
  }
});

ipcMain.on("ai-model-download", async (event, modelId: string) => {
  try {
    await aiService.download(modelId, (id, downloadedBytes, totalBytes) => {
      replyToSender(event, "ai-model-download-progress", { modelId: id, downloadedBytes, totalBytes });
    });
    replyToSender(event, "ai-model-download-success");
  } catch (error: any) {
    if (error instanceof DownloadCancelledError) {
      replyToSender(event, "ai-model-download-cancelled", { modelId });
    } else {
      replyToSender(event, "ai-model-download-error", { modelId, error: error.message });
    }
  }
});

ipcMain.on("ai-model-download-cancel", (event, modelId: string) => {
  aiService.cancelDownload(modelId);
  event.reply("ai-model-download-cancel-success");
});

ipcMain.on("ai-model-select", async (event, modelId: string) => {
  try {
    await aiService.selectModel(modelId);
    replyToSender(event, "ai-model-select-success");
  } catch (error: any) {
    replyToSender(event, "ai-model-select-error", { error: error.message });
  }
});

ipcMain.on("ai-model-delete", async (event, modelId: string) => {
  try {
    await aiService.deleteModel(modelId);
    replyToSender(event, "ai-model-delete-success");
  } catch (error: any) {
    replyToSender(event, "ai-model-delete-error", { modelId, error: error.message });
  }
});

ipcMain.on("ai-model-add", async (event, filePath?: string) => {
  try {
    let chosen = filePath;
    if (!chosen) {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "GGUF model", extensions: ["gguf"] }],
      });
      chosen = result.filePaths[0];
      if (!chosen) {
        return;
      }
    }
    await aiService.addCustomModel(chosen);
    replyToSender(event, "ai-model-add-success");
  } catch (error: any) {
    replyToSender(event, "ai-model-add-error", { error: error.message });
  }
});

ipcMain.on("ai-model-reveal", async (event, modelId: string) => {
  try {
    const filePath = await aiService.getModelFilePath(modelId);
    shell.showItemInFolder(filePath);
    replyToSender(event, "ai-model-reveal-success");
  } catch (error: any) {
    replyToSender(event, "ai-model-reveal-error", { error: error.message });
  }
});
