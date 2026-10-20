import React from "react";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  children?: React.ReactNode;
}

const EmptyState = ({ title, children }: EmptyStateProps) => {
  return (
    <Box
      sx={{
        mt: 3,
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        borderRadius: 2,
        border: "1px dashed #555",
        bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default EmptyState;
