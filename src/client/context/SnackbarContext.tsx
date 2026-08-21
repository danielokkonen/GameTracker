import { Dispatch, createContext } from "react";
import { SnackbarAction } from "../components/common/SnackbarProvider";

const context: Dispatch<SnackbarAction> = undefined as unknown as Dispatch<SnackbarAction>;

const SnackbarContext = createContext(context);

export default SnackbarContext;
