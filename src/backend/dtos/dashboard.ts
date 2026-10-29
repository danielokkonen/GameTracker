import ActivityDto from "./activity";

export default class DashboardDto {
  public completed!: number;
  public started!: number;
  public notStarted!: number;
  public paused!: number;
  public dropped!: number;
  public replaying!: number;
  public avgPlaytime!: number;
  public totalPlaytime!: number;
  public completionRate!: number;
  public startedGames!: { id: number; name: string; coverImage: string | null }[];
  public activity!: ActivityDto[];
}
