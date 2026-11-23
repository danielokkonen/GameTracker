import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import Spinner from "../common/Spinner";
import { Channels } from "../../constants/channels";
import useIpcRendererCallback from "../../hooks/UseIpcRendererCallback";
import SnackbarContext from "../../context/SnackbarContext";
import { ModelStatus, DownloadProgress } from "../../../backend/services/model-manager";
import { AI_MAX_MODEL_SIZE_BYTES } from "../../../backend/constants/ai-models";
import { formatBytes } from "../../utils/formatUtils";

const AiModelManager = () => {
  const location = useLocation();
  const snackbarDispatch = useContext(SnackbarContext);
  const [models, setModels] = useState<ModelStatus[] | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<{ modelId: string; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll the section into view when navigated here from the dashboard's "Set up AI Insights" button.
  useEffect(() => {
    if (location.state?.focusAiSection) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const refreshModels = () => window.aiService.listModels();

  useIpcRendererCallback<ModelStatus[]>(Channels.AI_MODEL_LIST_SUCCESS, refreshModels, (data) => {
    setModels(data);
  });

  useIpcRendererCallback<DownloadProgress>(Channels.AI_MODEL_DOWNLOAD_PROGRESS, null, (p) => {
    setProgress(p);
  });

  const handleDownloadSuccess = () => {
    setProgress(null);
    refreshModels();
  };

  useIpcRendererCallback(Channels.AI_MODEL_DOWNLOAD_SUCCESS, null, handleDownloadSuccess);

  const handleDownloadError = (data: { modelId: string; error: string }) => {
    setError({ modelId: data.modelId, message: data.error });
    setProgress(null);
    refreshModels();
  };

  useIpcRendererCallback<{ modelId: string; error: string }>(
    Channels.AI_MODEL_DOWNLOAD_ERROR,
    null,
    handleDownloadError
  );

  const startDownload = (modelId: string) => {
    setError(null);
    window.aiService.download(modelId);
    refreshModels();
  };

  const handleSelectSuccess = () => refreshModels();

  useIpcRendererCallback(Channels.AI_MODEL_SELECT_SUCCESS, null, handleSelectSuccess);

  const handleSelectError = (data: { error: string }) => {
    snackbarDispatch({ type: "show_message", payload: `Could not select model: ${data.error}` });
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_MODEL_SELECT_ERROR, null, handleSelectError);

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    refreshModels();
  };

  useIpcRendererCallback(Channels.AI_MODEL_DELETE_SUCCESS, null, handleDeleteSuccess);

  const handleDeleteError = (data: { modelId: string; error: string }) => {
    setDeleteDialogOpen(false);
    snackbarDispatch({ type: "show_message", payload: `Could not delete model: ${data.error}` });
    refreshModels();
  };

  useIpcRendererCallback<{ modelId: string; error: string }>(
    Channels.AI_MODEL_DELETE_ERROR,
    null,
    handleDeleteError
  );

  const handleAddSuccess = () => refreshModels();

  useIpcRendererCallback(Channels.AI_MODEL_ADD_SUCCESS, null, handleAddSuccess);

  const handleAddError = (data: { error: string }) => {
    snackbarDispatch({ type: "show_message", payload: `Could not add model: ${data.error}` });
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_MODEL_ADD_ERROR, null, handleAddError);

  return (
    <Box ref={sectionRef} sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6">AI Insights</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Download a small model to enable on-device library insights. Everything runs locally — nothing leaves your machine.
      </Typography>

      {models === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <Spinner />
        </Box>
      ) : (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Detected {formatBytes(models[0].machineRamMb * 1024 * 1024)} of system RAM.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => window.aiService.addCustomModel()}>
              Use my own model
            </Button>
            <Typography variant="body2" color="text.secondary">
              Already have a GGUF file? Add it here (up to {formatBytes(AI_MAX_MODEL_SIZE_BYTES)}).
            </Typography>
          </Box>

          {models.map((model) => {
            const isDownloading = model.installState === "downloading" || progress?.modelId === model.id;
            const anyDownloading =
              progress !== null || models.some((entry) => entry.installState === "downloading");
            const isError = error?.modelId === model.id;
            const liveProgress = progress?.modelId === model.id ? progress : model.downloadProgress;
            const progressPct =
              liveProgress && liveProgress.totalBytes > 0
                ? Math.round((liveProgress.downloadedBytes / liveProgress.totalBytes) * 100)
                : 0;

            return (
              <Box
                key={model.id}
                sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography>
                      {model.name}{" "}
                      {model.recommended && (
                        <Chip label="Recommended" size="small" variant="outlined" color="primary" />
                      )}
                      {model.custom && (
                        <Chip label="Custom" size="small" variant="outlined" color="success" />
                      )}
                    </Typography>
                    {model.custom && model.installState === "none" ? (
                      <Typography variant="body2" color="text.secondary">
                        File not found: {model.filePath}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {formatBytes(model.sizeBytes)} · ~{model.ramMb} MB RAM
                        {!model.fitsRam && (
                          <Chip
                            size="small"
                            color="warning"
                            label="May not fit this machine"
                            sx={{ ml: 1, verticalAlign: "middle" }}
                          />
                        )}
                      </Typography>
                    )}
                    {!model.fitsRam && (
                      <Typography variant="body2" color="warning.main">
                        Needs ~{formatBytes(model.requiredRamMb * 1024 * 1024)} of the detected{" "}
                        {formatBytes(model.machineRamMb * 1024 * 1024)} system RAM — it may run slowly or fail.
                      </Typography>
                    )}
                  </Box>

                  {isDownloading ? (
                    <Box sx={{ width: 200 }}>
                      <LinearProgress variant="determinate" value={progressPct} />
                      <Typography variant="body2" color="text.secondary">
                        {progressPct}%
                      </Typography>
                    </Box>
                  ) : model.installState === "installed" || model.custom ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {model.installState === "installed" && (
                        <Button
                          variant={model.selected ? "contained" : "outlined"}
                          startIcon={<CheckIcon />}
                          disabled={model.selected}
                          onClick={() => window.aiService.selectModel(model.id)}
                        >
                          {model.selected ? "In use" : "Use this model"}
                        </Button>
                      )}
                      <Tooltip title={model.custom ? "Remove model" : "Delete model"}>
                        <IconButton size="small" onClick={() => { setDeleteTarget(model); setDeleteDialogOpen(true); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={anyDownloading}
                      onClick={() => startDownload(model.id)}
                    >
                      {isError ? "Re-download" : "Download"}
                    </Button>
                  )}
                </Box>

                {isError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {error.message}
                  </Alert>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      <Dialog open={deleteDialogOpen && deleteTarget !== null} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          {deleteTarget?.custom ? "Remove" : "Delete"} {deleteTarget?.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.custom
              ? "It will no longer be available in GameTracker. The file itself stays on your disk."
              : `This frees ${deleteTarget ? formatBytes(deleteTarget.sizeBytes) : ""} on disk. You can download the model again later.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color={deleteTarget?.custom ? "primary" : "error"}
            variant="contained"
            onClick={() => deleteTarget && window.aiService.deleteModel(deleteTarget.id)}
          >
            {deleteTarget?.custom ? "Remove" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AiModelManager;
