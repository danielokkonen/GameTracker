import React, { useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import SettingsDto from "../../../backend/dtos/settings";
import LockIcon from "@mui/icons-material/Lock";

interface ISettingsFormProps {
  value: SettingsDto | null;
  onSubmit: (value: SettingsDto) => void;
}

const SettingsForm = ({ value, onSubmit }: ISettingsFormProps) => {
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
        <Button type="submit" variant="contained" disabled={disabled}>
          Save
        </Button>
      </Box>
      {formik.values.developerMode && (
        <Box component="pre" sx={{}}>
          {JSON.stringify(formik, null, 2)}
        </Box>
      )}
    </>
  );
};

export default SettingsForm;
