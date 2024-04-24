import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, Stack } from "@mui/material";
import GameList from "../components/games/GameList";
import GameDto from "../../backend/dtos/game";
import { IpcRendererEvent } from "electron";
import { Channels } from "../constants/channels";
import CreateGameForm from "../components/games/CreateGameForm";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import SnackbarContext from "../context/SnackbarContext";
import MenuButton from "../components/common/MenuButton";

const Games = () => {
  const [games, setGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    show: false,
    value: null,
  });

  const snackbarDispatch = useContext(SnackbarContext);

  const franchises = useMemo(
    () => Array.from(new Set(games?.map((g) => g.franchise))).sort(),
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

  const handleListGamesSuccess = (
    event: IpcRendererEvent,
    payload: GameDto[]
  ) => {
    setGames(payload);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
        <CreateGameForm
          value={form.value}
          onSubmit={submitForm}
          onClose={hideForm}
          franchises={franchises}
        />
      )}
      <Stack direction="row">
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
              onClick: () => window.gameService.import(),
            },
          ]}
        />
        <IconButton>
          <FilterListIcon />
        </IconButton>
      </Stack>
      {loading ? (
        <CircularProgress />
      ) : (
        <GameList items={games} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </Box>
  );
};

export default Games;
