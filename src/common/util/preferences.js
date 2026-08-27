import { useSelector } from 'react-redux';

export const usePreference = (key, defaultValue) => {
  return useSelector((state) => {
    const userVal = state.session.user?.attributes?.[key];
    if (userVal !== undefined && userVal !== null) {
      return userVal;
    }
    const serverVal = state.session.server?.attributes?.[key];
    if (serverVal !== undefined && serverVal !== null) {
      return serverVal;
    }
    return defaultValue;
  });
};

export const useAttributePreference = (key, defaultValue) => {
  return useSelector((state) => {
    const userAttr = state.session.user?.attributes?.[key];
    if (userAttr !== undefined && userAttr !== null) {
      return userAttr;
    }
    const serverAttr = state.session.server?.attributes?.[key];
    if (serverAttr !== undefined && serverAttr !== null) {
      return serverAttr;
    }
    return defaultValue;
  });
};

export const getPreference = (state, key, defaultValue) => {
  const userVal = state.session?.user?.attributes?.[key];
  if (userVal !== undefined && userVal !== null) {
    return userVal;
  }
  const serverVal = state.session?.server?.attributes?.[key];
  if (serverVal !== undefined && serverVal !== null) {
    return serverVal;
  }
  return defaultValue;
};