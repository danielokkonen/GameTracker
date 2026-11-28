export const SQUIRREL_INSTALL_EVENT = "--squirrel-install";

export const SQUIRREL_UPDATED_EVENT = "--squirrel-updated";

export const SQUIRREL_UNINSTALL_EVENT = "--squirrel-uninstall";

export const SQUIRREL_OBSOLETE_EVENT = "--squirrel-obsolete";

// `--squirrel-firstrun` is deliberately absent: that launch is a normal app start, not an install-time command.
export const SQUIRREL_EVENTS = [
  SQUIRREL_INSTALL_EVENT,
  SQUIRREL_UPDATED_EVENT,
  SQUIRREL_UNINSTALL_EVENT,
  SQUIRREL_OBSOLETE_EVENT,
];

export const SQUIRREL_CREATE_SHORTCUT_FLAG = "--createShortcut=";

export const SQUIRREL_REMOVE_SHORTCUT_FLAG = "--removeShortcut=";

export const SQUIRREL_UPDATE_EXE = "Update.exe";

export const SQUIRREL_UPDATE_EXE_FAILURE = 1;
