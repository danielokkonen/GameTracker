import { useEffect, useRef } from "react";
import { IpcRendererEvent } from "electron";

const useIpcRendererCallback = <T,>(
  channel: string,
  method: (() => void) | null,
  callback: (data: T) => void
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handleEvent = (event: IpcRendererEvent, data: T) => {
    callbackRef.current(data);
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(channel, handleEvent);

    if (method) {
      method();
    }

    return () => {
      window.electronApi.ipcRenderer.off(channel, handleEvent);
    };
  }, []);
};

export default useIpcRendererCallback;
