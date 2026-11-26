export interface AiModel {
  id: string;
  name: string;
  sourceRepo: string;
  fileName: string;
  sizeBytes: number;
  ramMb: number;
  sha256: string;
  recommended: boolean;
}

export const AI_MAX_MODEL_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export const AI_MIN_MODEL_SIZE_BYTES = 10 * 1024 * 1024;

export const AI_SYSTEM_RAM_HEADROOM_MB = 2048;

export const AI_MODELS: AiModel[] = [
  {
    id: "qwen2.5-1.5b",
    name: "Qwen 2.5 1.5B Instruct",
    sourceRepo: "Qwen/Qwen2.5-1.5B-Instruct-GGUF",
    fileName: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    sizeBytes: 1117320736,
    ramMb: 428,
    sha256: "6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e",
    recommended: false,
  },
  {
    id: "llama3.2-1b",
    name: "Llama 3.2 1B Instruct",
    sourceRepo: "bartowski/Llama-3.2-1B-Instruct-GGUF",
    fileName: "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    sizeBytes: 807694464,
    ramMb: 403,
    sha256: "6f85a640a97cf2bf5b8e764087b1e83da0fdb51d7c9fab7d0fece9385611df83",
    recommended: false,
  },
  {
    id: "phi4-mini",
    name: "Phi-4 Mini Instruct",
    sourceRepo: "bartowski/microsoft_Phi-4-mini-instruct-GGUF",
    fileName: "microsoft_Phi-4-mini-instruct-IQ3_M.gguf",
    sizeBytes: 2017656192,
    ramMb: 937,
    sha256: "0d6a07d53a3ebd474a8ca9abc9415af39e88f041cfbfe388e3bf632b84e7b232",
    recommended: true,
  },
];

export const AI_MODEL_SOURCE_BASE_URL = "https://huggingface.co";
