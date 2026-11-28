import { spawnSync } from "node:child_process";
import path from "path";
import {
  SQUIRREL_CREATE_SHORTCUT_FLAG,
  SQUIRREL_EVENTS,
  SQUIRREL_OBSOLETE_EVENT,
  SQUIRREL_REMOVE_SHORTCUT_FLAG,
  SQUIRREL_UNINSTALL_EVENT,
  SQUIRREL_UPDATE_EXE,
  SQUIRREL_UPDATE_EXE_FAILURE,
} from "../constants/squirrel";

const UPDATE_EXE_DIRECTORY = "..";

export default class SquirrelStartupService {
  // Squirrel.Windows launches the app itself to run install-time work and waits for it to exit.
  // Returns the exit code to report back to the installer, or undefined for a normal app start.
  handleStartupEvent = (): number | undefined => {
    const event = this.detectEvent();
    if (event === undefined) {
      return undefined;
    }

    if (event === SQUIRREL_OBSOLETE_EVENT) {
      return 0;
    }

    const shortcutFlag =
      event === SQUIRREL_UNINSTALL_EVENT ? SQUIRREL_REMOVE_SHORTCUT_FLAG : SQUIRREL_CREATE_SHORTCUT_FLAG;
    return this.runUpdateExe(shortcutFlag);
  };

  private detectEvent = (): string | undefined =>
    process.platform === "win32" ? process.argv.find((arg) => SQUIRREL_EVENTS.includes(arg)) : undefined;

  private runUpdateExe = (shortcutFlag: string): number => {
    const updateExe = path.resolve(path.dirname(process.execPath), UPDATE_EXE_DIRECTORY, SQUIRREL_UPDATE_EXE);
    const result = spawnSync(updateExe, [`${shortcutFlag}${path.basename(process.execPath)}`]);
    return result.error ? SQUIRREL_UPDATE_EXE_FAILURE : result.status ?? SQUIRREL_UPDATE_EXE_FAILURE;
  };
}
