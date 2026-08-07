import React, { useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import SettingsDto from "../../../backend/dtos/settings";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface ISettingsFormProps {
  value: SettingsDto | null;
  onSubmit: (value: SettingsDto) => void;
  onClearTokens: () => void;
}

const SettingsForm = ({ value, onSubmit, onClearTokens }: ISettingsFormProps) => {
  const [showDialog, setShowDialog] = React.useState(false);
  const [debugExpanded, setDebugExpanded] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);
  const handleSubmit = (values: SettingsDto) => {
    onSubmit(values);
    formik.setSubmitting(false);
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
            type={showSecret ? "text" : "password"}
            value={formik.values.igdbSecret}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Credentials are encrypted at rest using your OS keychain">
                    <LockIcon fontSize="small" color="action" />
                  </Tooltip>
                  <IconButton
                    onClick={() => setShowSecret(!showSecret)}
                    edge="end"
                  >
                    {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
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
        <Button type="submit" variant="contained" disabled={disabled}>
          Save
        </Button>
      </Box>
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
