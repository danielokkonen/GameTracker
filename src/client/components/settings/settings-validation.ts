import { bool, object, string } from "yup";

const isFilled = (value: string | undefined): boolean => Boolean(value);

export const settingsValidationSchema = object({
  developerMode: bool().required(),
  darkMode: bool().required(),
  igdbClientId: string(),
  igdbSecret: string(),
  steamId: string(),
  steamApiKey: string(),
})
  .test("igdb-pair", function (values) {
    const hasClientId = isFilled(values.igdbClientId);
    const hasSecret = isFilled(values.igdbSecret);

    if (hasClientId && !hasSecret) {
      return this.createError({
        path: "igdbSecret",
        message: "Secret is required when a client id is set",
      });
    }

    if (hasSecret && !hasClientId) {
      return this.createError({
        path: "igdbClientId",
        message: "Client id is required when a secret is set",
      });
    }

    return true;
  })
  .test("steam-pair", function (values) {
    const hasSteamId = isFilled(values.steamId);
    const hasApiKey = isFilled(values.steamApiKey);

    if (hasSteamId && !hasApiKey) {
      return this.createError({
        path: "steamApiKey",
        message: "API key is required when a SteamID is set",
      });
    }

    if (hasApiKey && !hasSteamId) {
      return this.createError({
        path: "steamId",
        message: "SteamID is required when an API key is set",
      });
    }

    return true;
  });
