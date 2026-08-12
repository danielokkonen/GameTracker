import React from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableContainer,
  TableBody,
  TableCell,
  Checkbox,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { formatPlaytime } from "../../utils/numberUtils";
import GameDto from "../../../backend/dtos/game";

interface SteamImportTableProps {
  games: GameDto[];
  selected: Set<string>;
  existingGames: GameDto[];
  sortColumn: "name" | "playtime";
  sortDirection: "asc" | "desc";
  onSelectAll: () => void;
  onToggleSelect: (appId: string) => void;
  onSort: (column: "name" | "playtime") => void;
}

const SteamImportTable = ({
  games,
  selected,
  existingGames,
  sortColumn,
  sortDirection,
  onSelectAll,
  onToggleSelect,
  onSort,
}: SteamImportTableProps) => {
  const getSortIcon = (column: "name" | "playtime") => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ArrowUpward fontSize="small" />
    ) : (
      <ArrowDownward fontSize="small" />
    );
  };

  const selectableGames = games.filter(
    (g) => !existingGames.find((e) => e.appId === g.appId)
  );

  const isIndeterminate = selectableGames.length > 0 &&
    selectableGames.some(
      (g) => !existingGames.find((e) => e.appId === g.appId) && selected.has(String(g.appId))
    ) &&
    !selectableGames.every(
      (g) =>
        existingGames.find((e) => e.appId === g.appId) || selected.has(String(g.appId))
    );

  const isAllSelected =
    selectableGames.some(
      (g) => !existingGames.find((e) => e.appId === g.appId)
    ) &&
    selectableGames.every(
      (g) =>
        existingGames.find((e) => e.appId === g.appId) || selected.has(String(g.appId))
    );

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={onSelectAll}
                size="small"
              />
            </TableCell>
            <TableCell
              sx={{
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => onSort("name")}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                Game
                {getSortIcon("name")}
              </Box>
            </TableCell>
            <TableCell
              align="right"
              sx={{
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => onSort("playtime")}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                Playtime
                {getSortIcon("playtime")}
              </Box>
            </TableCell>
            <TableCell>Imported</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {games.length === 0 || selectableGames.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No games to import
              </TableCell>
            </TableRow>
          ) : (
            games.map((game) => (
              <TableRow key={game.appId}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.has(String(game.appId))}
                    onChange={() => onToggleSelect(String(game.appId))}
                    size="small"
                    disabled={!!existingGames.find((e) => e.appId === game.appId)}
                  />
                </TableCell>
                <TableCell>{game.name}</TableCell>
                <TableCell align="right">
                  {formatPlaytime(game.playtimeMinutes)}
                </TableCell>
                <TableCell>
                  {existingGames.find((e) => e.appId === game.appId)
                    ? "Yes"
                    : "No"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SteamImportTable;
