export class DbGame {
  id: number | null = null;
  name!: string;
  franchise!: string;
  start: string | null = null;
  end: string | null = null;
  created: string | null = null;
  updated: string | null = null;
  coverImage: string | null = null;
  developer: string | null = null;
  genres: string | null = null;
  platforms: string | null = null;
  publisher: string | null = null;
  summary: string | null = null;
  appId: string | null = null;
  playtime_minutes: number = 0;
}

export class DbToken {
  service!: string;
  token!: string;
  type!: string;
  expires_at!: number;
}
