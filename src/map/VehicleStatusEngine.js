/**
 * Dynamic device status engine for vehicle tracking
 * Evaluates telemetry packets and returns status based on conditions:
 * - Offline (Red): no updates for more than 3 hours
 * - Idling (Orange): ignition ON and speed === 0
 * - Moving (Green): speed > 1
 * - Stopped/Parked (Blue): speed <= 0 and ignition OFF
 */

// Status constants
export const STATUS_STOPPED = 'stopped';
export const STATUS_MOVING = 'moving';
export const STATUS_IDLING = 'idling';
export const STATUS_OFFLINE = 'offline';

// Color mapping for each status
export const STATUS_COLORS = {
  [STATUS_STOPPED]: '#1d4ed8',
  [STATUS_MOVING]: '#16a34a',
  [STATUS_IDLING]: '#ca8a04',
  [STATUS_OFFLINE]: '#dc2626',
};

// Time threshold for offline status (3 hours in milliseconds)
const OFFLINE_THRESHOLD_MS = 3 * 60 * 60 * 1000;

/**
 * Format relative time since last update
 * - Less than 60 seconds: "few seconds ago"
 * - 1 minute to 59 minutes: "X minutes ago"
 * - 1 hour to 23 hours: "X hours ago"
 * - 1 day or more: "X days ago"
 * 
 * @param {string|Date} fixTime - The last fix time from position data
 * @returns {string} - Formatted relative time string
 */
export const formatRelativeTime = (fixTime) => {
  if (!fixTime) return '';
  
  const now = new Date();
  const lastUpdate = new Date(fixTime);
  const diffMs = now.getTime() - lastUpdate.getTime();
  
  // Less than 60 seconds - show "few seconds ago"
  if (diffMs < 60 * 1000) {
    return 'few seconds ago';
  }
  
  // 1 minute to 59 minutes
  if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // 1 hour to 23 hours
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // 1 day or more
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

/**
 * Determine vehicle status based on telemetry data
 * Priority: Idling > Moving > Stopped > Offline
 * 
 * @param {Object} position - Position data with speed, attributes, fixTime
 * @param {Object} device - Device data with status
 * @returns {string} - Status string: 'stopped', 'moving', 'idling', or 'offline'
 */
export const getVehicleStatus = (position, device) => {
  // Check if position exists
  if (!position || !position.id) {
    return STATUS_OFFLINE;
  }

  // Check if device is offline based on last update time (3 hours threshold)
  if (position.fixTime) {
    const now = new Date();
    const lastUpdate = new Date(position.fixTime);
    const diffMs = now.getTime() - lastUpdate.getTime();
    
    if (diffMs > OFFLINE_THRESHOLD_MS) {
      return STATUS_OFFLINE;
    }
  }

  // Get speed in kph (position.speed is in knots)
  const speedKnots = position.speed || 0;
  const speedKph = speedKnots * 1.852;
  const speed = speedKph;

  // Get ignition state from position attributes
  const ignition = position.attributes?.ignition === true;

  // Priority: Idling takes precedence over Stopped
  // Idling: ignition ON and speed exactly 0
  if (ignition && speed === 0) {
    return STATUS_IDLING;
  }

  // Moving: speed > 1
  if (speed > 1) {
    return STATUS_MOVING;
  }

  // Stopped/Parked: speed <= 0 and ignition OFF
  if (speed <= 0 && !ignition) {
    return STATUS_STOPPED;
  }

  // Default to stopped for edge cases
  return STATUS_STOPPED;
};

/**
 * Get the color for a given status
 * @param {string} status - Status string
 * @returns {string} - Hex color code
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS[STATUS_OFFLINE];
};

/**
 * Get status label for display
 * @param {string} status - Status string
 * @param {Function} t - Translation function
 * @returns {string} - Status label
 */
export const getStatusLabel = (status, t) => {
  if (!t) {
    const labels = {
      [STATUS_STOPPED]: 'Parked',
      [STATUS_MOVING]: 'Moving',
      [STATUS_IDLING]: 'Idling',
      [STATUS_OFFLINE]: 'Offline',
    };
    return labels[status] || status;
  }
  const labels = {
    [STATUS_STOPPED]: t('deviceStatusParked') || 'Parked',
    [STATUS_MOVING]: t('deviceStatusMoving') || 'Moving',
    [STATUS_IDLING]: t('deviceStatusIdling') || 'Idling',
    [STATUS_OFFLINE]: t('deviceStatusOffline') || 'Offline',
  };
  return labels[status] || status;
};