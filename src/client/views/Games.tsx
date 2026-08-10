import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import GameList from "../components/games/GameList";
import GameDto from "../../backend/dtos/game";
import { Channels } from "../constants/channels";
import CreateGameForm from "../components/games/CreateGameForm";
import SteamImportDialog from "../components/games/SteamImportDialog";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import SnackbarContext from "../context/SnackbarContext";
import MenuButton from "../components/common/MenuButton";
import Spinner from "../components/common/Spinner";
import GamesContext from "../context/GamesContext";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";

const Games = () => {
  const snackbarDispatch = useContext(SnackbarContext);
  const gamesContext = useContext(GamesContext);

  const [games, setGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    show: false,
    value: null,
  });

  const [filter, setFilter] = useState({
    franchise: "",
    status: "",
  });

  const [steamDialog, setSteamDialog] = useState({
    open: false,
    games: null as GameDto[] | null,
    loading: false,
    error: null as string | null,
    importing: false,
  });

  const filteredGames = useMemo(() => {
    let result = Array.from(games);
    if (filter.franchise) {
      result = result.filter((g) => g.franchise === filter.franchise);
    }
    if (filter.status) {
      result = result.filter((g) => g.status === filter.status);
    }

    return result;
  }, [games, filter]);

  const franchises = useMemo(
    () => Array.from(new Set(games?.map((g) => g.franchise))).sort(),
    [games]
  );

  const statuses = useMemo(
    () => Array.from(new Set(games?.map((g) => g.status))).sort(),
    [games]
  );

  const refreshTable = () => {
    setLoading(true);
    window.gameService.list();
  };

  useEffect(() => {
    refreshTable();
  }, []);

  const showForm = () => {
    setForm({
      ...form,
      show: true,
      value: null,
    });
  };

  const hideForm = () => {
    setForm({
      ...form,
      show: false,
    });
  };

  const submitForm = (game: GameDto) => {
    if (game.id) {
      window.gameService.update(game);
    } else {
      window.gameService.create(game);
    }
  };

  const handleEdit = (game: GameDto) => {
    setForm({
      ...form,
      show: true,
      value: game,
    });
  };

  const handleDelete = (id: number) => {
    window.gameService.delete(id);
  };

  const addGameDetailsToSelectedGames = async () => {
    snackbarDispatch({
      type: "show_message",
      payload: "Adding game details from IGDB...",
    });

    const selectedGames = Object.keys(
      gamesContext.state.selectedGames
    ).reverse();

    for (const item of selectedGames) {
      gamesContext.dispatch({
        type: "SET_SELECTED_GAME",
        payload: {
          id: parseInt(item),
          loading: true,
          selected: true,
        },
      });
    }

    for (const item of selectedGames) {
      window.gameService.addGameDetails(parseInt(item));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleAddGameDetailsSuccess = (id: number) => {
    gamesContext.dispatch({
      type: "REMOVE_SELECTED_GAME",
      payload: id,
    });
    window.gameService.list(); // TODO: Do not fetch all games every time
  };

  useIpcRendererCallback(
    Channels.GAMES_ADDDETAILS_SUCCESS,
    null,
    handleAddGameDetailsSuccess
  );

  const handleListGamesSuccess = (payload: GameDto[]) => {
    setGames(payload);
    setLoading(false);
  };

  useIpcRendererCallback(
    Channels.GAMES_LIST_SUCCESS,
    null,
    handleListGamesSuccess
  );

  const handleCreateSuccess = () => {
    hideForm();
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game added",
    });
  };

  useIpcRendererCallback(
    Channels.GAMES_CREATE_SUCCESS,
    null,
    handleCreateSuccess
  );

  const handleUpdateSuccess = () => {
    hideForm();
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game updated",
    });
  };

  useIpcRendererCallback(
    Channels.GAMES_UPDATE_SUCCESS,
    null,
    handleUpdateSuccess
  );

  const handleDeleteSuccess = () => {
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game deleted",
    });
  };

  useIpcRendererCallback(
    Channels.GAMES_DELETE_SUCCESS,
    null,
    handleDeleteSuccess
  );

  const handleImportSuccess = () => {
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Games imported",
    });
  };

  useIpcRendererCallback(
    Channels.GAMES_IMPORT_SUCCESS,
    null,
    handleImportSuccess
  );

  const handleSteamLibrarySuccess = (payload: GameDto[] | { error: string }) => {
    if (typeof payload === "object" && "error" in payload) {
      setSteamDialog((prev) => ({ ...prev, loading: false, error: payload.error }));
      snackbarDispatch({
        type: "show_message",
        payload: `Failed to fetch Steam library: ${payload.error}`,
      });
    } else {
      setSteamDialog((prev) => ({ ...prev, loading: false, games: payload }));
    }
  };

  useIpcRendererCallback(
    Channels.IMPORT_STEAM_SUCCESS,
    null,
    handleSteamLibrarySuccess
  );

  const handleOpenSteamDialog = () => {
    setSteamDialog((prev) => ({ ...prev, open: true, games: null, loading: true, error: null }));
    window.gameService.importSteam();
  };

  const handleSteamImport = (selectedGames: GameDto[]) => {
    setSteamDialog((prev) => ({ ...prev, importing: true }));

    const gamesToImport = selectedGames
      .filter((game) => !games.find((g) => g.appId === game.appId))
      .map((game) => {
        const newGame = new GameDto();
        newGame.id = null;
        newGame.name = game.name;
        newGame.developer = game.developer;
        newGame.publisher = game.publisher;
        newGame.appId = game.appId;
        newGame.playtimeMinutes = game.playtimeMinutes;
        newGame.franchise = "";
        newGame.status = "";
        return newGame;
      });

    if (gamesToImport.length === 0) {
      snackbarDispatch({
        type: "show_message",
        payload: "All games already exist in your library",
      });
      return;
    }

    snackbarDispatch({
      type: "show_message",
      payload: `Importing ${gamesToImport.length} game${gamesToImport.length === 1 ? "" : "s"} from Steam...`,
    });

    window.gameService.importSteamSelected(gamesToImport);
  };

  const handleSteamImportSuccess = (payload: { imported: number; skipped: number }) => {
    setSteamDialog((prev) => ({ ...prev, importing: false, open: false }));
    const message = payload.skipped > 0
      ? `Successfully imported ${payload.imported} game${payload.imported === 1 ? "" : "s"}, ${payload.skipped} already exist`
      : `Successfully imported ${payload.imported} game${payload.imported === 1 ? "" : "s"} from Steam`;

    snackbarDispatch({
      type: "show_message",
      payload: message,
    });
    refreshTable();
  };

  useIpcRendererCallback(
    Channels.IMPORT_STEAM_SELECTED_SUCCESS,
    null,
    handleSteamImportSuccess
  );

  const handleCloseSteamDialog = () => {
    setSteamDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box>
      {form.show && (
        <>
          <CreateGameForm
            value={form.value}
            onSubmit={submitForm}
            onClose={hideForm}
            franchises={franchises}
          />
          <Divider sx={{ mt: 2, mb: 2 }} />
        </>
      )}
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <MenuButton
            component={IconButton}
            icon={AddIcon}
            items={[
              {
                name: "New",
                onClick: showForm,
              },
              {
                name: "Import from CSV",
                onClick: window.gameService.import,
              },
              {
                name: "Import from Steam",
                onClick: handleOpenSteamDialog,
              },
              {
                name: "Add game details from IGDB",
                onClick: addGameDetailsToSelectedGames,
              },
            ]}
          />
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Box>
        <Box sx={{ "> div": { mr: 1, minWidth: 150 } }}>
          <Select
            size="small"
            name="franchise"
            displayEmpty
            value={filter.franchise}
            onChange={(e) =>
              setFilter({ ...filter, franchise: e.target.value })
            }
          >
            <MenuItem value="">Franchise</MenuItem>
            {franchises.map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            name="status"
            displayEmpty
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <MenuItem value="">Status</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>
      {loading && <Spinner delayed />}
      <GameList
        items={filteredGames}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {steamDialog.open && (
        <SteamImportDialog
          open={steamDialog.open}
          onClose={handleCloseSteamDialog}
          onImport={handleSteamImport}
          games={steamDialog.games}
          loading={steamDialog.loading}
          error={steamDialog.error}
          onFetchLibrary={handleOpenSteamDialog}
          importing={steamDialog.importing}
          existingAppIds={new Set(games.map((g) => String(g.appId)))}
        />
      )}
    </Box>
  );
};

export default Games;
