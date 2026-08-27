// src/common/util/authUtils.js

export const isUserAdmin = (user) => Boolean(user && (user.administrator || user.admin));

export const isUserExpired = (user) => {
  if (!user || !user.expirationTime) return false;
  const expDate = new Date(user.expirationTime);
  return !isNaN(expDate.getTime()) && expDate <= new Date();
};

export const getDefaultRouteForUser = (user) => {
  if (!user) return '/login';
  return isUserAdmin(user) ? '/admin' : '/?tab=Objects';
};

export const getValidatedPostLoginDestination = (user, storedDestination) => {
  if (!user) return '/login';
  const isAdmin = isUserAdmin(user);

  if (!storedDestination || typeof storedDestination !== 'string' || !storedDestination.startsWith('/')) {
    return getDefaultRouteForUser(user);
  }

  // Prevent routing to authentication or system exit paths
  if (['/login', '/register', '/reset-password', '/change-server'].includes(storedDestination)) {
    return getDefaultRouteForUser(user);
  }

  // Non-admin attempting to access an administrator route
  if (!isAdmin && (storedDestination.startsWith('/admin') || storedDestination.startsWith('/server-custom'))) {
    return '/?tab=Objects';
  }

  return storedDestination;
};