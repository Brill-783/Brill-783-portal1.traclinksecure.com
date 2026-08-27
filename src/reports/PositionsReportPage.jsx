import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import TimelineIcon from '@mui/icons-material/Timeline';
import PrintIcon from '@mui/icons-material/Print';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import PositionValue from '../common/components/PositionValue';
import ColumnSelect from './components/ColumnSelect';
import ResizeHandle from './components/ResizeHandle';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch, useCatchCallback } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import { useRestriction } from '../common/util/permissions';
import CollectionActions from '../common/components/CollectionActions';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import dayjs from 'dayjs';

const PRIMARY = '#00ab8e';
const FONT_FAMILY = "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_SIZE_12 = '12px !important';

const PositionsReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const positionAttributes = usePositionAttributes(t);
  const readonly = useRestriction('readonly');

  const [available, setAvailable] = useState([]);
  const [columns, setColumns] = useState(['fixTime', 'latitude', 'longitude', 'speed', 'address']);
  const [items, setItems] = useState([]);
  const geofenceId = searchParams.has('geofenceId')
    ? parseInt(searchParams.get('geofenceId'), 10)
    : null;
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [filterParams, setFilterParams] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    deviceIds: [],
  });

  const selectedRef = useRef();

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedItem]);

  const onMapPointClick = useCallback(
    (positionId) => {
      setSelectedItem(items.find((it) => it.id === positionId));
    },
    [items]
  );

  const onShow = useCatchCallback(
    async ({ deviceIds, from, to }) => {
      setFilterParams({ deviceIds, from, to });
      const query = new URLSearchParams({ from, to });
      if (geofenceId) {
        query.append('geofenceId', geofenceId);
      }
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      setLoading(true);
      try {
        const response = await fetchOrThrow(`/api/positions?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        const keySet = new Set();
        const keyList = [];
        data.forEach((position) => {
          Object.keys(position).forEach((it) => keySet.add(it));
          Object.keys(position.attributes || {}).forEach((it) => keySet.add(it));
        });
        ['id', 'deviceId', 'outdated', 'network', 'attributes'].forEach((key) => keySet.delete(key));
        Object.keys(positionAttributes).forEach((key) => {
          if (keySet.has(key)) {
            keyList.push(key);
            keySet.delete(key);
          }
        });
        setAvailable([...keyList, ...keySet].map((key) => [key, positionAttributes[key]?.name || key]));
        setItems(data);
      } finally {
        setLoading(false);
      }
    },
    [geofenceId, positionAttributes]
  );

  const onExport = useCatch(async ({ deviceIds, from, to, format }) => {
    const query = new URLSearchParams({ from, to });
    if (geofenceId) {
      query.append('geofenceId', geofenceId);
    }
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    window.location.assign(`/api/positions/${format}?${query.toString()}`);
  });

  const onPrintTrackLink = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fromStr = dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss');
    const toStr = dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss');

    const headersHtml = columns.map((k) => `<th style="padding: 8px 10px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #cbd5e1; text-align: left;">${positionAttributes[k]?.name || k}</th>`).join('');

    const rowsHtml = items.slice(0, 500).map((it, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
        ${columns.map((k) => `<td style="padding: 8px 10px; color: #1e293b;">${k === 'fixTime' ? dayjs(it.fixTime).format('DD-MM-YYYY HH:mm:ss') : it[k] !== undefined ? it[k] : it.attributes?.[k] ?? '-'}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Positions Telemetry Log</title>
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
              <span style="font-weight:700; color:#00ab8e; font-size:13px;">📍 Report type: Historical Positions</span>
              <span style="font-size:12px; font-weight:600; color:#334155;">${fromStr} - ${toStr} (UTC +2)</span>
            </div>
            <div class="card-body">
              <span style="font-weight:700;">Total Coordinates:</span>
              <span style="font-weight:700; color:#0f172a;">${items.length} GPS Points</span>
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
    report.type = 'route';
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportPositions']}>
      <div className={classes.container} style={{ fontFamily: FONT_FAMILY }}>
        {selectedItem && (
          <>
            <div className={classes.containerMap}>
              <MapView>
                <MapGeofence />
                {[...new Set(items.map((it) => it.deviceId))].map((deviceId) => {
                  const pos = items.filter((position) => position.deviceId === deviceId);
                  return (
                    <Fragment key={deviceId}>
                      <MapRoutePath positions={pos} />
                      <MapRoutePoints positions={pos} onClick={onMapPointClick} />
                    </Fragment>
                  );
                })}
                <MapPositions positions={[selectedItem]} titleField="fixTime" />
              </MapView>
              <MapScale />
              <MapCamera positions={items} />
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
              deviceType="single"
              loading={loading}
              formats={['csv', 'gpx', 'kml', 'kmz']}
            >
              <div className={classes.filterItem}>
                <SelectField
                  value={geofenceId}
                  onChange={(e) => {
                    const values = e.target.value ? [e.target.value] : [];
                    updateReportParams(searchParams, setSearchParams, 'geofenceId', values);
                  }}
                  endpoint="/api/geofences"
                  label={t('sharedGeofence')}
                  fullWidth
                />
              </div>
              <ColumnSelect
                columns={columns}
                setColumns={setColumns}
                columnsArray={available}
                rawValues
                disabled={!items.length}
              />
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
                    <TimelineIcon sx={{ color: PRIMARY, fontSize: '18px' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE_12, color: PRIMARY }}>
                      Report type: Historical Coordinates
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
                    {dayjs(filterParams.from).format('DD-MM-YYYY HH:mm:ss')} — {dayjs(filterParams.to).format('DD-MM-YYYY HH:mm:ss')} (UTC +2)
                  </Typography>
                </Box>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 1, fontSize: '12px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Captured Points:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{items.length} telemetry fixes</span>
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
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell className={classes.columnAction} />
                {columns.map((key) => (
                  <TableCell key={key} sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {positionAttributes[key]?.name || key}
                  </TableCell>
                ))}
                <TableCell className={classes.columnAction} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.slice(0, 4000).map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell className={classes.columnAction} padding="none">
                      {selectedItem === item ? (
                        <IconButton
                          size="small"
                          onClick={() => setSelectedItem(null)}
                          ref={selectedRef}
                        >
                          <GpsFixedIcon fontSize="small" sx={{ color: PRIMARY }} />
                        </IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => setSelectedItem(item)}>
                          <LocationSearchingIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    {columns.map((key) => (
                      <TableCell key={key} sx={{ fontSize: FONT_SIZE_12 }}>
                        <PositionValue
                          position={item}
                          property={item.hasOwnProperty(key) ? key : null}
                          attribute={item.hasOwnProperty(key) ? null : key}
                        />
                      </TableCell>
                    ))}
                    <TableCell className={classes.actionCellPadding}>
                      <CollectionActions
                        itemId={item.id}
                        endpoint="positions"
                        readonly={readonly}
                        onReload={() => {
                          setItems(items.filter((pos) => pos.id !== item.id));
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 1} startAction />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default PositionsReportPage;