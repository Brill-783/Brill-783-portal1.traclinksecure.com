import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAsyncTask } from './reactHelper';
import {
  devicesActions,
  groupsActions,
  geofencesActions,
  driversActions,
  maintenancesActions,
  calendarsActions,
  sessionActions,
  usersActions,
} from './store';
import { eventsActions } from './store/events';
import { notificationsActions } from './store/notifications';

const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, { ...options, credentials: 'include' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return null;
};

const PreloadController = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const preloadComplete = useSelector((state) => state.session.preloadComplete);
  const [internalDone, setInternalDone] = useState(false);

  useEffect(() => {
    if (internalDone && !preloadComplete) {
      dispatch(sessionActions.setPreloadComplete(true));
    }
  }, [dispatch, internalDone, preloadComplete]);

  useAsyncTask(
    async ({ signal }) => {
      if (!user || preloadComplete) {
        setInternalDone(true);
        return;
      }

      const isAdmin = Boolean(user.administrator || user.admin);
      const impersonatedId = localStorage.getItem('impersonated_user_id');
      const deviceEndpoint = impersonatedId
        ? `/api/devices?userId=${impersonatedId}`
        : '/api/devices';

      // 1. Synchronously fetch all critical data during the spinner
      const [
        serverData,
        devicesData,
        positionsData,
        groupsData,
        usersData,
      ] = await Promise.all([
        safeFetchJson('/api/server', { signal }),
        safeFetchJson(deviceEndpoint, { signal }),
        safeFetchJson('/api/positions', { signal }),
        safeFetchJson('/api/groups', { signal }),
        isAdmin ? safeFetchJson('/api/users', { signal }) : Promise.resolve(null),
      ]);

      if (serverData) dispatch(sessionActions.updateServer(serverData));
      if (devicesData) {
        const list = Array.isArray(devicesData) ? devicesData : Object.values(devicesData);
        dispatch(devicesActions.refresh(list));
        if (impersonatedId) {
          sessionStorage.setItem(`user_devices_${impersonatedId}`, JSON.stringify(list.map((d) => d.id)));
        }
      }
      if (positionsData) dispatch(sessionActions.updatePositions(positionsData));
      if (groupsData) dispatch(groupsActions.refresh(groupsData));
      if (usersData) {
        const userList = Array.isArray(usersData) ? usersData : Object.values(usersData);
        dispatch(usersActions.refresh(userList));
      }

      // ONLY set complete after all users and devices are inside Redux
      setInternalDone(true);
      dispatch(sessionActions.setPreloadComplete(true));

      // 2. Non-blocking secondary caches (reports, geofences, calendars)
      Promise.all([
        safeFetchJson('/api/geofences', { signal }),
        safeFetchJson('/api/drivers', { signal }),
        safeFetchJson('/api/maintenance', { signal }),
        safeFetchJson('/api/calendars', { signal }),
        safeFetchJson('/api/notifications?limit=100&offset=0', { signal }),
        safeFetchJson(
          '/api/reports/events?page=0&pageSize=100&from=' +
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() +
            '&to=' +
            new Date().toISOString(),
          { signal }
        ),
      ]).then(([geofences, drivers, maintenances, calendars, notifications, events]) => {
        if (geofences) dispatch(geofencesActions.refresh(geofences));
        if (drivers) dispatch(driversActions.refresh(drivers));
        if (maintenances) dispatch(maintenancesActions.refresh(maintenances));
        if (calendars) dispatch(calendarsActions.refresh(calendars));
        if (notifications) dispatch(notificationsActions.set(Array.isArray(notifications) ? notifications : []));
        if (events) {
          const items = Array.isArray(events) ? events : events.items || [];
          dispatch(eventsActions.mergeHistorical(items));
        }
      });
    },
    [dispatch, user, preloadComplete]
  );

  return null;
};

export default PreloadController;