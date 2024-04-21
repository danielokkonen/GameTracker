import { Snackbar } from "@mui/material";
import React, { useReducer } from "react";
import SnackbarContext from "../../../client/context/SnackbarContext";

interface ISnackbarState {
  open: boolean;
  message: string;
}

const initialState: ISnackbarState = {
  open: false,
  message: null,
};

export type SnackbarAction =
  | { type: "show_message"; payload: string }
  | { type: "hide"; payload?: undefined };

const reducer = (state: ISnackbarState, action: SnackbarAction) => {
  switch (action.type) {
    case "show_message":
      return {
        ...state,
        open: true,
        message: action.payload,
      };
    case "hide":
      return {
        ...state,
        open: false,
      };
    default:
      return state;
  }
};

interface ISnackbarProviderProps {
  children: React.ReactNode;
}

const SnackbarProvider = ({ children }: ISnackbarProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const onClose = () => {
    dispatch({
      type: "hide",
    });
  };

  return (
    <SnackbarContext.Provider value={dispatch}>
      <Snackbar
        open={state.open}
        autoHideDuration={5000}
        onClose={onClose}
        message={state.message}
        ClickAwayListenerProps={{ onClickAway: () => null }}
      />
      {children}
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;
