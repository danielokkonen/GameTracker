import { Dispatch, createContext } from "react";
import { GamesAction, IGamesProvider } from "../components/games/GamesProvider";

export interface IGamesContext {
  state: IGamesProvider;
  dispatch: Dispatch<GamesAction>;
}

const context: IGamesContext = null;

const GamesContext = createContext(context);

export default GamesContext;
