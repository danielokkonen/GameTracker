import React, { useState } from "react";
import { Box } from "@mui/material";
import SettingsForm from "../components/settings/SettingsForm";
import SettingsDto from "../../backend/dtos/settings";
import { Channels } from "../constants/channels";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";

const Settings = () => {
  const [settings, setSettings] = useState<SettingsDto>(null);

  useIpcRendererCallback<SettingsDto>(
    Channels.SETTINGS_GET_SUCCESS,
    () => window.settingsService.get(),
    (data) => {
      setSettings(data);
    }
  );

  const onSubmit = (data: SettingsDto) => {
    window.settingsService.upsert(data);
  };

  return (
    <Box>
      <SettingsForm value={settings} onSubmit={onSubmit} />
    </Box>
  );
};

export default Settings;
