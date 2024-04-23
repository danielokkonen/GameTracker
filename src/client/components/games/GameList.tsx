import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Theme,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import GameDto from "../../../backend/dtos/game-dto";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";
import dayjs from "dayjs";

interface GameListProps {
  items: GameDto[];
  onEdit: (game: GameDto) => void;
  onDelete: (id: number) => void;
}

interface HeaderSortProps {
  orderBy: string;
  order: "asc" | "desc";
}

const headers = [
  { key: "name", label: "Name" },
  { key: "franchise", label: "Franchise" },
  { key: "status", label: "Status" },
  { key: "started", label: "Started" },
  { key: "completed", label: "Completed" },
  { key: "actions", label: "" },
];

const GameList = ({ items, onEdit, onDelete }: GameListProps) => {
  const [sortOptions, setSortOptions] = useState<HeaderSortProps>({
    orderBy: "",
    order: "asc",
  });

  const onHeaderClick = (event: React.MouseEvent, property: string) => {
    setSortOptions({
      orderBy:
        sortOptions.orderBy === property && sortOptions.order === "desc"
          ? ""
          : property,
      order:
        sortOptions.orderBy === property
          ? sortOptions.order === "asc"
            ? "desc"
            : "asc"
          : "asc",
    });
  };

  const headerCells = useMemo(
    () =>
      headers.map((h) => (
        <TableCell key={h.key}>
          {h.label ? (
            <TableSortLabel
              onClick={(e) => onHeaderClick(e, h.key)}
              active={sortOptions.orderBy === h.key}
              direction={sortOptions.order}
            >
              {h.label}
            </TableSortLabel>
          ) : (
            h.label
          )}
        </TableCell>
      )),
    [sortOptions]
  );

  // TODO: Refactor this mess    
  const sortedItems = useMemo(() => {
    if (sortOptions.orderBy) {
      return Array.from(items).sort((a, b) => {
        const propType = typeof a[sortOptions.orderBy];

        if (propType === "string") {
          if (sortOptions.order === "asc") {
            return (a[sortOptions.orderBy] as string).localeCompare(
              b[sortOptions.orderBy] as string
            );
          } else {
            return (b[sortOptions.orderBy] as string).localeCompare(
              a[sortOptions.orderBy] as string
            );
          }
        } else if (
          propType === "number" ||
          a[sortOptions.orderBy] instanceof Date
        ) {
          if (sortOptions.order === "asc") {
            return (
              (a[sortOptions.orderBy] as number) -
              (b[sortOptions.orderBy] as number)
            );
          } else {
            return (
              (b[sortOptions.orderBy] as number) -
              (a[sortOptions.orderBy] as number)
            );
          }
        }
      });
    }
    return items;
  }, [sortOptions]);

  const getStatus = (game: GameDto) => {
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

  return (
    <TableContainer sx={{ td: { userSelect: "none" } }}>
      <Table>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.franchise}</TableCell>
              <TableCell>{getStatus(item)}</TableCell>
              <TableCell>
                {item.started && dayjs(item.started).format("YYYY-MM-DD")}
              </TableCell>
              <TableCell>
                {item.completed && dayjs(item.completed).format("YYYY-MM-DD")}
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(item)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(item.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GameList;
