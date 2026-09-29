import { GameStatus } from "../constants/gameStatuses";

export default class ActivityDto {
  public id!: number;
  public gameId!: number;
  public gameName!: string;
  public action!: string;
  public oldStatus: GameStatus | null = null;
  public newStatus!: GameStatus;
  public created!: Date;
}
