import React, { useState, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputBase,
  Chip,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';

import { useTranslation } from '../common/components/LocalizationProvider';
import { formatTime } from '../common/util/formatter';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import ReportFilter from './components/ReportFilter';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';
const TEXT = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const fontStyle = {
  fontFamily: FONT_FAMILY,
};

const scrollableSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#cbd5e1 transparent',
  '&::-webkit-scrollbar': {
    width: '4px',
    height: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#cbd5e1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#94a3b8',
  },
};

const columnsArray = [
  ['actionTime', 'positionServerTime'],
  ['address', 'positionAddress'],
  ['userId', 'settingsUser'],
  ['actionType', 'sharedActionType'],
  ['objectType', 'sharedObjectType'],
  ['objectId', 'deviceIdentifier'],
];

const columnsMap = new Map(columnsArray);

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: SURFACE_SOFT,
    overflow: 'hidden',
    fontFamily: FONT_FAMILY,
    boxSizing: 'border-box',
    padding: '16px',
    gap: '12px',
    '@media (max-width: 600px)': {
      padding: '10px 8px',
      gap: '8px',
    },
    '&, & *': {
      fontFamily: `${FONT_FAMILY} !important`,
    },
    '@keyframes livePulse': {
      '0%': {
        transform: 'scale(0.95)',
        boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
      },
      '70%': {
        transform: 'scale(1)',
        boxShadow: '0 0 0 5px rgba(16, 185, 129, 0)',
      },
      '100%': {
        transform: 'scale(0.95)',
        boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)',
      },
    },
  },
}));

