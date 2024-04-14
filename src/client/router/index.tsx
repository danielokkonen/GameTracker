import React from "react";
import {
  createHashRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Home from "../views/Home";
import About from "../views/About";
import Games from "../views/Games";
import BaseLayout from "../layouts/BaseLayout";

const routes = [
  <Route path="/" element={<BaseLayout />}>
    <Route index element={<Home />} />,
    <Route path="/games" element={<Games />} />,
    <Route path="/about" element={<About />} />,
  </Route>,
];

const router = createHashRouter(createRoutesFromElements(routes));

export default router;
