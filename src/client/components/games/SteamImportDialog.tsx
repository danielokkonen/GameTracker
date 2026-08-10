import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableContainer,
  TableBody,
  TableCell,
  Checkbox,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import GameDto from "../../../backend/dtos/game";

interface SteamImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (selectedGames: GameDto[]) => void;
  games: GameDto[] | null;
  loading: boolean;
  error: string | null;
  onFetchLibrary: () => void;
  importing: boolean;
}

const SteamImportDialog: React.FC<SteamImportDialogProps> = ({
  open,
  onClose,
  onImport,
  games,
  loading,
  error,
  onFetchLibrary,
  importing,
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"name" | "playtime">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredGames = useMemo(() => {
    if (!games) return [];
    const lowerSearch = search.toLowerCase();
    const result = games.filter((g) => g.name.toLowerCase().includes(lowerSearch));
    result.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "playtime") {
        comparison = a.playtimeMinutes - b.playtimeMinutes;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return result;
  }, [games, search, sortColumn, sortDirection]);

  React.useEffect(() => {
    if (open && games === null) {
      onFetchLibrary();
    }
    if (!open) {
      setSearch("");
      setSelected(new Set());
    }
  }, [open]);

  React.useEffect(() => {
    if (open && games && games.length > 0) {
      setSelected(new Set(games.map((g) => String(g.appId))));
    }
    if (games === null) {
      setSelected(new Set());
    }
  }, [open, games]);

  const handleSelectAll = () => {
    const allIds = filteredGames.map((g) => String(g.appId));
    const allSelected = filteredGames.every((g) => selected.has(String(g.appId)));
    if (allSelected) {
      const next = new Set(selected);
      allIds.forEach((id) => next.delete(id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      allIds.forEach((id) => next.add(id));
      setSelected(next);
    }
  };

  const handleSelectNone = () => {
    setSelected(new Set());
  };

  const handleSelectAllVisible = () => {
    const allIds = filteredGames.map((g) => String(g.appId));
    const allSelected = filteredGames.every((g) => selected.has(String(g.appId)));
    if (allSelected) {
      const next = new Set(selected);
      allIds.forEach((id) => next.delete(id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      allIds.forEach((id) => next.add(id));
      setSelected(next);
    }
  };

  const handleToggleSelect = (appId: string) => {
    const next = new Set(selected);
    if (next.has(appId)) {
      next.delete(appId);
    } else {
      next.add(appId);
    }
    setSelected(next);
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSort = (column: "name" | "playtime") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "name" | "playtime") => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
  };

  const handleImport = () => {
    const selectedGamesList = (games || []).filter((g) => selected.has(String(g.appId)));
    onImport(selectedGamesList);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Import from Steam
        {games && (
          <Typography variant="subtitle2" sx={{ mt: 0.5, fontWeight: 400 }}>
            {games.length} games found
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search games..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            sx={{ width: 300 }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={handleSelectAllVisible}>
              Select All
            </Button>
            <Button size="small" onClick={handleSelectNone}>
              Select None
            </Button>
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && games && games.length > 0 && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          filteredGames.length > 0 &&
                          filteredGames.some((g) => selected.has(String(g.appId))) &&
                          !filteredGames.every((g) => selected.has(String(g.appId)))
                        }
                        checked={
                          filteredGames.length > 0 &&
                          filteredGames.every((g) => selected.has(String(g.appId)))
                        }
                        onChange={handleSelectAll}
                        size="small"
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => handleSort("name")}
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
                      onClick={() => handleSort("playtime")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                        Playtime
                        {getSortIcon("playtime")}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow key={game.appId}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.has(String(game.appId))}
                          onChange={() => handleToggleSelect(String(game.appId))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{game.name}</TableCell>
                      <TableCell align="right">
                        {formatPlaytime(game.playtimeMinutes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {!loading && !error && games && games.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography>No games found in your Steam library.</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={selected.size === 0 || loading || importing}
          startIcon={importing ? <CircularProgress size={20} /> : null}
        >
          {importing ? "Importing..." : `Import Selected (${selected.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SteamImportDialog;
