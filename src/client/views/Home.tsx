import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";

const Home = () => {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);

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
  );
};

export default Home;
