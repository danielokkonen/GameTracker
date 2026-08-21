export interface IgdbCover {
  url: string;
}

export interface IgdbCompany {
  company: {
    name: string;
  };
  developer: boolean;
  publisher: boolean;
  supporting: boolean;
}

export interface IgdbGenre {
  name: string;
}

export interface IgdbPlatform {
  name: string;
}

export interface IgdbGame {
  cover: IgdbCover;
  summary: string;
  involved_companies: IgdbCompany[];
  genres: IgdbGenre[];
  platforms: IgdbPlatform[];
}
