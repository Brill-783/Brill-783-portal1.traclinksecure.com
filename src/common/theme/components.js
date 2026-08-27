export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },

  MuiContainer: {
    defaultProps: {
      maxWidth: false,
      disableGutters: true,
    },
    styleOverrides: {
      root: {
        width: '100%',
        maxWidth: '100%',
        paddingLeft: '0',
        paddingRight: '0',
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: '#ffffff',
        borderRadius: theme.dimensions?.radius?.sm || '8px',
        transition: 'border-color 0.15s ease',
        border: '1px solid',
        borderColor: '#e2e8f0',

        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#cbd5e1',
        },

        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: '1px',
        },
      }),

      input: () => ({
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#0f172a',
        padding: '6px 8px',
      }),

      notchedOutline: () => ({
        borderColor: '#e2e8f0',
      }),
    },
  },

  MuiInputBase: {
    styleOverrides: {
      input: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
      }),
    },
  },

  MuiButton: {
    styleOverrides: {
      sizeMedium: {
        height: '32px',
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.75rem',
      },

      root: ({ theme }) => ({
        borderRadius: theme.dimensions?.radius?.sm || '8px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.75rem',
        transition: 'all 0.15s ease',
      }),

      containedPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff',

        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'dark'
              ? '#2dd4bf'
              : theme.palette.themeColors?.primaryDark || '#008f77',
          opacity: 0.95,
          transform: 'translateY(-1px)',
          boxShadow: theme.dimensions?.shadow?.lg || '0 4px 12px rgba(0,0,0,0.1)',
        },
      }),

      outlined: ({ theme }) => ({
        borderColor: theme.palette.mode === 'dark' ? '#475569' : '#cbd5e1',
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#334155',
        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,171,142,0.04)',
          borderColor: theme.palette.primary.main,
        },
      }),

      text: ({ theme }) => ({
        color: theme.palette.primary.main,
        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,171,142,0.06)',
        },
      }),
    },
  },

  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    },
  },

  MuiTooltip: {
    defaultProps: {
      enterDelay: 300,
      enterNextDelay: 300,
    },

    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#0f172a',
        fontSize: '0.75rem',
        fontWeight: 500,
        borderRadius: theme.dimensions?.radius?.sm || '6px',
      }),
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
        fontSize: '0.875rem',
        '@media print': {
          color: theme.palette.alwaysDark?.main || '#000000',
        },
      }),
      head: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
        fontWeight: 600,
      }),
    },
  },

  MuiTypography: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
      }),
      body1: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
      }),
      body2: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#cbd5e1' : '#64748b',
      }),
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#0f172a',
        fontWeight: 500,
      }),
      secondary: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
      }),
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: 'none',
        borderRadius: theme.dimensions?.radius?.lg || '12px',
        boxSizing: 'border-box',
      }),
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.dimensions?.radius?.sm || '6px',
        backgroundColor: '#ffffff',
        boxShadow: theme.dimensions?.shadow?.xxl || '0 25px 50px -12px rgba(0,0,0,0.25)',
      }),
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.dimensions?.radius?.sm || '8px',
        transition: 'all 0.15s ease',
        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 171, 142, 0.06)',
        },
      }),
    },
  },

  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.dimensions?.radius?.md || '10px',
        backgroundColor: theme.palette.background.paper,
      }),
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.875rem',
        fontWeight: 500,
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#334155',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? '#334155' : '#f8fafc',
        },
      }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: theme.dimensions?.radius?.md || '10px',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12)',
      }),
      list: {
        padding: '4px 0',
      },
    },
  },

  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: theme.dimensions?.radius?.md || '10px',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12)',
      }),
    },
  },

  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.dimensions?.radius?.sm || '6px',
        fontWeight: 500,
        backgroundColor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9',
        color: theme.palette.mode === 'dark' ? '#f1f5f9' : '#475569',
      }),
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.875rem',
        fontWeight: 500,
        color: theme.palette.mode === 'dark' ? '#cbd5e1' : '#64748b',
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
      }),
    },
  },

  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.dimensions?.radius?.sm || '6px',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.2s ease',
          '& fieldset': {
            borderColor: '#e2e8f0',
          },
          '&:hover fieldset': {
            borderColor: theme.palette.themeColors?.primaryDark || '#008f77',
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: '1px',
          },
        },
      }),
    },
  },

  MuiAutocomplete: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.dimensions?.radius?.sm || '6px',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.2s ease',
          '& fieldset': {
            borderColor: '#e2e8f0',
          },
          '&:hover fieldset': {
            borderColor: theme.palette.themeColors?.primaryDark || '#008f77',
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
          },
        },
      }),
      popup: () => ({
        '& .MuiPaper-root': {
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
        },
      }),
    },
  },

  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.dimensions?.radius?.sm || '6px',
          backgroundColor: '#ffffff',
        },
      }),
    },
  },

  MuiAccordion: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.dimensions?.radius?.lg || '12px',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        marginBottom: '12px',
        boxShadow: 'none',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: 0,
        },
      }),
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        minHeight: '48px',
        '&.Mui-expanded': {
          minHeight: '48px',
        },
      }),
      content: {
        margin: 0,
        '&.Mui-expanded': {
          margin: 0,
        },
      },
    },
  },

  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        padding: '16px 20px 20px',
      },
    },
  },
};