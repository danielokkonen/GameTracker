import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./client/router";
import SnackbarProvider from "./client/components/common/SnackbarProvider";
import SettingsProvider from "./client/components/settings/SettingsProvider";
import GamesProvider from "./client/components/games/GamesProvider";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const App = () => {
  return (
    <>
      <SettingsProvider>
        <SnackbarProvider>
          <GamesProvider>
            <RouterProvider router={router} />
          </GamesProvider>
        </SnackbarProvider>
      </SettingsProvider>
    </>
  );
};

export default App;
