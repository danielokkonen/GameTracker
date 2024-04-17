import React, { useEffect, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import GameList from "../components/games/GameList";
import GameDto from "../../backend/dtos/game-dto";
import { IpcRendererEvent } from "electron";
import { Channels } from "../constants/channels";
import CreateGameForm from "../components/games/CreateGameForm";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";

const Games = () => {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({
    show: false,
    loading: false,
    value: null,
  });

  const showForm = () => {
    setForm({
      ...form,
      show: true,
      loading: false,
      value: new GameDto(0, "", "", "", null, null, null, null),
    });
  };

  const hideForm = () => {
    setForm({
      ...form,
      show: false,
      loading: false,
    });
  };

  const submitForm = () => {
    setForm({
      ...form,
      loading: true,
    });

    if (form.value.id) {
      (window as any).gameService.update(form.value);
    } else {
      (window as any).gameService.create(form.value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    setForm({
      ...form,
      value: {
        ...form.value,
        [e.currentTarget.name]: e.currentTarget.value,
      },
    });
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
    // TODO: Type/Interface
    (window as any).gameService.list();
  }, []);

  const handleListGamesSuccess = (
    event: IpcRendererEvent,
    payload: GameDto[]
  ) => {
    setGames(payload);
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
    (window as any).gameService.list();
    hideForm();
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
    (window as any).gameService.list();
    hideForm();
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
    (window as any).gameService.list();
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

  return (
    <Box>
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing(1),
        })}
      >
        <Typography variant="h4">Games </Typography>
        <Box
          sx={(theme) => ({
            ".MuiButton-root": { marginLeft: theme.spacing(1) },
          })}
        >
          <IconButton>
            <FilterListIcon />
          </IconButton>
          <IconButton onClick={showForm}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
      {form.show && (
        <CreateGameForm
          value={form.value}
          onSubmit={submitForm}
          onChange={handleChange}
          onClose={hideForm}
          loading={form.loading}
        />
      )}
      <GameList items={games} onEdit={handleEdit} onDelete={handleDelete} />
    </Box>
  );
};

export default Games;
