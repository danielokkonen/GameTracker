import { useContext, useEffect, useState } from "react";
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
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

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

  useIpcRendererCallback<SettingsDto | null>(
    Channels.SETTINGS_GET_SUCCESS,
    () => window.settingsService.get(),
    (settings) => {
      if (settings) {
        dispatch({
          type: "init",
          payload: settings,
        });
      }
    }
  );

  const [systemDarkMode, setSystemDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDarkMode(event.matches);
    darkModeQuery.addEventListener("change", onChange);
    return () => darkModeQuery.removeEventListener("change", onChange);
  }, []);

  const shouldUseDarkMode = state.darkMode ?? systemDarkMode;

  return (
    <ThemeProvider theme={shouldUseDarkMode ? darkTheme : lightTheme}>
      <CssBaseline enableColorScheme />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Navigation open={true} />
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default BaseLayout;
