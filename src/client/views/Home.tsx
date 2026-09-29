import React, { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography, Box, Button, ButtonGroup, List, ListItemIcon, ListItemButton, ListItemText } from "@mui/material";
import DashboardDto from "../../backend/dtos/dashboard";
import ActivityDto from "../../backend/dtos/activity";
import { Channels } from "../constants/channels";
import { IpcRendererEvent } from "electron";
import Spinner from "../components/common/Spinner";
import Carousel from "../components/common/Carousel";
import { useNavigate } from "react-router-dom";
import { formatPlaytime, formatActivityDate } from "../utils/formatUtils";
import {
  AddCircleOutlined,
  PlayArrow,
  CheckCircle,
  PauseCircle,
  Cancel,
  Replay,
  EventNote,
} from "@mui/icons-material";

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "added": return <AddCircleOutlined sx={{ color: "#9e9e9e" }} />;
      case "started": return <PlayArrow sx={{ color: "#ffbf00" }} />;
      case "completed": return <CheckCircle sx={{ color: "#4caf50" }} />;
      case "paused": return <PauseCircle sx={{ color: "#2196f3" }} />;
      case "dropped": return <Cancel sx={{ color: "#f44336" }} />;
      case "replaying": return <Replay sx={{ color: "#9c27b0" }} />;
      default: return <EventNote sx={{ color: "#757575" }} />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "added": return "Added to backlog";
      case "started": return "Started playing";
      case "completed": return "Completed";
      case "paused": return "Paused";
      case "dropped": return "Dropped";
      case "replaying": return "Replaying";
      default: return action;
    }
  };

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
            <Box
              key={game.id}
              onClick={() => navigate(`/games/${game.id}`)}
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
        </Carousel>
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
            <Button onClick={() => navigate("/steam-import")}>
              Import from Steam
            </Button>
          </ButtonGroup>
        </Box>
      )}

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Recent Activity
      </Typography>

      {activity === null ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Spinner />
        </Box>
      ) : activity.length > 0 ? (
        <List sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2, mb: 4 }}>
          {activity.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => navigate(`/games/${item.gameId}`)}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>{getActionIcon(item.action)}</ListItemIcon>
              <ListItemText
                primary={item.gameName}
                secondary={
                  <>
                    {getActionLabel(item.action)}
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'inline', ml: 1 }}>
                      · {formatActivityDate(item.created)}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Box
          sx={{
            mt: 3,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
            border: "1px dashed #555",
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No activity yet
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Home;
