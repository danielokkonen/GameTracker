import React from "react";
import { Theme } from "@mui/material";
import GameDto from "../../../backend/dtos/game";
import { gameStatusIcons, gameStatusColors } from "../../constants/gameStatuses";

interface StatusIconProps {
  game: GameDto;
}

const StatusIcon = ({ game }: StatusIconProps) => {
  const iconProps = (theme: Theme) => ({
    fontSize: "inherit",
    marginRight: theme.spacing(1),
    color: gameStatusColors[game.status],
  });

  const Icon = gameStatusIcons[game.status];
  return (
    <>
      <Icon sx={iconProps} />
      {game.status}
    </>
  );
};

export default StatusIcon;
