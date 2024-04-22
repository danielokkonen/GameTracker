import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton } from "@mui/material";
import GameList from "../components/games/GameList";
import GameDto from "../../backend/dtos/game-dto";
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

  const franchises = useMemo(
    () => Array.from(new Set(games?.map((g) => g.franchise))).sort(),
    [games]
  );

  const snackbarDispatch = useContext(SnackbarContext);

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
      (window as any).gameService.update(game);
    } else {
      (window as any).gameService.create(game);
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
    (window as any).gameService.delete(id);
  };

  useEffect(() => {
    // FIXME: Type/Interface
    setTimeout(() => {
      (window as any).gameService.list();
    }, 1000);
  }, []);

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
    // FIXME: Type/Interface
    (window as any).gameService.list();
    hideForm();
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
    // FIXME: Type/Interface
    (window as any).gameService.list();
    hideForm();
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
    // FIXME: Type/Interface
    (window as any).gameService.list();
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
    // FIXME: Type/Interface
    (window as any).gameService.list();
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
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: theme.spacing(1),
        })}
      >
        <Box
          sx={(theme) => ({
            ".MuiButton-root": { marginLeft: theme.spacing(1) },
          })}
        >
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
                onClick: () => (window as any).gameService.import(),
              },
            ]}
          />
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Box>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <GameList items={games} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </Box>
  );
};

export default Games;
