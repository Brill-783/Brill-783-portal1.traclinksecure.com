import {
  AppBar,
  Breadcrumbs,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import BackIcon from './BackIcon';

const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: '14px 16px',
    backgroundColor: '#f8fafc',
    fontFamily: FONT_FAMILY,
    [theme.breakpoints.down('sm')]: {
      padding: '8px',
    },
  },
  desktopHeader: {
    width: '100%',
    minHeight: '52px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    marginBottom: '10px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: '3px',
  },
  title: {
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
  },
  breadcrumbs: {
    fontFamily: FONT_FAMILY,
    fontSize: '11px',
    '& .MuiBreadcrumbs-separator': {
      color: '#94a3b8',
      marginLeft: '5px',
      marginRight: '5px',
    },
  },
  breadcrumbText: {
    fontFamily: FONT_FAMILY,
    fontSize: '11px',
    lineHeight: 1.2,
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    minHeight: 0,
    flex: '1 1 0%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: '5px',
      height: '5px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: '#94a3b8',
    },
  },
  mobileHeader: {
    width: '100%',
    minHeight: '46px',
    marginBottom: '8px',
    borderRadius: '9px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: 'none',
    overflow: 'hidden',
  },
  mobileToolbar: {
    minHeight: '46px !important',
    height: '46px',
    paddingLeft: '6px !important',
    paddingRight: '10px !important',
  },
  backButton: {
    width: '34px',
    height: '34px',
    marginRight: '5px',
    color: '#334155',
    borderRadius: '7px',
    '&:hover': {
      backgroundColor: '#f0fdfa',
      color: '#00ab8e',
    },
  },
  mobileTitle: {
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box className={classes.titleGroup}>
      <Typography className={classes.title}>
        {t(
          breadcrumbs[
            breadcrumbs.length - 1
          ],
        )}
      </Typography>

      <Breadcrumbs
        className={classes.breadcrumbs}
      >
        {breadcrumbs.map(
          (crumb, index) => (
            <Typography
              key={`${crumb}-${index}`}
              className={
                classes.breadcrumbText
              }
              sx={{
                color:
                  index ===
                  breadcrumbs.length - 1
                    ? '#00ab8e'
                    : '#64748b',
                fontWeight:
                  index ===
                  breadcrumbs.length - 1
                    ? 600
                    : 500,
              }}
            >
              {t(crumb)}
            </Typography>
          ),
        )}
      </Breadcrumbs>
    </Box>
  );
};

const PageLayout = ({
  breadcrumbs = [],
  children,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();

  const desktop = useMediaQuery(
    theme.breakpoints.up('md'),
  );

  return (
    <Box className={classes.root}>
      {!desktop && (
        <AppBar
          position="static"
          color="inherit"
          className={classes.mobileHeader}
        >
          <Toolbar
            className={
              classes.mobileToolbar
            }
          >
            <IconButton
              className={
                classes.backButton
              }
              edge="start"
              onClick={() =>
                navigate('/')
              }
              size="small"
            >
              <BackIcon />
            </IconButton>

            <Typography
              className={
                classes.mobileTitle
              }
            >
              {breadcrumbs.length > 0
                ? breadcrumbs[
                    breadcrumbs.length - 1
                  ] && (
                    <PageTitle
                      breadcrumbs={
                        breadcrumbs
                      }
                    />
                  )
                : ''}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {desktop &&
        breadcrumbs.length > 0 && (
          <Box
            className={
              classes.desktopHeader
            }
          >
            <PageTitle
              breadcrumbs={breadcrumbs}
            />
          </Box>
        )}

      <Box
        className={classes.content}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;