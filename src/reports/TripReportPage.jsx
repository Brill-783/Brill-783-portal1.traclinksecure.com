import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Typography,
  Button,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import RouteIcon from '@mui/icons-material/Route';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import {
  formatAddress,
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import ResizeHandle from './components/ResizeHandle';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch, useCatchCallback, useAsyncTask } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import dayjs from 'dayjs';

const PRIMARY = '#00ab8e';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_SIZE_12 = '12px !important';

const LOGO_SVG = `
  <div style="display: flex; align-items: center;">
    <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="4.5" fill="#00ab8e"/>
      <path d="M12.5 9.5C9.5 12 7.5 15.5 7.5 19.5C7.5 23.5 9.5 27 12.5 29.5" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M23.5 9.5C26.5 12 28.5 15.5 28.5 19.5C28.5 23.5 26.5 27 23.5 29.5" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M7 5C3 8.5 0.5 13.5 0.5 19.5C0.5 25.5 3 30.5 7 34" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M29 5C33 8.5 35.5 13.5 35.5 19.5C35.5 25.5 33 30.5 29 34" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
  </div>
`;

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'reportStartOdometer'],
  ['startAddress', 'reportStartAddress'],
  ['endTime', 'reportEndTime'],
  ['endOdometer', 'reportEndOdometer'],
  ['endAddress', 'reportEndAddress'],
  ['distance', 'sharedDistance'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['duration', 'reportDuration'],
  ['spentFuel', 'reportSpentFuel'],
  ['driverName', 'sharedDriver'],
];
const columnsMap = new Map(columnsArray);

const TripReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const reduxDevices = useSelector((state) => state.devices.items || {}, shallowEqual);
  const devices = useMemo(() => {
    return Array.isArray(reduxDevices)
      ? reduxDevices.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      : reduxDevices;
  }, [reduxDevices]);

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [columns, setColumns] = usePersistedState('tripColumns', [
    'startTime',
    'endTime',
    'distance',
    'duration',
    'averageSpeed',
    'startAddress',
    'endAddress',
  ]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);

  const [filterParams, setFilterParams] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    deviceIds: [],
  });

  const createMarkers = () => [
    {
      latitude: selectedItem.startLat,
      longitude: selectedItem.startLon,
      image: 'start-success',
    },
    {
      latitude: selectedItem.endLat,
      longitude: selectedItem.endLon,
      image: 'finish-error',
    },
  ];

  useAsyncTask(
    async ({ signal }) => {
      if (selectedItem) {
        const query = new URLSearchParams({
          deviceId: selectedItem.deviceId,
          from: selectedItem.startTime,
          to: selectedItem.endTime,
        });
        const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
          headers: { Accept: 'application/json' },
          signal,
        });
        setRoute(await response.json());
      } else {
        setRoute(null);
      }
    },
    [selectedItem],
  );

  const onShow = useCatchCallback(async ({ deviceIds, groupIds, from, to }) => {
    setFilterParams({ deviceIds, from, to });
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/trips?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const totalSummary = useMemo(() => {
    const totalDist = items.reduce((acc, it) => acc + (it.distance || 0), 0);
    const totalDurationMs = items.reduce((acc, it) => acc + (it.duration || 0), 0);
    const maxSpd = items.reduce((acc, it) => Math.max(acc, it.maxSpeed || 0), 0);

    return {
      distance: formatDistance(totalDist, distanceUnit, t),
      duration: formatNumericHours(totalDurationMs, t),
      maxSpeed: maxSpd > 0 ? formatSpeed(maxSpd, speedUnit, t) : '0 kph',
    };
  }, [items, distanceUnit, speedUnit, t]);

  const onExport = useCatch(async () => {
    const sheets = new Map();
    items.forEach((item) => {
      const deviceName = devices[item.deviceId]?.name || `Unit #${item.deviceId}`;
      if (!sheets.has(deviceName)) {
        sheets.set(deviceName, []);
      }
      const row = {};
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        if (key === 'startAddress') {
          row[header] = formatAddress(
            {
              address: item.startAddress,
              latitude: item.startLat,
              longitude: item.startLon,
            },
            coordinateFormat,
          );
        } else if (key === 'endAddress') {
          row[header] = formatAddress(
            {
              address: item.endAddress,
              latitude: item.endLat,
              longitude: item.endLon,
            },
            coordinateFormat,
          );
        } else {
          row[header] = formatValue(item, key);
        }
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('reportTrips'), 'trips.xlsx', sheets, theme);
  });

  const onPrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const devName =
      filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
        ? devices[filterParams.deviceIds[0]].name
        : 'All Selected Fleet Units';

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss');

    const headersHtml = columns.map((k) => `<th style="padding: 8px 10px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; text-align: left;">${t(columnsMap.get(k))}</th>`).join('');

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
        ${columns.map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${k === 'startAddress' ? (it.startAddress || '-') : k === 'endAddress' ? (it.endAddress || '-') : (formatValue(it, k) ?? '-')}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Travel sheet - ${devName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', -apple-system, Roboto, sans-serif; margin: 28px; color: #1e293b; background: #ffffff; }
            .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00ab8e; padding-bottom: 14px; margin-bottom: 20px; }
            .card { border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
            .card-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; }
            .card-body { padding: 12px 16px; display: grid; grid-template-columns: 140px 1fr; row-gap: 8px; font-size: 12.5px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            ${LOGO_SVG}
            <div style="text-align:right; font-size:11px; color:#64748b;">
              <div>Fleet Telematics Intelligence</div>
              <div>Generated: ${dayjs().format('DD-MM-YYYY HH:mm:ss')}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <span style="font-weight:700; color:#00ab8e; font-size:13px;">📊 Report type: Travel sheet</span>
              <span style="font-size:12px; font-weight:600; color:#334155;">${fromStr} - ${toStr} (UTC +2)</span>
            </div>
            <div class="card-body">
              <span style="font-weight:700;">Device:</span>
              <span style="font-weight:700; color:#0f172a;">${devName}</span>
              <span style="font-weight:700;">Route length:</span>
              <span>${totalSummary.distance}</span>
              <span style="font-weight:700;">Move duration:</span>
              <span>${totalSummary.duration}</span>
            </div>
          </div>

          <table>
            <thead><tr>${headersHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'trips';
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const navigateToReplay = (item) => {
    navigate({
      pathname: '/replay',
      search: new URLSearchParams({
        from: item.startTime,
        to: item.endTime,
        deviceId: item.deviceId,
      }).toString(),
    });
  };

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'duration':
        return formatNumericHours(value, t);
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'startAddress':
        return (
          <AddressValue
            latitude={item.startLat}
            longitude={item.startLon}
            originalAddress={value}
          />
        );
      case 'endAddress':
        return (
          <AddressValue latitude={item.endLat} longitude={item.endLon} originalAddress={value} />
        );
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>
      <div className={classes.container} style={{ fontFamily: FONT_FAMILY }}>
        {selectedItem && (
          <>
            <div className={classes.containerMap}>
              <MapView>
                <MapGeofence />
                {route && (
                  <>
                    <MapRoutePath positions={route} />
                    <MapMarkers markers={createMarkers()} />
                    <MapCamera positions={route} />
                  </>
                )}
              </MapView>
              <MapScale />
            </div>
            <ResizeHandle />
          </>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              onShow={onShow}
              onExport={onExport}
              onSchedule={onSchedule}
              deviceType="multiple"
              loading={loading}
              formats={['xlsx']}
            >
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {items.length > 0 && (
            <Box sx={{ p: 2, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              <Box
                sx={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: PRIMARY }}>
                      Report type: Travel sheet
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
                    {dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss')} — {dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss')} (UTC +2)
                  </Typography>
                </Box>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: '12px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Device:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
                        ? devices[filterParams.deviceIds[0]].name
                        : `Selected Fleet Units (${filterParams.deviceIds.length || Object.keys(devices).length})`}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Route length:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{totalSummary.distance}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Move duration:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{totalSummary.duration}</span>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon fontSize="small" />}
                      onClick={onPrintReport}
                      sx={{
                        borderRadius: '6px',
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: FONT_SIZE_12,
                        textTransform: 'none',
                        '&:hover': { borderColor: PRIMARY, color: PRIMARY, backgroundColor: '#f0fdfa' },
                      }}
                    >
                      Print Report
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FileDownloadIcon fontSize="small" />}
                      onClick={onExport}
                      sx={{
                        borderRadius: '6px',
                        backgroundColor: PRIMARY,
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: FONT_SIZE_12,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#008f77' },
                      }}
                    >
                      Export Excel
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell className={classes.columnAction} />
                <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{t('sharedDevice')}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key} sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.startPositionId} hover>
                    <TableCell className={classes.columnAction} padding="none">
                      <div className={classes.columnActionContainer}>
                        {selectedItem === item ? (
                          <IconButton size="small" onClick={() => setSelectedItem(null)}>
                            <GpsFixedIcon fontSize="small" sx={{ color: PRIMARY }} />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => setSelectedItem(item)}>
                            <LocationSearchingIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => navigateToReplay(item)}>
                          <RouteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </TableCell>
                    <TableCell sx={{ fontSize: FONT_SIZE_12, fontWeight: 600 }}>{devices[item.deviceId]?.name || item.deviceId}</TableCell>
                    {columns.map((key) => (
                      <TableCell key={key} sx={{ fontSize: FONT_SIZE_12 }}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 2} startAction />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default TripReportPage;