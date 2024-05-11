import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import GameDto from "../../../backend/dtos/game";
import GameListRow from "./GameListRow";
import { useNavigate } from "react-router-dom";

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
  const navgiate = useNavigate();

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

  const onRowClick = (event: React.MouseEvent, id: number) => {
    const target = event.target as HTMLInputElement;
    const tag = target.nodeName.toLowerCase();

    if (tag !== "button" && tag !== "svg") {
      navgiate(`/games/${id}`);
    }
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
  }, [sortOptions, items]);

  return (
    <TableContainer sx={{ td: { userSelect: "none" } }}>
      <Table>
        <TableHead>
          <TableRow>{headerCells}</TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => (
            <GameListRow
              onClick={(e: React.MouseEvent) => onRowClick(e, item.id)}
              game={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GameList;
