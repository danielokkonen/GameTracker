import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";

const Home = () => {
  const [dashboard, setDashboard] = useState<DashboardDto>(null);

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

  const getCard = (label: string, data: number) => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {data !== undefined ? (
          <Typography variant="body1">{data}</Typography>
        ) : (
          <CircularProgress />
        )}
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={2}>
      {getCard("Not started", dashboard?.notStarted)}
      {getCard("Started", dashboard?.started)}
      {getCard("Completed", dashboard?.completed)}
      {getCard("Started last 30 days", dashboard?.startedLast30Days)}
      {getCard("Completed last 30 days", dashboard?.completedLast30Days)}
    </Stack>
  );
};

export default Home;
