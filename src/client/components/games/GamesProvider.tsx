/* eslint-disable no-case-declarations */
import React, { useReducer } from "react";
import GamesContext from "../../../client/context/GamesContext";

export interface IGamesProvider {
  selectedGames: any;
}

const initialState: IGamesProvider = {
  selectedGames: {},
};

type SetSelectedGamePayload = {
  id: number;
  selected: boolean;
  loading: boolean;
};

export type GamesAction =
  | {
      type: "SET_SELECTED_GAME";
      payload: SetSelectedGamePayload;
    }
  | {
      type: "REMOVE_SELECTED_GAME";
      payload: number;
    }
  | {
      type: "REMOVE_ALL_SELECTED_GAMES";
    };

const reducer = (state: IGamesProvider, action: GamesAction) => {
  switch (action.type) {
    case "SET_SELECTED_GAME":
      return {
        ...state,
        selectedGames: {
          ...state.selectedGames,
          [action.payload.id]: {
            selected: action.payload.selected,
            loading: action.payload.loading,
          },
        },
      };
    case "REMOVE_SELECTED_GAME":
      const result = { ...state.selectedGames };
      delete result[action.payload];

      return {
        ...state,
        selectedGames: {
          ...result,
        },
      };
    case "REMOVE_ALL_SELECTED_GAMES":
      return {
        ...state,
        selectedGames: {},
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
