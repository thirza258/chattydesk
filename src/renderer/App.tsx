import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { routerBasename } from '../constant';
import { AuthProvider } from './AuthContext';
import { isDesktop } from './environment';
import RequireAuth from './components/RequireAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import './App.css';
import 'tailwindcss/tailwind.css';

function App() {
  /**
   * The desktop app is loaded from a file:// URL once packaged, where there is
   * no server to answer a request for /chat — so it routes on the hash instead.
   * The web build gets real URLs, which is what makes the landing page
   * shareable.
   */
  const desktop = isDesktop();
  const Router = desktop ? HashRouter : BrowserRouter;

  return (
    <AuthProvider>
      <Router basename={desktop ? undefined : routerBasename}>
        <Routes>
          {/*
            The landing page exists to introduce the web version. The desktop
            app is already installed, so it opens on the chat — and, if nobody
            is signed in, on the sign-in page.
          */}
          <Route
            path="/"
            element={desktop ? <Navigate to="/chat" replace /> : <Landing />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          {/* Includes /index.html, which is what the desktop dev server serves. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
