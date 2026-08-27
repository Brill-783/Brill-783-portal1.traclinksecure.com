import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

const DriverValue = ({ driverUniqueId, driverId }) => {
  const driversMap = useSelector((state) => state.drivers?.items || {}, shallowEqual);

  const driver = React.useMemo(() => {
    const list = Array.isArray(driversMap) ? driversMap : Object.values(driversMap || {});
    if (driverId) {
      const match = list.find((d) => String(d?.id) === String(driverId));
      if (match) return match;
    }
    if (driverUniqueId) {
      const match = list.find((d) => String(d?.uniqueId) === String(driverUniqueId));
      if (match) return match;
    }
    return null;
  }, [driversMap, driverId, driverUniqueId]);

  return driver?.name || driverUniqueId || '—';
};

export default DriverValue;