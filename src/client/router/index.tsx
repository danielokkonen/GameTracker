import React from "react";
import {
  createHashRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Home from "../views/Home";
import Settings from "../views/Settings";
import Games from "../views/Games";
import BaseLayout from "../layouts/BaseLayout";
import GameDetails from "../views/GameDetails";
import SteamImport from "../views/SteamImport";

const routes = [
  <Route path="/" element={<BaseLayout />}>
    <Route index element={<Home />} />,
    <Route path="/games" element={<Games />} />,
    <Route path="/games/:id" element={<GameDetails />} />,
    <Route path="/steam-import" element={<SteamImport />} />,
    <Route path="/settings" element={<Settings />} />,
  </Route>,
];

const router = createHashRouter(createRoutesFromElements(routes));

export default router;
