import { EventNote } from "@mui/icons-material";
import { gameStatusIcons, gameStatusColors, actionFromStatus, type GameStatus } from "../../constants/gameStatuses";

interface UseActivityItemResult {
  Icon: React.ComponentType<any>;
  label: string;
  color: string;
}

const useActivityItem = (action: string): UseActivityItemResult => {
  const status = (Object.entries(actionFromStatus) as [GameStatus, string][])
    .find(([, a]) => a === action)
    ?.[0];

  if (status) {
    const Icon = gameStatusIcons[status];
    return { Icon, label: "", color: gameStatusColors[status] };
  }

  return { Icon: EventNote, label: "", color: "#757575" };
};

export default useActivityItem;
