import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

/**
 * useFilter - Filters and sorts devices based on keyword, status, group, and geofence filters
 * Returns filtered devices and positions directly (no state setters needed)
 * 
 * @param {string} keyword - Search keyword
 * @param {Object} filter - Filter object with statuses, groups, geofences arrays
 * @param {string} filterSort - Sort type ('name' or 'lastUpdate')
 * @param {boolean} filterMap - Whether to filter positions to only show filtered devices
 * @param {Object} positions - Positions object from Redux state
 * @returns {Object} - { filteredDevices, filteredPositions }
 */
  export default (keyword, filter, filterSort, filterMap, positions) => {
    const groups = useSelector((state) => state.groups.items);
    const devices = useSelector((state) => state.devices.items);

    // Memoize device groups calculation
    const getDeviceGroupIds = useCallback((device) => {
      const groupIds = [];
      let { groupId } = device;
      while (groupId) {
        groupIds.push(groupId);
        const parentGroup = groups[groupId];
        groupId = parentGroup?.groupId || 0;
      }
      return groupIds;
    }, [groups]);

    // Memoize keyword check
    const keywordCheck = useCallback((device) => {
      if (!keyword) return true;
      const lowerCaseKeyword = keyword.toLowerCase();
      return [device.name, device.uniqueId, device.phone, device.model, device.contact].some(
        (s) => s && s.toLowerCase().includes(lowerCaseKeyword),
      );
    }, [keyword]);

    // Memoize the filtered devices
    const filteredDevices = useMemo(() => {
      const deviceEntries = Array.isArray(devices) ? devices : Object.values(devices || {});

      const filtered = deviceEntries.filter((device) => {
        // Keyword filter
        if (!keywordCheck(device)) {
          return false;
        }

        // Single-select filter based on real-time position attributes
        const activeFilter = (filter.activeFilter || 'all').toLowerCase();
        if (activeFilter && activeFilter !== 'all') {
          const position = positions[device.id] || device.position || {};
          const attributes = position.attributes || {};

          const rawSpeed = Number(position.speed || 0);
          const speedKph = rawSpeed > 0 ? (rawSpeed > 5 ? rawSpeed : rawSpeed * 1.852) : 0;

          const deviceStatus = (device.status || 'offline').toLowerCase();
          const isIgnitionOn = Boolean(attributes.ignition);
          const hasConnected = Boolean(device.lastUpdate || position.fixTime);

          let matches = false;
          switch (activeFilter) {
            case 'online':
              matches = deviceStatus === 'online';
              break;
            case 'offline':
              matches = deviceStatus === 'offline' && hasConnected;
              break;
            case 'moving':
              matches = speedKph > 1 && deviceStatus === 'online';
              break;
            case 'parked':
              matches = speedKph <= 1 && !isIgnitionOn && deviceStatus === 'online';
              break;
            case 'idling':
              matches = speedKph <= 1 && isIgnitionOn && deviceStatus === 'online';
              break;
            case 'neverconnected':
              matches = !hasConnected || deviceStatus === 'unknown';
              break;
            default:
              matches = true;
          }

          if (!matches) {
            return false;
          }
        }

        // Group filter
        if (filter.groups.length) {
          const groupIds = getDeviceGroupIds(device);
          if (!groupIds.some((id) => filter.groups.includes(id))) {
            return false;
          }
        }

        // Geofence filter
        if (filter.geofences.length) {
          const devicePosition = positions[device.id];
          const geofenceIds = devicePosition?.geofenceIds || [];
          if (!geofenceIds.some((id) => filter.geofences.includes(id))) {
            return false;
          }
        }

        return true;
      });

      // Sort alphabetically by device name A-Z
      filtered.sort((a, b) => {
        const nameA = (a.name || '').trim().toLowerCase();
        const nameB = (b.name || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      return filtered;
    }, [devices, filter, positions, getDeviceGroupIds, keywordCheck]);

    // Memoize filtered positions when devices or filterMap changes
    const filteredPositions = useMemo(() => {
      if (filterMap) {
        return filteredDevices.map((device) => positions[device.id]).filter(Boolean);
      }
      return Object.values(positions);
    }, [filterMap, filteredDevices, positions]);

    return { filteredDevices, filteredPositions };
  };