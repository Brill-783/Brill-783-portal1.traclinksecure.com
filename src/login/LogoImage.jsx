import React from 'react';
import { useTheme } from '@mui/material';
import { useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(() => ({
  image: {
    display: 'block',
    margin: '0 auto',
    height: '16px',
    maxHeight: '16px',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    transition: 'all 0.2s ease',
  },
}));

const LogoImage = ({ className, style, variant = 'default', onClick }) => {
  const theme = useTheme();
  const { classes } = useStyles();
  const isDarkMode = theme.palette.mode === 'dark';

  const server = useSelector((state) => state.session?.server, shallowEqual) || {};
  const attributes = server?.attributes || {};

  const logo = attributes.logo;
  const logoInverted = attributes.logoInverted;
  const frontpageLogo = attributes.frontpageLogo;
  const loginLogo = attributes.loginLogo;

  let src;
  if (variant === 'login') {
    src = loginLogo || frontpageLogo || (isDarkMode && logoInverted ? logoInverted : (logo || '/logo.png'));
  } else if (variant === 'frontpage') {
    src = frontpageLogo || (isDarkMode && logoInverted ? logoInverted : (logo || '/logo.png'));
  } else {
    src = (isDarkMode && logoInverted) ? logoInverted : (logo || frontpageLogo || '/logo.png');
  }

  return (
    <img
      className={[classes.image, className].filter(Boolean).join(' ')}
      style={style}
      src={src}
      alt="Platform Logo"
      onClick={onClick}
    />
  );
};

export default LogoImage;