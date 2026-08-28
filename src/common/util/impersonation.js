import fetchOrThrow from './fetchOrThrow';
import { sessionActions, devicesActions, groupsActions, geofencesActions, driversActions, maintenancesActions } from '../../store';

const BACKUP_ID_KEY = 'admin_session_backup_id';
const BACKUP_EMAIL_KEY = 'admin_session_backup_email';
const IMPERSONATED_ID_KEY = 'impersonated_user_id';
const IMPERSONATED_EMAIL_KEY = 'impersonated_user_email';

export const getBackupId = () => localStorage.getItem(BACKUP_ID_KEY);
export const getBackupEmail = () => localStorage.getItem(BACKUP_EMAIL_KEY);

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
  localStorage.removeItem('admin_token_backup');
};

const clearClientState = (dispatch) => {
  if (dispatch) {
    dispatch({ type: 'RESET_STORE' });
  }
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

  // Back up an admin session token so the original administrator session can be
  // restored later. Once we switch to the target user, the server session loses
  // administrator privileges and can no longer perform the switch-back itself.
  try {
    const tokenRes = await fetch('/api/session/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: new URLSearchParams({
        expiration: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    if (tokenRes.ok) {
      localStorage.setItem('admin_token_backup', (await tokenRes.text()).trim());
    }
  } catch {}

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

  window.location.assign('/');

  return {
    user: targetUser,
    token,
  };
};

export const stopImpersonation = async (dispatch) => {
  const backupId = localStorage.getItem(BACKUP_ID_KEY);
  const adminToken = localStorage.getItem('admin_token_backup');
  let adminUser = null;

  // Restore the original administrator session. While impersonating, the active
  // server session belongs to the target user (who lacks admin privileges), so the
  // switch-back must be authenticated with the backed-up administrator token.
  if (adminToken) {
    try {
      const response = await fetch(`/api/session?token=${encodeURIComponent(adminToken)}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        adminUser = await response.json();
      }
    } catch {}
  }

  // Fallbacks for environments where the token backup is unavailable.
  if (!adminUser && backupId) {
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
    try {
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        adminUser = await response.json();
      }
    } catch {}
  }

  const restoredUser = adminUser?.user || adminUser;

  clearImpersonationFlags();
  if (dispatch) {
    clearClientState(dispatch);
    if (restoredUser) {
      dispatch(sessionActions.updateUser(restoredUser));
    }
  }

  window.location.assign('/');
};

export const returnToAdmin = stopImpersonation;

export const logoutOrReturnToAdmin = async (dispatch, navigate) => {
  if (isImpersonating()) {
    await stopImpersonation(dispatch);
    if (navigate) {
      navigate('/settings/users', { replace: true });
    }
    return true;
  }
  return false;
};
