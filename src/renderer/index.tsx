import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
// `window.electron` is only injected by the Electron preload script, so it is
// absent when the same bundle is served as a plain web app in the browser.
if (window.electron) {
  window.electron.ipcRenderer.once('ipc-example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
  });
  window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
}
