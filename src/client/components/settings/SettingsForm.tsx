import React, { useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useFormik } from "formik";
import SettingsDto from "../../../backend/dtos/settings";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";

interface ISettingsFormProps {
  value: SettingsDto | null;
  onSubmit: (value: SettingsDto) => void;
  onClearTokens: () => void;
}

const SettingsForm = ({ value, onSubmit, onClearTokens }: ISettingsFormProps) => {
  const [showDialog, setShowDialog] = React.useState(false);
  const [debugExpanded, setDebugExpanded] = React.useState(false);
  const handleSubmit = (values: SettingsDto) => {
    onSubmit(values);
  };

  const shouldUseDarkMode = useMemo(
    () => window.electronApi.theme.darkMode(),
    []
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: value ?? new SettingsDto(Boolean(shouldUseDarkMode)),
    onSubmit: handleSubmit,
  });

  const disabled = !formik.dirty || formik.isSubmitting;

  return (
    <>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Stack spacing={2} mb={2}>
          <Typography variant="h6">General</Typography>
          <FormControlLabel
            label="Dark Mode"
            control={
              <Checkbox
                name="darkMode"
                checked={formik.values.darkMode}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
            }
          />
          <Typography variant="h6">IGDB</Typography>
          <TextField
            name="igdbClientId"
            label="Client Id"
            value={formik.values.igdbClientId}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <TextField
            name="igdbSecret"
            label="Secret"
            type="password"
            value={formik.values.igdbSecret}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Credentials are encrypted at rest using your OS keychain">
                    <LockIcon fontSize="small" color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <Stack spacing={2} sx={{ mt: 4, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Debug</Typography>
            <Button
              size="small"
              onClick={() => setDebugExpanded(!debugExpanded)}
            >
              {debugExpanded ? "Collapse" : "Expand"}
            </Button>
          </Stack>
          <Collapse in={debugExpanded}>
            <Stack>
              <FormControlLabel
                label="Developer Mode"
                control={
                  <Checkbox
                    name="developerMode"
                    checked={formik.values.developerMode}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  />
                }
              />
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDialog(true)}
              >
                Clear Tokens
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </Box>
      <Button type="submit" variant="contained" disabled={disabled}>
        Save
      </Button>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Clear Tokens</DialogTitle>
        <DialogContent>
          <Typography>
            This will delete all stored OAuth tokens (IGDB, etc.).
            Tokens will be automatically regenerated when needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setShowDialog(false);
              onClearTokens();
            }}
            color="error"
            variant="contained"
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
      {formik.values.developerMode && (
        <Box component="pre" sx={{}}>
          {JSON.stringify(formik, null, 2)}
        </Box>
      )}
    </>
  );
};

export default SettingsForm;
