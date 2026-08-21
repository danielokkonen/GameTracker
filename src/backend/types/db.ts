export interface DbGame {
  id: number | null;
  name: string;
  franchise: string;
  start: string | null;
  end: string | null;
  created: string | null;
  updated: string | null;
  coverImage: string | null;
  developer: string | null;
  genres: string | null;
  platforms: string | null;
  publisher: string | null;
  summary: string | null;
  appId: string | null;
  playtime_minutes: number;
}

export interface DbToken {
  service: string;
  token: string;
  type: string;
  expires_at: number;
}
