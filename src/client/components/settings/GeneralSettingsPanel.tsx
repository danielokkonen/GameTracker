import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import SettingsDto from "../../../backend/dtos/settings";
import { SETTINGS_PANEL_SPACING } from "../../constants/settings-layout";

const GeneralSettingsPanel = () => {
  const formik = useFormikContext<SettingsDto>();
  const disabled = !formik.dirty || formik.isSubmitting;

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Stack spacing={SETTINGS_PANEL_SPACING}>
        <Typography variant="h6">Appearance</Typography>
        <FormControlLabel
          label="Dark Mode"
          control={
            <Checkbox
              name="darkMode"
              checked={formik.values.darkMode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          }
        />
        <Box>
          <Button type="submit" variant="contained" disabled={disabled}>
            Save
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default GeneralSettingsPanel;
