import React from "react";
import { ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import ActivityDto from "../../../backend/dtos/activity";
import useActivityItem from "./useActivityItem";
import { formatActivityDate } from "../../utils/formatUtils";

interface ActivityItemProps {
  item: ActivityDto;
  onClick: () => void;
}

const ActivityItem = ({ item, onClick }: ActivityItemProps) => {
  const { Icon, label, color } = useActivityItem(item.action);

  return (
    <ListItemButton
      onClick={onClick}
      sx={{ pl: 4 }}
    >
      <ListItemIcon>
        <Icon sx={{ color }} />
      </ListItemIcon>
      <ListItemText
        primary={item.gameName}
        secondary={
          <>
            {label || item.action}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "inline", ml: 1 }}>
              · {formatActivityDate(item.created)}
            </Typography>
          </>
        }
      />
    </ListItemButton>
  );
};

export default ActivityItem;
