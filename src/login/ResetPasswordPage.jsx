import React, { useState } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch } from '../reactHelper';
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

const ResetPasswordPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();

    if (!token) {
      await fetchOrThrow('/api/password/reset', {
        method: 'POST',
        body: new URLSearchParams(`email=${encodeURIComponent(email)}`),
      });
    } else {
      await fetchOrThrow('/api/password/update', {
        method: 'POST',
        body: new URLSearchParams(`token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`),
      });
    }

    setSnackbarOpen(true);
  });

  const validEmail = /(.+)@(.+)\.(.{2,})/.test(email);

  return (
    <LoginLayout>
      <form onSubmit={handleSubmit} className={classes.container} noValidate>
        <Box className={classes.header}>
          <IconButton className={classes.backButton} onClick={() => navigate('/login')} size="small">
            <BackIcon />
          </IconButton>
          <Typography className={classes.title}>
            {t('loginReset')}
          </Typography>
        </Box>

        {!token ? (
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
              autoFocus
              onChange={(event) => setEmail(event.target.value)}
              variant="outlined"
              className={classes.inputField}
            />
          </Box>
        ) : (
          <Box className={classes.fieldWrapper}>
            <label className={classes.fieldLabel}>New Password</label>
            <PasswordField
              required
              fullWidth
              name="password"
              placeholder="Enter new password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              className={classes.inputField}
            />
          </Box>
        )}

        <Button
          variant="contained"
          type="submit"
          disabled={token ? !password : !validEmail}
          className={classes.submitButton}
          fullWidth
        >
          {t('loginReset')}
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        onClose={() => navigate('/login')}
        autoHideDuration={snackBarDurationShortMs}
      >
        <Alert severity="success">
          {!token ? t('loginResetSuccess') : t('loginUpdateSuccess')}
        </Alert>
      </Snackbar>
    </LoginLayout>
  );
};

export default ResetPasswordPage;