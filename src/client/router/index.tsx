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

const routes = [
  <Route path="/" element={<BaseLayout />}>
    <Route index element={<Home />} />,
    <Route path="/games" element={<Games />} />,
    <Route path="/settings" element={<Settings />} />,
  </Route>,
];

const router = createHashRouter(createRoutesFromElements(routes));

export default router;
