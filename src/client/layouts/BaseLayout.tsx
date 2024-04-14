import React from "react";
import Navigation from "../components/common/Navigation";
import { Outlet } from "react-router-dom";
import { Container as ContainerBase, styled } from "@mui/material";

const Container = styled(ContainerBase)(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const BaseLayout = () => {
  return (
    <>
      <Navigation open={true} />
      <Container>
        <Outlet />
      </Container>
    </>
  );
};

export default BaseLayout;
