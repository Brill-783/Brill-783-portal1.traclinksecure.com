import React, { useEffect, useState } from 'react';
import { Autocomplete, Checkbox, FormControlLabel, TextField, Box, Typography } from '@mui/material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useRestriction } from '../../common/util/permissions';
import { useAsyncTask } from '../../reactHelper';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { prefixString } from '../../common/util/stringUtils';
import useCommandAttributes from '../../common/attributes/useCommandAttributes';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const TEXT = '#1e293b';

const BaseCommandView = ({
  deviceId,
  item = {},
  setItem,
  includeSaved = false,
  savedId,
  setSavedId,
}) => {
  const t = useTranslation();
  const limitCommands = useRestriction('limitCommands');
  const availableAttributes = useCommandAttributes(t);

  const [attributes, setAttributes] = useState([]);
  const [options, setOptions] = useState([]);

  useAsyncTask(
    async ({ signal }) => {
      if (includeSaved && deviceId) {
        const savedResponse = await fetchOrThrow(`/api/commands/send?deviceId=${deviceId}`, {
          signal,
        });
        const saved = await savedResponse.json();
        let combined = saved.map((it) => ({ ...it, optionType: 'saved', key: `saved-${it.id}` }));
        if (!limitCommands) {
          const typesResponse = await fetchOrThrow(
            `/api/commands/types?${new URLSearchParams({ deviceId }).toString()}`,
            { signal },
          );
          const types = await typesResponse.json();
          combined = combined.concat(
            types.map((it) => ({ ...it, optionType: 'type', key: `type-${it.type}` })),
          );
        }
        setOptions(combined);
      } else {
        const typesResponse = await fetchOrThrow('/api/commands/types', { signal });
        const types = await typesResponse.json();
        setOptions(types.map((it) => ({ ...it, optionType: 'type', key: `type-${it.type}` })));
      }
    },
    [deviceId, includeSaved, limitCommands],
  );

  useEffect(() => {
    if (item && item.type) {
      setAttributes(availableAttributes[item.type] || []);
    } else {
      setAttributes([]);
    }
  }, [availableAttributes, item]);

  const handleSelect = (_, value) => {
    if (value?.optionType === 'saved') {
      setSavedId?.(value.id);
      setItem({ ...item, type: value.type, attributes: value.attributes || {} });
    } else if (value?.type) {
      setSavedId?.(0);
      const defaults = {};
      availableAttributes[value.type]?.forEach((attribute) => {
        switch (attribute.type) {
          case 'boolean':
            defaults[attribute.key] = false;
            break;
          case 'number':
            defaults[attribute.key] = 0;
            break;
          default:
            defaults[attribute.key] = '';
            break;
        }
      });
      setItem({ ...item, type: value.type, attributes: defaults });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '12px', color: TEXT, marginBottom: '6px', fontFamily: FONT_FAMILY }}>
          Command Type
        </Typography>
        <Autocomplete
          size="small"
          options={options}
          groupBy={
            includeSaved
              ? (option) =>
                  option.optionType === 'saved' ? t('sharedSavedCommands') : t('sharedType')
              : null
          }
          getOptionLabel={(option) =>
            option.optionType === 'saved'
              ? option.description || option.type
              : t(prefixString('command', option.type)) || option.type
          }
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key || option.key || option.type} {...optionProps} style={{ fontSize: '12.5px', fontFamily: FONT_FAMILY }}>
                {option.optionType === 'saved'
                  ? option.description
                  : t(prefixString('command', option.type)) || option.type}
              </li>
            );
          }}
          isOptionEqualToValue={(option, value) =>
            option.key ? option.key === value?.key : option.type === value?.type
          }
          value={
            savedId
              ? options.find((it) => it.optionType === 'saved' && it.id === savedId) || null
              : options.find((it) => it.type === item.type) || null
          }
          onChange={handleSelect}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select command type..."
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                '& input': { fontSize: '12.5px', fontWeight: 600, fontFamily: FONT_FAMILY },
              }}
            />
          )}
        />
      </Box>

      {(!includeSaved || !savedId) &&
        attributes.map(({ key, name, type }) => {
          if (type === 'boolean') {
            return (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    size="small"
                    checked={Boolean(item.attributes?.[key])}
                    onChange={(e) => {
                      setItem({
                        ...item,
                        attributes: { ...(item.attributes || {}), [key]: e.target.checked },
                      });
                    }}
                    sx={{ color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }}
                  />
                }
                label={<Typography sx={{ fontSize: '12.5px', fontWeight: 600, fontFamily: FONT_FAMILY }}>{name}</Typography>}
              />
            );
          }
          return (
            <Box key={key}>
              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: TEXT, marginBottom: '4px', fontFamily: FONT_FAMILY }}>
                {name}
              </Typography>
              <TextField
                size="small"
                fullWidth
                type={type === 'number' ? 'number' : 'text'}
                value={item.attributes?.[key] ?? ''}
                onChange={(e) => {
                  setItem({
                    ...item,
                    attributes: {
                      ...(item.attributes || {}),
                      [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                    },
                  });
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                  '& input': { fontSize: '12.5px', fontWeight: 500, fontFamily: FONT_FAMILY },
                }}
              />
            </Box>
          );
        })}
    </Box>
  );
};

export default BaseCommandView;