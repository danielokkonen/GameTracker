import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography, Box, Button, ButtonGroup, Tooltip, IconButton } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";
import Carousel from "../components/common/Carousel";
import { useNavigate } from "react-router-dom";
import { formatPlaytime } from "../utils/formatUtils";
import NowPlayingCard from "../components/dashboard/NowPlayingCard";
import ActivityItem from "../components/dashboard/ActivityItem";
import EmptyState from "../components/common/EmptyState";
import { Info } from "@mui/icons-material";

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
      Channels.DASHBOARD_SUCCESS,
      handleDashboardSuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.DASHBOARD_SUCCESS
      );
    };
  }, []);

  const totalGames =
    (dashboard?.notStarted ?? 0) +
    (dashboard?.started ?? 0) +
    (dashboard?.completed ?? 0) +
    (dashboard?.paused ?? 0) +
    (dashboard?.dropped ?? 0) +
    (dashboard?.replaying ?? 0);

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
                {dashboard?.completionRate ?? 0}%
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
                <Tooltip title="Playtime is only fetched from Steam during import and may be out of date.">
                  <IconButton size="small" sx={{ ml: 0.5, verticalAlign: "middle" }}>
                    <Info fontSize="inherit" sx={{ color: "text.secondary" }} />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Typography variant="h4">
                {formatPlaytime(dashboard?.totalPlaytime ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg. Playtime
                <Tooltip title="Playtime is only fetched from Steam during import and may be out of date.">
                  <IconButton size="small" sx={{ ml: 0.5, verticalAlign: "middle" }}>
                    <Info fontSize="inherit" sx={{ color: "text.secondary" }} />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Typography variant="h4">
                {formatPlaytime(dashboard?.avgPlaytime ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Now Playing
      </Typography>

      {dashboard === null ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Spinner />
        </Box>
      ) : dashboard.startedGames.length > 0 ? (
        <Carousel>
          {dashboard.startedGames.map((game) => (
            <NowPlayingCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/games/${game.id}`)}
            />
          ))}
        </Carousel>
      ) : (
        <EmptyState title="No games currently being played">
          <ButtonGroup variant="outlined" size="large">
            <Button onClick={() => navigate("/games")}>Add a Game</Button>
            <Button onClick={() => navigate("/steam-import")}>Import from Steam</Button>
          </ButtonGroup>
        </EmptyState>
      )}

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Recent Activity
      </Typography>

      {dashboard === null ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Spinner />
        </Box>
      ) : dashboard.activity.length > 0 ? (
        <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2, mb: 4 }}>
          {dashboard.activity.map((item) => (
            <ActivityItem
              key={item.id}
              item={item}
              onClick={() => navigate(`/games/${item.gameId}`)}
            />
          ))}
        </Box>
      ) : (
        <EmptyState title="No activity yet" />
      )}
    </Box>
  );
};

export default Home;
