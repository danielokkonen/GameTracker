export type GameStatus =
  | "Not started"
  | "Started"
  | "Completed"
  | "Paused"
  | "Dropped"
  | "Replaying";

export const GAME_STATUSES: GameStatus[] = [
  "Not started",
  "Started",
  "Completed",
  "Paused",
  "Dropped",
  "Replaying",
];

export const actionFromStatus: Record<GameStatus, string> = {
  "Not started": "added",
  "Started": "started",
  "Completed": "completed",
  "Paused": "paused",
  "Dropped": "dropped",
  "Replaying": "replaying",
};
