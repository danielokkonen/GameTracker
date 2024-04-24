export default class GameDto {
  public id: number;
  public name: string;
  public franchise: string;
  public status: string;
  public started: Date;
  public completed: Date;
  public created: Date;
  public updated: Date;

  [key: string]: string | number| Date;

  constructor(
    id?: number,
    name?: string,
    franchise?: string,
    status?: string,
    started?: Date,
    completed?: Date,
    created?: Date,
    updated?: Date
  ) {
    this.id = id;
    this.name = name;
    this.franchise = franchise;
    this.status = status;
    this.started = started;
    this.completed = completed;
    this.created = created;
    this.updated = updated;
  }
}
