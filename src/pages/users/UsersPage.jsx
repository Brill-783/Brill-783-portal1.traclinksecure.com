import { useCallback, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Switch,
  TableFooter,
  FormControlLabel,
  Box,
  Alert,
  Button,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import { useCatch, useAsyncTask, useScrollToLoad, pageSize } from '../../reactHelper';
import { formatBoolean, formatTime } from '../../common/util/formatter';
import { useTranslation } from '../../common/components/LocalizationProvider';
import PageLayout from '../../common/components/PageLayout';
import SettingsMenu from '../../common/components/SettingsMenu';
import CollectionFab from '../../common/components/CollectionFab';
import CollectionActions from '../../common/components/CollectionActions';
import TableShimmer from '../../common/components/TableShimmer';
import { useManager } from '../../common/util/permissions';
import SearchHeader from '../../common/components/SearchHeader';
import useSettingsStyles from '../../common/theme/useSettingsStyles';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import UserDevicesValue from '../../settings/components/UserDevicesValue';
import {
  startImpersonation,
  isImpersonating,
  getImpersonationInfo,
  returnToAdmin,
} from '../../common/util/impersonation';

const UsersPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const manager = useManager();
  const currentUser = useSelector((state) => state.session?.user);

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [temporary, setTemporary] = useState(false);

  const impersonating = isImpersonating();
  const { backupAdminEmail, impersonatedUserEmail } = getImpersonationInfo();

  const handleLogin = useCatch(async (userId) => {
    await startImpersonation(currentUser, userId, dispatch);
    window.location.replace('/?tab=Objects');
  });

  const handleReturnToAdmin = useCatch(async () => {
    await returnToAdmin(dispatch);
    navigate('/settings/users');
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  const loadItems = useCallback(
    async (offset, signal) => {
      const query = new URLSearchParams({ excludeAttributes: true, limit: pageSize, offset });
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/users?${query.toString()}`, { signal });
      const data = await response.json();
      setItems((previous) => (offset ? [...previous, ...data] : data));
      setHasMore(data.length >= pageSize);
    },
    [searchKeyword],
  );

  const sentinelRef = useScrollToLoad(() => loadItems(items.length));

  useAsyncTask(
    async ({ signal }) => {
      void reloadKey;
      setItems([]);
      await loadItems(0, signal);
    },
    [reloadKey, loadItems],
  );

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {impersonating && (
          <Alert
            severity="info"
            sx={{ borderRadius: 0 }}
            action={(
              <Button color="inherit" size="small" onClick={handleReturnToAdmin}>
                {t('sharedReturnToAdmin') || 'Return to admin'}
              </Button>
            )}
          >
            {(t('sharedImpersonatingAs') || 'Logged in as')}
            {' '}
            {impersonatedUserEmail}
            {' '}
            {(t('sharedBackupAdmin') || '— admin session backed up for')}
            {' '}
            {backupAdminEmail}
          </Alert>
        )}

        <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

        <Box sx={{ width: '100%', overflowX: 'auto', flex: 1 }}>
          <Table className={classes.table} sx={{ width: '100%', minWidth: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('sharedName')}</TableCell>
                <TableCell>{t('userEmail')}</TableCell>
                <TableCell>{t('userAdmin')}</TableCell>
                <TableCell>{t('sharedDisabled')}</TableCell>
                <TableCell>{t('userExpirationTime')}</TableCell>
                <TableCell>{t('deviceTitle')}</TableCell>
                <TableCell className={classes.columnAction} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items
                .filter((u) => temporary || !u.temporary)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{formatBoolean(item.administrator, t)}</TableCell>
                    <TableCell>{formatBoolean(item.disabled, t)}</TableCell>
                    <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                    <TableCell>
                      <UserDevicesValue userId={item.id} />
                    </TableCell>
                    <TableCell className={classes.columnAction} padding="none">
                      <CollectionActions
                        itemId={item.id}
                        editPath="/settings/user"
                        endpoint="users"
                        onReload={reload}
                        customActions={manager ? [actionLogin, actionConnections] : [actionConnections]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {hasMore && (
                <TableShimmer ref={items.length > 0 ? sentinelRef : null} columns={7} endAction />
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={temporary}
                        onChange={(e) => setTemporary(e.target.checked)}
                        size="small"
                      />
                    )}
                    label={t('userTemporary')}
                    labelPlacement="start"
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Box>
      </Box>
      <CollectionFab editPath="/settings/user" />
    </PageLayout>
  );
};

export default UsersPage;