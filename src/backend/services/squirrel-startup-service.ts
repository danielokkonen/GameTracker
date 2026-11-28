import { spawnSync } from "node:child_process";
import path from "path";

// `--squirrel-firstrun` is deliberately absent: that launch is a normal app start, not an install-time command.
const SQUIRREL_EVENTS = ["--squirrel-install", "--squirrel-updated", "--squirrel-uninstall", "--squirrel-obsolete"];

export default class SquirrelStartupService {
  // Squirrel.Windows launches the app itself to run install-time work and waits for it to exit.
  // Returns the exit code to report back to the installer, or undefined for a normal app start.
  handleStartupEvent = (): number | undefined => {
    const event = this.detectEvent();
    if (event === undefined) {
      return undefined;
    }

    if (event === "--squirrel-obsolete") {
      return 0;
    }

    const uninstall = event === "--squirrel-uninstall";
    return this.runUpdateExe(uninstall ? "--removeShortcut=" : "--createShortcut=");
  };

  private detectEvent = (): string | undefined =>
    process.platform === "win32" ? process.argv.find((arg) => SQUIRREL_EVENTS.includes(arg)) : undefined;

  private runUpdateExe = (shortcutFlag: string): number => {
    const updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe");
    const result = spawnSync(updateExe, [`${shortcutFlag}${path.basename(process.execPath)}`]);
    return result.error ? 1 : result.status ?? 1;
  };
}
