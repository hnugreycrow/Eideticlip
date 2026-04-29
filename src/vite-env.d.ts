/// <reference types="vite/client" />

import type { WindowControls, ClipboardAPI, ConfigAPI, UpdateControls } from "./utils/type";

declare global {
  interface Window {
    ipcRenderer: import("electron").IpcRenderer;
    windowControls: WindowControls;
    clipboard: ClipboardAPI;
    config: ConfigAPI;
    updater: UpdateControls;
  }
}

export {};
