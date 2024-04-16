import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import GameList from "../components/games/GameList";
import GameDto from "../../backend/dtos/game-dto";
import { IpcRendererEvent } from "electron";

const Games = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    (window as any).gameService.listGames();
  }, []);

  const handleListGamesSuccess = (
    event: IpcRendererEvent,
    payload: GameDto[]
  ) => {
    setGames(payload);
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      "list-games-success",
      handleListGamesSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners("list-games-success");
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4">Games</Typography>
      <GameList items={games} />
    </Box>
  );
};

export default Games;
