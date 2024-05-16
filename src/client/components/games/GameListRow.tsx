import React from "react";
import GameDto from "../../../backend/dtos/game";
import { IconButton, Paper, TableCell, TableRow } from "@mui/material";
import StatusIcon from "./StatusIcon";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";

interface GameListRowProps {
  game: GameDto;
  onClick: (event: React.MouseEvent) => void;
  onEdit: (game: GameDto) => void;
  onDelete: (id: number) => void;
}

const GameListRow = ({ game, onClick, onEdit, onDelete }: GameListRowProps) => {
  return (
    <TableRow
      key={game.name}
      hover
      onClick={onClick}
      sx={{ ":hover": { cursor: "pointer" } }}
    >
      <TableCell width={"5%"}>
        {game.coverImage ? (
          <Paper
            component="img"
            src={game.coverImage}
            width={48}
            height={64}
            elevation={3}
          />
        ) : (
          <Paper sx={{ width: 48, height: 64 }} elevation={3} />
        )}
      </TableCell>
      <TableCell width={"30%"}>{game.name}</TableCell>
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
