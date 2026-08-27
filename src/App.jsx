import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import CssBaseline from '@mui/material/CssBaseline';

import SocketController from './SocketController';
import PreloadController from './PreloadController';
import UpdateController from './UpdateController';
import MotionController from './main/components/MotionController';
import GlobalAlertController from './main/components/GlobalAlertController';

import { useCatch, useAsyncTask } from './reactHelper';
import { sessionActions, devicesActions } from './store';
import TermsDialog from './common/components/TermsDialog';
import Loader from './common/components/Loader';

const useStyles = makeStyles()(() => ({
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    fontSize: '12px !important',
  },
}));

const App = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const newServer = useSelector((state) => state.session.server?.newServer);
  const termsUrl = useSelector((state) => state.session.server?.attributes?.termsUrl);
  const user = useSelector((state) => state.session.user);
  const preloadComplete = useSelector((state) => state.session.preloadComplete);

  const [sessionChecked, setSessionChecked] = useState(Boolean(user));

  const acceptTerms = useCatch(async () => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user,
        attributes: { ...(user.attributes || {}), termsAccepted: true },
      }),
      credentials: 'include',
    });
    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
    }
  });

  useAsyncTask(
    async ({ signal }) => {
      if (!user) {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        const storedToken = localStorage.getItem('userToken');
        const token = tokenParam || storedToken;

        const sessionUrl = token
          ? `/api/session?token=${encodeURIComponent(token)}`
          : '/api/session';

        try {
          const response = await fetch(sessionUrl, { signal, credentials: 'include' });

          if (response.ok) {
            const sessionUser = await response.json();

            if (sessionUser.expirationTime) {
              const expDate = new Date(sessionUser.expirationTime);
              if (expDate <= new Date()) {
                await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
                localStorage.removeItem('userToken');
                localStorage.removeItem('impersonated_user_id');
                localStorage.removeItem('impersonated_user_email');
                dispatch(devicesActions.clear());
                dispatch(sessionActions.updateUser(null));
                navigate('/login', { replace: true });
                return null;
              }
            }

            if (tokenParam) {
              localStorage.setItem('userToken', tokenParam);
              urlParams.delete('token');
              const newSearch = urlParams.toString();
              const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
              window.history.replaceState({}, '', cleanUrl);
            }

            dispatch(sessionActions.updateUser(sessionUser));
            setSessionChecked(true);
          } else {
            localStorage.removeItem('userToken');
            localStorage.removeItem('impersonated_user_id');
            localStorage.removeItem('impersonated_user_email');
            dispatch(devicesActions.clear());

            if (tokenParam) {
              urlParams.delete('token');
              const newSearch = urlParams.toString();
              const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
              window.history.replaceState({}, '', cleanUrl);
            }

            const currentPath = window.location.pathname + window.location.search;
            if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
              window.sessionStorage.setItem('postLogin', currentPath);
            }

            setSessionChecked(true);
            navigate(newServer ? '/register' : '/login', { replace: true });
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('impersonated_user_id');
            localStorage.removeItem('impersonated_user_email');
            dispatch(devicesActions.clear());
            setSessionChecked(true);
            navigate(newServer ? '/register' : '/login', { replace: true });
          }
        }
      } else {
        setSessionChecked(true);
      }
      return null;
    },
    [user, dispatch, navigate, newServer]
  );

  return (
    <>
      <CssBaseline />

      {/* Controllers only mount when a verified user session exists */}
      {Boolean(user) && (
        <>
          <SocketController />
          <PreloadController />
          <UpdateController />
          <MotionController />
          <GlobalAlertController />
        </>
      )}

      {(!user || !sessionChecked || !preloadComplete) ? (
        <Loader />
      ) : (
        <div className={classes.page}>
          <Outlet />
        </div>
      )}

      {termsUrl && user && !user.attributes?.termsAccepted && (
        <TermsDialog
          open
          onCancel={() => navigate('/login')}
          onAccept={() => acceptTerms()}
        />
      )}
    </>
  );
};

export default App;