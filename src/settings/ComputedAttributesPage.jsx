import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FunctionsIcon from '@mui/icons-material/Functions';
import Swal from 'sweetalert2';

import { useTranslation } from '../common/components/LocalizationProvider';
import { useAdministrator } from '../common/util/permissions';
import fetchOrThrow from '../common/util/fetchOrThrow';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
const BACKGROUND = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT = '#1e293b';
const SECONDARY = '#64748b';
const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const pageSize = 50;

const alert = (options) =>
  Swal.fire({
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

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  '& .MuiInputLabel-root': {
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
  },
  '& input': {
    fontFamily: FONT_FAMILY,
    fontSize: '13px',
    color: TEXT,
  },
};

const ComputedAttributesPage = () => {
  const t = useTranslation();
  const administrator = useAdministrator();

  const [reloadKey, reload] = useReducer((value) => value + 1, 0);
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [description, setDescription] = useState('');
  const [attribute, setAttribute] = useState('');
  const [expression, setExpression] = useState('');
  const [type, setType] = useState('string');

  const loadItems = useCallback(
    async (offset = 0, signal) => {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const query = new URLSearchParams({
          limit: String(pageSize),
          offset: String(offset),
        });

        if (searchKeyword.trim()) {
          query.append('keyword', searchKeyword.trim());
        }

        const response = await fetchOrThrow(
          `/api/attributes/computed?${query.toString()}`,
          {
            signal,
          },
        );

        const data = await response.json();

        setItems((previous) =>
          offset === 0 ? data : [...previous, ...data],
        );

        setHasMore(data.length >= pageSize);
      } catch (error) {
        if (error.name !== 'AbortError') {
          alert({
            icon: 'error',
            title: 'Unable to Load Attributes',
            text:
              error.message ||
              'The computed attributes could not be loaded.',
            confirmButtonColor: PRIMARY,
          });
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchKeyword],
  );

  useEffect(() => {
    const controller = new AbortController();

    setItems([]);
    setHasMore(true);

    loadItems(0, controller.signal);

    return () => {
      controller.abort();
    };
  }, [reloadKey, loadItems]);

  const handleSearchChange = (event) => {
    setSearchKeyword(event.target.value);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setDescription('');
    setAttribute('');
    setExpression('');
    setType('string');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setDescription(item.description || '');
    setAttribute(item.attribute || '');
    setExpression(item.expression || '');
    setType(item.type || 'string');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingItem(null);
    setDescription('');
    setAttribute('');
    setExpression('');
    setType('string');
  };

  const handleSave = async () => {
    if (!description.trim()) {
      await alert({
        icon: 'warning',
        title: 'Description Required',
        text: 'Enter a description for the computed attribute.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!attribute.trim()) {
      await alert({
        icon: 'warning',
        title: 'Attribute Required',
        text: 'Enter the attribute name.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    if (!expression.trim()) {
      await alert({
        icon: 'warning',
        title: 'Expression Required',
        text: 'Enter the computed expression.',
        confirmButtonColor: PRIMARY,
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        description: description.trim(),
        attribute: attribute.trim(),
        expression: expression.trim(),
        type,
      };

      const endpoint = editingItem
        ? `/api/attributes/computed/${editingItem.id}`
        : '/api/attributes/computed';

      const method = editingItem ? 'PUT' : 'POST';

      await fetchOrThrow(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          editingItem
            ? {
                ...editingItem,
                ...payload,
              }
            : payload,
        ),
      });

      setDialogOpen(false);
      setEditingItem(null);
      setDescription('');
      setAttribute('');
      setExpression('');
      setType('string');

      reload();

      await alert({
        icon: 'success',
        title: editingItem
          ? 'Computed Attribute Updated'
          : 'Computed Attribute Created',
        text: editingItem
          ? 'The computed attribute was updated successfully.'
          : 'The computed attribute was created successfully.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await alert({
        icon: 'error',
        title: 'Save Failed',
        text:
          error.message ||
          'The computed attribute could not be saved.',
        confirmButtonColor: PRIMARY,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await alert({
      icon: 'warning',
      title: 'Delete Computed Attribute?',
      html: `Are you sure you want to delete <strong>${item.description || item.attribute}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await fetchOrThrow(
        `/api/attributes/computed/${item.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      setItems((previous) =>
        previous.filter((entry) => entry.id !== item.id),
      );

      await alert({
        icon: 'success',
        title: 'Deleted',
        text: 'The computed attribute has been deleted.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await alert({
        icon: 'error',
        title: 'Delete Failed',
        text:
          error.message ||
          'The computed attribute could not be deleted.',
        confirmButtonColor: PRIMARY,
      });
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadItems(items.length);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BACKGROUND,
        overflow: 'hidden',
        fontFamily: FONT_FAMILY,
        p: {
          xs: 1,
          sm: 2,
        },
        gap: 1.5,
        '& *': {
          fontFamily: `${FONT_FAMILY} !important`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FunctionsIcon
            sx={{
              color: PRIMARY,
              fontSize: {
                xs: 21,
                sm: 24,
              },
            }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: {
                  xs: '15px',
                  sm: '17px',
                },
                fontWeight: 700,
                color: TEXT,
                lineHeight: 1.2,
              }}
            >
              {t('sharedComputedAttributes')}
            </Typography>

            <Typography
              sx={{
                fontSize: '11.5px',
                color: SECONDARY,
                mt: 0.25,
              }}
            >
              Manage calculated device attributes and expressions
            </Typography>
          </Box>
        </Box>

        {administrator && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              minHeight: 36,
              px: 2,
              borderRadius: '7px',
              backgroundColor: PRIMARY,
              color: '#ffffff',
              textTransform: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: PRIMARY_DARK,
                boxShadow: 'none',
              },
            }}
          >
            Add Computed Attribute
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          size="small"
          value={searchKeyword}
          onChange={handleSearchChange}
          placeholder="Search computed attributes..."
          sx={inputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: '#94a3b8',
                    fontSize: 18,
                  }}
                />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title="Refresh">
          <IconButton
            onClick={reload}
            sx={{
              width: 38,
              height: 38,
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: SECONDARY,
              '&:hover': {
                color: PRIMARY,
                borderColor: PRIMARY,
                backgroundColor: '#f0fdfa',
              },
            }}
          >
            <RefreshIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: 6,
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#cbd5e1',
              borderRadius: 6,
            },
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: 850,
              tableLayout: 'fixed',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: '22%',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: TEXT,
                    backgroundColor: '#e6f7f5',
                    borderBottom: `2px solid ${PRIMARY}`,
                  }}
                >
                  {t('sharedDescription')}
                </TableCell>

                <TableCell
                  sx={{
                    width: '17%',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: TEXT,
                    backgroundColor: '#e6f7f5',
                    borderBottom: `2px solid ${PRIMARY}`,
                  }}
                >
                  {t('sharedAttribute')}
                </TableCell>

                <TableCell
                  sx={{
                    width: '32%',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: TEXT,
                    backgroundColor: '#e6f7f5',
                    borderBottom: `2px solid ${PRIMARY}`,
                  }}
                >
                  {t('sharedExpression')}
                </TableCell>

                <TableCell
                  sx={{
                    width: '11%',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: TEXT,
                    backgroundColor: '#e6f7f5',
                    borderBottom: `2px solid ${PRIMARY}`,
                  }}
                >
                  {t('sharedType')}
                </TableCell>

                {administrator && (
                  <TableCell
                    align="center"
                    sx={{
                      width: 160,
                      fontSize: '12px',
                      fontWeight: 700,
                      color: TEXT,
                      backgroundColor: '#e6f7f5',
                      borderBottom: `2px solid ${PRIMARY}`,
                    }}
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={administrator ? 5 : 4}
                    align="center"
                    sx={{
                      py: 6,
                      borderBottom: 'none',
                    }}
                  >
                    <CircularProgress
                      size={26}
                      sx={{
                        color: PRIMARY,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={administrator ? 5 : 4}
                    align="center"
                    sx={{
                      py: 7,
                      borderBottom: 'none',
                    }}
                  >
                    <FunctionsIcon
                      sx={{
                        fontSize: 38,
                        color: '#cbd5e1',
                        mb: 1,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: TEXT,
                      }}
                    >
                      No computed attributes found
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: '11.5px',
                        color: SECONDARY,
                        mt: 0.5,
                      }}
                    >
                      Create a computed attribute to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                      },
                      '& td': {
                        fontSize: '12px',
                        color: SECONDARY,
                        borderBottom: `1px solid ${BORDER}`,
                        verticalAlign: 'middle',
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: `${TEXT} !important`,
                        fontWeight: '600 !important',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.description || '—'}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: `${TEXT} !important`,
                        fontWeight: '600 !important',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.attribute || '—'}
                    </TableCell>

                    <TableCell
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.expression || '—'}
                    </TableCell>

                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.4,
                          borderRadius: '5px',
                          backgroundColor: '#f0fdfa',
                          color: PRIMARY_DARK,
                          border: '1px solid #ccfbf1',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.type || 'string'}
                      </Box>
                    </TableCell>

                    {administrator && (
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.7,
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={
                              <EditIcon
                                sx={{
                                  fontSize: '15px !important',
                                }}
                              />
                            }
                            onClick={() =>
                              handleOpenEdit(item)
                            }
                            sx={{
                              minWidth: 72,
                              height: 30,
                              px: 1.1,
                              borderRadius: '6px',
                              borderColor: '#cbd5e1',
                              color: TEXT,
                              textTransform: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
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
                            variant="outlined"
                            startIcon={
                              <DeleteIcon
                                sx={{
                                  fontSize: '15px !important',
                                }}
                              />
                            }
                            onClick={() =>
                              handleDelete(item)
                            }
                            sx={{
                              minWidth: 78,
                              height: 30,
                              px: 1.1,
                              borderRadius: '6px',
                              borderColor: '#fecaca',
                              color: '#dc2626',
                              textTransform: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
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
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {!loading && hasMore && items.length > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 1,
              borderTop: `1px solid ${BORDER}`,
              backgroundColor: '#ffffff',
            }}
          >
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              sx={{
                minWidth: 120,
                height: 32,
                borderRadius: '6px',
                color: PRIMARY,
                textTransform: 'none',
                fontSize: '11.5px',
                fontWeight: 700,
                '&:hover': {
                  backgroundColor: '#f0fdfa',
                },
              }}
            >
              {loadingMore ? (
                <CircularProgress
                  size={16}
                  sx={{
                    color: PRIMARY,
                  }}
                />
              ) : (
                'Load More'
              )}
            </Button>
          </Box>
        )}
      </Paper>

      {administrator && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              minHeight: 36,
              px: 2,
              borderRadius: '7px',
              backgroundColor: PRIMARY,
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: PRIMARY_DARK,
                boxShadow: 'none',
              },
            }}
          >
            Add Computed Attribute
          </Button>
        </Box>
      )}

      {dialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            p: 2,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDialog();
            }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 560,
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: `1px solid ${BORDER}`,
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <FunctionsIcon
                  sx={{
                    color: PRIMARY,
                    fontSize: 21,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: TEXT,
                  }}
                >
                  {editingItem
                    ? 'Edit Computed Attribute'
                    : 'Add Computed Attribute'}
                </Typography>
              </Box>

              <Button
                onClick={handleCloseDialog}
                disabled={saving}
                sx={{
                  minWidth: 'auto',
                  color: SECONDARY,
                  fontSize: '12px',
                  textTransform: 'none',
                }}
              >
                Close
              </Button>
            </Box>

            <Box
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.7,
              }}
            >
              <TextField
                label="Description"
                size="small"
                fullWidth
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Example: Vehicle Total Distance"
                sx={inputSx}
              />

              <TextField
                label="Attribute"
                size="small"
                fullWidth
                value={attribute}
                onChange={(event) =>
                  setAttribute(event.target.value)
                }
                placeholder="Example: totalDistance"
                sx={inputSx}
              />

              <TextField
                label="Expression"
                size="small"
                fullWidth
                multiline
                minRows={3}
                value={expression}
                onChange={(event) =>
                  setExpression(event.target.value)
                }
                placeholder="Example: distance + odometer"
                sx={inputSx}
              />

              <TextField
                select
                label="Type"
                size="small"
                fullWidth
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                SelectProps={{
                  native: true,
                }}
                sx={inputSx}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </TextField>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1.4,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                disabled={saving}
                sx={{
                  minWidth: 80,
                  height: 34,
                  borderRadius: '6px',
                  borderColor: '#cbd5e1',
                  color: SECONDARY,
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  minWidth: 110,
                  height: 34,
                  borderRadius: '6px',
                  backgroundColor: PRIMARY,
                  color: '#ffffff',
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: PRIMARY_DARK,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving ? (
                  <CircularProgress
                    size={17}
                    sx={{
                      color: '#ffffff',
                    }}
                  />
                ) : editingItem ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ComputedAttributesPage;