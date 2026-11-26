export interface AiInsightState {
  text: string;
}

export interface AiStatus {
  modelInstalled: boolean;
  selectedModelId: string | null;
  generating: boolean;
  insight: AiInsightState | null;
}
