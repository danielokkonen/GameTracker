export const SETTINGS_TAB_QUERY_KEY = "tab";

export const SETTINGS_TABS = {
  general: "general",
  integrations: "integrations",
  ai: "ai",
  debug: "debug",
} as const;

export type SettingsTab = (typeof SETTINGS_TABS)[keyof typeof SETTINGS_TABS];

export const DEFAULT_SETTINGS_TAB: SettingsTab = SETTINGS_TABS.general;

export const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  general: "General",
  integrations: "Integrations",
  ai: "AI Features",
  debug: "Debug",
};

export const SETTINGS_TAB_ORDER: SettingsTab[] = [
  SETTINGS_TABS.general,
  SETTINGS_TABS.integrations,
  SETTINGS_TABS.ai,
  SETTINGS_TABS.debug,
];

const TAB_VALUES: string[] = Object.values(SETTINGS_TABS);

export const resolveSettingsTab = (value: string | null): SettingsTab =>
  value !== null && TAB_VALUES.includes(value)
    ? (value as SettingsTab)
    : DEFAULT_SETTINGS_TAB;
