import React, { useContext, useState } from "react";
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
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuButton, { MenuButtonItem } from "../common/MenuButton";
import Spinner from "../common/Spinner";
import { Channels } from "../../constants/channels";
import useIpcRendererCallback from "../../hooks/UseIpcRendererCallback";
import SnackbarContext from "../../context/SnackbarContext";
import type { ModelStatus, DownloadProgress } from "../../../backend/services/model-manager";
import { AI_MAX_MODEL_SIZE_BYTES } from "../../constants/ai-models";
import { formatBytes } from "../../utils/formatUtils";

const modelStatusSummary = (model: ModelStatus): string => {
  if (model.installState === "downloading") {
    return "Downloading";
  }
  if (model.installState === "installed") {
    return model.selected ? "Active (in use)" : "Installed";
  }
  return model.custom ? "File not found" : "Not downloaded";
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 2, alignItems: "baseline" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {value}
    </Typography>
  </Box>
);

const AiModelManager = () => {
  const snackbarDispatch = useContext(SnackbarContext);
  const [models, setModels] = useState<ModelStatus[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<{ modelId: string; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModel, setDetailsModel] = useState<ModelStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const refreshModels = () => window.aiService.listModels();

  useIpcRendererCallback<ModelStatus[]>(Channels.AI_MODEL_LIST_SUCCESS, refreshModels, (data) => {
    setModels(data);
    setListError(null);
  });

  useIpcRendererCallback<{ error: string }>(Channels.AI_MODEL_LIST_ERROR, null, (data) => {
    setListError(data.error);
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

  const handleDownloadCancelled = () => {
    setProgress(null);
    refreshModels();
  };

  useIpcRendererCallback(Channels.AI_MODEL_DOWNLOAD_CANCELLED, null, handleDownloadCancelled);

  const startDownload = (modelId: string) => {
    setError(null);
    window.aiService.download(modelId);
    refreshModels();
  };

  const cancelDownload = (modelId: string) => {
    window.aiService.cancelDownload(modelId);
  };

  const openDeleteDialog = (model: ModelStatus) => {
    setDeleteTarget(model);
    setDeleteDialogOpen(true);
  };

  const openDetails = (model: ModelStatus) => {
    setDetailsModel(model);
    setDetailsOpen(true);
  };

  const closeDetails = () => setDetailsOpen(false);

  const modelMenuItems = (model: ModelStatus, isDownloading: boolean): MenuButtonItem[] => {
    const items: MenuButtonItem[] = [{ name: "Model details", onClick: () => openDetails(model) }];

    if (isDownloading) {
      return [...items, { name: "Cancel download", onClick: () => cancelDownload(model.id) }];
    }
    if (model.installState === "installed") {
      items.push({ name: "Show file location", onClick: () => window.aiService.revealModelFile(model.id) });
    }
    if (model.custom || model.installState === "installed") {
      items.push({ name: "Delete", onClick: () => openDeleteDialog(model), color: "error", divider: true });
    }
    return items;
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

  const handleAddSuccess = () => {
    snackbarDispatch({ type: "show_message", payload: "Model added" });
    refreshModels();
  };

  useIpcRendererCallback(Channels.AI_MODEL_ADD_SUCCESS, null, handleAddSuccess);

  const handleAddError = (data: { error: string }) => {
    snackbarDispatch({ type: "show_message", payload: `Could not add model: ${data.error}` });
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_MODEL_ADD_ERROR, null, handleAddError);

  const handleRevealError = (data: { error: string }) => {
    snackbarDispatch({ type: "show_message", payload: `Could not show model location: ${data.error}` });
  };

  useIpcRendererCallback<{ error: string }>(Channels.AI_MODEL_REVEAL_ERROR, null, handleRevealError);

  return (
    <Box>
      <Typography variant="h6">AI Insights</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Download a small model to enable on-device library insights. Everything runs locally — nothing leaves your machine.
      </Typography>

      {models === null ? (
        listError ? (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <Button color="inherit" size="small" onClick={refreshModels}>
                Retry
              </Button>
            }
          >
            {listError}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <Spinner />
          </Box>
        )
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
            const menuItems = modelMenuItems(model, isDownloading);
            const liveProgress = progress?.modelId === model.id ? progress : model.downloadProgress;
            const hasProgress = Boolean(liveProgress && liveProgress.totalBytes > 0);
            const progressPct =
              liveProgress && liveProgress.totalBytes > 0
                ? Math.round((liveProgress.downloadedBytes / liveProgress.totalBytes) * 100)
                : 0;

            return (
              <Box
                key={model.id}
                sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="body1">{model.name}</Typography>
                      {model.recommended && (
                        <Chip label="Recommended" size="small" variant="outlined" color="primary" />
                      )}
                      {model.custom && (
                        <Chip label="Custom" size="small" variant="outlined" color="success" />
                      )}
                      {model.selected && (
                        <Chip label="Active" size="small" color="success" icon={<CheckIcon />} />
                      )}
                    </Box>
                    {model.custom && model.installState === "none" ? (
                      <Typography variant="body2" color="text.secondary">
                        File not found: {model.filePath}
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatBytes(model.sizeBytes)} · ~{model.ramMb} MB RAM
                        </Typography>
                        {!model.fitsRam && (
                          <Chip size="small" color="warning" label="May not fit this machine" />
                        )}
                      </Box>
                    )}
                    {!model.fitsRam && (
                      <Typography variant="body2" color="warning.main">
                        Needs ~{formatBytes(model.requiredRamMb * 1024 * 1024)} of the detected{" "}
                        {formatBytes(model.machineRamMb * 1024 * 1024)} system RAM — it may run slowly or fail.
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ width: 240, minHeight: 40, flexShrink: 0, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      {isDownloading ? (
                        <Box sx={{ width: 184 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Downloading…</Typography>
                            {hasProgress && (
                              <Typography variant="body2" color="text.secondary">{progressPct}%</Typography>
                            )}
                          </Box>
                          <LinearProgress
                            variant={hasProgress ? "determinate" : "indeterminate"}
                            value={progressPct}
                          />
                          {hasProgress && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              {formatBytes(liveProgress?.downloadedBytes ?? 0)} of{" "}
                              {formatBytes(liveProgress?.totalBytes || model.sizeBytes)}
                            </Typography>
                          )}
                        </Box>
                      ) : model.installState === "installed" && !model.selected ? (
                        <Button
                          variant="outlined"
                          startIcon={<CheckIcon />}
                          onClick={() => window.aiService.selectModel(model.id)}
                        >
                          Use this model
                        </Button>
                      ) : model.installState === "none" && !model.custom ? (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          disabled={anyDownloading}
                          onClick={() => startDownload(model.id)}
                        >
                          {isError ? "Re-download" : "Download"}
                        </Button>
                      ) : null}
                    </Box>
                    <Box sx={{ width: 48, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <MenuButton
                        component={IconButton}
                        icon={MoreVertIcon}
                        disabled={menuItems.length === 0}
                        items={menuItems}
                      />
                    </Box>
                  </Box>
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
        <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.custom
              ? "It will no longer be available in GameTracker, but the file itself will not be deleted from your disk."
              : `This frees ${deleteTarget ? formatBytes(deleteTarget.sizeBytes) : ""} on disk. You can download the model again later.`}
          </DialogContentText>
          {deleteTarget?.selected && (
            <DialogContentText sx={{ mt: 1 }}>
              This is your active model — no model will be active until you select one.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteTarget && window.aiService.deleteModel(deleteTarget.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="sm" fullWidth>
        {detailsModel && (
          <>
            <DialogTitle>{detailsModel.name}</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <DetailRow label="Status" value={modelStatusSummary(detailsModel)} />
                <DetailRow
                  label="Type"
                  value={
                    detailsModel.custom
                      ? "Custom (from your files)"
                      : detailsModel.recommended
                        ? "Recommended"
                        : "Catalog model"
                  }
                />
                <DetailRow
                  label="File size"
                  value={detailsModel.sizeBytes > 0 ? formatBytes(detailsModel.sizeBytes) : "—"}
                />
                <DetailRow label="Estimated RAM" value={`~${detailsModel.ramMb} MB`} />
                <DetailRow
                  label="RAM needed"
                  value={`~${formatBytes(detailsModel.requiredRamMb * 1024 * 1024)} (with system headroom)`}
                />
                <DetailRow
                  label="System RAM"
                  value={formatBytes(detailsModel.machineRamMb * 1024 * 1024)}
                />
                <DetailRow
                  label="Compatibility"
                  value={detailsModel.fitsRam ? "Fits this machine" : "May not fit — could run slowly or fail"}
                />
                {detailsModel.filePath && <DetailRow label="File path" value={detailsModel.filePath} />}
              </Stack>
            </DialogContent>
            <DialogActions>
              {detailsModel.installState === "installed" && (
                <Button onClick={() => window.aiService.revealModelFile(detailsModel.id)}>
                  Show file location
                </Button>
              )}
              <Button onClick={closeDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AiModelManager;
