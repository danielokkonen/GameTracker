import React, { useEffect, useState } from "react";
import GameDto from "../../backend/dtos/game";
import { useParams } from "react-router-dom";
import { Channels } from "../constants/channels";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Skeleton,
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
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";

const GameDetails = () => {
  const { id } = useParams();

  const [game, setGame] = useState<GameDto>(null);
  const [gameDetails, setGameDetails] = useState<any[]>([]);
  const [gameDetailsIndex, setGameDetailsIndex] = useState(0);
  const [gameDetailsLoading, setGameDetailsLoading] = useState(false);

  useEffect(() => {
    const selectedGameDetails = gameDetails[gameDetailsIndex];
    if (!selectedGameDetails) {
      return;
    }

    const reader = new FileReader();

    let imageUrl = selectedGameDetails.cover.url.replace("t_thumb", "t_720p");
    if (!imageUrl.startsWith("https://")) {
      imageUrl = `https:${
        imageUrl.startsWith("//") ? imageUrl : `//${imageUrl}`
      }`;
    }

    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .then(() => {
        const coverImage = reader.result.toString();

        const updatedGame: GameDto = { ...game };
        updatedGame.summary = selectedGameDetails.summary;
        updatedGame.developer = selectedGameDetails?.involved_companies?.find(
          (i: any) => i.developer
        )?.company.name;
        updatedGame.publisher = selectedGameDetails?.involved_companies?.find(
          (i: any) => i.publisher
        )?.company.name;
        updatedGame.genres = selectedGameDetails.genres?.map(
          (g: any) => g.name
        );
        updatedGame.platforms = selectedGameDetails.platforms?.map(
          (p: any) => p.name
        );
        updatedGame.coverImage = coverImage;

        setGame(updatedGame);
      });
  }, [gameDetails, gameDetailsIndex]);

  useEffect(() => {
    if (id) {
      window.gameService.get(parseInt(id));
    }
  }, [id]);

  useIpcRendererCallback(Channels.IGDB_GET_GAME, null, (result: any) => {
    setGameDetails(result.filter((r: any) => !!r.cover));
    setGameDetailsLoading(false);
  });

  useIpcRendererCallback(Channels.GAMES_GET_SUCCESS, null, (game: GameDto) => {
    setGame(game);
    setGameDetails([]);
  });

  useIpcRendererCallback(Channels.GAMES_UPDATE_SUCCESS, null, () => {
    window.gameService.get(parseInt(id));
  });

  const getGameDetails = (name: string) => {
    setGameDetailsLoading(true);
    window.igdbService.getGameDetails(name);
  };

  const saveGameDetails = () => {
    window.gameService.update(game);
  };

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
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            disabled={!gameDetails.length}
            onClick={saveGameDetails}
          >
            Save
          </Button>
          <IconButton
            disabled={gameDetailsIndex <= 0}
            onClick={() => setGameDetailsIndex(gameDetailsIndex - 1)}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            disabled={gameDetailsIndex + 1 >= gameDetails.length}
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
                onClick: () => getGameDetails(game.name),
              },
            ]}
          />
        </Stack>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          "& h6:not(:first-of-type)": { mt: 2 },
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
          <Grid container mt={2}>
            <Grid item xs={6}>
              <Typography variant="h6">Developer</Typography>
              <Typography>
                {gameDetailsLoading ? (
                  <Skeleton width={100} />
                ) : (
                  game?.developer ?? "Unknown"
                )}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Publisher</Typography>
              <Typography>
                {gameDetailsLoading ? (
                  <Skeleton width={100} />
                ) : (
                  game.publisher ?? "Unknown"
                )}
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="h6">Description</Typography>
          <Typography>
            {gameDetailsLoading ? (
              <Skeleton />
            ) : (
              game?.summary ?? "No description"
            )}
          </Typography>
          <Typography variant="h6">Genres</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {gameDetailsLoading ? (
              <Skeleton height={32} width={100} />
            ) : (
              game?.genres?.map((g) => (
                <Chip key={g} label={g} variant="outlined" />
              )) ?? "Unknown"
            )}
          </Stack>
          <Typography variant="h6">Platforms</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {gameDetailsLoading ? (
              <Skeleton height={32} width={100} />
            ) : (
              game?.platforms?.map((p) => (
                <Chip key={p} label={p} variant="outlined" />
              )) ?? "Unknown"
            )}
          </Stack>
        </Box>
        {gameDetailsLoading ? (
          <Skeleton variant="rectangular" width={400} height={500} />
        ) : (
          <Paper
            component="img"
            width={400}
            sx={{ minHeight: 500 }}
            src={game?.coverImage}
            elevation={3}
          ></Paper>
        )}
      </Box>
    </Box>
  );
};

export default GameDetails;
