import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, CircularProgress, Alert } from "@mui/material";
import GameDto from "../../backend/dtos/game";
import { Channels } from "../constants/channels";
import SnackbarContext from "../context/SnackbarContext";
import SettingsContext from "../context/SettingsContext";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";
import SteamImportToolbar from "../components/steam-import/SteamImportToolbar";
import SteamImportTable from "../components/steam-import/SteamImportTable";
import Spinner from "../components/common/Spinner";

const SteamImport = () => {
  const snackbarDispatch = useContext(SnackbarContext);
  const { state } = useContext(SettingsContext);

  const [existingGames, setExistingGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [steamGames, setSteamGames] = useState<GameDto[] | null>(null);
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"name" | "playtime">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hideImported, setHideImported] = useState(true);

  const refreshExistingGames = () => {
    setLoading(true);
    window.gameService.list();
  };

  useEffect(() => {
    refreshExistingGames();
    window.gameService.getSteamGames();
  }, []);

  const handleExistingGamesSuccess = (payload: GameDto[]) => {
    setExistingGames(payload);
    setLoading(false);
  };

  useIpcRendererCallback(
    Channels.GAMES_LIST_SUCCESS,
    null,
    handleExistingGamesSuccess
  );

  const handleSteamLibrarySuccess = (payload: GameDto[]) => {
    setSteamGames(payload);
    setSteamLoading(false);
    setSelected(new Set());
  };

  useIpcRendererCallback(
    Channels.GET_STEAM_GAMES_SUCCESS,
    null,
    handleSteamLibrarySuccess
  );

  const handleSteamLibraryError = (payload: { error: string }) => {
    setSteamError(payload.error);
    setSteamLoading(false);
    snackbarDispatch({
      type: "show_message",
      payload: `Failed to fetch Steam library: ${payload.error}`,
    });
  };

  useIpcRendererCallback(
    Channels.GET_STEAM_GAMES_ERROR,
    null,
    handleSteamLibraryError
  );

  const filteredGames = useMemo(() => {
    if (!steamGames) return [];
    const lowerSearch = search.toLowerCase();
    let result = steamGames.filter((g) => g.name.toLowerCase().includes(lowerSearch));
    if (hideImported) {
      result = result.filter((g) => !existingGames.find((e) => e.appId === g.appId));
    }
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
  }, [steamGames, existingGames, search, sortColumn, sortDirection, hideImported]);

  const handleSelectAll = () => {
    const selectableGames = filteredGames.filter(
      (g) => !existingGames.find((e) => e.appId === g.appId)
    );
    const allSelected =
      selectableGames.length > 0 &&
      selectableGames.every((g) => selected.has(String(g.appId)));
    if (allSelected) {
      const next = new Set(selected);
      selectableGames.forEach((g) => next.delete(String(g.appId)));
      setSelected(next);
    } else {
      const next = new Set(selected);
      selectableGames.forEach((g) => next.add(String(g.appId)));
      setSelected(next);
    }
  };

  const handleToggleSelect = (appId: string) => {
    const next = new Set(selected);
    if (next.has(appId)) {
      next.delete(appId);
    } else if (!existingGames.find((e) => e.appId === appId)) {
      next.add(appId);
    }
    setSelected(next);
  };

  const handleSort = (column: "name" | "playtime") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleImport = () => {
    const gamesToImport = (steamGames || [])
      .filter((g) => selected.has(String(g.appId)))
      .filter((game) => !existingGames.find((e) => e.appId === game.appId))
      .map((game) => {
        const newGame = new GameDto();
        newGame.id = null;
        newGame.name = game.name;
        newGame.developer = game.developer;
        newGame.publisher = game.publisher;
        newGame.appId = game.appId;
        newGame.playtimeMinutes = game.playtimeMinutes;
        newGame.franchise = "";
        newGame.status = "Not started";
        return newGame;
      });

    if (gamesToImport.length === 0) {
      snackbarDispatch({
        type: "show_message",
        payload: "All games already exist in your library",
      });
      return;
    }

    setImporting(true);
    snackbarDispatch({
      type: "show_message",
      payload: `Importing ${gamesToImport.length} game${gamesToImport.length === 1 ? "" : "s"} from Steam...`,
    });
    window.gameService.importSteamGames(gamesToImport);
  };

  const handleSteamImportSuccess = (payload: {
    imported: number;
    skipped: number;
    errors?: string[];
  }) => {
    setImporting(false);
    const message =
      payload.skipped > 0
        ? `Successfully imported ${payload.imported} game${payload.imported === 1 ? "" : "s"}, ${payload.skipped} already exist`
        : `Successfully imported ${payload.imported} game${payload.imported === 1 ? "" : "s"} from Steam`;

    if (payload.errors && payload.errors.length > 0) {
      const truncated = payload.errors.length > 5
        ? `${payload.errors.slice(0, 5).join(", ")}, ... and ${payload.errors.length - 5} more`
        : payload.errors.join(", ");
      snackbarDispatch({
        type: "show_message",
        payload: `${message}. Failed: ${truncated}`,
      });
    } else {
      snackbarDispatch({
        type: "show_message",
        payload: message,
      });
    }
    setSelected(new Set());
    refreshExistingGames();
  };

  useIpcRendererCallback(
    Channels.IMPORT_STEAM_GAMES_SUCCESS,
    null,
    handleSteamImportSuccess
  );

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Import from Steam
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse your Steam library and import games to your collection.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Steam library: {steamGames ? steamGames.length : "—"} games
            </Typography>
          </Box>
        </Box>

        {loading && <Spinner delayed />}

        {!loading && steamLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !steamLoading && steamError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {steamError}
          </Alert>
        )}

        {!loading && !steamLoading && !steamError && steamGames && steamGames.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography>No games found in your Steam library.</Typography>
          </Box>
        )}

        {!loading && steamGames && (
          <>
            <SteamImportToolbar
              search={search}
              onSearchChange={setSearch}
              hideImported={hideImported}
              onToggleHideImported={() => setHideImported((prev) => !prev)}
              onRefresh={refreshExistingGames}
              onImport={handleImport}
              importing={importing}
              selectedCount={selected.size}
              disabled={loading || !state.steamApiKey || !state.steamId}
            />

            <SteamImportTable
              games={filteredGames}
              selected={selected}
              existingGames={existingGames}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSelectAll={handleSelectAll}
              onToggleSelect={handleToggleSelect}
              onSort={handleSort}
            />
          </>
        )}
      </Stack>
    </Box>
  );
};

export default SteamImport;
