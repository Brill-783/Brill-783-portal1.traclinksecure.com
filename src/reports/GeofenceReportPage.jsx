import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { formatNumericHours, formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch, useCatchCallback } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import exportExcel from '../common/util/exportExcel';
import dayjs from 'dayjs';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';

const columnsArray = [
  ['geofenceId', 'sharedGeofence'],
  ['startTime', 'reportStartTime'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
];
const columnsMap = new Map(columnsArray);

const GeofenceReportPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();
  const geofenceIds = useMemo(() => searchParams.getAll('geofenceId').map(Number), [searchParams]);

  const reduxDevices = useSelector((state) => state.devices.items || {}, shallowEqual);
  const devices = useMemo(() => {
    return Array.isArray(reduxDevices)
      ? reduxDevices.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      : reduxDevices;
  }, [reduxDevices]);

  const geofences = useSelector((state) => state.geofences.items || {}, shallowEqual);

  const [columns, setColumns] = usePersistedState('geofenceColumns', [
    'geofenceId',
    'startTime',
    'endTime',
    'duration',
  ]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterParams, setFilterParams] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    deviceIds: [],
  });

  const onShow = useCatchCallback(
    async ({ deviceIds, groupIds, from, to }) => {
      setFilterParams({ deviceIds, from, to });
      const query = new URLSearchParams({ from, to });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      groupIds.forEach((groupId) => query.append('groupId', groupId));
      geofenceIds.forEach((id) => query.append('geofenceId', id));
      setLoading(true);
      try {
        const response = await fetchOrThrow(`/api/reports/geofences?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setItems(await response.json());
      } finally {
        setLoading(false);
      }
    },
    [geofenceIds],
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
        row[header] = formatValue(item, key);
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('sharedGeofences'), 'geofences.xlsx', sheets, theme);
  });

  const onPrintTrackLink = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const devName =
      filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
        ? devices[filterParams.deviceIds[0]].name
        : 'All Fleet Units Zone Visits';

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss');

    const headersHtml = columns
      .map(
        (k) =>
          `<th style="padding: 8px 10px; background: #e6f7f5; font-size: 11px; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #00ab8e; text-align: left; font-family: 'Inter', sans-serif;">${t(
            columnsMap.get(k)
          )}</th>`
      )
      .join('');

    const rowsHtml = items
      .map(
        (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11.5px; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-family: 'Inter', sans-serif;">
        ${columns
          .map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${formatValue(it, k) ?? '-'}</td>`)
          .join('')}
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Geofence Log - ${devName}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, Roboto, sans-serif; margin: 28px; color: #1e293b; }
            .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00ab8e; padding-bottom: 14px; margin-bottom: 20px; }
            .card { border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 20px; background: #ffffff; }
            .card-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
            .card-body { padding: 12px 16px; display: grid; grid-template-columns: 140px 1fr; row-gap: 8px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <span style="font-weight: 800; font-size: 20px; color: #1e293b;">Geofence Intelligence Report</span>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>Generated: ${dayjs().format('DD-MM-YYYY HH:mm:ss')}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <span style="font-weight: 700; color: #00ab8e; font-size: 13px;">Zone Activity</span>
              <span style="font-size: 12px; font-weight: 600; color: #334155;">${fromStr} - ${toStr}</span>
            </div>
            <div class="card-body">
              <span style="font-weight: 700;">Target:</span>
              <span style="font-weight: 700; color: #0f172a;">${devName}</span>
              <span style="font-weight: 700;">Transitions:</span>
              <span>${items.length} Recorded Zone Events</span>
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

  const formatValue = (item, key) => {
    switch (key) {
      case 'geofenceId':
        return geofences[item.geofenceId]?.name || item.geofenceId;
      case 'startTime':
      case 'endTime':
        return formatTime(item[key], 'minutes');
      case 'duration':
        return formatNumericHours(Date.parse(item.endTime) - Date.parse(item.startTime), t);
      default:
        return item[key];
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'sharedGeofences']}>
      <div className={classes.header} style={{ fontFamily: FONT_FAMILY, borderBottom: '1px solid #cbd5e1' }}>
        <ReportFilter
          onShow={onShow}
          onExport={onExport}
          deviceType="multiple"
          loading={loading}
          formats={['xlsx']}
        >
          <div className={classes.filterItem}>
            <SelectField
              label={t('sharedGeofences')}
              value={geofenceIds}
              onChange={(e) =>
                updateReportParams(searchParams, setSearchParams, 'geofenceId', e.target.value)
              }
              endpoint="/api/geofences"
              multiple
              singleLine
              fullWidth
            />
          </div>
          <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
        </ReportFilter>
      </div>

      {items.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
          <Box sx={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LayersIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: PRIMARY, fontFamily: FONT_FAMILY }}>
                  Geofence Activity Log
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', fontFamily: FONT_FAMILY }}>
                {dayjs(filterParams.from).format('DD-MM-YYYY HH:mm')} — {dayjs(filterParams.to).format('DD-MM-YYYY HH:mm')}
              </Typography>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: '12.5px', fontFamily: FONT_FAMILY }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Device:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
                    ? devices[filterParams.deviceIds[0]].name
                    : `Selected Units (${filterParams.deviceIds.length || Object.keys(devices).length})`}
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Visits:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{items.length} Zone Events</span>
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
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'none',
                    fontFamily: FONT_FAMILY,
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
                  disableElevation
                  sx={{
                    borderRadius: '6px',
                    backgroundColor: PRIMARY,
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'none',
                    fontFamily: FONT_FAMILY,
                    '&:hover': { backgroundColor: PRIMARY_DARK },
                  }}
                >
                  Export Excel
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Paper elevation={0} sx={{ flex: 1, borderTop: '1px solid #cbd5e1', borderRadius: 0, overflow: 'auto', ...scrollableSx }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', backgroundColor: '#e6f7f5', borderBottom: '2px solid #00ab8e', borderRight: '1px solid #cbd5e1', fontFamily: FONT_FAMILY }}>
                {t('sharedDevice')}
              </TableCell>
              {columns.map((key) => (
                <TableCell key={key} sx={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', backgroundColor: '#e6f7f5', borderBottom: '2px solid #00ab8e', borderRight: '1px solid #cbd5e1', fontFamily: FONT_FAMILY }}>
                  {t(columnsMap.get(key))}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              items.map((item) => (
                <TableRow
                  key={`${item.deviceId}_${item.geofenceId}_${item.startTime}_${item.endTime}`}
                  hover
                  sx={{ '&:hover': { backgroundColor: '#e6f7f5 !important' } }}
                >
                  <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontFamily: FONT_FAMILY }}>
                    {devices[item.deviceId]?.name || item.deviceId}
                  </TableCell>
                  {columns.map((key) => (
                    <TableCell key={key} sx={{ fontSize: '12.5px', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontFamily: FONT_FAMILY }}>
                      {formatValue(item, key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableShimmer columns={columns.length + 1} />
            )}
          </TableBody>
        </Table>
      </Paper>
    </PageLayout>
  );
};

export default GeofenceReportPage;