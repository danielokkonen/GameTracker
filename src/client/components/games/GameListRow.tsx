import React from "react";
import GameDto from "../../../backend/dtos/game";
import {
  Checkbox,
  IconButton,
  Paper,
  Skeleton,
  TableCell,
  TableRow,
} from "@mui/material";
import StatusIcon from "./StatusIcon";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";

interface GameListRowProps {
  game: GameDto;
  selected: boolean;
  loading: boolean;
  onSelect: () => void;
  onClick: (event: React.MouseEvent) => void;
  onEdit: (game: GameDto) => void;
  onDelete: (id: number) => void;
}

const GameListRow = ({
  game,
  selected,
  loading,
  onSelect,
  onClick,
  onEdit,
  onDelete,
}: GameListRowProps) => {
  return (
    <TableRow
      hover={!loading}
      onClick={onClick}
      sx={{ ":hover": { cursor: "pointer" } }}
    >
      <TableCell width={"5%"}>
        <Checkbox onChange={onSelect} checked={selected ? true : false} />
      </TableCell>
      <TableCell width={"5%"}>
        {game.coverImage && !loading ? (
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
      <TableCell width={"30%"}>{loading ? <Skeleton /> : game.name}</TableCell>
      <TableCell width={"13%"}>
        {loading ? <Skeleton /> : game.franchise}
      </TableCell>
      <TableCell width={"15%"}>
        {loading ? <Skeleton /> : <StatusIcon game={game} />}
      </TableCell>
      <TableCell width={"10%"}>
        {loading ? (
          <Skeleton />
        ) : (
          game.started && dayjs(game.started).format("YYYY-MM-DD")
        )}
      </TableCell>
      <TableCell width={"10%"}>
        {loading ? (
          <Skeleton />
        ) : (
          game.completed && dayjs(game.completed).format("YYYY-MM-DD")
        )}
      </TableCell>
      <TableCell align="right" width={"12%"}>
        {loading ? (
          <Skeleton />
        ) : (
          <>
            <IconButton onClick={() => onEdit(game)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(game.id)}>
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};

export default GameListRow;
