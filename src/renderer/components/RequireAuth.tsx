import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

/**
 * Gate for the pages that need an account. Sends a signed-out visitor to the
 * sign-in page, remembering where they were headed so they land there
 * afterwards instead of on a generic home page.
 */
function RequireAuth({ children }: { children: ReactElement }) {
  const { status } = useAuth();
  const location = useLocation();

  // While a stored token is being confirmed, showing either the page or the
  // sign-in form would be a guess — and the wrong guess flashes on every
  // reload.
  if (status === 'checking') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950">
        <span
          role="status"
          aria-label="Checking your session"
          className="h-6 w-6 rounded-full border-2 border-slate-600 border-t-transparent motion-safe:animate-spin"
        />
      </div>
    );
  }

  if (status === 'signed-out') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default RequireAuth;
