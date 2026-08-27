import React, { useState, useEffect, useMemo, memo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  InputBase,
  Chip,
  Box,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  CircularProgress,
  Tooltip,
  Checkbox,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';

import Swal from 'sweetalert2';

import { useTranslation } from '../common/components/LocalizationProvider';
import fetchOrThrow from '../common/util/fetchOrThrow';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const SURFACE = '#ffffff';
const SURFACE_SOFT = '#f8fafc';
const BORDER = '#cbd5e1';
const BORDER_LIGHT = '#f1f5f9';
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

const showAlert = (options) => {
  return Swal.fire({
    target: document.body,
    customClass: {
      container: 'swal-top-layer',
    },
    didOpen: () => {
      const container = Swal.getContainer();

      if (container) {
        container.style.zIndex = '999999';
      }
    },
    ...options,
  });
};

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

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '7px',
    backgroundColor: SURFACE,
  },

  '& .MuiInputLabel-root': {
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
  },

  '& input': {
    fontSize: '13px',
    fontWeight: 500,
    color: TEXT,
    fontFamily: FONT_FAMILY,
  },

  '& textarea': {
    fontSize: '13px',
    fontWeight: 500,
    color: TEXT,
    fontFamily: FONT_FAMILY,
  },

  '& .MuiSelect-select': {
    fontSize: '13px',
    fontWeight: 500,
    color: TEXT,
    fontFamily: FONT_FAMILY,
  },
};

