import React, { useContext, useRef, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { Formik } from "formik";
import type { FormikHelpers } from "formik";
import { useSearchParams } from "react-router-dom";
import SettingsDto from "../../backend/dtos/settings";
import { Channels } from "../constants/channels";
import useIpcRendererCallback from "../hooks/UseIpcRendererCallback";
import SettingsContext from "../context/SettingsContext";
import Spinner from "../components/common/Spinner";
import { settingsValidationSchema } from "../components/settings/settings-validation";
import GeneralSettingsPanel from "../components/settings/GeneralSettingsPanel";
import IntegrationsSettingsPanel from "../components/settings/IntegrationsSettingsPanel";
import AiFeaturesPanel from "../components/settings/AiFeaturesPanel";
import DebugSettingsPanel from "../components/settings/DebugSettingsPanel";
import {
  SETTINGS_TAB_QUERY_KEY,
  SETTINGS_TABS,
  SETTINGS_TAB_LABELS,
  SETTINGS_TAB_ORDER,
  SettingsTab,
  resolveSettingsTab,
} from "../constants/settings-tabs";
import { SETTINGS_PANEL_SPACING } from "../constants/settings-layout";

const PANELS: Record<SettingsTab, React.ReactElement> = {
  [SETTINGS_TABS.general]: <GeneralSettingsPanel />,
  [SETTINGS_TABS.integrations]: <IntegrationsSettingsPanel />,
  [SETTINGS_TABS.ai]: <AiFeaturesPanel />,
  [SETTINGS_TABS.debug]: <DebugSettingsPanel />,
};

interface TabPanelProps {
  tab: SettingsTab;
  activeTab: SettingsTab;
  children: React.ReactNode;
}

const TabPanel = ({ tab, activeTab, children }: TabPanelProps) =>
  tab === activeTab ? (
    <Box
      role="tabpanel"
      sx={{ pt: SETTINGS_PANEL_SPACING, pb: SETTINGS_PANEL_SPACING }}
    >
      {children}
    </Box>
  ) : null;

const createDefaultSettings = async (): Promise<SettingsDto> => {
  const darkMode = await window.electronApi.theme.darkMode();
  return new SettingsDto(darkMode);
};

const Settings = () => {
  const { dispatch } = useContext(SettingsContext);
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsApplied = useRef(false);

  const activeTab = resolveSettingsTab(searchParams.get(SETTINGS_TAB_QUERY_KEY));

  useIpcRendererCallback<SettingsDto | null>(
    Channels.SETTINGS_GET_SUCCESS,
    () => window.settingsService.get(),
    (data) => {
      if (data) {
        setSettings(data);
        return;
      }
      if (defaultsApplied.current) {
        return;
      }
      defaultsApplied.current = true;
      void createDefaultSettings()
        .then(setSettings)
        .catch(() => setSettings(new SettingsDto(false)));
    }
  );

  const handleTabChange = (_event: React.SyntheticEvent, tab: SettingsTab) => {
    setSearchParams({ [SETTINGS_TAB_QUERY_KEY]: tab }, { replace: true });
  };

  const onSubmit = (values: SettingsDto, helpers: FormikHelpers<SettingsDto>) => {
    window.settingsService.upsert(values);
    dispatch({ type: "init", payload: values });
    setSettings(values);
    helpers.setSubmitting(false);
  };

  if (settings === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Formik<SettingsDto>
      enableReinitialize
      validationSchema={settingsValidationSchema}
      initialValues={settings}
      onSubmit={onSubmit}
    >
      <Box>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {SETTINGS_TAB_ORDER.map((tab) => (
            <Tab key={tab} value={tab} label={SETTINGS_TAB_LABELS[tab]} />
          ))}
        </Tabs>

        {SETTINGS_TAB_ORDER.map((tab) => (
          <TabPanel key={tab} tab={tab} activeTab={activeTab}>
            {PANELS[tab]}
          </TabPanel>
        ))}
      </Box>
    </Formik>
  );
};

export default Settings;
