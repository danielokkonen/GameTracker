import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography, Box, Button, ButtonGroup } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import ActivityDto from "../../backend/dtos/activity";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";
import Carousel from "../components/common/Carousel";
import { useNavigate } from "react-router-dom";
import { formatPlaytime } from "../utils/formatUtils";
import NowPlayingCard from "../components/dashboard/NowPlayingCard";
import ActivityItem from "../components/dashboard/ActivityItem";
import EmptyState from "../components/common/EmptyState";

const Home = () => {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [activity, setActivity] = useState<ActivityDto[] | null>(null);
  const navigate = useNavigate();

  const handleDashboardSuccess = (
    event: IpcRendererEvent,
    data: DashboardDto
  ) => {
    setDashboard(data);
  };

  const handleActivitySuccess = (
    event: IpcRendererEvent,
    data: ActivityDto[]
  ) => {
    setActivity(data);
  };

  useEffect(() => {
    window.gameService.dashboard();
    window.gameService.getActivity();
  }, []);

  useEffect(() => {
    window.electronApi.ipcRenderer.on(
      Channels.GAMES_DASHBOARD_SUCCESS,
      handleDashboardSuccess
    );
    window.electronApi.ipcRenderer.on(
      Channels.GET_ACTIVITY_SUCCESS,
      handleActivitySuccess
    );
    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GAMES_DASHBOARD_SUCCESS
      );
      window.electronApi.ipcRenderer.removeAllListeners(
        Channels.GET_ACTIVITY_SUCCESS
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

      {activity === null ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Spinner />
        </Box>
      ) : activity.length > 0 ? (
        <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2, mb: 4 }}>
          {activity.map((item) => (
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