const TemplateTableRow = memo(({ item, onEdit, onDelete }) => {
  const isEmail = item.type === 'email';

  return (
    <TableRow
      hover
      sx={{
        height: {
          xs: '46px',
          sm: '50px',
        },

        '&:hover': {
          backgroundColor: '#e6f7f5 !important',
        },

        '& td': {
          py: {
            xs: '7px',
            sm: '9px',
          },

          px: {
            xs: '8px',
            sm: '14px',
          },

          fontSize: {
            xs: '12px',
            sm: '13px',
          },

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
      <TableCell
        sx={{
          color: '#0f172a !important',
          fontWeight: '700 !important',
        }}
      >
        {item.name}
      </TableCell>

      <TableCell
        align="center"
        sx={{
          width: 110,
        }}
      >
        <Chip
          icon={
            isEmail ? (
              <EmailOutlinedIcon
                sx={{
                  fontSize: '13px !important',
                }}
              />
            ) : (
              <SmsOutlinedIcon
                sx={{
                  fontSize: '13px !important',
                }}
              />
            )
          }
          label={isEmail ? 'Email' : 'SMS'}
          size="small"
          sx={{
            height: '22px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: isEmail ? '#eff6ff' : '#f0fdfa',
            color: isEmail ? '#1d4ed8' : PRIMARY_DARK,
            border: `1.5px solid ${isEmail ? '#bfdbfe' : '#ccfbf1'}`,
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      <TableCell
        sx={{
          color: '#475569',
          fontWeight: 500,
        }}
      >
        {item.subject || '-'}
      </TableCell>

      <TableCell
        sx={{
          color: '#64748b',
        }}
      >
        <Box
          sx={{
            maxWidth: '350px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.content}
        </Box>
      </TableCell>

      <TableCell
        align="center"
        sx={{
          borderRight: 'none !important',
          pr: 1.5,
          width: 150,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.8,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => onEdit(item)}
            sx={{
              minWidth: '58px',
              height: '28px',
              px: 1.2,
              borderRadius: '6px',
              borderColor: '#94a3b8',
              color: '#475569',
              backgroundColor: '#ffffff',
              textTransform: 'none',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: FONT_FAMILY,
              boxShadow: 'none',
              '&:hover': {
                borderColor: PRIMARY,
                color: PRIMARY,
                backgroundColor: '#f0fdfa',
              },
            }}
          >
            Edit
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => onDelete(item)}
            sx={{
              minWidth: '64px',
              height: '28px',
              px: 1.2,
              borderRadius: '6px',
              borderColor: '#fecaca',
              color: '#dc2626',
              backgroundColor: '#ffffff',
              textTransform: 'none',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: FONT_FAMILY,
              boxShadow: 'none',
              '&:hover': {
                borderColor: '#dc2626',
                color: '#b91c1c',
                backgroundColor: '#fef2f2',
              },
            }}
          >
            Delete
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
});

TemplateTableRow.displayName = 'TemplateTableRow';

export default function ChannelsPage() {
  const { classes } = useStyles();
  const t = useTranslation();

  const server = useSelector(
    (state) => state.session?.server || {},
    shallowEqual
  );

  const serverVersion = server?.version || '6.0';
  const serverHostIp =
    typeof window !== 'undefined'
      ? window.location.hostname || '127.0.0.1'
      : '127.0.0.1';

  const [activeTab, setActiveTab] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [mailHost, setMailHost] = useState('');
  const [mailPort, setMailPort] = useState('587');
  const [mailFrom, setMailFrom] = useState('');
  const [mailSenderName, setMailSenderName] = useState('');
  const [mailUsername, setMailUsername] = useState('');
  const [mailPassword, setMailPassword] = useState('');
  const [mailSsl, setMailSsl] = useState(false);
  const [mailStartTls, setMailStartTls] = useState(true);
  const [testEmailTarget, setTestEmailTarget] = useState('');

  const [smsHttpUrl, setSmsHttpUrl] = useState('');
  const [smsTemplate, setSmsTemplate] = useState(
    '{"to":"{phone}","message":"{message}"}'
  );
  const [smsAuthorization, setSmsAuthorization] = useState('');
  const [smsPhoneField, setSmsPhoneField] = useState('phone');
  const [testSmsTarget, setTestSmsTarget] = useState('');

  const [templates, setTemplates] = useState([
    {
      id: 1,
      type: 'email',
      name: 'Standard Alert',
      subject: 'Device Alert: {device.name}',
      content:
        'Alert notification for {device.name} at {position.time}.',
    },
    {
      id: 2,
      type: 'email',
      name: 'Geofence Event',
      subject: 'Geofence: {geofence.name}',
      content:
        'Device {device.name} entered/exited geofence {geofence.name}.',
    },
    {
      id: 3,
      type: 'sms',
      name: 'Emergency SMS',
      subject: '',
      content:
        'ALERT: {device.name} triggered SOS at {position.fixTime}.',
    },
    {
      id: 4,
      type: 'sms',
      name: 'Speed Warning SMS',
      subject: '',
      content:
        'Speed Warning: {device.name} reached {position.speed} km/h.',
    },
  ]);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [tplName, setTplName] = useState('');
  const [tplType, setTplType] = useState('email');
  const [tplSubject, setTplSubject] = useState('');
  const [tplContent, setTplContent] = useState('');

  useEffect(() => {
    if (!server || !server.attributes) {
      return;
    }

    const attributes = server.attributes;

    setMailHost(attributes['mail.smtp.host'] || '');
    setMailPort(String(attributes['mail.smtp.port'] || '587'));
    setMailFrom(attributes['mail.smtp.from'] || '');
    setMailSenderName(attributes['mail.smtp.sender'] || '');
    setMailUsername(attributes['mail.smtp.username'] || '');
    setMailPassword(attributes['mail.smtp.password'] || '');
    setMailSsl(Boolean(attributes['mail.smtp.ssl.enable']));

    setMailStartTls(
      attributes['mail.smtp.starttls.enable'] !== false
    );

    setSmsHttpUrl(attributes['sms.http.url'] || '');

    setSmsTemplate(
      attributes['sms.http.template'] ||
        '{"to":"{phone}","message":"{message}"}'
    );

    setSmsAuthorization(
      attributes['sms.http.authorization'] || ''
    );

    setSmsPhoneField(
      attributes['sms.http.phoneField'] || 'phone'
    );

    if (Array.isArray(attributes.notificationTemplates)) {
      setTemplates(attributes.notificationTemplates);
    }
  }, [server]);

  const handleSaveEmail = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setSaving(true);

    try {
      const payload = {
        ...server,
        attributes: {
          ...(server.attributes || {}),
          'mail.smtp.host': mailHost.trim(),
          'mail.smtp.port': Number(mailPort) || 587,
          'mail.smtp.from': mailFrom.trim(),
          'mail.smtp.sender': mailSenderName.trim(),
          'mail.smtp.username': mailUsername.trim(),
          'mail.smtp.password': mailPassword,
          'mail.smtp.ssl.enable': mailSsl,
          'mail.smtp.starttls.enable': mailStartTls,
        },
      };

      await fetchOrThrow('/api/server', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      showAlert({
        icon: 'success',
        title: 'Email Gateway Saved',
        text: 'SMTP settings updated successfully on the server.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text:
          error.message ||
          'Unable to update email configuration.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTarget.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Recipient Required',
        text: 'Enter a destination email address for testing.',
        confirmButtonColor: PRIMARY,
      });

      return;
    }

    setTesting(true);

    try {
      await fetchOrThrow('/api/notifications/test/mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmailTarget.trim(),
        }),
      });

      showAlert({
        icon: 'success',
        title: 'Test Email Dispatched',
        text: `Diagnostic message sent to ${testEmailTarget.trim()}.`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Mail Test Failed',
        text:
          error.message ||
          'Check your SMTP credentials and connectivity.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSms = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setSaving(true);

    try {
      const payload = {
        ...server,
        attributes: {
          ...(server.attributes || {}),
          'sms.http.url': smsHttpUrl.trim(),
          'sms.http.template': smsTemplate,
          'sms.http.authorization':
            smsAuthorization.trim(),
          'sms.http.phoneField': smsPhoneField.trim(),
        },
      };

      await fetchOrThrow('/api/server', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      showAlert({
        icon: 'success',
        title: 'SMS Gateway Saved',
        text:
          'Cellular HTTP SMS configuration saved successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text:
          error.message ||
          'Unable to update SMS gateway settings.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testSmsTarget.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Recipient Required',
        text:
          'Enter a valid target mobile number for testing.',
        confirmButtonColor: PRIMARY,
      });

      return;
    }

    setTesting(true);

    try {
      await fetchOrThrow('/api/notifications/test/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: testSmsTarget.trim(),
        }),
      });

      showAlert({
        icon: 'success',
        title: 'Test SMS Dispatched',
        text:
          `Diagnostic SMS packet submitted to ${testSmsTarget.trim()}.`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'SMS Test Failed',
        text:
          error.message ||
          'Check your SMS API gateway URL and API token.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleOpenAddTemplate = () => {
    setActiveTemplate(null);
    setTplName('');
    setTplType('email');
    setTplSubject('');
    setTplContent('');
    setTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (template) => {
    setActiveTemplate(template);
    setTplName(template.name || '');
    setTplType(template.type || 'email');
    setTplSubject(template.subject || '');
    setTplContent(template.content || '');
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!tplName.trim() || !tplContent.trim()) {
      showAlert({
        icon: 'error',
        title: 'Validation Error',
        text:
          'Please enter a template title and message body.',
        confirmButtonColor: PRIMARY,
      });

      return;
    }

    const newTemplate = {
      id: activeTemplate
        ? activeTemplate.id
        : Date.now(),

      name: tplName.trim(),

      type: tplType,

      subject:
        tplType === 'email'
          ? tplSubject.trim()
          : '',

      content: tplContent.trim(),
    };

    const nextTemplates = activeTemplate
      ? templates.map((template) =>
          template.id === activeTemplate.id
            ? newTemplate
            : template
        )
      : [...templates, newTemplate];

    setTemplates(nextTemplates);

    try {
      await fetchOrThrow('/api/server', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...server,
          attributes: {
            ...(server.attributes || {}),
            notificationTemplates: nextTemplates,
          },
        }),
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Template Save Failed',
        text:
          error.message ||
          'The template could not be saved to the server.',
        confirmButtonColor: PRIMARY,
      });

      return;
    }

    setTemplateModalOpen(false);

    showAlert({
      icon: 'success',
      title: activeTemplate
        ? 'Template Updated'
        : 'Template Created',
      text:
        `Template "${tplName.trim()}" is ready.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleDeleteTemplate = async (template) => {
    const result = await showAlert({
      title: 'Delete Template?',
      html:
        `Are you sure you want to remove <strong>${template.name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) {
      return;
    }

    const nextTemplates = templates.filter(
      (item) => item.id !== template.id
    );

    setTemplates(nextTemplates);

    try {
      await fetchOrThrow('/api/server', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...server,
          attributes: {
            ...(server.attributes || {}),
            notificationTemplates: nextTemplates,
          },
        }),
      });
    } catch (error) {
      showAlert({
        icon: 'error',
        title: 'Delete Failed',
        text:
          error.message ||
          'The template could not be removed from the server.',
        confirmButtonColor: PRIMARY,
      });

      return;
    }

    showAlert({
      icon: 'success',
      title: 'Deleted',
      text: 'Notification template removed.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filteredTemplates = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();

    if (!query) {
      return templates;
    }

    return templates.filter((template) => {
      return (
        String(template.name || '')
          .toLowerCase()
          .includes(query) ||
        String(template.subject || '')
          .toLowerCase()
          .includes(query) ||
        String(template.content || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [templates, searchKeyword]);

  return (
    <Box className={classes.root}>
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: {
            xs: 1,
            sm: 1.5,
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: {
                xs: 0.8,
                sm: 1.2,
              },
            }}
          >
            <ContactMailOutlinedIcon
              sx={{
                color: PRIMARY,
                fontSize: {
                  xs: '20px',
                  sm: '24px',
                },
              }}
            />

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: {
                  xs: '15px !important',
                  sm: '17px !important',
                },
                color: TEXT,
                letterSpacing: '-0.02em',
                fontFamily: FONT_FAMILY,
                lineHeight: 1.2,
              }}
            >
              Communication Channels & Gateways
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            boxSizing: 'border-box',
            flexWrap: 'wrap',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{
              minHeight: '38px',
              backgroundColor: SURFACE,
              borderRadius: '8px',
              border: `1px solid ${BORDER}`,
              p: 0.3,

              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                color: TEXT_SECONDARY,
                minHeight: '32px',
                borderRadius: '6px',
                px: 1.8,
                fontFamily: FONT_FAMILY,
              },

              '& .Mui-selected': {
                color: '#ffffff !important',
                backgroundColor: `${PRIMARY} !important`,
              },

              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab
              icon={
                <EmailOutlinedIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              }
              iconPosition="start"
              label="Email (SMTP)"
            />

            <Tab
              icon={
                <SmsOutlinedIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              }
              iconPosition="start"
              label="SMS Gateway"
            />

            <Tab
              icon={
                <MarkEmailReadOutlinedIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              }
              iconPosition="start"
              label={`Templates (${templates.length})`}
            />
          </Tabs>

          {activeTab === 2 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: {
                  xs: '100%',
                  sm: 'auto',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: SURFACE,
                  borderRadius: '20px',
                  paddingLeft: '12px',
                  paddingRight: '6px',
                  height: '34px',
                  border: `1.5px solid ${BORDER}`,
                  width: {
                    xs: '100%',
                    sm: '220px',
                  },
                  transition: 'all 0.15s ease',

                  '&:focus-within': {
                    borderColor: PRIMARY,
                    boxShadow:
                      '0 0 0 2px rgba(0, 171, 142, 0.15)',
                  },
                }}
              >
                <SearchIcon
                  sx={{
                    color: TEXT_MUTED,
                    fontSize: '16px',
                    marginRight: '6px',
                    flexShrink: 0,
                  }}
                />

                <InputBase
                  placeholder="Search templates..."
                  value={searchKeyword}
                  onChange={(event) =>
                    setSearchKeyword(event.target.value)
                  }
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '12.5px',
                    color: TEXT,
                    fontFamily: FONT_FAMILY,
                  }}
                />
              </Box>

              <Button
                variant="contained"
                startIcon={
                  <AddIcon
                    sx={{
                      fontSize: 18,
                    }}
                  />
                }
                onClick={handleOpenAddTemplate}
                sx={{
                  height: '34px',
                  px: 2,
                  borderRadius: '8px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  textTransform: 'none',
                  fontSize: '12.5px !important',
                  fontWeight: '700 !important',
                  fontFamily: FONT_FAMILY,
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',

                  '&:hover': {
                    backgroundColor: PRIMARY_DARK,
                    boxShadow: 'none',
                  },
                }}
              >
                Add Template
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          height: 0,
          minHeight: 0,
          overflowY: 'auto',
          ...scrollableSx,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeTab === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },

              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              backgroundColor: SURFACE,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: TEXT,
                  mb: 0.3,
                  fontFamily: FONT_FAMILY,
                }}
              >
                SMTP Server Gateway
              </Typography>

              <Typography
                sx={{
                  fontSize: '12px',
                  color: TEXT_SECONDARY,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Configure the outgoing mail server for alarm
                notifications and automated system reports.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '3fr 1fr',
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="SMTP Host"
                size="small"
                fullWidth
                value={mailHost}
                onChange={(event) =>
                  setMailHost(event.target.value)
                }
                placeholder="smtp.mailgun.org"
                sx={inputSx}
              />

              <TextField
                label="Port"
                size="small"
                fullWidth
                type="number"
                value={mailPort}
                onChange={(event) =>
                  setMailPort(event.target.value)
                }
                placeholder="587"
                sx={inputSx}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="From Address"
                size="small"
                fullWidth
                type="email"
                value={mailFrom}
                onChange={(event) =>
                  setMailFrom(event.target.value)
                }
                placeholder="noreply@fleetdomain.com"
                sx={inputSx}
              />

              <TextField
                label="Sender Name"
                size="small"
                fullWidth
                value={mailSenderName}
                onChange={(event) =>
                  setMailSenderName(event.target.value)
                }
                placeholder="GPS Alert Center"
                sx={inputSx}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="SMTP Username"
                size="small"
                fullWidth
                value={mailUsername}
                onChange={(event) =>
                  setMailUsername(event.target.value)
                }
                placeholder="user@domain.com"
                sx={inputSx}
              />

              <TextField
                label="SMTP Password"
                size="small"
                fullWidth
                type="password"
                value={mailPassword}
                onChange={(event) =>
                  setMailPassword(event.target.value)
                }
                placeholder="Password"
                sx={inputSx}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  p: 1.2,
                  borderRadius: '6px',
                  border: `1px solid ${BORDER}`,
                  backgroundColor: mailStartTls
                    ? '#f0fdfa'
                    : SURFACE_SOFT,
                }}
                onClick={() =>
                  setMailStartTls(!mailStartTls)
                }
              >
                <Checkbox
                  size="small"
                  checked={mailStartTls}
                  onChange={(event) =>
                    setMailStartTls(event.target.checked)
                  }
                  sx={{
                    p: 0.5,
                    color: '#cbd5e1',

                    '&.Mui-checked': {
                      color: PRIMARY,
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: TEXT,
                    ml: 0.5,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Enable STARTTLS (Port 587)
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  p: 1.2,
                  borderRadius: '6px',
                  border: `1px solid ${BORDER}`,
                  backgroundColor: mailSsl
                    ? '#f0fdfa'
                    : SURFACE_SOFT,
                }}
                onClick={() => setMailSsl(!mailSsl)}
              >
                <Checkbox
                  size="small"
                  checked={mailSsl}
                  onChange={(event) =>
                    setMailSsl(event.target.checked)
                  }
                  sx={{
                    p: 0.5,
                    color: '#cbd5e1',

                    '&.Mui-checked': {
                      color: PRIMARY,
                    },
                  }}
                />

                <Typography
                  sx={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: TEXT,
                    ml: 0.5,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Enable Direct SSL/TLS (Port 465)
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                borderTop: `1px solid ${BORDER_LIGHT}`,
                pt: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: TEXT,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Test Email Transmission
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.2,
                  maxWidth: '600px',

                  '@media (max-width: 600px)': {
                    flexDirection: 'column',
                    maxWidth: '100%',
                  },
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmailTarget}
                  onChange={(event) =>
                    setTestEmailTarget(event.target.value)
                  }
                  sx={inputSx}
                />

                <Button
                  variant="outlined"
                  disabled={testing}
                  startIcon={
                    testing ? (
                      <CircularProgress
                        size={14}
                        color="inherit"
                      />
                    ) : (
                      <SendIcon
                        sx={{
                          fontSize: 15,
                        }}
                      />
                    )
                  }
                  onClick={handleTestEmail}
                  sx={{
                    height: '38px',
                    minWidth: '120px',
                    borderRadius: '7px',
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: FONT_FAMILY,

                    '&:hover': {
                      borderColor: PRIMARY_DARK,
                      backgroundColor: '#f0fdfa',
                    },

                    '@media (max-width: 600px)': {
                      width: '100%',
                    },
                  }}
                >
                  Send Test
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                pt: 1,
              }}
            >
              <Button
                variant="contained"
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <SaveIcon
                      sx={{
                        fontSize: 17,
                      }}
                    />
                  )
                }
                onClick={handleSaveEmail}
                sx={{
                  height: '38px',
                  px: 3,
                  borderRadius: '7px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  fontFamily: FONT_FAMILY,
                  boxShadow: 'none',

                  '&:hover': {
                    backgroundColor: PRIMARY_DARK,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Email Gateway'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },

              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              backgroundColor: SURFACE,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: TEXT,
                  mb: 0.3,
                  fontFamily: FONT_FAMILY,
                }}
              >
                HTTP SMS Service Gateway
              </Typography>

              <Typography
                sx={{
                  fontSize: '12px',
                  color: TEXT_SECONDARY,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Deliver instantaneous cellular SMS alerts using
                your SMS provider or custom HTTP gateway.
              </Typography>
            </Box>

            <TextField
              label="SMS API Endpoint URL"
              size="small"
              fullWidth
              value={smsHttpUrl}
              onChange={(event) =>
                setSmsHttpUrl(event.target.value)
              }
              placeholder="https://api.gateway.com/v1/sms/send"
              sx={inputSx}
            />

            <TextField
              label="Authorization Header / API Key"
              size="small"
              fullWidth
              value={smsAuthorization}
              onChange={(event) =>
                setSmsAuthorization(event.target.value)
              }
              placeholder="Bearer your_secret_token"
              sx={inputSx}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 2fr',
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="Mobile Phone Field Identifier"
                size="small"
                fullWidth
                value={smsPhoneField}
                onChange={(event) =>
                  setSmsPhoneField(event.target.value)
                }
                placeholder="phone"
                sx={inputSx}
              />

              <TextField
                label="HTTP JSON / Body Payload Template"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={smsTemplate}
                onChange={(event) =>
                  setSmsTemplate(event.target.value)
                }
                placeholder='{"to":"{phone}","message":"{message}"}'
                sx={inputSx}
              />
            </Box>

            <Box
              sx={{
                borderTop: `1px solid ${BORDER_LIGHT}`,
                pt: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: TEXT,
                  fontFamily: FONT_FAMILY,
                }}
              >
                Test SMS Transmission
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.2,
                  maxWidth: '600px',

                  '@media (max-width: 600px)': {
                    flexDirection: 'column',
                    maxWidth: '100%',
                  },
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder="+260 97 000 0000"
                  value={testSmsTarget}
                  onChange={(event) =>
                    setTestSmsTarget(event.target.value)
                  }
                  sx={inputSx}
                />

                <Button
                  variant="outlined"
                  disabled={testing}
                  startIcon={
                    testing ? (
                      <CircularProgress
                        size={14}
                        color="inherit"
                      />
                    ) : (
                      <SendIcon
                        sx={{
                          fontSize: 15,
                        }}
                      />
                    )
                  }
                  onClick={handleTestSms}
                  sx={{
                    height: '38px',
                    minWidth: '120px',
                    borderRadius: '7px',
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: FONT_FAMILY,

                    '&:hover': {
                      borderColor: PRIMARY_DARK,
                      backgroundColor: '#f0fdfa',
                    },

                    '@media (max-width: 600px)': {
                      width: '100%',
                    },
                  }}
                >
                  Send Test
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                pt: 1,
              }}
            >
              <Button
                variant="contained"
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <SaveIcon
                      sx={{
                        fontSize: 17,
                      }}
                    />
                  )
                }
                onClick={handleSaveSms}
                sx={{
                  height: '38px',
                  px: 3,
                  borderRadius: '7px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  fontFamily: FONT_FAMILY,
                  boxShadow: 'none',

                  '&:hover': {
                    backgroundColor: PRIMARY_DARK,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving
                  ? 'Saving...'
                  : 'Save SMS Gateway'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 auto',
              width: '100%',
              height: 0,
              minHeight: 0,
              border: '1px solid #cbd5e1',
              borderRadius: {
                xs: '6px',
                sm: '8px',
              },
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
                  minWidth: '900px',
                  tableLayout: 'fixed',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <TableHead>
                  <TableRow>
                    {[
                      ['Template Name', 200],
                      ['Type', 110],
                      ['Subject Line', 220],
                      ['Message Body Content', 350],
                      ['Actions', 150],
                    ].map(([label, width], index) => (
                      <TableCell
                        key={label}
                        align={
                          index === 1 || index === 4
                            ? 'center'
                            : 'left'
                        }
                        sx={{
                          width,
                          fontWeight: '700 !important',
                          fontSize: {
                            xs: '12px !important',
                            sm: '13px !important',
                          },
                          color: '#0f172a',
                          backgroundColor: '#e6f7f5',
                          borderBottom:
                            '2px solid #00ab8e',
                          borderRight:
                            index === 4
                              ? 'none'
                              : '1px solid #cbd5e1',
                          py: {
                            xs: '7px',
                            sm: '9px',
                          },
                          px: {
                            xs: '10px',
                            sm: '14px',
                          },
                          position: 'sticky',
                          top: 0,
                          right:
                            index === 4
                              ? 0
                              : 'auto',
                          zIndex:
                            index === 4 ? 3 : 2,
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                          ...fontStyle,
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((item) => (
                      <TemplateTableRow
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEditTemplate}
                        onDelete={handleDeleteTemplate}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{
                          py: 4,
                          color: '#64748b',
                          fontSize: '12.5px',
                          ...fontStyle,
                        }}
                      >
                        No notification templates configured.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        )}
      </Box>

      <Box
        sx={{
          mt: 'auto',
          pt: {
            xs: '6px',
            sm: '10px',
          },
          pb: '2px',
          px: {
            xs: '2px',
            sm: '6px',
          },
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },
          justifyContent: 'space-between',
          borderTop: '1px solid #e2e8f0',
          width: '100%',
          flexShrink: 0,
          gap: {
            xs: 0.5,
            sm: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: {
              xs: 1,
              sm: 1.5,
            },
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <DnsOutlinedIcon
              sx={{
                fontSize: '14px',
                color: PRIMARY,
              }}
            />

            <span
              style={{
                color: '#64748b',
                fontSize: '11.5px',
                ...fontStyle,
              }}
            >
              Server:
            </span>

            <strong
              style={{
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '11.5px',
                ...fontStyle,
              }}
            >
              {serverHostIp}
            </strong>
          </Box>

          <span
            style={{
              color: '#cbd5e1',
            }}
          >
            |
          </span>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <InfoOutlinedIcon
              sx={{
                fontSize: '14px',
                color: PRIMARY,
              }}
            />

            <span
              style={{
                color: '#64748b',
                fontSize: '11.5px',
                ...fontStyle,
              }}
            >
              Version:
            </span>

            <strong
              style={{
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '11.5px',
                ...fontStyle,
              }}
            >
              v{serverVersion}
            </strong>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            px: {
              xs: 1,
              sm: 1.4,
            },
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
              boxShadow:
                '0 0 6px rgba(16, 185, 129, 0.8)',
              animation:
                'livePulse 1.5s infinite ease-in-out',
            }}
          />

          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#047857',
              letterSpacing: '0.2px',
              ...fontStyle,
            }}
          >
            Notification Daemons Online
          </span>
        </Box>
      </Box>

      <Dialog
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: SURFACE,
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: FONT_FAMILY,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: SURFACE,
            borderBottom:
              `1px solid ${BORDER_LIGHT}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <MarkEmailReadOutlinedIcon
              sx={{
                color: PRIMARY,
                fontSize: '20px',
              }}
            />

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                color: TEXT,
                fontFamily: FONT_FAMILY,
              }}
            >
              {activeTemplate
                ? 'Edit Template'
                : 'Add Notification Template'}
            </Typography>
          </Box>

          <IconButton
            onClick={() =>
              setTemplateModalOpen(false)
            }
            size="small"
            sx={{
              color: TEXT_SECONDARY,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            label="Template Title"
            size="small"
            fullWidth
            value={tplName}
            onChange={(event) =>
              setTplName(event.target.value)
            }
            placeholder="Example: Speed Warning SMS"
            sx={inputSx}
          />

          <TextField
            select
            label="Channel Type"
            size="small"
            fullWidth
            value={tplType}
            onChange={(event) =>
              setTplType(event.target.value)
            }
            sx={inputSx}
          >
            <MenuItem value="email">
              Email
            </MenuItem>

            <MenuItem value="sms">
              SMS
            </MenuItem>
          </TextField>

          {tplType === 'email' && (
            <TextField
              label="Subject Template"
              size="small"
              fullWidth
              value={tplSubject}
              onChange={(event) =>
                setTplSubject(event.target.value)
              }
              placeholder="Example: Device Alert: {device.name}"
              sx={inputSx}
            />
          )}

          <TextField
            label="Message Content Body"
            size="small"
            fullWidth
            multiline
            rows={4}
            value={tplContent}
            onChange={(event) =>
              setTplContent(event.target.value)
            }
            placeholder="Available tokens: {device.name}, {position.speed}, {geofence.name}, {position.address}"
            sx={inputSx}
          />
        </DialogContent>

        <DialogActions
          sx={{
            p: '12px 18px',
            borderTop:
              `1px solid ${BORDER_LIGHT}`,
            gap: 1,
          }}
        >
          <Button
            onClick={() =>
              setTemplateModalOpen(false)
            }
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '6px',
              color: PRIMARY,
              borderColor: PRIMARY,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: FONT_FAMILY,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            size="small"
            sx={{
              borderRadius: '6px',
              backgroundColor: PRIMARY,
              color: SURFACE,

              '&:hover': {
                backgroundColor: PRIMARY_DARK,
              },

              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: FONT_FAMILY,
              boxShadow: 'none',
            }}
          >
            {activeTemplate
              ? 'Update Template'
              : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}