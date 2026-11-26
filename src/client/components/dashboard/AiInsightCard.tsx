import React, { useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsIcon from "@mui/icons-material/Settings";
import { Channels } from "../../constants/channels";
import { formatInsightLines } from "../../utils/formatUtils";
import useIpcRendererCallback from "../../hooks/UseIpcRendererCallback";
import type { AiStatus } from "../../../backend/types/ai-insight";
import { useNavigate } from "react-router-dom";
import { SETTINGS_TAB_QUERY_KEY, SETTINGS_TABS } from "../../constants/settings-tabs";

const AiInsightCard = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const startGeneration = (force: boolean) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setError(null);
    window.aiService.generateInsight(force);
  };

  const handleStatusSuccess = (data: AiStatus) => {
    setStatus(data);
    setError(null);
    if (data.insight) {
      setInsightText(data.insight.text);
    }
    if (!generatingRef.current && data.generating) {
      generatingRef.current = true;
      setGenerating(true);
    }
  };

  useIpcRendererCallback<AiStatus>(
    Channels.AI_STATUS_SUCCESS,
    () => window.aiService.status(),
    handleStatusSuccess
  );

  const handleStatusError = (data: { error: string }) => {
    setError(data.error);
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_STATUS_ERROR, null, handleStatusError);

  const handleAnalyze = () => {
    startGeneration(insightText !== null);
  };

  const handleGenerateSuccess = (text: string) => {
    generatingRef.current = false;
    setInsightText(text);
    setGenerating(false);
  };

  useIpcRendererCallback<string>(Channels.AI_INSIGHT_GENERATE_SUCCESS, null, handleGenerateSuccess);

  const handleDismissSuccess = () => {
    setInsightText(null);
    setError(null);
  };

  useIpcRendererCallback<null>(Channels.AI_INSIGHT_DISMISS_SUCCESS, null, handleDismissSuccess);

  const handleGenerateError = (data: { error: string }) => {
    generatingRef.current = false;
    setError(data.error);
    setGenerating(false);
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_INSIGHT_GENERATE_ERROR, null, handleGenerateError);

  if (!status) {
    if (!error) return null;
    return (
      <Box sx={{ mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.aiService.status()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const noModel = !status.modelInstalled;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        {noModel ? (
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate(`/settings?${SETTINGS_TAB_QUERY_KEY}=${SETTINGS_TABS.ai}`)}
          >
            Set up AI Insights
          </Button>
        ) : (
          <Button
            variant="outlined"
            disabled={generating}
            startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleAnalyze}
          >
            {generating ? "Analyzing…" : insightText !== null ? "Analyze again" : "Analyze library"}
          </Button>
        )}
      </Box>

      {noModel && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Get a short analysis of your library, generated entirely on this device. No cloud, no API keys.
        </Typography>
      )}

      {insightText !== null && (
        <Alert
          severity="info"
          icon={<AutoAwesomeIcon />}
          onClose={() => window.aiService.dismissInsight()}
          sx={{ mt: 2, "& .MuiAlert-message": { flex: "1 1 auto" } }}
        >
          {generating ? (
            <>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="95%" />
              <Skeleton variant="text" width="55%" />
            </>
          ) : (
            <Stack spacing={1}>
              {formatInsightLines(insightText).map((line, index) => (
                <Typography key={index}>{line}</Typography>
              ))}
            </Stack>
          )}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => startGeneration(true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default AiInsightCard;
