import React, { useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import SettingsDto from "../../../backend/dtos/settings";

interface ISettingsFormProps {
  value: SettingsDto;
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
    initialValues: value ?? new SettingsDto(shouldUseDarkMode),
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
            value={formik.values.igdbSecret}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
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
