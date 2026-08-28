import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Skeleton,
  Typography,
  TextField,
} from '@mui/material';
import { useCatch, useAsyncTask } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import PageLayout from '../../common/components/PageLayout';
import useSettingsStyles from '../theme/useSettingsStyles';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const EditItemView = ({
  children,
  endpoint,
  item,
  setItem,
  defaultItem,
  validate,
  onItemSaved,
  menu,
  breadcrumbs,
}) => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  useAsyncTask(
    async ({ signal }) => {
      if (!item) {
        if (id) {
          const response = await fetchOrThrow(`/api/${endpoint}/${id}`, { signal });
          setItem(await response.json());
        } else {
          setItem(defaultItem || {});
        }
      }
    },
    [id, item, defaultItem, endpoint, setItem],
  );

  const handleSave = useCatch(async () => {
    let url = `/api/${endpoint}`;
    if (id) {
      url += `/${id}`;
    }

    const response = await fetchOrThrow(url, {
      method: !id ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (onItemSaved) {
      onItemSaved(await response.json());
    }
    navigate(-1);
  });

  return (
    <PageLayout menu={menu} breadcrumbs={breadcrumbs}>
      {/* 
        REPLACED <Container maxWidth="xs"> WITH FLUID 100% FULL-WIDTH BOX 
        This allows UserPage and all edit forms to stretch edge-to-edge
      */}
      <Box
        sx={{
          width: '100% !important',
          maxWidth: '100% !important',
          minWidth: '0 !important',
          flex: '1 1 0%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {item ? (
          children
        ) : (
          <Accordion defaultExpanded sx={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <AccordionSummary>
              <Typography variant="subtitle1">
                <Skeleton width="10em" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={-i} width="100%">
                  <TextField fullWidth size="small" />
                </Skeleton>
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Clean Modern Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: '1px solid #e2e8f0',
            width: '100%',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={!item}
            sx={{
              borderColor: '#cbd5e1',
              color: '#64748b',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
            }}
          >
            {t('sharedCancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!item || (validate && !validate())}
            sx={{
              backgroundColor: '#00ab8e',
              color: '#ffffff',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              '&:hover': { backgroundColor: '#008f77' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8' },
            }}
          >
            {t('sharedSave')}
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default EditItemView;