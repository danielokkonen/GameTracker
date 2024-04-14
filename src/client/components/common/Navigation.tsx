import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import GamesIcon from "@mui/icons-material/List";
import AboutIcon from "@mui/icons-material/QuestionMark";
import React from "react";
import { Link } from "react-router-dom";

interface NavigationProps {
  open: boolean;
}

const Navigation = ({ open }: NavigationProps) => {
  return (
    <Drawer
      sx={{
        width: 250,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 250,
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
      open={open}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/">
            <HomeIcon />
            <ListItemText primary={"Home"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/games">
            <GamesIcon />
            <ListItemText primary={"Games"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/about">
            <AboutIcon />
            <ListItemText primary={"About"} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navigation;
