import React, { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Snackbar,
  IconButton,
  Box,
  Alert,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch, useAsyncTask } from '../reactHelper';
import { sessionActions } from '../store';
import BackIcon from '../common/components/BackIcon';
import PasswordField from '../common/components/PasswordField';
import fetchOrThrow from '../common/util/fetchOrThrow';

const PRIMARY = '#00a79d';
const PRIMARY_HOVER = '#00968d';
const FONT_FAMILY = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: FONT_FAMILY,
    touchAction: 'manipulation',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    minWidth: 0,
  },
  title: {
    fontSize: '1.25rem',
    lineHeight: 1.25,
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  backButton: {
    color: '#64748b',
    padding: theme.spacing(0.5),
    borderRadius: '8px',
    flexShrink: 0,
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      marginBottom: '14px',
    },
  },
  fieldLabel: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '6px',
    fontFamily: FONT_FAMILY,
  },
  inputField: {
    width: '100%',
    minWidth: 0,
    '& .MuiOutlinedInput-root': {
      width: '100%',
      minHeight: '44px',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      fontWeight: 600,
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
        fontSize: '13px',
        fontWeight: 600,
        color: '#0f172a',
        fontFamily: FONT_FAMILY,
        padding: '11px 13px',
        touchAction: 'manipulation',
        [theme.breakpoints.down('sm')]: {
          fontSize: '16px !important',
        },
      },
    },
  },
  submitButton: {
    width: '100%',
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
    marginTop: '6px',
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
}));

const RegisterPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session?.server || {});
  const attributes = server?.attributes || {};
  const registrationEnabled = attributes.registrationEnabled !== false && attributes.disableRegistration !== true;
  const totpForce = attributes.totpForce === true;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (!registrationEnabled) {
      navigate('/login', { replace: true });
    }
  }, [registrationEnabled, navigate]);

  useAsyncTask(
    async ({ signal }) => {
      if (registrationEnabled && totpForce) {
        const response = await fetchOrThrow('/api/users/totp', { method: 'POST', signal });
        setTotpKey(await response.text());
      }
    },
    [registrationEnabled, totpForce]
  );

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    if (!registrationEnabled) {
      navigate('/login', { replace: true });
      return;
    }

    await fetchOrThrow('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, totpKey }),
    });

    setSnackbarOpen(true);
  });

  if (!registrationEnabled) {
    return null;
  }

  return (
    <LoginLayout>
      <form onSubmit={handleSubmit} className={classes.container} noValidate>
        <Box className={classes.header}>
          {!server?.newServer && (
            <IconButton className={classes.backButton} onClick={() => navigate('/login')} size="small">
              <BackIcon />
            </IconButton>
          )}
          <Typography className={classes.title}>
            {t('loginRegister')}
          </Typography>
        </Box>

        <Box className={classes.fieldWrapper}>
          <label className={classes.fieldLabel}>Full Name</label>
          <TextField
            required
            fullWidth
            name="name"
            placeholder="John Doe"
            value={name}
            autoComplete="name"
            autoFocus
            onChange={(event) => setName(event.target.value)}
            variant="outlined"
            className={classes.inputField}
          />
        </Box>

        <Box className={classes.fieldWrapper}>
          <label className={classes.fieldLabel}>Email Address</label>
          <TextField
            required
            fullWidth
            type="email"
            name="email"
            placeholder="name@example.com"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            variant="outlined"
            className={classes.inputField}
          />
        </Box>

        <Box className={classes.fieldWrapper}>
          <label className={classes.fieldLabel}>Password</label>
          <PasswordField
            required
            fullWidth
            name="password"
            placeholder="Create a password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            className={classes.inputField}
          />
        </Box>

        {totpForce && (
          <Box className={classes.fieldWrapper}>
            <label className={classes.fieldLabel}>{t('loginTotpKey')}</label>
            <TextField
              required
              fullWidth
              name="totpKey"
              value={totpKey || ''}
              variant="outlined"
              className={classes.inputField}
              slotProps={{ input: { readOnly: true } }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          type="submit"
          disabled={!name || !password || !(server?.newServer || /(.+)@(.+)\.(.{2,})/.test(email))}
          className={classes.submitButton}
          fullWidth
        >
          {t('loginRegister')}
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        onClose={() => {
          dispatch(sessionActions.updateServer({ ...server, newServer: false }));
          navigate('/login');
        }}
        autoHideDuration={snackBarDurationShortMs}
      >
        <Alert severity="success">
          {t('loginCreated')}
        </Alert>
      </Snackbar>
    </LoginLayout>
  );
};

export default RegisterPage;