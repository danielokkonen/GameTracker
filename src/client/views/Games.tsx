import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import GameList from "../components/games/GameList";
import { IpcRendererEvent } from "electron";
import Game from "../../backend/models/game";

const Games = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    (window as any).gameService.listGames();
  }, []);

  const handleListGamesSuccess = (event: IpcRendererEvent, payload: Game[]) => {
    console.log(payload);
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
