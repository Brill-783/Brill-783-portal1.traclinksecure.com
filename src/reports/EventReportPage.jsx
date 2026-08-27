import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useSelector, shallowEqual } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { formatAddress, formatNumber, formatSpeed, formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import ResizeHandle from './components/ResizeHandle';
import { useCatch, useCatchCallback, useAsyncTask } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import SelectField from '../common/components/SelectField';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import AddressValue from '../common/components/AddressValue';
import dayjs from 'dayjs';

const PRIMARY = '#00ab8e';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_SIZE_12 = '12px !important';

const columnsArray = [
  ['eventTime', 'positionFixTime'],
  ['type', 'sharedType'],
  ['geofenceId', 'sharedGeofence'],
  ['maintenanceId', 'sharedMaintenance'],
  ['address', 'positionAddress'],
  ['attributes', 'commandData'],
];
const columnsMap = new Map(columnsArray);

const EventReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const reduxDevices = useSelector((state) => state.devices.items || {}, shallowEqual);
  const devices = useMemo(() => {
    return Array.isArray(reduxDevices)
      ? reduxDevices.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      : reduxDevices;
  }, [reduxDevices]);

  const geofences = useSelector((state) => state.geofences.items || {}, shallowEqual);

  const speedUnit = useAttributePreference('speedUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [allEventTypes, setAllEventTypes] = useState([{ id: 'allEvents', label: 'eventAll' }]);

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const [columns, setColumns] = usePersistedState('eventColumns', [
    'eventTime',
    'type',
    'address',
    'attributes',
  ]);
  const eventTypes = useMemo(() => searchParams.getAll('eventType'), [searchParams]);
  const alarmTypes = useMemo(() => searchParams.getAll('alarmType'), [searchParams]);
  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [position, setPosition] = useState(null);

  const [filterParams, setFilterParams] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    deviceIds: [],
  });

  useEffect(() => {
    if (!eventTypes.length) {
      updateReportParams(searchParams, setSearchParams, 'eventType', ['allEvents']);
    }
  }, [searchParams, setSearchParams, eventTypes]);

  useEffect(() => {
    if (selectedItem?.positionId) {
      setPosition(positions[selectedItem.positionId] || null);
    } else {
      setPosition(null);
    }
  }, [selectedItem, positions]);

  useAsyncTask(async ({ signal }) => {
    const response = await fetchOrThrow('/api/notifications/types', { signal });
    const types = await response.json();
    setAllEventTypes((previous) => [
      ...previous,
      ...types.map((it) => ({ id: it.type, label: prefixString('event', it.type) })),
    ]);
  }, []);

  const onShow = useCatchCallback(
    async ({ deviceIds, groupIds, from, to }) => {
      setFilterParams({ deviceIds, from, to });
      const query = new URLSearchParams({ from, to });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      groupIds.forEach((groupId) => query.append('groupId', groupId));
      eventTypes.forEach((it) => query.append('type', it));
      if (eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm')) {
        alarmTypes.forEach((it) => query.append('alarm', it));
      }
      setSelectedItem(null);
      setPosition(null);
      setLoading(true);
      try {
        const response = await fetchOrThrow(`/api/reports/events?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const events = await response.json();
        setItems(events);
        const positionIds = Array.from(
          new Set(events.map((event) => event.positionId).filter((id) => id)),
        );
        const positionsMap = {};
        if (positionIds.length > 0) {
          const positionsQuery = new URLSearchParams();
          positionIds.slice(0, 128).forEach((id) => positionsQuery.append('id', id));
          const positionsResponse = await fetchOrThrow(
            `/api/positions?${positionsQuery.toString()}`,
          );
          const positionsArray = await positionsResponse.json();
          positionsArray.forEach((p) => (positionsMap[p.id] = p));
        }
        setPositions(positionsMap);
      } finally {
        setLoading(false);
      }
    },
    [eventTypes, alarmTypes],
  );

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
        if (key === 'attributes' && item.type === 'media') {
          row[header] = item.attributes.file;
        } else if (key === 'address') {
          const pos = positions[item.positionId];
          row[header] = pos ? formatAddress(pos, coordinateFormat) : '';
        } else {
          row[header] = formatValue(item, key);
        }
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('reportEvents'), 'events.xlsx', sheets, theme);
  });

  const onPrintTrackLink = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const devName =
      filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
        ? devices[filterParams.deviceIds[0]].name
        : 'All Fleet Units Event Logs';

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss');

    const headersHtml = columns.map((k) => `<th style="padding: 8px 10px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; text-align: left;">${t(columnsMap.get(k))}</th>`).join('');

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
        ${columns.map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${k === 'address' && positions[it.positionId] ? (positions[it.positionId].address || '-') : (formatValue(it, k) ?? '-')}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event Logs - ${devName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', -apple-system, Roboto, sans-serif; margin: 28px; color: #1e293b; }
            .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00ab8e; padding-bottom: 14px; margin-bottom: 20px; }
            .card { border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
            .card-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; }
            .card-body { padding: 12px 16px; display: grid; grid-template-columns: 140px 1fr; row-gap: 8px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div style="display:flex; align-items:center; gap:8px;">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="4" fill="#00ab8e"/><path d="M12.5 9.5C9.5 12 7.5 15.5 7.5 19.5C7.5 23.5 9.5 27 12.5 29.5" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/><path d="M23.5 9.5C26.5 12 28.5 15.5 28.5 19.5C28.5 23.5 26.5 27 23.5 29.5" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/><path d="M7 5C3 8.5 0.5 13.5 0.5 19.5C0.5 25.5 3 30.5 7 34" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/><path d="M29 5C33 8.5 35.5 13.5 35.5 19.5C35.5 25.5 33 30.5 29 34" stroke="#00ab8e" stroke-width="2.6" stroke-linecap="round"/></svg>
              <span style="font-weight:900; font-size:24px; color:#1e293b; letter-spacing:-0.5px;">TRACKLINK</span>
            </div>
            <div style="text-align:right; font-size:11px; color:#64748b;">
              <div>TrackLink Telematics Fleet Intelligence</div>
              <div>Generated: ${dayjs().format('DD-MM-YYYY HH:mm:ss')}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <span style="font-weight:700; color:#ef4444; font-size:13px;">🚨 Report type: Alerts & Events Log</span>
              <span style="font-size:12px; font-weight:600; color:#334155;">${fromStr} - ${toStr} (UTC +2)</span>
            </div>
            <div class="card-body">
              <span style="font-weight:700;">Device:</span>
              <span style="font-weight:700; color:#0f172a;">${devName}</span>
              <span style="font-weight:700;">Total Events:</span>
              <span>${items.length} Triggered Logs</span>
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
    report.type = 'events';
    if (eventTypes[0] !== 'allEvents') {
      report.attributes.types = eventTypes.join(',');
    }
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'eventTime':
        return formatTime(value, 'seconds');
      case 'type':
        return t(prefixString('event', value));
      case 'geofenceId':
        if (value > 0) {
          const geofence = geofences[value];
          return geofence && geofence.name;
        }
        return null;
      case 'maintenanceId':
        return value > 0 ? value : null;
      case 'address': {
        const pos = positions[item.positionId];
        if (pos) {
          return (
            <AddressValue
              latitude={pos.latitude}
              longitude={pos.longitude}
              originalAddress={pos.address}
            />
          );
        }
        return '';
      }
      case 'attributes':
        switch (item.type) {
          case 'alarm':
            return t(prefixString('alarm', item.attributes?.alarm));
          case 'deviceOverspeed':
            return formatSpeed(item.attributes?.speed, speedUnit, t);
          case 'driverChanged':
            return item.attributes?.driverUniqueId;
          case 'deviceFuelDrop':
          case 'deviceFuelIncrease':
            return formatNumber(Math.abs(item.attributes?.after - item.attributes?.before));
          case 'media':
            return (
              <Link
                href={`/api/media/${devices[item.deviceId]?.uniqueId}/${item.attributes?.file}`}
                target="_blank"
              >
                {item.attributes?.file}
              </Link>
            );
          case 'commandResult':
            return item.attributes?.result;
          default:
            return '';
        }
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportEvents']}>
      <div className={classes.container} style={{ fontFamily: FONT_FAMILY }}>
        {selectedItem && (
          <>
            <div className={classes.containerMap}>
              <MapView>
                <MapGeofence />
                {position && <MapPositions positions={[position]} titleField="fixTime" />}
              </MapView>
              <MapScale />
              {position && (
                <MapCamera latitude={position.latitude} longitude={position.longitude} />
              )}
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
              <div className={classes.filterItem}>
                <SelectField
                  multiple
                  singleLine
                  data={allEventTypes}
                  value={eventTypes}
                  allValue="allEvents"
                  titleGetter={(it) => t(it.label)}
                  onChange={(e) =>
                    updateReportParams(searchParams, setSearchParams, 'eventType', e.target.value)
                  }
                  label={t('reportEventTypes')}
                  fullWidth
                />
              </div>
              {eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm') && (
                <div className={classes.filterItem}>
                  <SelectField
                    multiple
                    singleLine
                    value={alarmTypes}
                    onChange={(e) =>
                      updateReportParams(searchParams, setSearchParams, 'alarmType', e.target.value)
                    }
                    data={alarms}
                    keyGetter={(it) => it.key}
                    label={t('sharedAlarms')}
                    fullWidth
                  />
                </div>
              )}
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {items.length > 0 && (
            <Box sx={{ p: 2, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
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
                    <NotificationsActiveIcon sx={{ color: '#ef4444', fontSize: '18px' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: '#ef4444' }}>
                      Report type: Event Logs
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
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Triggered Events:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{items.length} Incidents</span>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon fontSize="small" />}
                      onClick={onPrintTrackLink}
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
                  <TableRow key={item.id} hover>
                    <TableCell className={classes.columnAction} padding="none">
                      {(item.positionId &&
                        (selectedItem === item ? (
                          <IconButton size="small" onClick={() => setSelectedItem(null)}>
                            <GpsFixedIcon fontSize="small" sx={{ color: PRIMARY }} />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => setSelectedItem(item)}>
                            <LocationSearchingIcon fontSize="small" />
                          </IconButton>
                        ))) ||
                        ''}
                    </TableCell>
                    <TableCell sx={{ fontSize: FONT_SIZE_12, fontWeight: 600 }}>{devices[item.deviceId]?.name || item.deviceId}</TableCell>
                    {columns.map((key) => (
                      <TableCell key={key} sx={{ fontSize: FONT_SIZE_12 }}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 2} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default EventReportPage;