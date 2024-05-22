import React, { useContext, useMemo } from "react";
import Navigation from "../components/common/Navigation";
import { Outlet } from "react-router-dom";
import {
  Container as ContainerBase,
  CssBaseline,
  ThemeProvider,
  createTheme,
  styled,
} from "@mui/material";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";
import { Channels } from "../constants/channels";
import SettingsContext from "../context/SettingsContext";
import SettingsDto from "../../backend/dtos/settings";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

const Container = styled(ContainerBase)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  overflowY: "auto",
}));

const BaseLayout = () => {
  const { state, dispatch } = useContext(SettingsContext);

  useIpcRendererCallback<SettingsDto>(
    Channels.SETTINGS_GET_SUCCESS,
    () => window.settingsService.get(),
    (settings) => {
      dispatch({
        type: "init",
        payload: settings,
      });
    }
  );

  const shouldUseDarkMode = useMemo(() => {
    if (state.darkMode === undefined || state.darkMode === null) {
      return window.electronApi.theme.darkMode();
    }

    return state.darkMode;
  }, [state]);

  return (
    <ThemeProvider
      theme={shouldUseDarkMode ? darkTheme : lightTheme}
    >
      <CssBaseline />
      <Navigation open={true} />
      <Container maxWidth="xl">
        <Outlet />
      </Container>
    </ThemeProvider>
  );
};

export default BaseLayout;
