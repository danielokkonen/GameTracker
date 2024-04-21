import React, { useEffect, useReducer } from "react";
import SettingsContext from "../../../client/context/SettingsContext";

export interface ISettingsState {
  developerMode: boolean;
}

const initialState: ISettingsState = {
  developerMode: false,
};

export type SettingsPayload = {
  name: string;
  value: number | string | boolean | null;
};

export type SettingsAction =
  | { type: "set_value"; payload: SettingsPayload }
  | { type: "init"; payload?: undefined };

const reducer = (state: ISettingsState, action: SettingsAction) => {
  switch (action.type) {
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
