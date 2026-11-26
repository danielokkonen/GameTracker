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
import type { DownloadProgress, ModelList, ModelSource, ModelStatus } from "../../../backend/types/ai-model";
import { AI_MAX_MODEL_SIZE_BYTES } from "../../constants/ai-models";
import { formatBytes, formatMegabytes } from "../../utils/formatUtils";

const matchSource = <Result,>(
  model: ModelStatus,
  handlers: { [K in ModelSource]: (model: Extract<ModelStatus, { source: K }>) => Result }
): Result => handlers[model.source](model as never);

type ModelChip = { label: string; color: "primary" | "success" };

const RECOMMENDED_CHIP: ModelChip = { label: "Recommended", color: "primary" };

const CUSTOM_CHIP: ModelChip = { label: "Custom", color: "success" };

const modelStatusSummary = (model: ModelStatus): string => {
  if (model.installState === "downloading") {
    return "Downloading";
  }
  if (model.installState === "installed") {
    return model.selected ? "Active (in use)" : "Installed";
  }
  return matchSource(model, {
    catalog: () => "Not downloaded",
    custom: () => "File not found",
  });
};

const modelTypeLabel = (model: ModelStatus): string =>
  matchSource(model, {
    catalog: (catalog) => (catalog.recommended ? "Recommended" : "Catalog model"),
    custom: () => "Custom (from your files)",
  });

const modelTypeChips = (model: ModelStatus): ModelChip[] =>
  matchSource(model, {
    catalog: (catalog) => (catalog.recommended ? [RECOMMENDED_CHIP] : []),
    custom: () => [CUSTOM_CHIP],
  });

const canDownloadModel = (model: ModelStatus): boolean =>
  matchSource(model, {
    catalog: () => true,
    custom: () => false,
  });

const canRemoveModel = (model: ModelStatus): boolean =>
  matchSource(model, {
    catalog: (catalog) => catalog.installState === "installed",
    custom: () => true,
  });

const deleteModelWarning = (model: ModelStatus): string =>
  matchSource(model, {
    catalog: (catalog) => `This frees ${formatBytes(catalog.sizeBytes)} on disk. You can download the model again later.`,
    custom: () =>
      "It will no longer be available in GameTracker, but the file itself will not be deleted from your disk.",
  });

const liveDownloadProgress = (model: ModelStatus, progress: DownloadProgress | null): DownloadProgress | null => {
  if (progress?.modelId === model.id) {
    return progress;
  }
  return matchSource(model, {
    catalog: (catalog) => catalog.downloadProgress,
    custom: () => null,
  });
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 2, alignItems: "baseline" }}>
    <Typography variant="body2">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {value}
    </Typography>
  </Box>
);

const AiModelManager = () => {
  const snackbarDispatch = useContext(SnackbarContext);
  const [modelList, setModelList] = useState<ModelList | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<{ modelId: string; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModel, setDetailsModel] = useState<ModelStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const refreshModels = () => window.aiService.listModels();

  useIpcRendererCallback<ModelList>(Channels.AI_MODEL_LIST_SUCCESS, refreshModels, (data) => {
    setModelList(data);
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
    if (canRemoveModel(model)) {
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
      <Typography variant="body2" sx={{ mb: 2 }}>
        Download a small model to enable on-device library insights. Everything runs locally — nothing leaves your machine.
      </Typography>

      {modelList === null ? (
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
          <Typography variant="body2">
            Detected {formatMegabytes(modelList.machineRamMb)} of system RAM.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => window.aiService.addCustomModel()}>
              Use my own model
            </Button>
            <Typography variant="body2">
              Already have a GGUF file? Add it here (up to {formatBytes(AI_MAX_MODEL_SIZE_BYTES)}).
            </Typography>
          </Box>

          {modelList.models.map((model) => {
            const isDownloading = model.installState === "downloading" || progress?.modelId === model.id;
            const anyDownloading =
              progress !== null || modelList.models.some((entry) => entry.installState === "downloading");
            const isError = error?.modelId === model.id;
            const menuItems = modelMenuItems(model, isDownloading);
            const liveProgress = liveDownloadProgress(model, progress);
            const hasProgress = liveProgress !== null && liveProgress.totalBytes > 0;
            const progressPct =
              hasProgress
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
                      {modelTypeChips(model).map((chip) => (
                        <Chip key={chip.label} label={chip.label} size="small" variant="outlined" color={chip.color} />
                      ))}
                      {model.selected && (
                        <Chip label="Active" size="small" color="success" icon={<CheckIcon />} />
                      )}
                    </Box>
                    {model.source === "custom" && model.installState === "none" ? (
                      <Typography variant="body2">
                        File not found: {model.filePath}
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                        <Typography variant="body2">
                          {formatBytes(model.sizeBytes)} · ~{model.ramMb} MB RAM
                        </Typography>
                        {!model.fitsRam && (
                          <Chip size="small" color="warning" label="May not fit this machine" />
                        )}
                      </Box>
                    )}
                    {!model.fitsRam && (
                      <Typography variant="body2">
                        Needs ~{formatMegabytes(model.requiredRamMb)} of the detected{" "}
                        {formatMegabytes(modelList.machineRamMb)} system RAM — it may run slowly or fail.
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ width: 240, minHeight: 40, flexShrink: 0, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      {isDownloading ? (
                        <Box sx={{ width: 184 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                              {hasProgress
                                ? `${formatBytes(liveProgress.downloadedBytes)} of ${formatBytes(liveProgress.totalBytes)}`
                                : "Downloading…"}
                            </Typography>
                            {hasProgress && (
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {progressPct}%
                              </Typography>
                            )}
                          </Box>
                          <LinearProgress
                            variant={hasProgress ? "determinate" : "indeterminate"}
                            value={progressPct}
                          />
                        </Box>
                      ) : model.installState === "installed" && !model.selected ? (
                        <Button
                          variant="outlined"
                          startIcon={<CheckIcon />}
                          onClick={() => window.aiService.selectModel(model.id)}
                        >
                          Use this model
                        </Button>
                      ) : model.installState === "none" && canDownloadModel(model) ? (
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
            {deleteTarget && deleteModelWarning(deleteTarget)}
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
                <DetailRow label="Type" value={modelTypeLabel(detailsModel)} />
                <DetailRow
                  label="File size"
                  value={detailsModel.sizeBytes > 0 ? formatBytes(detailsModel.sizeBytes) : "—"}
                />
                <DetailRow label="Estimated RAM" value={`~${detailsModel.ramMb} MB`} />
                <DetailRow
                  label="RAM needed"
                  value={`~${formatMegabytes(detailsModel.requiredRamMb)} (with system headroom)`}
                />
                {modelList && <DetailRow label="System RAM" value={formatMegabytes(modelList.machineRamMb)} />}
                <DetailRow
                  label="Compatibility"
                  value={detailsModel.fitsRam ? "Fits this machine" : "May not fit — could run slowly or fail"}
                />
                {detailsModel.source === "custom" && (
                  <DetailRow label="File path" value={detailsModel.filePath} />
                )}
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
