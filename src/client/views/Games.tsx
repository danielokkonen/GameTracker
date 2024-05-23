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
import { IpcRendererEvent } from "electron";
import { Channels } from "../constants/channels";
import CreateGameForm from "../components/games/CreateGameForm";
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

  useIpcRendererCallback(
    Channels.GAMES_ADDDETAILS_SUCCESS,
    null,
    (id: number) => {
      gamesContext.dispatch({
        type: "REMOVE_SELECTED_GAME",
        payload: id,
      });
      window.gameService.list(); // TODO: Do not fetch all games every time
    }
  );

  const handleListGamesSuccess = (
    event: IpcRendererEvent,
    payload: GameDto[]
  ) => {
    setGames(payload);
    setLoading(false);
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_LIST_SUCCESS,
      handleListGamesSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_LIST_SUCCESS
      );
    };
  }, []);

  const handleCreateSuccess = () => {
    hideForm();
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game added",
    });
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_CREATE_SUCCESS,
      handleCreateSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_CREATE_SUCCESS
      );
    };
  }, []);

  const handleUpdateSuccess = () => {
    hideForm();
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game updated",
    });
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_UPDATE_SUCCESS,
      handleUpdateSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_UPDATE_SUCCESS
      );
    };
  }, []);

  const handleDeleteSuccess = () => {
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Game deleted",
    });
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_DELETE_SUCCESS,
      handleDeleteSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_DELETE_SUCCESS
      );
    };
  }, []);

  const handleImportSuccess = () => {
    refreshTable();
    snackbarDispatch({
      type: "show_message",
      payload: "Games imported",
    });
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_IMPORT_SUCCESS,
      handleImportSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_IMPORT_SUCCESS
      );
    };
  }, []);

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
              setFilter({ ...filter, franchise: e.target.value as string })
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
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value as string })
            }
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
      {loading ? (
        <Spinner delayed />
      ) : (
        <GameList
          items={filteredGames}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </Box>
  );
};

export default Games;