export default function AuditPage() {
  const { classes } = useStyles();
  const t = useTranslation();

  const server = useSelector((state) => state.session?.server || {}, shallowEqual);
  const users = useSelector((state) => state.users?.items || {}, shallowEqual);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [columns, setColumns] = usePersistedState('auditColumns', [
    'actionTime',
    'userId',
    'actionType',
    'objectType',
    'objectId',
  ]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const onShow = useCatchCallback(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append('from', from);
      query.append('to', to);

      const response = await fetchOrThrow(`/api/audit?${query.toString()}`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const user = users[item.userId];
      const userName = user?.name || '';
      const actionType = String(item.actionType || '');
      const objectType = String(item.objectType || '');
      const address = String(item.address || '');
      const objectId = String(item.objectId || '');

      return (
        userName.toLowerCase().includes(q) ||
        actionType.toLowerCase().includes(q) ||
        objectType.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q) ||
        objectId.toLowerCase().includes(q)
      );
    });
  }, [items, users, searchKeyword]);

  const renderCellContent = (item, key) => {
    if (key === 'actionTime') {
      return formatTime(item.actionTime, 'minutes');
    }

    if (key === 'userId') {
      const user = users[item.userId];
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <PersonOutlinedIcon sx={{ fontSize: 16, color: PRIMARY }} />
          <span>{user?.name || `User #${item.userId}`}</span>
        </Box>
      );
    }

    if (key === 'actionType') {
      const action = String(item.actionType || '').toLowerCase();
      const isDelete = action.includes('delete') || action.includes('remove');
      const isCreate = action.includes('create') || action.includes('add') || action.includes('login');
      const isUpdate = action.includes('update') || action.includes('edit');

      return (
        <Chip
          label={item.actionType || '—'}
          size="small"
          sx={{
            height: '22px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: isDelete ? '#fee2e2' : isCreate ? '#dcfce7' : isUpdate ? '#eff6ff' : '#f1f5f9',
            color: isDelete ? '#991b1b' : isCreate ? '#15803d' : isUpdate ? '#1d4ed8' : TEXT_SECONDARY,
            border: `1.5px solid ${isDelete ? '#fca5a5' : isCreate ? '#86efac' : isUpdate ? '#bfdbfe' : '#cbd5e1'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      );
    }

    return item[key] ?? '—';
  };

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 } }}>
            <HistoryOutlinedIcon sx={{ color: PRIMARY, fontSize: { xs: '20px', sm: '24px' } }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '15px !important', sm: '17px !important' },
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Audit Trail & System Logs
            </Typography>
          </Box>
        </Box>

        {/* Toolbar: Search, Filters and Column Picker */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            boxSizing: 'border-box',
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: SURFACE,
              borderRadius: '20px',
              paddingLeft: { xs: '10px', sm: '14px' },
              paddingRight: { xs: '6px', sm: '8px' },
              height: { xs: '34px', sm: '38px' },
              border: `1.5px solid ${BORDER}`,
              width: { xs: '100%', sm: '270px' },
              transition: 'all 0.15s ease',
              '&:focus-within': {
                borderColor: PRIMARY,
                boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
              },
            }}
          >
            <SearchIcon sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', sm: '17px' }, marginRight: { xs: '4px', sm: '8px' }, flexShrink: 0 }} />
            <InputBase
              placeholder="Search audit records..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 400,
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
            <ReportFilter onShow={onShow} deviceType="none" loading={loading} />
            <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
          </Box>
        </Box>
      </Box>

      {/* Main Table Container */}
      <Paper
        elevation={0}
        sx={{
          flex: '1 1 auto',
          width: '100%',
          height: 0,
          minHeight: 0,
          border: '1px solid #cbd5e1',
          borderRadius: { xs: '6px', sm: '8px' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'auto',
            ...scrollableSx,
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              width: '100%',
              minWidth: columns.length > 4 ? '850px' : '650px',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontFamily: FONT_FAMILY,
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((key, idx) => (
                  <TableCell
                    key={key}
                    align={key === 'actionType' ? 'center' : 'left'}
                    sx={{
                      width: key === 'actionTime' ? 180 : key === 'actionType' ? 140 : key === 'userId' ? 180 : 160,
                      fontWeight: '700 !important',
                      fontSize: { xs: '12px !important', sm: '13px !important' },
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      borderRight: idx === columns.length - 1 ? 'none' : '1px solid #cbd5e1',
                      py: { xs: '7px', sm: '9px' },
                      px: { xs: '10px', sm: '14px' },
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      ...fontStyle,
                    }}
                  >
                    {t(columnsMap.get(key)) || key}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={24} sx={{ color: PRIMARY }} />
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: TEXT_SECONDARY, mt: 1, fontFamily: FONT_FAMILY }}>
                      Loading audit records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <TableRow
                    key={item.id || index}
                    hover
                    sx={{
                      height: { xs: '40px', sm: '44px' },
                      '&:hover': {
                        backgroundColor: '#e6f7f5 !important',
                      },
                      '& td': {
                        py: { xs: '6px', sm: '8px' },
                        px: { xs: '8px', sm: '14px' },
                        fontSize: { xs: '12px', sm: '12.5px' },
                        fontWeight: 400,
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid #e2e8f0',
                        borderRight: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        ...fontStyle,
                      },
                    }}
                  >
                    {columns.map((key, idx) => (
                      <TableCell
                        key={key}
                        align={key === 'actionType' ? 'center' : 'left'}
                        sx={{
                          borderRight: idx === columns.length - 1 ? 'none !important' : '1px solid #e2e8f0',
                          color: key === 'userId' || key === 'objectId' ? '#0f172a !important' : TEXT,
                          fontWeight: key === 'userId' || key === 'objectId' ? '600 !important' : 400,
                        }}
                      >
                        {renderCellContent(item, key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{
                      py: 5,
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No audit records found. Select a date range and click show.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Footer System Status Bar */}
      <Box
        sx={{
          mt: 'auto',
          pt: { xs: '6px', sm: '10px' },
          pb: '2px',
          px: { xs: '2px', sm: '6px' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          borderTop: '1px solid #e2e8f0',
          width: '100%',
          flexShrink: 0,
          gap: { xs: 0.5, sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DnsOutlinedIcon sx={{ fontSize: '14px', color: PRIMARY }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Server:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>{serverHostIp}</strong>
          </Box>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: '14px', color: PRIMARY }} />
            <span style={{ color: '#64748b', fontSize: '11.5px', ...fontStyle }}>Version:</span>
            <strong style={{ color: '#0f172a', fontWeight: 600, fontSize: '11.5px', ...fontStyle }}>v{serverVersion}</strong>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            px: { xs: 1, sm: 1.4 },
            py: 0.4,
            borderRadius: '20px',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
              animation: 'livePulse 1.5s infinite ease-in-out',
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857', letterSpacing: '0.2px', ...fontStyle }}>
            Audit Logger Active
          </span>
        </Box>
      </Box>
    </Box>
  );
}