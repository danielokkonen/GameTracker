import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import type { Stats } from "node:fs";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import os from "os";
import { Database } from "../database/database";
import {
  AI_MAX_MODEL_SIZE_BYTES,
  AI_MIN_MODEL_SIZE_BYTES,
  AI_MODELS,
  AI_MODEL_SOURCE_BASE_URL,
  AI_SYSTEM_RAM_HEADROOM_MB,
} from "../constants/ai-models";
import type { AiModel } from "../constants/ai-models";

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

export class DownloadCancelledError extends Error {
  public modelId: string;

  constructor(modelId: string) {
    super("Model download cancelled");
    this.name = "DownloadCancelledError";
    this.modelId = modelId;
  }
}

const PROGRESS_THROTTLE_MS = 250;

export default class ModelManager {
  private modelsDir: string;
  private downloadingIds = new Set<string>();
  private activeDownloads = new Map<string, DownloadProgress>();
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    this.modelsDir = path.join(Database.getDbFolder(), "models");
  }

  listModels = async (): Promise<ModelStatus[]> => {
    const selectedId = await this.getSelectedModelId();
    const machineRamMb = Math.floor(os.totalmem() / (1024 * 1024));
    const catalogRows = await Promise.all(
      AI_MODELS.map(async (entry) => {
        const requiredRamMb = entry.ramMb + AI_SYSTEM_RAM_HEADROOM_MB;
        return {
          id: entry.id,
          name: entry.name,
          sizeBytes: entry.sizeBytes,
          ramMb: entry.ramMb,
          requiredRamMb,
          machineRamMb,
          fitsRam: machineRamMb >= requiredRamMb,
          recommended: entry.recommended,
          installState: await this.getInstallState(entry),
          selected: entry.id === selectedId,
          downloadProgress: this.activeDownloads.get(entry.id) ?? null,
          custom: false,
          filePath: null,
        };
      })
    );
    catalogRows.sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.sizeBytes - b.sizeBytes);

    const customRows = await Promise.all(
      (await this.readCustomModels()).map((entry) => this.toCustomStatus(entry, selectedId, machineRamMb))
    );
    return [...catalogRows, ...customRows];
  };

  addCustomModel = async (filePath: string): Promise<CustomModelEntry> => {
    const resolved = path.resolve(filePath);
    if (!resolved.toLowerCase().endsWith(".gguf")) {
      throw new Error("Only .gguf model files can be added");
    }

    const stats = await this.statOrNull(resolved);
    if (!stats) {
      throw new Error("The selected file no longer exists");
    }
    if (stats.size >= AI_MAX_MODEL_SIZE_BYTES) {
      throw new Error(`Model file is larger than the ${AI_MAX_MODEL_SIZE_BYTES / 1024 ** 3} GiB limit`);
    }
    if (stats.size < AI_MIN_MODEL_SIZE_BYTES) {
      throw new Error("Model file is too small to be a usable GGUF model");
    }
    if (!(await this.hasGgufMagic(resolved))) {
      throw new Error("The selected file is not a valid GGUF model");
    }

    const entries = await this.readCustomModels();
    if (entries.some((entry) => entry.filePath === resolved)) {
      throw new Error("This model file is already in the list");
    }

    const entry: CustomModelEntry = {
      id: this.customIdFor(resolved),
      name: path.basename(resolved, path.extname(resolved)),
      filePath: resolved,
    };
    await this.writeCustomModels([...entries, entry]);
    await this.writeSelected(entry.id);
    return entry;
  };

  getSelectedModelId = async (): Promise<string | null> => {
    const raw = await this.readFileOrNull(this.selectedFilePath());
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as { modelId?: string };
      const modelId = parsed.modelId;
      if (!modelId) {
        return null;
      }
      if (AI_MODELS.some((model) => model.id === modelId)) {
        return modelId;
      }
      const custom = (await this.readCustomModels()).find((entry) => entry.id === modelId);
      if (custom && (await this.statOrNull(custom.filePath)) !== null) {
        return modelId;
      }
    } catch {
      return null;
    }
    return null;
  };

  selectModel = async (modelId: string): Promise<void> => {
    const model = await this.getModelEntry(modelId);
    if ((await this.statOrNull(model.filePath)) === null) {
      throw new Error("Only downloaded models can be selected");
    }
    await this.writeSelected(modelId);
  };

  deleteModel = async (modelId: string): Promise<void> => {
    const customEntries = await this.readCustomModels();
    const custom = customEntries.find((entry) => entry.id === modelId);
    const wasSelected = (await this.getSelectedModelId()) === modelId;

    if (custom) {
      await this.writeCustomModels(customEntries.filter((entry) => entry.id !== modelId));
    } else {
      const entry = this.getModel(modelId);
      if (this.downloadingIds.has(modelId)) {
        throw new Error("Cannot delete a model while it is downloading");
      }
      if ((await this.statOrNull(this.modelFilePath(entry))) === null) {
        throw new Error("Model is not installed");
      }

      await unlink(this.modelFilePath(entry));
      await this.unlinkIfExists(this.partFilePath(entry));
    }

    if (wasSelected) {
      await this.unlinkIfExists(this.selectedFilePath());
    }
  };

  getModelEntry = async (modelId: string): Promise<ResolvedModel> => {
    const catalog = AI_MODELS.find((model) => model.id === modelId);
    if (catalog) {
      return { id: catalog.id, name: catalog.name, sizeBytes: catalog.sizeBytes, filePath: this.modelFilePath(catalog) };
    }

    const custom = (await this.readCustomModels()).find((entry) => entry.id === modelId);
    if (!custom) {
      throw new Error(`Unknown model: ${modelId}`);
    }
    const stats = await this.statOrNull(custom.filePath);
    if (!stats) {
      throw new Error(`The model file for "${custom.name}" was not found on disk`);
    }
    return { id: custom.id, name: custom.name, sizeBytes: stats.size, filePath: custom.filePath };
  };

  getModelFilePath = async (modelId: string): Promise<string> => {
    return (await this.getModelEntry(modelId)).filePath;
  };

  download = async (modelId: string, onProgress?: DownloadProgressCallback): Promise<void> => {
    const entry = this.getModel(modelId);
    if (this.downloadingIds.has(modelId)) {
      throw new Error("Model download already in progress");
    }

    this.downloadingIds.add(modelId);
    const controller = new AbortController();
    this.abortControllers.set(modelId, controller);
    try {
      await mkdir(this.modelsDir, { recursive: true });

      const partPath = this.partFilePath(entry);
      let offset = (await this.statOrNull(partPath))?.size ?? 0;
      if (offset > entry.sizeBytes) {
        await this.unlinkIfExists(partPath);
        offset = 0;
      }

      this.activeDownloads.set(modelId, { modelId, downloadedBytes: offset, totalBytes: entry.sizeBytes });
      const trackProgress: DownloadProgressCallback = (id, downloadedBytes, totalBytes) => {
        this.activeDownloads.set(id, { modelId: id, downloadedBytes, totalBytes });
        onProgress?.(id, downloadedBytes, totalBytes);
      };

      if (offset < entry.sizeBytes) {
        const headers: Record<string, string> = {};
        if (offset > 0) {
          headers["Range"] = `bytes=${offset}-`;
        }
        let response = await fetch(this.sourceUrl(entry), { headers, signal: controller.signal });
        if (response.status === 416) {
          await this.unlinkIfExists(partPath);
          offset = 0;
          response = await fetch(this.sourceUrl(entry), { signal: controller.signal });
        }
        if (!response.ok || !response.body) {
          throw new Error(`Model download failed: ${response.status} ${response.statusText}`);
        }
        if (response.status !== 206) {
          await this.unlinkIfExists(partPath);
          offset = 0;
        }
        await this.streamToFile(response, partPath, entry.sizeBytes, offset, modelId, trackProgress);
      }

      const finalPath = this.modelFilePath(entry);
      await this.verifyChecksum(partPath, entry.sha256);
      await rename(partPath, finalPath);

      if (!(await this.getSelectedModelId())) {
        await this.writeSelected(modelId);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        throw new DownloadCancelledError(modelId);
      }
      throw error;
    } finally {
      this.downloadingIds.delete(modelId);
      this.activeDownloads.delete(modelId);
      this.abortControllers.delete(modelId);
    }
  };

  cancelDownload = (modelId: string): void => {
    this.abortControllers.get(modelId)?.abort();
  };

  private getModel = (modelId: string): AiModel => {
    const entry = AI_MODELS.find((model) => model.id === modelId);
    if (!entry) {
      throw new Error(`Unknown model: ${modelId}`);
    }
    return entry;
  };

  private toCustomStatus = async (
    entry: CustomModelEntry,
    selectedId: string | null,
    machineRamMb: number
  ): Promise<ModelStatus> => {
    const sizeBytes = (await this.statOrNull(entry.filePath))?.size ?? 0;
    const ramMb = Math.ceil(sizeBytes / (1024 * 1024));
    const requiredRamMb = ramMb + AI_SYSTEM_RAM_HEADROOM_MB;
    return {
      id: entry.id,
      name: entry.name,
      sizeBytes,
      ramMb,
      requiredRamMb,
      machineRamMb,
      fitsRam: machineRamMb >= requiredRamMb,
      recommended: false,
      installState: sizeBytes > 0 ? "installed" : "none",
      selected: entry.id === selectedId,
      downloadProgress: null,
      custom: true,
      filePath: entry.filePath,
    };
  };

  private getInstallState = async (entry: AiModel): Promise<ModelInstallState> => {
    if (this.downloadingIds.has(entry.id)) {
      return "downloading";
    }
    const exists = (await this.statOrNull(this.modelFilePath(entry))) !== null;
    return exists ? "installed" : "none";
  };

  private streamToFile = async (
    response: Response,
    partPath: string,
    totalBytes: number,
    startOffset: number,
    modelId: string,
    onProgress?: DownloadProgressCallback
  ): Promise<void> => {
    let received = startOffset;
    let lastEmitMs = 0;

    const counter = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        const now = Date.now();
        if (onProgress && now - lastEmitMs >= PROGRESS_THROTTLE_MS) {
          lastEmitMs = now;
          onProgress(modelId, received, totalBytes);
        }
        this.push(chunk);
        callback();
      },
    });

    const source = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream);
    await pipeline(source, counter, createWriteStream(partPath, { flags: "a" }));

    onProgress?.(modelId, received, totalBytes);
  };

  private verifyChecksum = async (filePath: string, expectedSha256: string): Promise<void> => {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(filePath)) {
      hash.update(chunk);
    }
    if (hash.digest("hex") !== expectedSha256) {
      await this.unlinkIfExists(filePath);
      throw new Error("Model download failed verification: checksum mismatch");
    }
  };

  private readCustomModels = async (): Promise<CustomModelEntry[]> => {
    const raw = await this.readFileOrNull(this.customFilePath());
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as { models?: unknown };
      return Array.isArray(parsed.models) ? (parsed.models as CustomModelEntry[]) : [];
    } catch {
      return [];
    }
  };

  private writeCustomModels = async (entries: CustomModelEntry[]): Promise<void> => {
    await mkdir(this.modelsDir, { recursive: true });
    await writeFile(this.customFilePath(), JSON.stringify({ models: entries }, null, 2));
  };

  private hasGgufMagic = async (filePath: string): Promise<boolean> => {
    const handle = await open(filePath, "r");
    try {
      const buffer = Buffer.alloc(4);
      const { bytesRead } = await handle.read(buffer, 0, 4, 0);
      return bytesRead === 4 && buffer.toString("latin1") === "GGUF";
    } finally {
      await handle.close();
    }
  };

  private customIdFor = (filePath: string): string => {
    const slug = path
      .basename(filePath, path.extname(filePath))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const hash = createHash("sha256").update(filePath).digest("hex").slice(0, 8);
    return `custom-${slug || "model"}-${hash}`;
  };

  private writeSelected = async (modelId: string): Promise<void> => {
    await mkdir(this.modelsDir, { recursive: true });
    await writeFile(this.selectedFilePath(), JSON.stringify({ modelId }, null, 2));
  };

  private sourceUrl = (entry: AiModel): string =>
    `${AI_MODEL_SOURCE_BASE_URL}/${entry.sourceRepo}/resolve/main/${entry.fileName}`;

  private modelFilePath = (entry: AiModel): string => path.join(this.modelsDir, entry.fileName);

  private partFilePath = (entry: AiModel): string => `${this.modelFilePath(entry)}.part`;

  private selectedFilePath = (): string => path.join(this.modelsDir, "selected.json");

  private customFilePath = (): string => path.join(this.modelsDir, "custom.json");

  private statOrNull = async (filePath: string): Promise<Stats | null> => {
    try {
      return await stat(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
      return null;
    }
  };

  private readFileOrNull = async (filePath: string): Promise<string | null> => {
    try {
      return await readFile(filePath, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
      return null;
    }
  };

  private unlinkIfExists = async (filePath: string): Promise<void> => {
    try {
      await unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  };
}
