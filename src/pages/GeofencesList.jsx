import React, { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Divider, List, ListItemButton, ListItemText } from '@mui/material';

import { geofencesActions } from '../store';
import CollectionActions from '../common/components/CollectionActions';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const useStyles = makeStyles()(() => ({
  list: {
    flexGrow: 1,
    overflow: 'auto',
    fontFamily: FONT_FAMILY,
    '& *': { fontFamily: `${FONT_FAMILY} !important` },
  },
}));

const GeofencesList = ({ onGeofenceSelected }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const items = useSelector((state) => state.geofences.items);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  return (
    <List className={classes.list}>
      {Object.values(items).map((item, index, list) => (
        <Fragment key={item.id}>
          <ListItemButton
            key={item.id}
            onClick={() => onGeofenceSelected(item.id)}
            sx={{
              py: '10px',
              px: '14px',
              '&:hover': { backgroundColor: '#f8fafc' },
            }}
          >
            <ListItemText
              primary={item.name}
              primaryTypographyProps={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
            />
            <CollectionActions
              itemId={item.id}
              editPath="/settings/geofence"
              endpoint="geofences"
              onReload={refreshGeofences}
            />
          </ListItemButton>
          {index < list.length - 1 ? <Divider sx={{ borderColor: '#f1f5f9' }} /> : null}
        </Fragment>
      ))}
    </List>
  );
};

export default GeofencesList;