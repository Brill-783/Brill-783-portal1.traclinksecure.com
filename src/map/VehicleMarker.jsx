import maplibregl from 'maplibre-gl';

/**
 * Creates a custom vehicle marker element with dynamic status coloring
 *
 * @param {Object} options - Marker options
 * @param {number} options.latitude - Vehicle latitude
 * @param {number} options.longitude - Vehicle longitude
 * @param {string} options.name - Vehicle name
 * @param {number} options.speed - Speed in knots
 * @param {number} options.course - Course/heading in degrees
 * @param {string} options.status - Device status
 * @param {Object} options.position - Full position data
 * @param {Object} options.device - Full device data
 * @param {Function} options.onClick - Click handler
 * @returns {maplibregl.Marker} - MapLibre marker instance
 */
export const createVehicleMarker = ({
  latitude,
  longitude,
  name,
  speed,
  course,
  status,
  position,
  device,
  onClick,
}) => {
  const arrowColor = '#22c55e';

  const speedKph = speed ? Math.round(speed * 1.852) : 0;

  const markerEl = document.createElement('div');
  markerEl.className = 'vehicle-marker-container';
  markerEl.style.position = 'relative';
  markerEl.style.cursor = 'pointer';

  if (onClick) {
    markerEl.addEventListener('click', (e) => {
      e.preventDefault();
      onClick(e);
    });
  }

  const labelBubble = document.createElement('div');
  labelBubble.className = 'vehicle-label-bubble';
  labelBubble.innerHTML = `
    <div class="vehicle-label-text">${name} (${speedKph} kph)</div>
    <div class="vehicle-label-tail"></div>
  `;

  const arrow = document.createElement('div');
  arrow.className = 'vehicle-arrow-wrapper';
  arrow.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0 L18 18 L2 18 Z" fill="${arrowColor}"/>
    </svg>
  `;
  const rotation = course || 0;
  arrow.style.transform = `rotate(${rotation}deg)`;

  markerEl.appendChild(labelBubble);
  markerEl.appendChild(arrow);

  return new maplibregl.Marker(markerEl, {
    anchor: 'bottom',
  }).setLngLat([longitude, latitude]);
};

export default createVehicleMarker;
