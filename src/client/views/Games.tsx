import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import GameList from "../components/games/GameList";
import Game from "../../backend/models/game";

const Games = () => {
  const items = useMemo(() => {
    return Array.from(Array(5)).map(
      (_, i) =>
        new Game(`${i + 1}`, `Game ${i + 1}`, "Not started", new Date(), i % 2 ? null : new Date())
    );
  }, []);

  return (
    <Box>
      <Typography variant="h4">Games</Typography>
      <GameList items={items} />
    </Box>
  );
};

export default Games;
