import {
  PlayArrow,
  CheckCircle,
  PauseCircle,
  Cancel,
  Replay,
  EventNote,
} from "@mui/icons-material";
import { GAME_STATUSES, actionFromStatus, type GameStatus } from "../../backend/constants/gameStatuses";

export { GAME_STATUSES, actionFromStatus, type GameStatus };

export const gameStatusIcons: Record<GameStatus, React.ComponentType<any>> = {
  "Not started": EventNote,
  "Started": PlayArrow,
  "Completed": CheckCircle,
  "Paused": PauseCircle,
  "Dropped": Cancel,
  "Replaying": Replay,
};

export const gameStatusColors: Record<GameStatus, string> = {
  "Not started": "#757575",
  "Started": "#ffbf00",
  "Completed": "#4caf50",
  "Paused": "#2196f3",
  "Dropped": "#f44336",
  "Replaying": "#9c27b0",
};
