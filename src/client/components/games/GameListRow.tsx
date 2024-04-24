import React from "react";
import GameDto from "../../../backend/dtos/game";
import { IconButton, TableCell, TableRow } from "@mui/material";
import StatusIcon from "./StatusIcon";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";

interface GameListRowProps {
  game: GameDto;
  onEdit: (game: GameDto) => void;
  onDelete: (id: number) => void;
}

const GameListRow = ({ game, onEdit, onDelete }: GameListRowProps) => {
  return (
    <TableRow key={game.name}>
      <TableCell width={"35%"}>{game.name}</TableCell>
      <TableCell width={"18%"}>{game.franchise}</TableCell>
      <TableCell width={"15%"}>{<StatusIcon game={game} />}</TableCell>
      <TableCell width={"10%"}>
        {game.started && dayjs(game.started).format("YYYY-MM-DD")}
      </TableCell>
      <TableCell width={"10%"}>
        {game.completed && dayjs(game.completed).format("YYYY-MM-DD")}
      </TableCell>
      <TableCell align="right" width={"12%"}>
        <IconButton onClick={() => onEdit(game)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(game.id)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default GameListRow;
