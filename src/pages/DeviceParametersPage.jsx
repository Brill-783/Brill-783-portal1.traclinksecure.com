import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Box,
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
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()(() => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    fontFamily: "'Roboto', -apple-system, sans-serif",
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
    fontWeight: 500,
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
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  table: {
    minWidth: 700,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableHeaderCell: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    borderBottom: '1px solid #e2e8f0',
    padding: '10px 16px',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  tableCell: {
    fontSize: '0.82rem',
    color: '#334155',
    fontWeight: 600,
    borderBottom: '1px solid #f1f5f9',
    padding: '10px 16px',
  },
  createButton: {
    backgroundColor: '#00ab8e',
    color: '#ffffff',
    textTransform: 'none',
    fontWeight: 700,
    borderRadius: '8px',
    fontSize: '0.84rem',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#008f77',
      boxShadow: 'none',
    },
  },
}));

const DeviceParametersPage = () => {
  const { classes } = useStyles();
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [description, setDescription] = useState('');
  const [attribute, setAttribute] = useState('');
  const [expression, setExpression] = useState('');
  const [type, setType] = useState('string');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const loadParameters = useCallback(async () => {
    try {
      const response = await fetchOrThrow('/api/attributes/computed');
      const data = await response.json();
      if (Array.isArray(data)) setItems(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadParameters();
  }, [loadParameters]);

  const handleOpenDialog = (param = null) => {
    if (param) {
      setEditingItem(param);
      setDescription(param.description || '');
      setAttribute(param.attribute || '');
      setExpression(param.expression || '');
      setType(param.type || 'string');
    } else {
      setEditingItem(null);
      setDescription('');
      setAttribute('');
      setExpression('');
      setType('string');
    }
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description.trim() || !attribute.trim() || !expression.trim()) return;

    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      description: description.trim(),
      attribute: attribute.trim(),
      expression: expression.trim(),
      type,
    };

    try {
      const endpoint = editingItem ? `/api/attributes/computed/${editingItem.id}` : '/api/attributes/computed';
      const method = editingItem ? 'PUT' : 'POST';

      await fetchOrThrow(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setDialogOpen(false);
      setSnackbar({ open: true, message: 'Parameter saved successfully.' });
      loadParameters();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save parameter.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetchOrThrow(`/api/attributes/computed/${id}`, { method: 'DELETE' });
      setSnackbar({ open: true, message: 'Parameter deleted.' });
      loadParameters();
    } catch (e) {}
  };

  const filteredItems = items.filter(
    (it) =>
      it.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      it.attribute?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>Device Parameters</div>
        <div className={classes.headerSubtitle}>
          Computed parameters and algebraic expressions evaluated against device telemetry.
        </div>
      </div>

      <div className={classes.toolbar}>
        <div className={classes.searchBox}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '4px 10px',
              height: '36px',
            }}
          >
            <InputBase
              placeholder="Search parameters..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              sx={{ fontSize: '0.84rem', flex: 1, color: '#0f172a', fontWeight: 600 }}
            />
            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
          </div>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => handleOpenDialog()}
          className={classes.createButton}
        >
          Add Parameter
        </Button>
      </div>

      <div className={classes.content}>
        <div className={classes.tableContainer}>
          <Table className={classes.table}>
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell className={classes.tableHeaderCell}>Description</TableCell>
                <TableCell className={classes.tableHeaderCell}>Attribute Field</TableCell>
                <TableCell className={classes.tableHeaderCell}>Expression</TableCell>
                <TableCell className={classes.tableHeaderCell}>Type</TableCell>
                <TableCell className={classes.tableHeaderCell} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={classes.tableCell} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                    No computed parameters configured.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={classes.tableRow}>
                    <TableCell className={classes.tableCell}>{item.description}</TableCell>
                    <TableCell className={classes.tableCell}>
                      <Chip label={item.attribute} size="small" sx={{ fontWeight: 700, backgroundColor: '#e6f7f5', color: '#00ab8e' }} />
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <code style={{ backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>
                        {item.expression}
                      </code>
                    </TableCell>
                    <TableCell className={classes.tableCell}>{item.type}</TableCell>
                    <TableCell className={classes.tableCell} align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: '#00ab8e', mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
          {editingItem ? 'Edit Parameter' : 'Add Computed Parameter'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              size="small"
              label="Description"
              required
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              size="small"
              label="Attribute Property"
              required
              fullWidth
              placeholder="e.g. speedKmh, batteryLevel"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
            />
            <TextField
              size="small"
              label="Expression"
              required
              fullWidth
              placeholder="e.g. speed * 1.852"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#00ab8e', '&:hover': { backgroundColor: '#008f77' }, textTransform: 'none', fontWeight: 700 }}
            >
              Save Parameter
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </div>
  );
};

export default DeviceParametersPage;