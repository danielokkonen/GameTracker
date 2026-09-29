import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";

interface StartedGame {
  id: number;
  name: string;
  coverImage: string | null;
}

interface NowPlayingCardProps {
  game: StartedGame;
  onClick: () => void;
}

const NowPlayingCard = ({ game, onClick }: NowPlayingCardProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        flexShrink: 0,
        width: 200,
        height: 280,
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        bgcolor: "#1a1a2e",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        },
      }}
    >
      {game.coverImage ? (
        <img
          src={game.coverImage}
          alt={game.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#2a2a3e",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No Cover
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          pt: 24,
          pb: 1.5,
          px: 1,
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        }}
      >
        <Tooltip title={game.name}>
          <Typography
            variant="body2"
            sx={{
              color: "white",
              fontWeight: 600,
              fontSize: "0.85rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {game.name}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default NowPlayingCard;
