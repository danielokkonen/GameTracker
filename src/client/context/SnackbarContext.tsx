import { Dispatch, createContext } from "react";
import { SnackbarAction } from "../components/common/SnackbarProvider";

const context: Dispatch<SnackbarAction> = null;

const SnackbarContext = createContext(context);

export default SnackbarContext;
