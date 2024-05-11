import React, { useEffect, useState } from "react";
import GameDto from "../../backend/dtos/game";
import { useParams } from "react-router-dom";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import {
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Spinner from "../components/common/Spinner";
import dayjs from "dayjs";
import StatusIcon from "../components/games/StatusIcon";
import MenuButton from "../components/common/MenuButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const GameDetails = () => {
  const { id } = useParams();

  const [game, setGame] = useState<GameDto>(null);
  const [gameDetails, setGameDetails] = useState<any[]>([]);
  const [gameDetailsIndex, setGameDetailsIndex] = useState<number>(0);

  useEffect(() => {
    if (id) {
      window.gameService.get(parseInt(id));
    }
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
    result: any
  ) => {
    setGameDetails(result.filter((r: any) => !!r.cover));
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h5" display="inline-block" mr={2}>
            {game.name}
          </Typography>
          <StatusIcon game={game} />
        </Box>
        <Box>
          <IconButton
            disabled={gameDetailsIndex <= 0}
            onClick={() => setGameDetailsIndex(gameDetailsIndex - 1)}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            disabled={gameDetailsIndex >= gameDetails.length}
            onClick={() => setGameDetailsIndex(gameDetailsIndex + 1)}
          >
            <ArrowForwardIcon />
          </IconButton>
          <MenuButton
            component={IconButton}
            icon={MoreVertIcon}
            items={[
              {
                name: "Add details from IGDB",
                onClick: () => window.igdbService.getGameDetails(game.name),
              },
            ]}
          />
        </Box>
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
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="h6">Developer</Typography>
              <Typography>
                {
                  gameDetails[gameDetailsIndex]?.involved_companies?.find(
                    (i: any) => i.developer
                  )?.company.name
                }
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Publisher</Typography>
              <Typography>
                {
                  gameDetails[gameDetailsIndex]?.involved_companies?.find(
                    (i: any) => i.publisher
                  )?.company.name
                }
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="h6">Genres</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {gameDetails &&
              gameDetails[gameDetailsIndex]?.genres?.map((g: any) => (
                <Chip label={g.name} variant="outlined" />
              ))}
          </Stack>
          <Typography variant="h6">Description</Typography>
          <Typography>
            {gameDetails && gameDetails[gameDetailsIndex]?.summary}
          </Typography>
          <Typography variant="h6">Platforms</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {gameDetails &&
              gameDetails[gameDetailsIndex]?.platforms?.map((p: any) => (
                <Chip label={p.name} variant="outlined" />
              ))}
          </Stack>
        </Box>
        <Paper
          component="img"
          width={400}
          src={
            gameDetails && gameDetails[gameDetailsIndex]?.cover
              ? gameDetails[gameDetailsIndex].cover?.url.replace(
                  "t_thumb",
                  "t_720p"
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
