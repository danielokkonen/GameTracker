import type { Llama, LlamaContext, LlamaContextSequence, LlamaModel } from "node-llama-cpp";
import { AI_MAX_MODEL_SIZE_BYTES } from "../constants/ai-models";
import {
  AI_CONTEXT_SIZE,
  AI_GENERATION_TIMEOUT_MS,
  AI_IDLE_UNLOAD_MS,
  AI_MAX_OUTPUT_TOKENS,
  AI_TEMPERATURE,
} from "../constants/ai-engine";
import ModelManager, { type ResolvedModel } from "./model-manager";

export interface GenerationParams {
  systemPrompt: string;
  prompt: string;
}

export default class InferenceEngine {
  private modelManager = new ModelManager();
  private loadedModelId: string | null = null;
  private llama: Llama | null = null;
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private sequence: LlamaContextSequence | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private generating = false;

  isGenerating = (): boolean => this.generating;

  unloadIfLoaded = async (modelId: string): Promise<void> => {
    if (this.loadedModelId === modelId) {
      await this.unload();
    }
  };

  generate = async (modelId: string, params: GenerationParams): Promise<string> => {
    if (this.generating) {
      throw new Error("Insight generation already in progress");
    }

    const entry = await this.getModelEntry(modelId);
    this.generating = true;
    try {
      const { model, sequence } = await this.ensureLoaded(entry);
      return await this.runGeneration(model, sequence, params);
    } finally {
      this.generating = false;
    }
  };

  private runGeneration = async (
    model: LlamaModel,
    sequence: LlamaContextSequence,
    params: GenerationParams
  ): Promise<string> => {
    await sequence.clearHistory();
    const nlc = await import("node-llama-cpp");
    // suppress reasoning blocks so thinking models (e.g. Qwen3) spend the output budget on the answer
    const chatWrapper = nlc.resolveChatWrapper(model, {
      customWrapperSettings: {
        qwen: { thoughts: "discourage" },
        jinjaTemplate: { additionalRenderParameters: { enable_thinking: false } },
      },
    });
    const session = new nlc.LlamaChatSession({
      contextSequence: sequence,
      chatWrapper,
      systemPrompt: params.systemPrompt,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT_MS);
    try {
      const result = await session.promptWithMeta(params.prompt, {
        signal: controller.signal,
        stopOnAbortSignal: true,
        temperature: AI_TEMPERATURE,
        maxTokens: AI_MAX_OUTPUT_TOKENS,
      });
      if (controller.signal.aborted) {
        throw new Error("Insight generation timed out");
      }
      return result.responseText;
    } finally {
      clearTimeout(timer);
      session.dispose();
      this.scheduleIdleUnload();
    }
  };

  private getModelEntry = async (modelId: string): Promise<ResolvedModel> => {
    return this.modelManager.getModelEntry(modelId);
  };

  private assertLoadable = (entry: ResolvedModel): void => {
    if (entry.sizeBytes >= AI_MAX_MODEL_SIZE_BYTES) {
      throw new Error(`Model "${entry.name}" exceeds the ${AI_MAX_MODEL_SIZE_BYTES / 1024 ** 3} GiB limit and cannot be loaded`);
    }
  };

  private ensureLoaded = async (entry: ResolvedModel): Promise<{ model: LlamaModel; sequence: LlamaContextSequence }> => {
    if (this.loadedModelId === entry.id && this.sequence && this.model) {
      return { model: this.model, sequence: this.sequence };
    }

    this.assertLoadable(entry);
    await this.unload();

    const nlc = await import("node-llama-cpp");
    const llama = await nlc.getLlama({ gpu: false });
    const model = await llama.loadModel({ modelPath: entry.filePath });
    const context = await model.createContext({ contextSize: AI_CONTEXT_SIZE });
    const sequence = context.getSequence();

    this.llama = llama;
    this.model = model;
    this.context = context;
    this.sequence = sequence;
    this.loadedModelId = entry.id;
    return { model, sequence };
  };

  private unload = async (): Promise<void> => {
    this.clearIdleTimer();

    const context = this.context;
    const model = this.model;
    const llama = this.llama;
    this.llama = null;
    this.model = null;
    this.context = null;
    this.sequence = null;
    this.loadedModelId = null;

    if (context) {
      await context.dispose();
    }
    if (model) {
      await model.dispose();
    }
    if (llama) {
      await llama.dispose();
    }
  };

  private scheduleIdleUnload = (): void => {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      void this.unload().catch((err) => console.error(err));
    }, AI_IDLE_UNLOAD_MS);
  };

  private clearIdleTimer = (): void => {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  };
}
