/* eslint-disable no-case-declarations */
import React, { useReducer } from "react";
import GamesContext from "../../../client/context/GamesContext";

export interface IGamesProvider {
  selectedGames: any;
}

const initialState: IGamesProvider = {
  selectedGames: {},
};

export type GamesAction = { type: "toggle_selected_game"; payload: number };

const reducer = (state: IGamesProvider, action: GamesAction) => {
  switch (action.type) {
    case "toggle_selected_game":
      const result = {
        ...state.selectedGames,
        [action.payload]: !state.selectedGames[action.payload],
      };

      if (result[action.payload] === false) {
        delete result[action.payload];
      }

      console.log(result);

      return {
        ...state,
        selectedGames: result,
      };
    default:
      return state;
  }
};

interface IGamesProviderProps {
  children: React.ReactNode;
}

const GamesProvider = ({ children }: IGamesProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <GamesContext.Provider value={{ state, dispatch }}>
      {children}
    </GamesContext.Provider>
  );
};

export default GamesProvider;
