import { useContext } from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsDto from "../../../backend/dtos/settings";
import { SETTINGS_PANEL_SPACING } from "../../constants/settings-layout";
import { Channels } from "../../constants/channels";
import useIpcRendererCallback from "../../hooks/UseIpcRendererCallback";
import SnackbarContext from "../../context/SnackbarContext";
import ConfirmActionButton from "./common/ConfirmActionButton";

const DebugSettingsPanel = () => {
  const formik = useFormikContext<SettingsDto>();
  const snackbarDispatch = useContext(SnackbarContext);
  const disabled = !formik.dirty || formik.isSubmitting;

  const handleClearTokens = () => {
    window.settingsService.clearTokens();
  };

  useIpcRendererCallback(Channels.CLEAR_TOKENS_SUCCESS, null, () => {
    snackbarDispatch({
      type: "show_message",
      payload: "Tokens cleared successfully.",
    });
  });

  const handleDeleteAllGames = () => {
    window.gameService.deleteAll();
  };

  useIpcRendererCallback(Channels.GAMES_DELETE_ALL_SUCCESS, null, () => {
    snackbarDispatch({
      type: "show_message",
      payload: "All games deleted successfully.",
    });
  });

  const handleOpenDatabaseFolder = () => {
    window.settingsService.openDatabaseFolder();
  };

  useIpcRendererCallback<{ error: string }>(Channels.OPEN_DATABASE_FOLDER_ERROR, null, (data) => {
    snackbarDispatch({
      type: "show_message",
      payload: `Could not open database folder: ${data.error}`,
    });
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Stack spacing={SETTINGS_PANEL_SPACING}>
        <Typography variant="h6">Developer</Typography>
        <FormControlLabel
          label="Developer Mode"
          control={
            <Checkbox
              name="developerMode"
              checked={formik.values.developerMode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          }
        />

        {formik.values.developerMode && (
          <Box component="pre" sx={{ overflowX: "auto" }}>
            {JSON.stringify(formik.values, null, 2)}
          </Box>
        )}

        <Typography variant="h6">Storage</Typography>
        <Stack direction="row" spacing={SETTINGS_PANEL_SPACING} sx={{ flexWrap: "wrap" }}>
          <ConfirmActionButton
            label="Clear Tokens"
            icon={DeleteIcon}
            dialogTitle="Clear Tokens"
            dialogBody="This will delete all stored OAuth tokens (IGDB, etc.). Tokens will be automatically regenerated when needed."
            confirmLabel="Clear"
            onConfirm={handleClearTokens}
          />
          <ConfirmActionButton
            label="Delete All Games"
            icon={DeleteIcon}
            dialogTitle="Delete All Games"
            dialogBody="This will permanently delete all games from your library. This action cannot be undone."
            confirmLabel="Delete All"
            onConfirm={handleDeleteAllGames}
          />
          <Button type="button" variant="outlined" startIcon={<FolderIcon />} onClick={handleOpenDatabaseFolder}>
            Open Database Folder
          </Button>
        </Stack>

        <Box>
          <Button type="submit" variant="contained" disabled={disabled}>
            Save
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default DebugSettingsPanel;
