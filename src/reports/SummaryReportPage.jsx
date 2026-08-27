import React, { useState, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';

import {
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch, useCatchCallback } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import scheduleReport from './common/scheduleReport';
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
  ['startTime', 'reportStartDate'],
  ['distance', 'sharedDistance'],
  ['startOdometer', 'reportStartOdometer'],
  ['endOdometer', 'reportEndOdometer'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['engineHours', 'reportEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const SummaryReportPage = () => {
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

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('summaryColumns', [
    'startTime',
    'distance',
    'averageSpeed',
    'maxSpeed',
    'engineHours',
  ]);

  const daily = searchParams.get('daily') === 'true';
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
      const query = new URLSearchParams({ from, to, daily });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      groupIds.forEach((groupId) => query.append('groupId', groupId));
      setLoading(true);
      try {
        const response = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        setItems(await response.json());
      } finally {
        setLoading(false);
      }
    },
    [daily]
  );

  const totalMetrics = useMemo(() => {
    const totalDist = items.reduce((acc, it) => acc + (it.distance || 0), 0);
    const maxSpd = items.reduce((acc, it) => Math.max(acc, it.maxSpeed || 0), 0);

    return {
      distance: formatDistance(totalDist, distanceUnit, t),
      maxSpeed: maxSpd > 0 ? formatSpeed(maxSpd, speedUnit, t) : '0 kph',
    };
  }, [items, distanceUnit, speedUnit, t]);

  const onExport = useCatch(async () => {
    const rows = [];
    const deviceHeader = t('sharedDevice');
    items.forEach((item) => {
      const row = { [deviceHeader]: devices[item.deviceId]?.name || item.deviceId };
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        row[header] = formatValue(item, key);
      });
      rows.push(row);
    });
    const titleKey = daily ? 'reportDaily' : 'reportSummary';
    const title = t(titleKey);
    const sheets = new Map([[title, rows]]);
    await exportExcel(title, 'summary.xlsx', sheets, theme);
  });

  const onPrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const devName =
      filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
        ? devices[filterParams.deviceIds[0]].name
        : 'Daily Fleet Mileage Summary';

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss');

    const headersHtml = columns.map((k) => `<th style="padding: 8px 10px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; text-align: left;">${t(columnsMap.get(k))}</th>`).join('');

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
        ${columns.map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${formatValue(it, k) ?? '-'}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fleet Summary - ${devName}</title>
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
              <span style="font-weight:700; color:#00ab8e; font-size:13px;">📈 Report type: ${daily ? 'Daily Fleet Mileage Summary' : 'Fleet Telematics Summary'}</span>
              <span style="font-size:12px; font-weight:600; color:#334155;">${fromStr} - ${toStr} (UTC +2)</span>
            </div>
            <div class="card-body">
              <span style="font-weight:700;">Device:</span>
              <span style="font-weight:700; color:#0f172a;">${devName}</span>
              <span style="font-weight:700;">Route length:</span>
              <span>${totalMetrics.distance}</span>
              <span style="font-weight:700;">Top Speed:</span>
              <span>${totalMetrics.maxSpeed}</span>
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
    report.type = 'summary';
    report.attributes.daily = daily;
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'startTime':
        return formatTime(value, 'date');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'engineHours':
      case 'startHours':
      case 'endHours':
        return value > 0 ? formatNumericHours(value, t) : null;
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportSummary']}>
      <div className={classes.header} style={{ fontFamily: FONT_FAMILY }}>
        <ReportFilter
          onShow={onShow}
          onExport={onExport}
          onSchedule={onSchedule}
          deviceType="multiple"
          loading={loading}
          formats={['xlsx']}
        >
          <div className={classes.filterItem}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: FONT_SIZE_12, fontWeight: 700 }}>{t('sharedType')}</InputLabel>
              <Select
                label={t('sharedType')}
                value={daily}
                onChange={(e) => updateReportParams(searchParams, setSearchParams, 'daily', [String(e.target.value)])}
                sx={{ borderRadius: '8px', fontSize: FONT_SIZE_12, fontWeight: 700 }}
              >
                <MenuItem value={false} sx={{ fontSize: FONT_SIZE_12, fontWeight: 700 }}>{t('reportSummary')}</MenuItem>
                <MenuItem value={true} sx={{ fontSize: FONT_SIZE_12, fontWeight: 700 }}>{t('reportDaily')}</MenuItem>
              </Select>
            </FormControl>
          </div>
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
                <EqualizerIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
                <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: PRIMARY }}>
                  Report type: Fleet Summary
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
                {dayjs(filterParams.from).format('DD-MM-YYYY')} — {dayjs(filterParams.to).format('DD-MM-YYYY')} (UTC +2)
              </Typography>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Fleet Scope:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {filterParams.deviceIds.length === 1 && devices[filterParams.deviceIds[0]]
                    ? devices[filterParams.deviceIds[0]].name
                    : `Active Fleet Units (${items.length})`}
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Route length:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{totalMetrics.distance}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Top Speed:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{totalMetrics.maxSpeed}</span>
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
            <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              {t('sharedDevice')}
            </TableCell>
            {columns.map((key) => (
              <TableCell key={key} sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {t(columnsMap.get(key))}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.map((item, idx) => (
              <TableRow key={`${item.deviceId}_${idx}`} hover>
                <TableCell sx={{ fontSize: FONT_SIZE_12, fontWeight: 600 }}>{devices[item.deviceId]?.name || item.deviceId}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key} sx={{ fontSize: FONT_SIZE_12 }}>{formatValue(item, key)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={columns.length + 1} />
          )}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default SummaryReportPage;