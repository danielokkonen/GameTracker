import { createHash } from "node:crypto";
import { Database } from "../database/database";
import InferenceEngine from "./inference-engine";
import ModelManager, { type DownloadProgressCallback, type ModelStatus } from "./model-manager";
import { AI_INSIGHT_CANDIDATE_LIMIT, AI_INSIGHT_GENRE_LIMIT, AI_INSIGHT_PLAYING_LIMIT } from "../constants/ai-engine";
import type { GameStatus } from "../constants/gameStatuses";
import type { DbGame } from "../types/db";

export interface AiInsightState {
  text: string;
}

export interface AiStatus {
  modelInstalled: boolean;
  selectedModelId: string | null;
  generating: boolean;
  insight: AiInsightState | null;
}

interface InsightPlayingEntry {
  name: string;
  minutes: number;
  genres: string[];
}

interface InsightCandidateEntry {
  name: string;
  status: GameStatus;
  minutes: number;
  genres: string[];
}

interface InsightPayload {
  statusCounts: Record<GameStatus, number>;
  totalPlaytimeMinutes: number;
  averagePlaytimePerPlayedGameMinutes: number | null;
  top5ByPlaytime: { name: string; minutes: number }[];
  currentlyPlaying: InsightPlayingEntry[];
  playNextCandidates: InsightCandidateEntry[];
  genreDistribution: Record<string, number>;
  genreOutcomes: Record<string, { completed: number; dropped: number }>;
  medianTimeToCompletionDays: number | null;
  last30DaysActivity: Record<string, number>;
}

interface ActivityRow {
  action: string;
  created: string;
}

interface AiInsightRow {
  fingerprint: string;
  model: string;
  insight: string;
  created: string;
}

const SYSTEM_PROMPT = `You are a game library analyst inside a personal game tracking app. You receive the user's game library as JSON. Reply with exactly these four labelled lines, one per line, in this exact order and wording. Put nothing before the first line and nothing after the last line:

Playing now: <what the player is actively playing and what that suggests about their current taste or mood>
Play next: <a game only from "Paused" or "Not started", then say in a natural sentence why it suits them, drawing on their own history>
Also try: <a different game only from "Paused" or "Not started", with a natural sentence on why it fits>
Pattern: <a sentence interpreting the player's habits or taste — focus, trends, tendencies>

Rules:
- Write like a knowledgeable friend who knows the player's library: warm, specific, conversational, in complete natural sentences. Avoid clipped note-taking, corporate filler, and stock phrases ("palate cleanser", "perfect fit", "without a doubt").
- Keep each line to one or two sentences. Plain text only — no markdown or HTML (no * or ** emphasis, no <p>/<strong> tags, no bullets, no numbered lists, no headings), no preamble, no extra or blank lines.
- "Play next" and "Also try" must each name a real game marked "Paused" or "Not started". Never recommend a game that is currently being played or already completed. Ground each reason in the player's own history — genres they gravitate to, games they loved, finished, or dropped.
- If there is no other suitable candidate for "Also try", write exactly "None" after its label.
- Never invent or guess game titles — reference only games that appear in the provided data.
- Never mention JSON field names or list names (such as "playNextCandidates" or "currentlyPlaying"), and never say "a game from the list" — name actual games only.
- Interpret the data (trends, focus, habits) instead of restating raw counts.
- If a field is missing or empty, ignore it silently.

Example:
Library: {"statusCounts":{"Completed":6,"Started":1,"Paused":1,"Not started":2},"currentlyPlaying":[{"name":"Outer Wilds","minutes":900,"genres":["Roguelike","Action"]}],"playNextCandidates":[{"name":"Solarus","status":"Paused","minutes":240,"genres":["Roguelike","Action"]},{"name":"Mosaic","status":"Not started","minutes":0,"genres":["Platformer"]}],"genreDistribution":{"Roguelike":3,"Action":3,"Platformer":1}}
Response:
Playing now: You are well into Outer Wilds, and the way you keep gravitating to roguelike action tells me that is where your head is at right now.
Play next: When you come up for air, Solarus is the one I would reach for. It is a roguelike you paused rather than bounced off, so the combat should feel familiar straight away.
Also try: Mosaic is there if you fancy something calmer, though it is a genre you have barely touched compared to your action backlog.
Pattern: You tend to sink hard into a single action game at a time and let the gentler stuff sit untouched in the backlog.`;

