import React, { useContext } from "react";
import Navigation from "../components/common/Navigation";
import { Outlet } from "react-router-dom";
import { Container as ContainerBase, styled } from "@mui/material";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";
import { Channels } from "../constants/channels";
import SettingsContext from "../context/SettingsContext";
import SettingsDto from "../../backend/dtos/settings";

const Container = styled(ContainerBase)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  overflowY: "auto",
}));

const BaseLayout = () => {
  const { dispatch } = useContext(SettingsContext);

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

  return (
    <>
      <Navigation open={true} />
      <Container maxWidth="xl">
        <Outlet />
      </Container>
    </>
  );
};

export default BaseLayout;
