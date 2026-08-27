import { parse, stringify } from 'wellknown';
import turfCircle from '@turf/circle';
import gcoord from 'gcoord';
import { map } from './MapView';

const coordinateSystem = (id) => {
  switch (id) {
    case 'gcj02':
      return gcoord.GCJ02;
    default:
      return gcoord.WGS84;
  }
};

export const toMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform(
        [longitude, latitude],
        gcoord.WGS84,
        coordinateSystem(map.coordinateSystem),
      )
    : [longitude, latitude];

export const fromMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform(
        [longitude, latitude],
        coordinateSystem(map.coordinateSystem),
        gcoord.WGS84,
      )
    : [longitude, latitude];

const transformGeometry = (geometry, from, to) => ({
  ...geometry,
  coordinates: gcoord.transform(
    structuredClone(geometry.coordinates),
    from,
    to,
  ),
});

export const loadImage = (url) =>
  new Promise((imageLoaded) => {
    const image = new Image();
    image.onload = () => imageLoaded(image);
    image.src = url;
  });

const canvasTintImage = (image, color) => {
  const canvas = document.createElement('canvas');

  canvas.width = image.width * devicePixelRatio;
  canvas.height = image.height * devicePixelRatio;
  canvas.style.width = `${image.width}px`;
  canvas.style.height = `${image.height}px`;

  const context = canvas.getContext('2d');

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas;
};

export const prepareIcon = (background, icon, color) => {
  const canvas = document.createElement('canvas');

  canvas.width = background.width * devicePixelRatio;
  canvas.height = background.height * devicePixelRatio;
  canvas.style.width = `${background.width}px`;
  canvas.style.height = `${background.height}px`;

  const context = canvas.getContext('2d');

  context.drawImage(
    background,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  if (icon) {
    const iconRatio = 0.5;
    const imageWidth = canvas.width * iconRatio;
    const imageHeight = canvas.height * iconRatio;

    context.drawImage(
      canvasTintImage(icon, color),
      (canvas.width - imageWidth) / 2,
      (canvas.height - imageHeight) / 2,
      imageWidth,
      imageHeight,
    );
  }

  return context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
};

export const geofenceToFeature = (theme, item) => {
  if (!item.area || typeof item.area !== 'string' || item.area.length === 0) {
    return null;
  }

  let geometry;

  try {
    if (item.area.indexOf('CIRCLE') > -1) {
      const coordinates = item.area
        .replace(/CIRCLE|\(|\)|,/g, ' ')
        .trim()
        .split(/ +/);

      const lng = Number(coordinates[1]);
      const lat = Number(coordinates[0]);
      const radius = Number(coordinates[2]);

      if (
        coordinates.length < 3 ||
        isNaN(lng) ||
        isNaN(lat) ||
        isNaN(radius) ||
        radius <= 0
      ) {
        return null;
      }

      geometry = turfCircle(
        toMapCoordinates(lng, lat),
        radius,
        {
          steps: 32,
          units: 'meters',
        },
      ).geometry;

    } else {

      const parsed = parse(item.area);

      if (
        !parsed ||
        !parsed.coordinates ||
        !parsed.coordinates.length
      ) {
        return null;
      }

      geometry = parsed;

      if (map.coordinateSystem) {
        geometry = transformGeometry(
          geometry,
          gcoord.WGS84,
          coordinateSystem(map.coordinateSystem),
        );
      }
    }

  } catch {
    return null;
  }

  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes?.color || theme.palette.geometry.main,
      width: item.attributes?.mapLineWidth || 2,
      opacity: item.attributes?.mapLineOpacity || 1,
    },
  };
};
export const findFonts = (mapInstance) => {
  if (!mapInstance || typeof mapInstance.getStyle !== 'function') {
    return ['Roboto Regular'];
  }

  const fontSet = new Set();

  try {
    const style = mapInstance.getStyle();

    style?.layers?.forEach((layer) => {
      layer.layout?.['text-font']?.forEach?.(
        (font) => fontSet.add(font),
      );
    });

  } catch {
  }

  const fonts = [...fontSet];

  const regularFont = fonts.find((font) =>
    font.includes('Regular'),
  );

  if (regularFont) {
    return [regularFont];
  }

  if (fonts.length) {
    return [fonts[0]];
  }

  return ['Roboto Regular'];
};


export const geometryToArea = (geometry) => {
  let transformedGeometry = geometry;

  if (map.coordinateSystem) {
    transformedGeometry = transformGeometry(
      geometry,
      coordinateSystem(map.coordinateSystem),
      gcoord.WGS84,
    );
  }

  return stringify(transformedGeometry);
};