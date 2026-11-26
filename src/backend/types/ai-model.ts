export type ModelInstallState = "none" | "downloading" | "installed";

export interface ModelStatus {
  id: string;
  name: string;
  sizeBytes: number;
  ramMb: number;
  requiredRamMb: number;
  machineRamMb: number;
  fitsRam: boolean;
  recommended: boolean;
  installState: ModelInstallState;
  selected: boolean;
  downloadProgress: DownloadProgress | null;
  custom: boolean;
  filePath: string | null;
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

export interface DownloadProgress {
  modelId: string;
  downloadedBytes: number;
  totalBytes: number;
}

export type DownloadProgressCallback = (modelId: string, downloadedBytes: number, totalBytes: number) => void;
