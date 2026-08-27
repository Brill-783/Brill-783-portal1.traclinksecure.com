import fetchOrThrow from './fetchOrThrow';
import { sessionActions, devicesActions, groupsActions, geofencesActions, driversActions, maintenancesActions } from '../../store';

const BACKUP_ID_KEY = 'admin_session_backup_id';
const BACKUP_EMAIL_KEY = 'admin_session_backup_email';
const IMPERSONATED_ID_KEY = 'impersonated_user_id';
const IMPERSONATED_EMAIL_KEY = 'impersonated_user_email';

export const isImpersonating = () => Boolean(localStorage.getItem(BACKUP_ID_KEY) || localStorage.getItem(IMPERSONATED_ID_KEY));

export const getImpersonationInfo = () => ({
  backupAdminId: localStorage.getItem(BACKUP_ID_KEY),
  backupAdminEmail: localStorage.getItem(BACKUP_EMAIL_KEY),
  impersonatedUserId: localStorage.getItem(IMPERSONATED_ID_KEY),
  impersonatedUserEmail: localStorage.getItem(IMPERSONATED_EMAIL_KEY),
  impersonating: Boolean(localStorage.getItem(BACKUP_ID_KEY) || localStorage.getItem(IMPERSONATED_ID_KEY)),
});

export const clearImpersonationFlags = () => {
  localStorage.removeItem(BACKUP_ID_KEY);
  localStorage.removeItem(BACKUP_EMAIL_KEY);
  localStorage.removeItem(IMPERSONATED_ID_KEY);
  localStorage.removeItem(IMPERSONATED_EMAIL_KEY);
};

const clearClientState = (dispatch) => {
  if (devicesActions?.selectId) dispatch(devicesActions.selectId(null));
  if (devicesActions?.clear) dispatch(devicesActions.clear());
  if (groupsActions?.refresh) dispatch(groupsActions.refresh([]));
  if (geofencesActions?.refresh) dispatch(geofencesActions.refresh([]));
  if (driversActions?.refresh) dispatch(driversActions.refresh([]));
  if (maintenancesActions?.refresh) dispatch(maintenancesActions.refresh([]));
  if (sessionActions?.clearUserData) dispatch(sessionActions.clearUserData());
};

const loadDevicesForCurrentUser = async (dispatch, impersonatedId = null) => {
  try {
    const url = impersonatedId ? `/api/devices?userId=${impersonatedId}` : '/api/devices';
    const response = await fetchOrThrow(url, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    const list = Array.isArray(data) ? data : Object.values(data || {});

    if (devicesActions?.refresh) {
      dispatch(devicesActions.refresh(list));
    }

    return list;
  } catch {
    return [];
  }
};

export const startImpersonation = async (currentUser, targetUserId, dispatch) => {
  if (!targetUserId) {
    throw new Error('Target user is required.');
  }

  if (currentUser?.id && String(currentUser.id) === String(targetUserId)) {
    throw new Error('You are already logged in as this user.');
  }

  // Back up admin identity before switching
  if (currentUser?.id) {
    localStorage.setItem(BACKUP_ID_KEY, String(currentUser.id));
    localStorage.setItem(BACKUP_EMAIL_KEY, String(currentUser.email || currentUser.login || currentUser.name || 'Admin'));
  }

  let sessionUser = null;
  let token = null;

  // Try 1: Traccar direct session switch /api/session/{userId}
  try {
    const switchRes = await fetch(`/api/session/${targetUserId}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (switchRes.ok) {
      sessionUser = await switchRes.json();
    }
  } catch {}

  // Try 2: Generate user token
  if (!sessionUser) {
    try {
      const tokenRes = await fetch(`/api/session/token?userId=${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({
          expiration: new Date(Date.now() + 86400000).toISOString(),
        }),
      });

      if (tokenRes.ok) {
        token = (await tokenRes.text()).trim();
      }
    } catch {}

    if (token) {
      const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        sessionUser = await response.json();
      }
    }
  }

  // Try 3: Query /api/session?userId=
  if (!sessionUser) {
    const response = await fetch(`/api/session?userId=${targetUserId}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      sessionUser = await response.json();
    }
  }

  if (!sessionUser) {
    throw new Error('Unable to switch to this user account on the server.');
  }

  const targetUser = sessionUser.user || sessionUser;

  localStorage.setItem(IMPERSONATED_ID_KEY, String(targetUserId));
  localStorage.setItem(IMPERSONATED_EMAIL_KEY, String(targetUser.email || targetUser.login || targetUser.name || ''));

  clearClientState(dispatch);
  dispatch(sessionActions.updateUser(targetUser));
  await loadDevicesForCurrentUser(dispatch, targetUserId);

  return {
    user: targetUser,
    token,
  };
};

export const returnToAdmin = async (dispatch) => {
  const backupId = localStorage.getItem(BACKUP_ID_KEY);
  let adminUser = null;

  if (backupId) {
    try {
      const response = await fetch(`/api/session/${backupId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        adminUser = await response.json();
      }
    } catch {}
  }

  if (!adminUser) {
    const response = await fetchOrThrow('/api/session', {
      method: 'GET',
      credentials: 'include',
    });
    adminUser = await response.json();
  }

  const restoredUser = adminUser?.user || adminUser;

  clearImpersonationFlags();
  clearClientState(dispatch);

  if (restoredUser) {
    dispatch(sessionActions.updateUser(restoredUser));
  }

  await loadDevicesForCurrentUser(dispatch, null);

  return {
    user: restoredUser,
  };
};

export const logoutOrReturnToAdmin = async (dispatch, navigate) => {
  if (isImpersonating()) {
    await returnToAdmin(dispatch);
    if (navigate) {
      navigate('/settings/users', { replace: true });
    }
    return true;
  }
  return false;
};
