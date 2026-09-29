export default class DashboardDto {
  public completed!: number;
  public started!: number;
  public notStarted!: number;
  public completedLast30Days!: number;
  public startedLast30Days!: number;
  public paused!: number;
  public dropped!: number;
  public replaying!: number;
  public gamesStartedByMonth!: { month: string; count: number }[];
  public gamesCompletedByMonth!: { month: string; count: number }[];
  public topGenres!: { genre: string; count: number }[];
  public topPlatforms!: { platform: string; count: number }[];
  public avgPlaytime!: number;
  public totalPlaytime!: number;
  public completionRate!: number;
  public startedGames!: { id: number; name: string; coverImage: string | null }[];
}
