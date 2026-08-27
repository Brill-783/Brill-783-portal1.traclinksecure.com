import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

const SYSTEM_PRESET_COLORS = [
  '#00ab8e', // Emerald System Primary
  '#0ea5e9', // Sky Blue
  '#3b82f6', // Indigo Blue
  '#6366f1', // Royal Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Green
  '#64748b', // Slate Gray
  '#1e293b', // Dark Slate
];

const useStyles = makeStyles()(() => ({
  pickerRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    marginBottom: '12px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#475569',
  },
  presetsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid #ffffff',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    '&:hover': {
      transform: 'scale(1.15)',
    },
  },
  colorSwatchActive: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid #ffffff',
    boxShadow: '0 0 0 2px #00ab8e, 0 3px 8px rgba(0, 0, 0, 0.2)',
    transform: 'scale(1.1)',
  },
  customInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  nativeColorInput: {
    width: '32px',
    height: '32px',
    padding: '0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    '&::-webkit-color-swatch-wrapper': { padding: 0 },
    '&::-webkit-color-swatch': { border: '1px solid #cbd5e1', borderRadius: '6px' },
  },
  hexText: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
}));

const GradientColorPicker = ({ value = '#00ab8e', onChange }) => {
  const { classes } = useStyles();
  const [currentColor, setCurrentColor] = useState(value);
  const lastColorRef = useRef(value);

  // Sync internal state when prop changes, avoiding re-render loops
  useEffect(() => {
    if (value && value !== lastColorRef.current) {
      lastColorRef.current = value;
      setCurrentColor(value);
    }
  }, [value]);

  const handleSelectColor = useCallback(
    (newColor) => {
      if (newColor === lastColorRef.current) return;
      lastColorRef.current = newColor;
      setCurrentColor(newColor);
      if (onChange) {
        onChange(newColor);
      }
    },
    [onChange]
  );

  return (
    <Box className={classes.pickerRoot}>
      <Typography className={classes.label}>Geofence Color</Typography>

      <Box className={classes.presetsRow}>
        {SYSTEM_PRESET_COLORS.map((color) => {
          const isActive = currentColor?.toLowerCase() === color.toLowerCase();
          return (
            <Box
              key={color}
              className={isActive ? classes.colorSwatchActive : classes.colorSwatch}
              style={{ backgroundColor: color }}
              onClick={() => handleSelectColor(color)}
            />
          );
        })}
      </Box>

      <Box className={classes.customInputRow}>
        <input
          type="color"
          className={classes.nativeColorInput}
          value={currentColor || '#00ab8e'}
          onChange={(e) => handleSelectColor(e.target.value)}
        />
        <Typography className={classes.hexText}>
          {(currentColor || '#00ab8e').toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );
};

export default GradientColorPicker;