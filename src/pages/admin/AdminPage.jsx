import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AdminUsersView from './AdminUsersView';
import { getImpersonationInfo } from '../../common/util/impersonation';

const AdminPage = () => {
  const user = useSelector((state) => state.session?.user);

  const [impersonating, setImpersonating] = useState(false);
  const [checkingImpersonation, setCheckingImpersonation] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkImpersonation = async () => {
      try {
        const info = await getImpersonationInfo();
        if (mounted) {
          setImpersonating(Boolean(info?.impersonating));
        }
      } catch {
        if (mounted) {
          setImpersonating(false);
        }
      } finally {
        if (mounted) {
          setCheckingImpersonation(false);
        }
      }
    };

    checkImpersonation();

    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = Boolean(
    user?.administrator ||
      user?.admin ||
      user?.id === 1 ||
      user?.email === 'admin',
  );

  if (checkingImpersonation) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <CircularProgress
          size={28}
          thickness={4}
          sx={{ color: '#00ab8e' }}
        />
      </Box>
    );
  }

  if (!isAdmin && !impersonating) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <AdminUsersView />
    </Box>
  );
};

export default AdminPage;