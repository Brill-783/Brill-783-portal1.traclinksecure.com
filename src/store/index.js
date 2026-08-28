import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { errorsReducer as errors } from './errors';
import { sessionReducer as session } from './session';
import { devicesReducer as devices } from './devices';
import { eventsReducer as events } from './events';
import { notificationsReducer as notifications } from './notifications';
import { motionReducer as motion } from './motion';
import { geofencesReducer as geofences } from './geofences';
import { groupsReducer as groups } from './groups';
import { driversReducer as drivers } from './drivers';
import { maintenancesReducer as maintenances } from './maintenances';
import { calendarsReducer as calendars } from './calendars';
import { usersReducer as users } from './users';
import throttleMiddleware from './throttleMiddleware';

const reducer = (state, action) => {
  if (action.type === 'RESET_STORE') {
    return combineReducers({
      errors,
      session,
      devices,
      events,
      notifications,
      motion,
      geofences,
      groups,
      drivers,
      maintenances,
      calendars,
      users,
    })(undefined, action);
  }
  return combineReducers({
    errors,
    session,
    devices,
    events,
    notifications,
    motion,
    geofences,
    groups,
    drivers,
    maintenances,
    calendars,
    users,
  })(state, action);
};

export { errorsActions } from './errors';
export { sessionActions } from './session';
export { devicesActions } from './devices';
export { eventsActions } from './events';
export { notificationsActions } from './notifications';
export { motionActions } from './motion';
export { geofencesActions } from './geofences';
export { groupsActions } from './groups';
export { driversActions } from './drivers';
export { maintenancesActions } from './maintenances';
export { calendarsActions } from './calendars';
export { usersActions } from './users';

export default configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(throttleMiddleware),
});