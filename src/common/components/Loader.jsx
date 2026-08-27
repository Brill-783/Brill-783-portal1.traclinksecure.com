import React from 'react';
import { Box } from '@mui/material';

import backgroundSvg from '../../resources/images/background.svg';

const Loader = ({ mini = false }) => {
  if (mini) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2.5px solid #e2e8f0',
            borderTopColor: '#00ab8e',
            borderRightColor: '#00ab8e',
            animation: 'spinRing 0.75s linear infinite',
            '@keyframes spinRing': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: '#f1f5f9',
        backgroundImage: `radial-gradient(rgba(241, 245, 249, 0.72), rgba(241, 245, 249, 0.88)), url('${backgroundSvg}'), url('/background.svg')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          onError={(e) => {
            if (!e.target.src.endsWith('.svg')) {
              e.target.src = '/logo.svg';
            }
          }}
          sx={{
            maxHeight: 38,
            maxWidth: 190,
            objectFit: 'contain',
          }}
        />
      </Box>

      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid rgba(226, 232, 240, 0.9)',
          borderTopColor: '#00ab8e',
          borderRightColor: '#00ab8e',
          animation: 'spinTracklink 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          '@keyframes spinTracklink': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />
    </Box>
  );
};

export default Loader;