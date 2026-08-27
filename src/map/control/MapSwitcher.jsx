import React, { useMemo } from 'react';
import {
  Menu,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(() => ({
  popoverPaper: {
    padding: '8px 6px !important',
    borderRadius: '14px !important',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16) !important',
    backgroundColor: '#ffffff !important',
    minWidth: '210px !important',
    border: '1px solid #e2e8f0 !important',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  formControlLabel: {
    margin: '0 !important',
    padding: '6px 10px !important',
    borderRadius: '8px !important',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9 !important',
    },
    '& .MuiTypography-root': {
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important",
      fontSize: '0.84rem !important',
      fontWeight: '700 !important',
      color: '#1e293b !important',
    },
  },
  customRadio: {
    padding: '3px 8px 3px 3px !important',
    color: '#cbd5e1 !important',
    '&.Mui-checked': {
      color: '#00ab8e !important',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '18px !important',
    },
  },
}));

const getFormattedTitle = (style) => {
  if (!style) return '';
  const id = (style.id || style).toString();
  switch (id) {
    case 'googleHybrid':
      return 'Google Hybrid';
    case 'googleRoad':
    case 'googleNormal':
      return 'Google Normal';
    case 'googleSatellite':
      return 'Google Satellite';
    case 'googleTerrain':
      return 'Google Terrain';
    case 'osm':
      return 'OpenStreetMap';
    default:
      return style.title || style.name || id;
  }
};

const MapSwitcher = ({
  styles = [],
  selectedId,
  onSelect,
  anchorEl,
  setAnchorEl,
}) => {
  const { classes } = useStyles();

  const availableStyles = useMemo(() => {
    if (Array.isArray(styles) && styles.length > 0) return styles;
    return [
      { id: 'googleHybrid', title: 'Google Hybrid' },
      { id: 'googleRoad', title: 'Google Normal' },
      { id: 'googleSatellite', title: 'Google Satellite' },
      { id: 'googleTerrain', title: 'Google Terrain' },
      { id: 'osm', title: 'OpenStreetMap' },
    ];
  }, [styles]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => setAnchorEl && setAnchorEl(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { className: classes.popoverPaper } }}
    >
      <RadioGroup
        value={selectedId || 'googleHybrid'}
        className={classes.radioGroup}
        onChange={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect(e.target.value);
          if (setAnchorEl) setAnchorEl(null);
        }}
      >
        {availableStyles.map((style) => (
          <FormControlLabel
            key={style.id}
            value={style.id}
            className={classes.formControlLabel}
            control={<Radio className={classes.customRadio} disableRipple />}
            label={getFormattedTitle(style)}
          />
        ))}
      </RadioGroup>
    </Menu>
  );
};

export default React.memo(MapSwitcher);