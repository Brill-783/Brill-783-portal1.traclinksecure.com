
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputBase,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch, useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatTime } from '../common/util/formatter';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: '16px 24px 12px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '2px',
  },
  headerSubtitle: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
    flexShrink: 0,
  },
  searchBox: {
    width: '320px',
    maxWidth: '100%',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 24px',
    minHeight: 0,
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f1f5f9',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: '3px',
      '&:hover': {
        backgroundColor: '#94a3b8',
      },
    },
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'auto',
  },
  table: {
    minWidth: 800,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableHeaderCell: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    borderBottom: '1px solid #e2e8f0',
    py: 0.5,
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  tableCell: {
    fontSize: '0.75rem',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    py: 0.5,
  },
  chip: {
    fontSize: '0.7rem',
    height: '24px',
    fontWeight: 600,
  },
  infoChip: {
    fontSize: '0.65rem',
    height: '20px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  portInfoDialog: {
    '& .MuiPaper-root': {
      borderRadius: '16px',
      width: '480px',
      maxWidth: '95vw',
    },
  },
  portInfoSection: {
    marginBottom: '20px',
  },
  portInfoLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px',
  },
  portInfoValue: {
    fontSize: '0.85rem',
    color: '#334155',
  },
  deviceList: {
    maxHeight: '200px',
    overflow: 'auto',
    marginTop: '8px',
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #f1f5f9',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
}));

const PortsPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const dispatch = useDispatch();

  const devices = useSelector((state) => state.devices?.items) || {};
  const positions = useSelector((state) => state.session?.positions) || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [portInfoOpen, setPortInfoOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);

  // Load server configuration to get port information
  const loadServerConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/server');
      if (response.ok) {
        const data = await response.json();
        // Store server config for port information
        return data;
      }
    } catch (err) {
      console.error('Failed to load server config:', err);
      setError('Could not load server configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get device protocol from attributes
  const getDeviceProtocol = (device) => {
    const attrs = device.attributes || {};
    return attrs.protocol || 'unknown';
  };

  // Get device connection status
  const getDeviceConnectionStatus = (deviceId) => {
    const position = positions[deviceId];
    if (!position) return 'offline';
    const lastUpdate = new Date(position.deviceTime || position.fixTime);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / 60000;
    return diffMinutes < 10 ? 'online' : 'offline';
  };

  // Group devices by protocol
  const devicesByProtocol = useCallback(() => {
    const groups = {};
    Object.values(devices).forEach((device) => {
      const protocol = getDeviceProtocol(device);
      if (!groups[protocol]) {
        groups[protocol] = {
          protocol,
          devices: [],
          onlineCount: 0,
          offlineCount: 0,
        };
      }
      groups[protocol].devices.push(device);
      if (getDeviceConnectionStatus(device.id) === 'online') {
        groups[protocol].onlineCount++;
      } else {
        groups[protocol].offlineCount++;
      }
    });
    return Object.values(groups);
  }, [devices, positions]);

  // Get port number for protocol (Traccar standard ports)
  const getPortForProtocol = (protocol) => {
    const portMap = {
      teltonika: 5010,
      gt06: 5011,
      tk103: 5012,
      traccar: 5013,
      wialon: 5014,
      gl200: 5015,
      gl300: 5016,
      tlv300: 5017,
      mvt300: 5018,
      st300: 5019,
      st400: 5020,
      meitrack: 5021,
      galileo: 5022,
      intellitrac: 5023,
      gpsgate: 5024,
      artis: 5025,
      gryphon: 5026,
      calamp: 5027,
      tomtom: 5028,
      gosafe: 5029,
      jv200: 5030,
      jv300: 5031,
      jv500: 5032,
      skypatrol: 5033,
      supermate: 5034,
      tramelco: 5035,
      xt01: 5036,
      xt03: 5037,
      pt60: 5038,
      pt300: 5039,
      pt600: 5040,
      pt900: 5041,
      flespi: 5042,
      wondeX: 5043,
      wondeXB: 5044,
      wondeXC: 5045,
      wondeXD: 5046,
      wondeXE: 5047,
      wondeXF: 5048,
      wondeXG: 5049,
      wondeXH: 5050,
    };
    return portMap[protocol] || 0;
  };

  // Get connection type for protocol
  const getConnectionType = (protocol) => {
    const tcpProtocols = ['teltonika', 'gt06', 'tk103', 'traccar', 'wialon', 'gl200', 'gl300', 'tlv300', 'mvt300', 'st300', 'st400', 'meitrack', 'galileo', 'intellitrac', 'gpsgate', 'artis', 'gryphon', 'calamp', 'tomtom', 'gosafe', 'jv200', 'jv300', 'jv500', 'skypatrol', 'supermate', 'tramelco', 'xt01', 'xt03', 'pt60', 'pt300', 'pt600', 'pt900', 'flespi', 'wondeX'];
    return tcpProtocols.includes(protocol) ? 'TCP' : 'UDP';
  };

  // Format protocol name for display
  const formatProtocolName = (protocol) => {
    const names = {
      teltonika: 'Teltonika',
      gt06: 'GT06',
      tk103: 'TK103',
      traccar: 'Traccar',
      wialon: 'Wialon',
      gl200: 'GL200',
      gl300: 'GL300',
      tlv300: 'TLV300',
      mvt300: 'MVT300',
      st300: 'ST300',
      st400: 'ST400',
      meitrack: 'Meitrack',
      galileo: 'Galileo',
      intellitrac: 'Intellitrac',
      gpsgate: 'GPSGate',
      artis: 'Artis',
      gryphon: 'Gryphon',
      calamp: 'Calamp',
      tomtom: 'TomTom',
      gosafe: 'GoSafe',
      jv200: 'JV200',
      jv300: 'JV300',
      jv500: 'JV500',
      skypatrol: 'SkyPatrol',
      supermate: 'Supermate',
      tramelco: 'Tramelco',
      xt01: 'XT01',
      xt03: 'XT03',
      pt60: 'PT60',
      pt300: 'PT300',
      pt600: 'PT600',
      pt900: 'PT900',
      flespi: 'Flespi',
      wondeX: 'WondeX',
      unknown: 'Unknown',
    };
    return names[protocol] || protocol;
  };

  const protocolGroups = devicesByProtocol();

  const filteredProtocols = protocolGroups.filter((group) =>
    formatProtocolName(group.protocol).toLowerCase().includes(searchKeyword.toLowerCase()) ||
    String(getPortForProtocol(group.protocol)).includes(searchKeyword) ||
    group.devices.some((d) => d.name?.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // Handle port info dialog
  const handleOpenPortInfo = (group) => {
    setSelectedPort(group);
    setPortInfoOpen(true);
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>Ports</div>
        <div className={classes.headerSubtitle}>Monitor server communication ports and device connections</div>
      </div>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className={classes.toolbar}>
        <div className={classes.searchBox}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 10px', height: '36px' }}>
            <InputBase
              placeholder="Search by device, protocol, or port..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              sx={{ fontSize: '0.85rem', flex: 1, color: '#0f172a' }}
            />
            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
          </div>
        </div>
      </div>

      <div className={classes.content}>
        {Object.keys(devices).length === 0 ? (
          <div className={classes.emptyState}>
            <div className={classes.emptyTitle}>No devices found</div>
            <div className={classes.emptyText}>
              Add devices to the system to see their communication ports and connection status.
            </div>
          </div>
        ) : (
          <div className={classes.tableContainer}>
            <div className={classes.tableWrapper}>
              <Table className={classes.table}>
                <TableHead className={classes.tableHeader}>
                  <TableRow>
                    <TableCell className={classes.tableHeaderCell}>Device Name</TableCell>
                    <TableCell className={classes.tableHeaderCell}>IMEI / Unique ID</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Device Model</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Protocol</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Port Number</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Connection Type</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Status</TableCell>
                    <TableCell className={classes.tableHeaderCell}>Last Communication</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProtocols.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className={classes.tableCell} sx={{ textAlign: 'center' }}>
                        No devices match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(devices).filter((device) =>
                      formatProtocolName(getDeviceProtocol(device)).toLowerCase().includes(searchKeyword.toLowerCase()) ||
                      String(getPortForProtocol(getDeviceProtocol(device))).includes(searchKeyword) ||
                      (device.name || '').toLowerCase().includes(searchKeyword.toLowerCase())
                    ).map((device) => {
                      const protocol = getDeviceProtocol(device);
                      const port = getPortForProtocol(protocol);
                      const connectionType = getConnectionType(protocol);
                      const status = getDeviceConnectionStatus(device.id);
                      const position = positions[device.id];

                      return (
                        <TableRow key={device.id} className={classes.tableRow}>
                          <TableCell className={classes.tableCell}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{device.name || `Device #${device.id}`}</span>
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                              {device.uniqueId || '—'}
                            </code>
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            {device.model || '—'}
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            <Chip
                              label={formatProtocolName(protocol)}
                              size="small"
                              className={classes.chip}
                              sx={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}
                            />
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                              {port || '—'}
                            </code>
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            <Chip
                              label={connectionType}
                              size="small"
                              className={classes.chip}
                              sx={{ backgroundColor: connectionType === 'TCP' ? '#dcfce7' : '#fef3c7', color: connectionType === 'TCP' ? '#166534' : '#92400e' }}
                            />
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            <Chip
                              label={status === 'online' ? 'Connected' : 'Disconnected'}
                              size="small"
                              className={classes.chip}
                              sx={{ backgroundColor: status === 'online' ? '#dcfce7' : '#fee2e2', color: status === 'online' ? '#166534' : '#991b1b' }}
                            />
                          </TableCell>
                          <TableCell className={classes.tableCell}>
                            {position ? formatTime(position.deviceTime || position.fixTime, 'seconds') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Port Info Dialog */}
      <Dialog open={portInfoOpen} onClose={() => setPortInfoOpen(false)} className={classes.portInfoDialog}>
        <DialogTitle className={classes.headerTitle}>
          Port Information
        </DialogTitle>
        <DialogContent>
          {selectedPort && (
            <>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Port Number</div>
                <div className={classes.portInfoValue}>{getPortForProtocol(selectedPort.protocol) || '—'}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Protocol</div>
                <div className={classes.portInfoValue}>{formatProtocolName(selectedPort.protocol)}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Connection Type</div>
                <div className={classes.portInfoValue}>{getConnectionType(selectedPort.protocol)}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Total Devices</div>
                <div className={classes.portInfoValue}>{selectedPort.devices.length}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Online Devices</div>
                <div className={classes.portInfoValue}>{selectedPort.onlineCount}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Offline Devices</div>
                <div className={classes.portInfoValue}>{selectedPort.offlineCount}</div>
              </div>
              <div className={classes.portInfoSection}>
                <div className={classes.portInfoLabel}>Connected Devices</div>
                <div className={classes.deviceList}>
                  {selectedPort.devices.map((device) => (
                    <div key={device.id} className={classes.deviceItem}>
                      <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>{device.name || `Device #${device.id}`}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{device.uniqueId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPortInfoOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PortsPage;