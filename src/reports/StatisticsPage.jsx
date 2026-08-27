import React, { useState } from 'react';
import { Table, TableRow, TableCell, TableHead, TableBody, Box, Typography, Button } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatchCallback } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import fetchOrThrow from '../common/util/fetchOrThrow';
import dayjs from 'dayjs';

const PRIMARY = '#00ab8e';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_SIZE_12 = '12px !important';

const columnsArray = [
  ['captureTime', 'statisticsCaptureTime'],
  ['activeUsers', 'statisticsActiveUsers'],
  ['activeDevices', 'statisticsActiveDevices'],
  ['requests', 'statisticsRequests'],
  ['messagesReceived', 'statisticsMessagesReceived'],
  ['messagesStored', 'statisticsMessagesStored'],
  ['mailSent', 'notificatorMail'],
  ['smsSent', 'notificatorSms'],
  ['geocoderRequests', 'statisticsGeocoder'],
  ['geolocationRequests', 'statisticsGeolocation'],
];
const columnsMap = new Map(columnsArray);

const StatisticsPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [columns, setColumns] = usePersistedState('statisticsColumns', [
    'captureTime',
    'activeUsers',
    'activeDevices',
    'messagesStored',
    'requests',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterParams, setFilterParams] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
  });

  const onShow = useCatchCallback(async ({ from, to }) => {
    setFilterParams({ from, to });
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetchOrThrow(`/api/statistics?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const onPrintTrackLink = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY');

    const headersHtml = columns.map((k) => `<th style="padding: 8px 10px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; text-align: left;">${t(columnsMap.get(k))}</th>`).join('');

    const rowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
        ${columns.map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${k === 'captureTime' ? dayjs(it.captureTime).format('DD-MM-YYYY') : it[k] ?? '-'}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fleet Statistics Report</title>
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
              <span style="font-weight:700; color:#00ab8e; font-size:13px;">📈 Report type: Fleet Server Statistics</span>
              <span style="font-size:12px; font-weight:600; color:#334155;">${fromStr} - ${toStr} (UTC +2)</span>
            </div>
            <div class="card-body">
              <span style="font-weight:700;">Records:</span>
              <span style="font-weight:700; color:#0f172a;">${items.length} Sample Logs</span>
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

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'statisticsTitle']}>
      <div className={classes.header} style={{ fontFamily: FONT_FAMILY }}>
        <ReportFilter onShow={onShow} deviceType="none" loading={loading}>
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
                <AssessmentIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
                <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: PRIMARY }}>
                  Report type: Server Statistics
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
                {dayjs(filterParams.from).format('DD-MM-YYYY')} — {dayjs(filterParams.to).format('DD-MM-YYYY')} (UTC +2)
              </Typography>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Captured Days:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{items.length} records</span>
              </Box>

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
            </Box>
          </Box>
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f8fafc' }}>
            {columns.map((key) => (
              <TableCell key={key} sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {t(columnsMap.get(key))}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.map((item) => (
              <TableRow key={item.id} hover>
                {columns.map((key) => (
                  <TableCell key={key} sx={{ fontSize: FONT_SIZE_12 }}>
                    {key === 'captureTime' ? formatTime(item[key], 'date') : item[key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={columns.length} />
          )}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default StatisticsPage;