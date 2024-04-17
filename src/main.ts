import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import GameService from "./backend/services/game-service";
import GameDto from "./backend/dtos/game-dto";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
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

ipcMain.on("list-games", async (event) => {
  const service = new GameService();
  const result = await service.list();
  event.reply("list-games-success", result);
});

ipcMain.on("get-game", async (event, data: number) => {
  const service = new GameService();
  const result = await service.get(data);
  event.reply("get-game-success", result);
});

ipcMain.on("create-game", async (event, data: GameDto) => {
  const service = new GameService();
  const result = await service.create(data);
  event.reply("create-game-success", result);
});

ipcMain.on("update-game", async (event, data: GameDto) => {
  const service = new GameService();
  const result = await service.update(data);
  event.reply("update-game-success", result);
});

ipcMain.on("delete-game", async (event, data: number) => {
  const service = new GameService();
  await service.delete(data);
  event.reply("delete-game-success");
});
