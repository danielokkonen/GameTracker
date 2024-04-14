export default class Game {
  public id: string;
  public name: string;
  public status: string;
  public started: Date;
  public completed: Date;

  constructor(
    id: string,
    name: string,
    status: string,
    started: Date,
    completed: Date
  ) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.started = started;
    this.completed = completed;
  }
}
