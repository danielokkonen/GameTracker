import React, { useContext, useState } from "react";
import { Box } from "@mui/material";
import SettingsForm from "../components/settings/SettingsForm";
import SettingsDto from "../../backend/dtos/settings";
import { Channels } from "../constants/channels";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";
import SettingsContext from "../context/SettingsContext";
import SnackbarContext from "../context/SnackbarContext";

const Settings = () => {
  const { dispatch } = useContext(SettingsContext);
  const snackbarDispatch = useContext(SnackbarContext);
  const [settings, setSettings] = useState<SettingsDto | null>(null);

  useIpcRendererCallback<SettingsDto | null>(
    Channels.SETTINGS_GET_SUCCESS,
    () => window.settingsService.get(),
    (data) => {
      setSettings(data);
    }
  );

  const onSubmit = (data: SettingsDto) => {
    window.settingsService.upsert(data);
    dispatch({
      type: "init",
      payload: data,
    });
    setSettings(data);
  };

  const onClearTokens = () => {
    window.settingsService.clearTokens();
    snackbarDispatch({
      type: "show_message",
      payload: "Tokens cleared successfully.",
    });
  };

  const onDeleteAllGames = () => {
    window.gameService.deleteAll();
  };

  const handleDeleteAllSuccess = () => {
    snackbarDispatch({
      type: "show_message",
      payload: "All games deleted successfully.",
    });
  };

  useIpcRendererCallback(
    Channels.GAMES_DELETE_ALL_SUCCESS,
    null,
    handleDeleteAllSuccess
  );

  return (
    <Box>
      <SettingsForm value={settings} onSubmit={onSubmit} onClearTokens={onClearTokens} onDeleteAllGames={onDeleteAllGames} />
    </Box>
  );
};

export default Settings;
