import { makeStyles } from 'tss-react/mui';

export default makeStyles()((theme) => ({
  table: {
    marginBottom: theme.spacing(10),
  },
  columnAction: {
    width: '1%',
    paddingRight: theme.spacing(1),
  },
  container: {
    marginTop: theme.spacing(2),
  },
  buttons: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2),
    '& > *': {
      flex: 1,
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    paddingBottom: theme.spacing(3),
  },
  verticalActions: {
    display: 'flex',
    flexDirection: 'column',
  },
  formField: {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.2s ease',
      '& fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.themeColors?.primaryDark || '#0096c7',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.themeColors?.primaryDark || '#0096c7',
        borderWidth: '1px',
      },
    },
    '& .MuiInputBase-input': {
      padding: '12px 14px',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#212121',
    },
    '& .MuiInputLabel-root': {
      display: 'none',
    },
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: theme.spacing(2),
    '& .MuiAccordionSummary-root': {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      '& .MuiTypography-root': {
        fontWeight: 600,
        color: '#0f172a',
      },
    },
  },
  formButton: {
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 600,
    height: '40px',
    fontSize: '0.875rem',
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: '#ffffff',
    '&:hover': {
      backgroundColor: theme.palette.themeColors?.primaryDark || '#0096c7',
    },
  },
}));
