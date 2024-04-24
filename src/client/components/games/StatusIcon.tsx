import React from "react";
import GameDto from "../../../backend/dtos/game";
import { Theme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";

interface StatusIconProps {
  game: GameDto;
}

const StatusIcon = ({ game }: StatusIconProps) => {
  const iconProps = (theme: Theme) => ({
    fontSize: "inherit",
    marginRight: theme.spacing(1),
  });

  let icon = <CircleIcon color="disabled" sx={iconProps} />;
  if (game.started && game.completed) {
    icon = <CheckCircleIcon color="success" sx={iconProps} />;
  } else if (game.started) {
    icon = <CircleIcon color="warning" sx={iconProps} />;
  }
  return (
    <>
      {icon}
      {game.status}
    </>
  );
};

export default StatusIcon;
