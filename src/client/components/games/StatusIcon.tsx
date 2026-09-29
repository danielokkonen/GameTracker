import React from "react";
import GameDto from "../../../backend/dtos/game";
import { Theme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";

interface StatusIconProps {
  game: GameDto;
}

const StatusIcon = ({ game }: StatusIconProps) => {
  const iconProps = (theme: Theme) => ({
    fontSize: "inherit",
    marginRight: theme.spacing(1),
  });

  let icon = <CircleIcon color="disabled" sx={iconProps} />;
  if (game.status === "Started") {
    icon = <CircleIcon color="warning" sx={iconProps} />;
  } else if (game.status === "Completed") {
    icon = <CheckCircleIcon color="success" sx={iconProps} />;
  } else if (game.status === "Paused") {
    icon = <PauseCircleIcon color="info" sx={iconProps} />;
  } else if (game.status === "Dropped") {
    icon = <CancelIcon color="error" sx={iconProps} />;
  } else if (game.status === "Replaying") {
    icon = <ReplayIcon color="secondary" sx={iconProps} />;
  }
  return (
    <>
      {icon}
      {game.status}
    </>
  );
};

export default StatusIcon;
