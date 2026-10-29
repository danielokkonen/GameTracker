import React, { useReducer } from "react";
import SettingsContext from "../../../client/context/SettingsContext";

export interface ISettingsState {
  developerMode: boolean;
  darkMode: boolean | null;
  igdbClientId: string | null;
  igdbSecret: string | null;
  steamApiKey: string | null;
  steamId: string | null;
}

const initialState: ISettingsState = {
  developerMode: false,
  darkMode: null,
  igdbClientId: null,
  igdbSecret: null,
  steamApiKey: null,
  steamId: null,
};

export type SettingsPayload = {
  name: string;
  value: number | string | boolean | null;
};

export type SettingsAction =
  | { type: "set_value"; payload: SettingsPayload }
  | { type: "init"; payload?: ISettingsState };

const reducer = (state: ISettingsState, action: SettingsAction) => {
  switch (action.type) {
    case "init":
      if (!action.payload) return state;
      return {
        ...action.payload,
      };
    case "set_value":
      return {
        ...state,
        [action.payload.name]: action.payload.value,
      };
    default:
      return state;
  }
};

interface ISettingsProviderProps {
  children: React.ReactNode;
}

const SettingsProvider = ({ children }: ISettingsProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
