export class IgdbCover {
  url!: string;
}

export class IgdbCompany {
  company!: { name: string };
  developer!: boolean;
  publisher!: boolean;
  supporting!: boolean;
}

export class IgdbGenre {
  name!: string;
}

export class IgdbPlatform {
  name!: string;
}

export class IgdbGame {
  cover!: IgdbCover;
  summary!: string;
  involved_companies!: IgdbCompany[];
  genres!: IgdbGenre[];
  platforms!: IgdbPlatform[];
}
