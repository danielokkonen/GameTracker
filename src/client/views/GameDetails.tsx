import React, { useEffect, useState } from "react";
import GameDto from "../../backend/dtos/game";
import { useParams } from "react-router-dom";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import { Box, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import Spinner from "../components/common/Spinner";
import dayjs from "dayjs";
import StatusIcon from "../components/games/StatusIcon";

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState<GameDto>(null);
  const [gameDetails, setGameDetails] = useState(null);

  useEffect(() => {
    window.gameService.get(parseInt(id));
  }, [id]);

  const handleGetGameSuccess = async (
    event: IpcRendererEvent,
    result: GameDto
  ) => {
    setGame(result);
    window.igdbService.getGameDetails(result.name);
  };

  const handleGetGameDetailsSuccess = async (
    event: IpcRendererEvent,
    result: string
  ) => {
    const array = JSON.parse(result);

    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      if (element?.artworks?.length > 0 && element?.genres?.length > 0) {
        setGameDetails(array[i]);
        return;
      }
    }
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.IGDB_GET_GAME,
      handleGetGameDetailsSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(Channels.IGDB_GET_GAME);
    };
  }, []);

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_GET_SUCCESS,
      handleGetGameSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_GET_SUCCESS
      );
    };
  }, []);

  if (!game) {
    return <Spinner />;
  }

  return (
    <Box>
      <Box>
        <Typography variant="h5" display="inline-block" mb={2} mr={2}>
          {game.name}
        </Typography>
        <StatusIcon game={game} />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          "& h6": { mt: 2 },
        }}
      >
        <Box flex={1} mr={2}>
          <Typography variant="h6">Progress</Typography>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
          >
            <TextField
              variant="standard"
              type="date"
              name="started"
              label="Started"
              value={
                game.started ? dayjs(game.started).format("YYYY-MM-DD") : " "
              }
              fullWidth
              disabled
            />
            <TextField
              variant="standard"
              type="date"
              name="completed"
              label="Completed"
              value={
                game.completed
                  ? dayjs(game.completed).format("YYYY-MM-DD")
                  : " "
              }
              fullWidth
              disabled
            />
          </Box>
          <Typography variant="h6">Genres</Typography>
          <Stack direction="row" spacing={1}>
            {gameDetails?.genres?.map((g: any) => (
              <Chip label={g.name} variant="outlined" />
            ))}
          </Stack>
          <Typography variant="h6">Description</Typography>
          <Typography>{gameDetails?.summary}</Typography>
        </Box>
        <Paper
          component="img"
          width={400}
          src={
            gameDetails?.artworks
              ? gameDetails.artworks[0].url.replace(
                  "t_thumb",
                  "t_screenshot_med"
                )
              : ""
          }
          elevation={3}
        ></Paper>
      </Box>
    </Box>
  );
};

export default GameDetails;
