import { Dispatch, createContext } from "react";
import { GamesAction, IGamesState } from "../components/games/GamesProvider";

export interface IGamesContext {
  state: IGamesState;
  dispatch: Dispatch<GamesAction>;
}

const context: IGamesContext = undefined as unknown as IGamesContext;

const GamesContext = createContext(context);

export default GamesContext;
