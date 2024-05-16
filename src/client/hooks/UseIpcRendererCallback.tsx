import { useEffect } from "react";
import { IpcRendererEvent } from "electron";

const useIpcRendererCallback = <T,>(
  channel: string,
  method: () => void,
  callback: (data: T) => void
) => {
  const handleEvent = (event: IpcRendererEvent, data: T) => {
    callback(data);
  };

  useEffect(() => {
    window.electronApi.ipcRenderer.on(channel, handleEvent);

    method();

    return () => {
      window.electronApi.ipcRenderer.removeAllListeners(channel);
    };
  }, []);
};

export default useIpcRendererCallback;
