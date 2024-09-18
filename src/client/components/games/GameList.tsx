import React, { useContext, useMemo, useState } from "react";
import {
  Checkbox,
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
import GamesContext from "../../../client/context/GamesContext";

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
  { key: "coverImage", label: "", sortable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "franchise", label: "Franchise", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "started", label: "Started", sortable: true },
  { key: "completed", label: "Completed", sortable: true },
  { key: "actions", label: "", sortable: false },
];

const GameList = ({ items, onEdit, onDelete }: GameListProps) => {
  const { state, dispatch } = useContext(GamesContext);

  const allSelected = useMemo(
    () =>
      items.length > 0 &&
      Object.values(state.selectedGames).map((v: any) => v.selected === true)
        .length === items.length,
    [state.selectedGames]
  );

  const navgiate = useNavigate();

  const [sortOptions, setSortOptions] = useState<HeaderSortProps>({
    orderBy: "",
    order: "asc",
  });

  const onHeaderClick = (event: React.MouseEvent, property: string) => {
    if (property === "selected") {
      if (!allSelected) {
        for (const item of items) {
          dispatch({
            type: "SET_SELECTED_GAME",
            payload: {
              id: item.id,
              selected: true,
              loading: false,
            },
          });
        }
      } else {
        dispatch({ type: "REMOVE_ALL_SELECTED_GAMES" });
      }
    } else {
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
    }
  };

  const onRowClick = (event: React.MouseEvent, id: number) => {
    const target = event.target as HTMLInputElement;
    const tag = target.nodeName.toLowerCase();

    if (["tr", "td", "p", "img"].some((arr) => arr === tag)) {
      navgiate(`/games/${id}`);
    }
  };

  const onRowSelect = (id: number) => {
    const selected = state.selectedGames[id]?.selected;
    if (selected) {
      dispatch({
        type: "REMOVE_SELECTED_GAME",
        payload: id,
      });
    } else {
      dispatch({
        type: "SET_SELECTED_GAME",
        payload: {
          id: id,
          loading: false,
          selected: true,
        },
      });
    }
  };

  const headerCells = useMemo(
    () =>
      headers.map((h) => {
        return h.label && h.sortable ? (
          <TableCell key={h.key}>
            <TableSortLabel
              onClick={(e) => onHeaderClick(e, h.key)}
              active={sortOptions.orderBy === h.key}
              direction={sortOptions.order}
            >
              {h.label}
            </TableSortLabel>
          </TableCell>
        ) : (
          <TableCell onClick={(e) => onHeaderClick(e, h.key)}>
            {h.label}
          </TableCell>
        );
      }),
    [sortOptions, allSelected]
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
          <TableRow>
            <TableCell onClick={(e) => onHeaderClick(e, "selected")}>
              <Checkbox checked={allSelected} />
            </TableCell>
            {headerCells}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => {
            const loading = state.selectedGames[item.id]?.loading;
            return (
              <GameListRow
                key={item.id}
                loading={loading}
                selected={state.selectedGames[item.id]?.selected}
                onSelect={loading ? null : () => onRowSelect(item.id)}
                onClick={
                  loading
                    ? null
                    : (e: React.MouseEvent) => onRowClick(e, item.id)
                }
                game={item}
                onEdit={loading ? null : onEdit}
                onDelete={loading ? null : onDelete}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GameList;
