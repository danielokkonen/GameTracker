import React, { useMemo } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import GamesIcon from "@mui/icons-material/List";
import AboutIcon from "@mui/icons-material/Settings";
import { Link } from "react-router-dom";
import useRouteMatch from "../../../client/hooks/UseRouteMatch";

interface NavigationProps {
  open: boolean;
}

const Navigation = ({ open }: NavigationProps) => {
  const links = useMemo(
    () => [
      {
        icon: <HomeIcon />,
        route: "/",
        label: "Home",
      },
      {
        icon: <GamesIcon />,
        route: "/games",
        label: "Games",
      },
      {
        icon: <AboutIcon />,
        route: "/settings",
        label: "Settings",
      },
    ],
    []
  );

  const routeMatch = useRouteMatch(links.map((l) => l.route));

  return (
    <Drawer
      sx={{
        width: 250,
        flexShrink: 0,
        "& .MuiPaper-root": {
          position: "inherit",
          width: 250,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
      open={open}
    >
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="h5" sx={{ userSelect: "none" }}>
          Game Tracker
        </Typography>
      </Box>
      <List disablePadding>
        {links.map((l) => (
          <ListItem
            key={l.label}
            disablePadding
            sx={{
              ".MuiSvgIcon-root": { mr: 2 },
            }}
          >
            <ListItemButton
              component={Link}
              to={l.route}
              selected={routeMatch?.pattern?.path === l.route}
            >
              {l.icon}
              <ListItemText primary={l.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Navigation;
