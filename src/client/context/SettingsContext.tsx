import { Dispatch, createContext } from "react";
import {
  ISettingsState,
  SettingsAction,
} from "../components/settings/SettingsProvider";

export interface ISettingsContext {
  state: ISettingsState;
  dispatch: Dispatch<SettingsAction>;
}

const context: ISettingsContext = null;

const SettingsContext = createContext(context);

export default SettingsContext;
