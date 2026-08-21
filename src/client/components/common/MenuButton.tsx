import React, { useState } from "react";
import {
  ExtendButtonBase,
  IconButtonTypeMap,
  Menu,
  MenuItem,
  SvgIconTypeMap,
} from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

export interface MenuButtonItem {
  name: string;
  onClick: () => void;
}

interface MenuButtonProps {
  component: ExtendButtonBase<IconButtonTypeMap>;
  icon: OverridableComponent<SvgIconTypeMap<object, "svg">>;
  items: MenuButtonItem[];
}

interface MenuButtonState {
  anchorEl: Element & EventTarget | null;
}

const MenuButton = (props: MenuButtonProps) => {
  const [state, setState] = useState<MenuButtonState>({
    anchorEl: null,
  });

  const showMenu = (e: React.MouseEvent) => {
    setState({
      anchorEl: e.currentTarget,
    });
  };

  const onClose = () => {
    setState({
      anchorEl: null,
    });
  };

  const handleClickItem = (callback: () => void) => {
    callback();
    onClose();
  };

  const { component, icon, items, ...restProps } = props;

  const Component = component;
  const Icon = icon;

  return (
    <>
      <Component {...restProps} onClick={showMenu}>
        <Icon />
      </Component>
      <Menu
        open={Boolean(state.anchorEl)}
        onClose={onClose}
        anchorEl={state.anchorEl}
      >
        {items.map((i) => (
          <MenuItem key={i.name} onClick={() => handleClickItem(i.onClick)}>
            {i.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default MenuButton;
