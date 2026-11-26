export type ModelInstallState = "none" | "downloading" | "installed";

export interface DownloadProgress {
  modelId: string;
  downloadedBytes: number;
  totalBytes: number;
}

interface ModelStatusBase {
  id: string;
  name: string;
  sizeBytes: number;
  ramMb: number;
  requiredRamMb: number;
  fitsRam: boolean;
  installState: ModelInstallState;
  selected: boolean;
}

export interface CatalogModelStatus extends ModelStatusBase {
  source: "catalog";
  recommended: boolean;
  downloadProgress: DownloadProgress | null;
}

export interface CustomModelStatus extends ModelStatusBase {
  source: "custom";
  filePath: string;
}

export type ModelStatus = CatalogModelStatus | CustomModelStatus;

export type ModelSource = ModelStatus["source"];

export interface ModelList {
  machineRamMb: number;
  models: ModelStatus[];
}

export interface CustomModelEntry {
  id: string;
  name: string;
  filePath: string;
}

export interface ResolvedModel {
  id: string;
  name: string;
  sizeBytes: number;
  filePath: string;
}

export type DownloadProgressCallback = (modelId: string, downloadedBytes: number, totalBytes: number) => void;
