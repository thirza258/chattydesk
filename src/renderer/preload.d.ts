import { ElectronHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    // Undefined in the browser build — only the Electron preload script sets it.
    electron?: ElectronHandler;
  }
}

export {};