const RECENT_ACTIVITY_DAYS = 30;
const MS_PER_DAY = 86_400_000;

const isInstalled = (model: ModelStatus): boolean => model.installState === "installed";

export default class AiService {
  private database = new Database();
  private modelManager = new ModelManager();
  private engine = new InferenceEngine();

  constructor() {
    this.clearCache();
  }

  getStatus = async (): Promise<AiStatus> => {
    const models = await this.modelManager.listModels();
    const selectedModel = models.find((model) => model.selected);
    const cached = this.readCache();

    return {
      modelInstalled: models.some(isInstalled),
      selectedModelId: selectedModel?.id ?? null,
      generating: this.engine.isGenerating(),
      insight: cached ? { text: cached.insight } : null,
    };
  };

  dismissInsight = (): void => {
    this.clearCache();
  };

  listModels = async (): Promise<ModelStatus[]> => {
    return this.modelManager.listModels();
  };

  selectModel = async (modelId: string): Promise<void> => {
    await this.modelManager.selectModel(modelId);
  };

  addCustomModel = async (filePath: string): Promise<void> => {
    await this.modelManager.addCustomModel(filePath);
  };

  deleteModel = async (modelId: string): Promise<void> => {
    if (this.engine.isGenerating()) {
      throw new Error("Cannot delete a model while an insight is being generated");
    }
    await this.engine.unloadIfLoaded(modelId);
    await this.modelManager.deleteModel(modelId);
  };

  download = async (modelId: string, onProgress?: DownloadProgressCallback): Promise<void> => {
    await this.modelManager.download(modelId, onProgress);
  };

  cancelDownload = (modelId: string): void => {
    this.modelManager.cancelDownload(modelId);
  };

  getModelFilePath = async (modelId: string): Promise<string> => {
    return this.modelManager.getModelFilePath(modelId);
  };

  generateInsight = async (force = false): Promise<string> => {
    const selectedModelId = await this.modelManager.getSelectedModelId();
    if (!selectedModelId) {
      const models = await this.modelManager.listModels();
      throw new Error(models.some(isInstalled) ? "No model is active — select one in Settings" : "No AI model is installed");
    }

    const games = this.getGames();
    const activities = this.getActivities();
    const payload = this.buildPayload(games, activities);
    const fingerprint = this.computeFingerprint(payload);

    if (!force) {
      const cached = this.readCache();
      if (cached && cached.fingerprint === fingerprint) {
        return cached.insight;
      }
    }

    const text = await this.engine.generate(selectedModelId, {
      systemPrompt: SYSTEM_PROMPT,
      prompt: `Analyze what I am playing and recommend what to play next:\n${JSON.stringify(payload)}`,
    });
    this.writeCache(fingerprint, selectedModelId, text);
    return text;
  };

