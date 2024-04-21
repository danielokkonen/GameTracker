import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./client/router";
import CssBaseline from "@mui/material/CssBaseline";
import SnackbarProvider from "./client/components/common/SnackbarProvider";
import SettingsProvider from "./client/components/settings/SettingsProvider";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const App = () => {
  return (
    <React.StrictMode>
      <CssBaseline />
      <SettingsProvider>
        <SnackbarProvider>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </SettingsProvider>
    </React.StrictMode>
  );
};

export default App;
