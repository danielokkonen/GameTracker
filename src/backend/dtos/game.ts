export default class GameDto {
  public id: number;
  public name: string;
  public franchise: string;
  public status: string;
  public started: Date;
  public completed: Date;
  public summary: string;
  public developer: string;
  public publisher: string;
  public genres: string[]; 
  public platforms: string[];
  public coverImage: string;
  public created: Date;
  public updated: Date;

  [key: string]: string| string[] | number| Date;
}
