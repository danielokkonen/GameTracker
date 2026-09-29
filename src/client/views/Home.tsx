import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography, Box, Button, ButtonGroup } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const navigate = useNavigate();

  const handleDashboardSuccess = (
    event: IpcRendererEvent,
    data: DashboardDto
  ) => {
    setDashboard(data);
  };

  useEffect(() => {
    window.gameService.dashboard();
  }, []);

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_DASHBOARD_SUCCESS,
      handleDashboardSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_DASHBOARD_SUCCESS
      );
    };
  }, []);

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (!dashboard) {
    return <Spinner />;
  }

  const totalGames =
    dashboard.notStarted +
    dashboard.started +
    dashboard.completed +
    dashboard.paused +
    dashboard.dropped +
    dashboard.replaying;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {dashboard.completionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Games
              </Typography>
              <Typography variant="h4">
                {totalGames}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Playtime
              </Typography>
              <Typography variant="h4">
                {formatPlaytime(dashboard.totalPlaytime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg. Playtime
              </Typography>
              <Typography variant="h4">
                {formatPlaytime(dashboard.avgPlaytime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Now Playing
      </Typography>

      {dashboard.startedGames.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 2,
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": { background: "#888", borderRadius: 3 },
          }}
        >
          {dashboard.startedGames.map((game) => (
            <Box
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
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
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            mt: 3,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            borderRadius: 2,
            border: "1px dashed #555",
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No games currently being played
          </Typography>
          <ButtonGroup variant="outlined" size="large">
            <Button onClick={() => navigate("/games")}>
              Add a Game
            </Button>
            <Button onClick={() => navigate("/import")}>
              Import from Steam
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
};

export default Home;
