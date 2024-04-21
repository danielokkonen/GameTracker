import { Box, Checkbox, FormControlLabel } from "@mui/material";
import React, { useContext } from "react";
import SettingsContext from "../../../client/context/SettingsContext";

const SettingsForm = () => {
  const { state, dispatch } = useContext(SettingsContext);

  return (
    <Box component="form">
      <FormControlLabel
        label="Developer Mode"
        control={
          <Checkbox
            checked={state.developerMode}
            onChange={() =>
              dispatch({
                type: "set_value",
                payload: {
                  name: "developerMode",
                  value: !state.developerMode,
                },
              })
            }
          />
        }
      />
    </Box>
  );
};

export default SettingsForm;
