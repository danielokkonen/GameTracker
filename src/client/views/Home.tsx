import React, { useEffect, useState } from "react";
import { PieChart, BarChart, LineChart } from "@mui/x-charts";
import { Card, CardContent, Grid, Typography, Box } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";

const STATUS_COLORS: Record<string, string> = {
  "Not started": "#9e9e9e",
  "Started": "#ffbf00",
  "Completed": "#4caf50",
  "Paused": "#2196f3",
  "Dropped": "#f44336",
  "Replaying": "#9c27b0",
};

const STATUS_NAMES = ["Not started", "Started", "Completed", "Paused", "Dropped", "Replaying"];

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

  const pieData = STATUS_NAMES.map((name) => {
    let count: number;
    switch (name) {
      case "Not started": count = dashboard?.notStarted ?? 0; break;
      case "Started": count = dashboard?.started ?? 0; break;
      case "Completed": count = dashboard?.completed ?? 0; break;
      case "Paused": count = dashboard?.paused ?? 0; break;
      case "Dropped": count = dashboard?.dropped ?? 0; break;
      case "Replaying": count = dashboard?.replaying ?? 0; break;
      default: count = 0;
    }
    return { name, label: `${name} (${count})`, value: count, color: STATUS_COLORS[name] };
  });

  const barData = STATUS_NAMES.map((name) => {
    let count: number;
    switch (name) {
      case "Not started": count = dashboard?.notStarted ?? 0; break;
      case "Started": count = dashboard?.started ?? 0; break;
      case "Completed": count = dashboard?.completed ?? 0; break;
      case "Paused": count = dashboard?.paused ?? 0; break;
      case "Dropped": count = dashboard?.dropped ?? 0; break;
      case "Replaying": count = dashboard?.replaying ?? 0; break;
      default: count = 0;
    }
    return { name, value: count };
  }).filter((d) => d.value > 0);

  const donutData = pieData.filter((s) => s.value > 0);

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
                {dashboard.notStarted + dashboard.started + dashboard.completed + dashboard.paused + dashboard.dropped + dashboard.replaying}
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
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Games by Status
              </Typography>
              <PieChart
                series={[
                  {
                    data: pieData.filter((s) => s.value > 0),
                    arcLabel: ((item: any) => item.label) as any,
                    arcLabelRadius: "60%",
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                  },
                }}
                sx={{ width: "100%", height: 300, "& .MuiChartsLegend-root": { maxWidth: 150 } }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Breakdown
              </Typography>
              <PieChart
                series={[
                  {
                    data: donutData,
                    arcLabel: ((item: any) => `${item.value}`) as any,
                    arcLabelMinAngle: 45,
                    innerRadius: 40,
                    outerRadius: 100,
                    paddingAngle: 2,
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    padding: 0,
                  },
                }}
                sx={{ width: "100%", height: 300, "& .MuiChartsLegend-root": { maxWidth: 150 } }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Counts
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: barData.map((d) => d.name) }]}
                series={[{ data: barData.map((d) => d.value), color: STATUS_COLORS[barData[0]?.name] }]}
                width={500}
                height={300}
                colors={STATUS_NAMES.map((n) => STATUS_COLORS[n])}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Games Over Time
              </Typography>
              <LineChart
                xAxis={[{ data: dashboard.gamesStartedByMonth.map((d) => d.month) }]}
                series={[
                  { data: dashboard.gamesStartedByMonth.map((d) => d.count), label: "Started", color: "#ffbf00" },
                  { data: dashboard.gamesCompletedByMonth.map((d) => d.count), label: "Completed", color: "#4caf50" },
                ]}
                width={500}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Genres
              </Typography>
              <BarChart
                xAxis={[{ data: dashboard.topGenres.map((d) => d.count), scaleType: "linear" }]}
                yAxis={[{ data: dashboard.topGenres.map((d) => d.genre), scaleType: "band" }]}
                series={[{ data: dashboard.topGenres.map((d) => d.count), layout: "horizontal" as const }]}
                width={500}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Platforms
              </Typography>
              <BarChart
                xAxis={[{ data: dashboard.topPlatforms.map((d) => d.count), scaleType: "linear" }]}
                yAxis={[{ data: dashboard.topPlatforms.map((d) => d.platform), scaleType: "band" }]}
                series={[{ data: dashboard.topPlatforms.map((d) => d.count), layout: "horizontal" as const }]}
                width={500}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
