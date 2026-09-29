export default class ActivityDto {
  public id!: number;
  public gameId!: number;
  public gameName!: string;
  public action!: string;
  public oldStatus: string | null = null;
  public newStatus!: string;
  public created!: Date;
}
