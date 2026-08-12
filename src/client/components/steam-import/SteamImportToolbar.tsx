import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface SteamImportToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  hideImported: boolean;
  onToggleHideImported: () => void;
  onRefresh: () => void;
  onImport: () => void;
  importing: boolean;
  selectedCount: number;
  disabled: boolean;
}

const SteamImportToolbar = ({
  search,
  onSearchChange,
  hideImported,
  onToggleHideImported,
  onRefresh,
  onImport,
  importing,
  selectedCount,
  disabled,
}: SteamImportToolbarProps) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search games..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            endAdornment: search ? (
              <IconButton size="small" onClick={() => onSearchChange("")}>
                <Close fontSize="small" />
              </IconButton>
            ) : null,
          }}
        />
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", userSelect: "none" }}
          onClick={onToggleHideImported}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleHideImported();
            }
          }}
          role="checkbox"
          aria-checked={hideImported}
          tabIndex={0}
        >
          <Checkbox
            size="small"
            checked={hideImported}
            onChange={onToggleHideImported}
            onClick={(e) => e.stopPropagation()}
          />
          <Typography variant="body2">Hide imported</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onRefresh}
          disabled={disabled}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          onClick={onImport}
          disabled={selectedCount === 0 || importing}
          startIcon={
            importing ? <CircularProgress size={20} /> : null
          }
        >
          {importing
            ? "Importing..."
            : `Import Selected (${selectedCount})`}
        </Button>
      </Box>
    </Box>
  );
};

export default SteamImportToolbar;
