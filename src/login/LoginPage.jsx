import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  TextField,
  Link,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions, devicesActions } from '../store';
import { useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import usePersistedState from '../common/util/usePersistedState';
import { generateLoginToken, handleLoginTokenListeners, nativeEnvironment, nativePostMessage } from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import { isUserExpired, getValidatedPostLoginDestination } from '../common/util/authUtils';

const PRIMARY = '#00a79d';
const PRIMARY_HOVER = '#00968d';
const FONT_FAMILY = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: FONT_FAMILY,
    touchAction: 'manipulation',
  },
  fieldWrapper: {
    width: '100%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    [theme.breakpoints.down('sm')]: {
      marginBottom: '14px',
    },
  },
  fieldLabel: {
    fontSize: '12.5px',
    lineHeight: 1.3,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '6px',
    display: 'block',
    fontFamily: FONT_FAMILY,
  },
  inputField: {
    width: '100%',
    minWidth: 0,
    '& .MuiOutlinedInput-root': {
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      fontSize: '13px',
      fontFamily: FONT_FAMILY,
      fontWeight: 600,
      minHeight: '44px',
      '& fieldset': {
        borderColor: '#cbd5e1',
        borderWidth: '1.2px',
      },
      '&:hover fieldset': {
        borderColor: '#94a3b8',
      },
      '&.Mui-focused': {
        boxShadow: '0 0 0 3px rgba(0, 167, 157, 0.12)',
        '& fieldset': {
          borderColor: PRIMARY,
          borderWidth: '1.5px',
        },
      },
      '& input': {
        minWidth: 0,
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        fontWeight: 600,
        color: '#0f172a',
        padding: '11px 13px',
        touchAction: 'manipulation',
        // Prevents mobile browser auto-zoom by enforcing 16px font size on small screens
        [theme.breakpoints.down('sm')]: {
          fontSize: '16px !important',
        },
      },
    },
  },
  rowActions: {
    width: '100%',
    minWidth: 0,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: '0px',
    marginBottom: '20px',
  },
  forgotLink: {
    cursor: 'pointer',
    fontWeight: 700,
    color: '#0066cc',
    fontSize: '12px',
    textDecoration: 'none',
    fontFamily: FONT_FAMILY,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  submitButton: {
    width: '100%',
    minWidth: 0,
    height: '46px',
    borderRadius: '23px',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'none',
    backgroundColor: `${PRIMARY} !important`,
    color: '#ffffff !important',
    boxShadow: 'none',
    fontFamily: FONT_FAMILY,
    letterSpacing: '0.3px',
    transition: 'background-color 0.15s ease',
    touchAction: 'manipulation',
    '&:hover': {
      backgroundColor: `${PRIMARY_HOVER} !important`,
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      backgroundColor: '#cbd5e1 !important',
      color: '#ffffff !important',
      opacity: 0.85,
    },
  },
  registerContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  registerText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  registerLink: {
    cursor: 'pointer',
    fontWeight: 700,
    color: PRIMARY,
    fontSize: '12px',
    textDecoration: 'none',
    fontFamily: FONT_FAMILY,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  errorAlert: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '16px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
  },
  topBar: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10,
    [theme.breakpoints.down('sm')]: {
      top: '10px',
      right: '10px',
    },
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session?.server || {});
  const attributes = server?.attributes || {};
  const registrationEnabled = attributes.registrationEnabled !== false && attributes.disableRegistration !== true;
  const changeEnabled = !attributes.disableChange;
  const openIdEnabled = server?.openIdEnabled;
  const openIdForced = server?.openIdEnabled && server?.openIdForce;

  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMe] = usePersistedState('loginRememberMe', true);
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const clearStaleSessionStorage = () => {
    [
      'impersonated_user_id',
      'impersonated_user_email',
      'admin_session_backup_id',
      'admin_session_backup_email',
      'admin_token_backup',
      'userToken',
    ].forEach((key) => window.localStorage.removeItem(key));
    window.sessionStorage.removeItem('userToken');
    dispatch(devicesActions.clear());
  };

  const routeAuthenticatedUser = (user) => {
    generateLoginToken();
    dispatch(sessionActions.updateUser(user));
    const storedTarget = window.sessionStorage.getItem('postLogin');
    window.sessionStorage.removeItem('postLogin');
    navigate(getValidatedPostLoginDestination(user, storedTarget), { replace: true });
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    setErrorMessage('');
    setLoading(true);

    try {
      clearStaleSessionStorage();
      const query = `email=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}`;
      const body = new URLSearchParams(code.length ? `${query}&code=${encodeURIComponent(code)}` : query);

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        if (isUserExpired(user)) {
          await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
          setErrorMessage('Account subscription expired. Your access period has ended.');
          setLoading(false);
          return;
        }

        if (!rememberMe) {
          window.localStorage.removeItem('loginEmail');
        }
        routeAuthenticatedUser(user);
        return;
      }

      if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
        setLoading(false);
        return;
      }

      if (response.status === 502) {
        setErrorMessage('Server connection offline. Please start your Traccar Java service on port 8082.');
        setLoading(false);
        return;
      }

      setFailed(true);
      setLoading(false);
      setPassword('');
    } catch {
      setErrorMessage('Unable to reach server. Please ensure the backend is running.');
      setFailed(true);
      setLoading(false);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    clearStaleSessionStorage();
    const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`, { credentials: 'include' });
    if (response.ok) {
      const user = await response.json();
      if (!isUserExpired(user)) routeAuthenticatedUser(user);
    }
  });

  const handleTokenLoginRef = useRef(handleTokenLogin);
  handleTokenLoginRef.current = handleTokenLogin;

  useEffect(() => {
    nativePostMessage('authentication');
  }, []);

  useEffect(() => {
    const listener = (token) => handleTokenLoginRef.current(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  const headerElements = (
    <Box className={classes.topBar}>
      {nativeEnvironment && changeEnabled && (
        <Tooltip title={`${t('settingsServer')}: ${window.location.hostname}`} arrow>
          <IconButton
            color="primary"
            onClick={() => navigate('/change-server')}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px',
              '&:hover': {
                backgroundColor: '#ffffff',
              },
            }}
          >
            <VpnLockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <LoginLayout headerActions={headerElements}>
      <form onSubmit={handlePasswordLogin} className={classes.container} noValidate>
        {!openIdForced && (
          <>
            {errorMessage && (
              <Box className={classes.errorAlert}>
                <ErrorIcon sx={{ color: '#991b1b', fontSize: 18, mt: '2px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#991b1b', lineHeight: 1.4, fontFamily: FONT_FAMILY }}>
                  {errorMessage}
                </Typography>
              </Box>
            )}

            {failed && !errorMessage && (
              <Box className={classes.errorAlert}>
                <ErrorIcon sx={{ color: '#991b1b', fontSize: 18, mt: '2px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#991b1b', lineHeight: 1.4, fontFamily: FONT_FAMILY }}>
                  Invalid email or password. Please try again.
                </Typography>
              </Box>
            )}

            <Box className={classes.fieldWrapper}>
              <label className={classes.fieldLabel}>Email</label>
              <TextField
                required
                fullWidth
                disabled={loading}
                error={failed}
                name="email"
                value={email}
                placeholder="name@example.com"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                variant="outlined"
                className={classes.inputField}
                slotProps={{
                  input: {
                    endAdornment: email ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setEmail('')}
                          edge="end"
                          sx={{ color: '#94a3b8', p: 0.5 }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </Box>

            <Box className={classes.fieldWrapper}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={classes.fieldLabel}>Password</label>
                <Link
                  onClick={() => !loading && navigate('/reset-password')}
                  className={classes.forgotLink}
                >
                  Forgot password?
                </Link>
              </Box>
              <TextField
                required
                fullWidth
                disabled={loading}
                error={failed}
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                variant="outlined"
                className={classes.inputField}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: '#94a3b8', p: 0.5 }}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            {codeEnabled && (
              <Box className={classes.fieldWrapper}>
                <label className={classes.fieldLabel}>{t('loginTotpCode')}</label>
                <TextField
                  required
                  fullWidth
                  disabled={loading}
                  error={failed}
                  name="code"
                  value={code}
                  type="number"
                  placeholder="6-digit code"
                  onChange={(event) => setCode(event.target.value)}
                  variant="outlined"
                  className={classes.inputField}
                />
              </Box>
            )}

            <Box className={classes.rowActions}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    disabled={loading}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    size="small"
                    sx={{
                      color: PRIMARY,
                      '&.Mui-checked': { color: PRIMARY },
                      p: 0.4,
                      borderRadius: '4px',
                    }}
                  />
                }
                label="Remember me"
                slotProps={{
                  typography: {
                    sx: {
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a',
                      userSelect: 'none',
                      fontFamily: FONT_FAMILY,
                    },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email || !password || (codeEnabled && !code)}
              className={classes.submitButton}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#fff !important' }} /> : 'Continue'}
            </Button>
          </>
        )}

        {openIdEnabled && (
          <Button
            onClick={() => { window.location.href = '/api/session/openid/auth'; }}
            variant="contained"
            fullWidth
            disabled={loading}
            className={classes.submitButton}
            sx={{ marginTop: openIdForced ? 0 : '10px' }}
          >
            {t('loginOpenId')}
          </Button>
        )}

        {!openIdForced && registrationEnabled && (
          <Box className={classes.registerContainer}>
            <Typography className={classes.registerText}>Do not have an account?</Typography>
            <Link onClick={() => !loading && navigate('/register')} className={classes.registerLink}>
              Create account
            </Link>
          </Box>
        )}
      </form>
    </LoginLayout>
  );
};

export default LoginPage;