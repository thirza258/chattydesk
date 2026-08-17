import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import services, { onSessionExpired } from '../services/services';
import { AuthUser, Credentials, SignUpDetails } from '../interface';
import { ACCESS_KEY, readStored } from './storage';

/**
 * 'checking' only happens when a token was found in storage and is being
 * confirmed with the server. Without one there is nothing to check, so the app
 * starts out plainly signed out.
 */
type AuthStatus = 'checking' | 'signed-in' | 'signed-out';

interface AuthValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (details: SignUpDetails) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export const useAuth = (): AuthValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    readStored(ACCESS_KEY) ? 'checking' : 'signed-out',
  );

  // Confirm a stored token before trusting it. An expired access token is
  // refreshed transparently by the API layer, so only a dead session lands in
  // the catch.
  useEffect(() => {
    if (!readStored(ACCESS_KEY)) return undefined;

    let cancelled = false;

    const confirmStoredToken = async () => {
      try {
        const account = await services.me();
        if (cancelled) return;
        setUser(account);
        setStatus('signed-in');
      } catch {
        if (cancelled) return;
        services.signOut();
        setStatus('signed-out');
      }
    };

    confirmStoredToken();

    return () => {
      cancelled = true;
    };
  }, []);

  // The API layer discovers a dead session mid-request; this is how the UI
  // hears about it and stops pretending somebody is signed in.
  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      setStatus('signed-out');
    });
    return () => onSessionExpired(null);
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    const session = await services.signIn(credentials);
    setUser(session.user);
    setStatus('signed-in');
  }, []);

  const signUp = useCallback(async (details: SignUpDetails) => {
    const session = await services.signUp(details);
    setUser(session.user);
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(() => {
    services.signOut();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
