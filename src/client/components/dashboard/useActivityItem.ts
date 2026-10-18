import { EventNote } from "@mui/icons-material";
import { gameStatusIcons, gameStatusColors, actionFromStatus, type GameStatus } from "../../constants/gameStatuses";

interface UseActivityItemResult {
  Icon: React.ComponentType<any>;
  color: string;
}

const useActivityItem = (action: string): UseActivityItemResult => {
  const status = (Object.entries(actionFromStatus) as [GameStatus, string][])
    .find(([, a]) => a === action)
    ?.[0];

  if (status) {
    const Icon = gameStatusIcons[status];
    return { Icon, color: gameStatusColors[status] };
  }

  return { Icon: EventNote, color: "#757575" };
};

export default useActivityItem;