  private buildPayload = (games: DbGame[], activities: ActivityRow[]): InsightPayload => {
    const statusCounts: Record<GameStatus, number> = {
      "Not started": 0,
      Started: 0,
      Completed: 0,
      Paused: 0,
      Dropped: 0,
      Replaying: 0,
    };
    for (const game of games) {
      statusCounts[game.status] += 1;
    }

    const played = games.filter((game) => (game.playtime_minutes ?? 0) > 0);
    const totalPlaytimeMinutes = played.reduce((sum, game) => sum + (game.playtime_minutes ?? 0), 0);

    const genreDistribution: Record<string, number> = {};
    for (const game of games) {
      for (const genre of this.splitList(game.genres)) {
        genreDistribution[genre] = (genreDistribution[genre] ?? 0) + 1;
      }
    }

    const genreOutcomes: Record<string, { completed: number; dropped: number }> = {};
    for (const game of games) {
      if (game.status !== "Completed" && game.status !== "Dropped") continue;
      for (const genre of this.splitList(game.genres)) {
        const entry = (genreOutcomes[genre] ??= { completed: 0, dropped: 0 });
        if (game.status === "Completed") entry.completed += 1;
        else entry.dropped += 1;
      }
    }

    const durationsDays = games
      .filter((game) => game.status === "Completed" && game.start && game.end)
      .map((game) => (Date.parse(game.end as string) - Date.parse(game.start as string)) / MS_PER_DAY)
      .sort((a, b) => a - b);
    const medianTimeToCompletionDays = durationsDays.length
      ? Math.round(durationsDays[Math.floor(durationsDays.length / 2)])
      : null;

    const cutoff = Date.now() - RECENT_ACTIVITY_DAYS * MS_PER_DAY;
    const recent = activities.filter((activity) => Date.parse(activity.created) >= cutoff);
    const last30DaysActivity: Record<string, number> = { total: recent.length };
    for (const activity of recent) {
      last30DaysActivity[activity.action] = (last30DaysActivity[activity.action] ?? 0) + 1;
    }

    const currentlyPlaying = games
      .filter((game) => game.status === "Started" || game.status === "Replaying")
      .sort((a, b) => (b.playtime_minutes ?? 0) - (a.playtime_minutes ?? 0))
      .slice(0, AI_INSIGHT_PLAYING_LIMIT)
      .map(this.toPlayingEntry);

    const playNextCandidates = [
      ...games
        .filter((game) => game.status === "Paused")
        .sort((a, b) => (b.playtime_minutes ?? 0) - (a.playtime_minutes ?? 0)),
      ...games
        .filter((game) => game.status === "Not started")
        .sort((a, b) => a.name.localeCompare(b.name)),
    ]
      .slice(0, AI_INSIGHT_CANDIDATE_LIMIT)
      .map(this.toCandidateEntry);

    return {
      statusCounts,
      totalPlaytimeMinutes,
      averagePlaytimePerPlayedGameMinutes: played.length ? Math.round(totalPlaytimeMinutes / played.length) : null,
      top5ByPlaytime: [...played]
        .sort((a, b) => (b.playtime_minutes ?? 0) - (a.playtime_minutes ?? 0))
        .slice(0, 5)
        .map((game) => ({ name: game.name, minutes: game.playtime_minutes ?? 0 })),
      currentlyPlaying,
      playNextCandidates,
      genreDistribution,
      genreOutcomes,
      medianTimeToCompletionDays,
      last30DaysActivity,
    };
  };

  private toPlayingEntry = (game: DbGame): InsightPlayingEntry => ({
    name: game.name,
    minutes: game.playtime_minutes ?? 0,
    genres: this.splitList(game.genres).slice(0, AI_INSIGHT_GENRE_LIMIT),
  });

  private toCandidateEntry = (game: DbGame): InsightCandidateEntry => ({
    name: game.name,
    status: game.status,
    minutes: game.playtime_minutes ?? 0,
    genres: this.splitList(game.genres).slice(0, AI_INSIGHT_GENRE_LIMIT),
  });

  private computeFingerprint = (payload: InsightPayload): string => {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  };

  private clearCache = (): void => {
    this.database.instance.prepare("DELETE FROM AiInsight").run();
  };

  private readCache = (): AiInsightRow | null => {
    const row = this.database.instance
      .prepare("SELECT fingerprint, model, insight, created FROM AiInsight")
      .get() as AiInsightRow | undefined;
    return row ?? null;
  };

  private writeCache = (fingerprint: string, modelId: string, insight: string): void => {
    const params = { fingerprint, model: modelId, insight, created: new Date().toISOString() };
    if (this.readCache()) {
      this.database.instance
        .prepare("UPDATE AiInsight SET fingerprint = @fingerprint, model = @model, insight = @insight, created = @created")
        .run(params);
    } else {
      this.database.instance
        .prepare("INSERT INTO AiInsight (fingerprint, model, insight, created) VALUES (@fingerprint, @model, @insight, @created)")
        .run(params);
    }
  };

  private getGames = (): DbGame[] => {
    return this.database.instance.prepare("SELECT * FROM Game").all() as DbGame[];
  };

  private getActivities = (): ActivityRow[] => {
    return this.database.instance
      .prepare("SELECT action, created FROM GameActivity")
      .all() as ActivityRow[];
  };

  private splitList = (value: string | null): string[] => {
    return (value ?? "").split(";").map((entry) => entry.trim()).filter(Boolean);
  };
}
