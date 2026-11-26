import React from "react";
import { Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import SettingsDto from "../../../backend/dtos/settings";
import { SETTINGS_PANEL_SPACING } from "../../constants/settings-layout";
import SecretTextField from "./common/SecretTextField";
import EncryptionStatusText from "./common/EncryptionStatusText";

const STEAM_API_KEY_URL = "https://steamcommunity.com/dev/apikey";
const IGDB_ACCOUNT_URL = "https://api-docs.igdb.com/#account-creation";

const IntegrationsSettingsPanel = () => {
  const formik = useFormikContext<SettingsDto>();
  const disabled = !formik.dirty || formik.isSubmitting;

  const errorText = (field: keyof SettingsDto) =>
    formik.errors[field] && (formik.touched[field] || formik.submitCount > 0)
      ? String(formik.errors[field])
      : undefined;

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Stack spacing={SETTINGS_PANEL_SPACING}>
        <Box>
          <Typography variant="h6">IGDB</Typography>
          <Typography variant="body2" color="text.secondary">
            Used to fetch cover art, summary, developer, publisher, genres and platforms for games in your library.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Get your credentials at{" "}
          <Link
            href={IGDB_ACCOUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "primary.main" }}
          >
            api-docs.igdb.com/#account-creation
          </Link>
        </Typography>

        <TextField
          name="igdbClientId"
          label="Client Id"
          value={formik.values.igdbClientId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(errorText("igdbClientId"))}
          helperText={errorText("igdbClientId")}
        />
        <SecretTextField
          name="igdbSecret"
          label="Secret"
          value={formik.values.igdbSecret}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(errorText("igdbSecret"))}
          helperText={errorText("igdbSecret")}
        />

        <Box>
          <Typography variant="h6">Steam</Typography>
          <Typography variant="body2" color="text.secondary">
            Used to import your Steam library and playtime on the Import from Steam page.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Get your API key at{" "}
          <Link
            href={STEAM_API_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "primary.main" }}
          >
            steamcommunity.com/dev/apikey
          </Link>
        </Typography>

        <TextField
          name="steamId"
          label="SteamID"
          placeholder="76561198299001234"
          value={formik.values.steamId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(errorText("steamId"))}
          helperText={errorText("steamId")}
        />
        <SecretTextField
          name="steamApiKey"
          label="API Key"
          value={formik.values.steamApiKey}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={Boolean(errorText("steamApiKey"))}
          helperText={errorText("steamApiKey")}
        />

        <EncryptionStatusText />

        <Box>
          <Button type="submit" variant="contained" disabled={disabled}>
            Save
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default IntegrationsSettingsPanel;
