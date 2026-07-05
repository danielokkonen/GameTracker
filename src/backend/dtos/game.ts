export default class GameDto {
  public id: number;
  public name: string;
  public franchise: string;
  public status: string;
  public started: Date | null;
  public completed: Date | null;
  public summary: string | null;
  public developer: string | null;
  public publisher: string | null;
  public genres: string[] | null; 
  public platforms: string[] | null;
  public coverImage: string | null;
  public created: Date | null;
  public updated: Date | null;

  [key: string]: string| string[] | number| Date|null;
}
