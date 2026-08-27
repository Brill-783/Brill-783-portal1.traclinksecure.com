import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
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
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const PRIMARY = '#00ab8e';
const PRIMARY_DARK = '#008f77';
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

const DEFAULT_PORTS_LIST = [
  { id: 1, port: 5001, name: 'gps103', protocol: 'gps103', defaultTransport: 'TCP' },
  { id: 2, port: 5002, name: 'tk103', protocol: 'tk103', defaultTransport: 'TCP' },
  { id: 3, port: 5003, name: 'gl100', protocol: 'gl100', defaultTransport: 'TCP' },
  { id: 4, port: 5004, name: 'gl200', protocol: 'gl200', defaultTransport: 'TCP' },
  { id: 5, port: 5005, name: 't55', protocol: 't55', defaultTransport: 'TCP' },
  { id: 6, port: 5006, name: 'xexun', protocol: 'xexun', defaultTransport: 'TCP' },
  { id: 7, port: 5007, name: 'totem', protocol: 'totem', defaultTransport: 'TCP' },
  { id: 8, port: 5008, name: 'enfora', protocol: 'enfora', defaultTransport: 'TCP' },
  { id: 9, port: 5009, name: 'meiligao', protocol: 'meiligao', defaultTransport: 'TCP' },
  { id: 10, port: 5010, name: 'trv', protocol: 'trv', defaultTransport: 'TCP' },
  { id: 11, port: 5011, name: 'suntech', protocol: 'suntech', defaultTransport: 'TCP' },
  { id: 12, port: 5012, name: 'progress', protocol: 'progress', defaultTransport: 'TCP' },
  { id: 13, port: 5013, name: 'h02', protocol: 'h02', defaultTransport: 'TCP' },
  { id: 14, port: 5014, name: 'jt600', protocol: 'jt600', defaultTransport: 'TCP' },
  { id: 15, port: 5015, name: 'jt808', protocol: 'jt808', defaultTransport: 'TCP' },
  { id: 16, port: 5016, name: 'v680', protocol: 'v680', defaultTransport: 'TCP' },
  { id: 17, port: 5017, name: 'pt502', protocol: 'pt502', defaultTransport: 'TCP' },
  { id: 18, port: 5018, name: 'tr20', protocol: 'tr20', defaultTransport: 'TCP' },
  { id: 19, port: 5019, name: 'navis', protocol: 'navis', defaultTransport: 'TCP' },
  { id: 20, port: 5020, name: 'meitrack', protocol: 'meitrack', defaultTransport: 'TCP' },
  { id: 21, port: 5021, name: 'skypatrol', protocol: 'skypatrol', defaultTransport: 'UDP' },
  { id: 22, port: 5022, name: 'gt02', protocol: 'gt02', defaultTransport: 'TCP' },
  { id: 23, port: 5023, name: 'gt06', protocol: 'gt06', defaultTransport: 'TCP' },
  { id: 24, port: 5024, name: 'megastek', protocol: 'megastek', defaultTransport: 'TCP' },
  { id: 25, port: 5025, name: 'navigil', protocol: 'navigil', defaultTransport: 'TCP' },
  { id: 26, port: 5026, name: 'gpsgate', protocol: 'gpsgate', defaultTransport: 'TCP' },
  { id: 27, port: 5027, name: 'teltonika', protocol: 'teltonika', defaultTransport: 'TCP' },
  { id: 28, port: 5028, name: 'mta6', protocol: 'mta6', defaultTransport: 'TCP' },
  { id: 29, port: 5029, name: 'tzone', protocol: 'tzone', defaultTransport: 'TCP' },
  { id: 30, port: 5030, name: 'tlt2h', protocol: 'tlt2h', defaultTransport: 'TCP' },
  { id: 31, port: 5031, name: 'taip', protocol: 'taip', defaultTransport: 'TCP' },
  { id: 32, port: 5032, name: 'wondex', protocol: 'wondex', defaultTransport: 'TCP' },
  { id: 33, port: 5033, name: 'cellocator', protocol: 'cellocator', defaultTransport: 'TCP' },
  { id: 34, port: 5034, name: 'galileo', protocol: 'galileo', defaultTransport: 'TCP' },
  { id: 35, port: 5035, name: 'ywt', protocol: 'ywt', defaultTransport: 'TCP' },
  { id: 36, port: 5037, name: 'intellitrac', protocol: 'intellitrac', defaultTransport: 'TCP' },
  { id: 37, port: 5038, name: 'gpsmta', protocol: 'gpsmta', defaultTransport: 'TCP' },
  { id: 38, port: 5039, name: 'wialon', protocol: 'wialon', defaultTransport: 'TCP' },
  { id: 39, port: 5040, name: 'carscop', protocol: 'carscop', defaultTransport: 'TCP' },
  { id: 40, port: 5041, name: 'apel', protocol: 'apel', defaultTransport: 'TCP' },
  { id: 41, port: 5042, name: 'manpower', protocol: 'manpower', defaultTransport: 'TCP' },
  { id: 42, port: 5043, name: 'globalsat', protocol: 'globalsat', defaultTransport: 'TCP' },
  { id: 43, port: 5044, name: 'atrack', protocol: 'atrack', defaultTransport: 'TCP' },
  { id: 44, port: 5045, name: 'pt3000', protocol: 'pt3000', defaultTransport: 'TCP' },
  { id: 45, port: 5046, name: 'ruptela', protocol: 'ruptela', defaultTransport: 'TCP' },
  { id: 46, port: 5047, name: 'topflytech', protocol: 'topflytech', defaultTransport: 'TCP' },
  { id: 47, port: 5048, name: 'laipac', protocol: 'laipac', defaultTransport: 'TCP' },
  { id: 48, port: 5049, name: 'aplicom', protocol: 'aplicom', defaultTransport: 'TCP' },
  { id: 49, port: 5050, name: 'gotop', protocol: 'gotop', defaultTransport: 'TCP' },
  { id: 50, port: 5051, name: 'sanav', protocol: 'sanav', defaultTransport: 'TCP' },
  { id: 51, port: 5052, name: 'gator', protocol: 'gator', defaultTransport: 'TCP' },
  { id: 52, port: 5053, name: 'noran', protocol: 'noran', defaultTransport: 'TCP' },
  { id: 53, port: 5054, name: 'm2m', protocol: 'm2m', defaultTransport: 'TCP' },
  { id: 54, port: 5055, name: 'osmand', protocol: 'osmand', defaultTransport: 'HTTP' },
  { id: 55, port: 5056, name: 'easytrack', protocol: 'easytrack', defaultTransport: 'TCP' },
  { id: 56, port: 5057, name: 'gpsmarker', protocol: 'gpsmarker', defaultTransport: 'TCP' },
  { id: 57, port: 5058, name: 'khd', protocol: 'khd', defaultTransport: 'TCP' },
  { id: 58, port: 5059, name: 'piligrim', protocol: 'piligrim', defaultTransport: 'TCP' },
  { id: 59, port: 5060, name: 'stl060', protocol: 'stl060', defaultTransport: 'TCP' },
  { id: 60, port: 5061, name: 'cartrack', protocol: 'cartrack', defaultTransport: 'TCP' },
  { id: 61, port: 5062, name: 'minifinder', protocol: 'minifinder', defaultTransport: 'TCP' },
  { id: 62, port: 5063, name: 'haicom', protocol: 'haicom', defaultTransport: 'TCP' },
  { id: 63, port: 5064, name: 'eelink', protocol: 'eelink', defaultTransport: 'TCP' },
  { id: 64, port: 5065, name: 'box', protocol: 'box', defaultTransport: 'TCP' },
  { id: 65, port: 5066, name: 'freedom', protocol: 'freedom', defaultTransport: 'TCP' },
  { id: 66, port: 5067, name: 'telic', protocol: 'telic', defaultTransport: 'TCP' },
  { id: 67, port: 5068, name: 'trackbox', protocol: 'trackbox', defaultTransport: 'TCP' },
  { id: 68, port: 5069, name: 'visiontek', protocol: 'visiontek', defaultTransport: 'TCP' },
  { id: 69, port: 5070, name: 'orion', protocol: 'orion', defaultTransport: 'TCP' },
  { id: 70, port: 5071, name: 'riti', protocol: 'riti', defaultTransport: 'TCP' },
  { id: 71, port: 5072, name: 'ulbotech', protocol: 'ulbotech', defaultTransport: 'TCP' },
  { id: 72, port: 5073, name: 'tramigo', protocol: 'tramigo', defaultTransport: 'TCP' },
  { id: 73, port: 5074, name: 'tr900', protocol: 'tr900', defaultTransport: 'TCP' },
  { id: 74, port: 5075, name: 'ardi01', protocol: 'ardi01', defaultTransport: 'TCP' },
  { id: 75, port: 5076, name: 'xt013', protocol: 'xt013', defaultTransport: 'TCP' },
  { id: 76, port: 5077, name: 'autofon', protocol: 'autofon', defaultTransport: 'TCP' },
  { id: 77, port: 5078, name: 'gosafe', protocol: 'gosafe', defaultTransport: 'TCP' },
  { id: 78, port: 5080, name: 'bce', protocol: 'bce', defaultTransport: 'TCP' },
  { id: 79, port: 5081, name: 'xirgo', protocol: 'xirgo', defaultTransport: 'TCP' },
  { id: 80, port: 5082, name: 'calamp', protocol: 'calamp', defaultTransport: 'UDP' },
  { id: 81, port: 5083, name: 'mtx', protocol: 'mtx', defaultTransport: 'TCP' },
  { id: 82, port: 5084, name: 'tytan', protocol: 'tytan', defaultTransport: 'TCP' },
  { id: 83, port: 5085, name: 'avl301', protocol: 'avl301', defaultTransport: 'TCP' },
  { id: 84, port: 5086, name: 'castel', protocol: 'castel', defaultTransport: 'TCP' },
  { id: 85, port: 5087, name: 'mxt', protocol: 'mxt', defaultTransport: 'TCP' },
  { id: 86, port: 5088, name: 'cityeasy', protocol: 'cityeasy', defaultTransport: 'TCP' },
  { id: 87, port: 5089, name: 'aquila', protocol: 'aquila', defaultTransport: 'TCP' },
  { id: 88, port: 5090, name: 'flextrack', protocol: 'flextrack', defaultTransport: 'TCP' },
  { id: 89, port: 5091, name: 'blackkite', protocol: 'blackkite', defaultTransport: 'TCP' },
  { id: 90, port: 5092, name: 'adm', protocol: 'adm', defaultTransport: 'TCP' },
  { id: 91, port: 5093, name: 'watch', protocol: 'watch', defaultTransport: 'TCP' },
  { id: 92, port: 5094, name: 't800x', protocol: 't800x', defaultTransport: 'TCP' },
  { id: 93, port: 5095, name: 'upro', protocol: 'upro', defaultTransport: 'TCP' },
  { id: 94, port: 5096, name: 'auro', protocol: 'auro', defaultTransport: 'TCP' },
  { id: 95, port: 5097, name: 'disha', protocol: 'disha', defaultTransport: 'TCP' },
  { id: 96, port: 5098, name: 'thinkrace', protocol: 'thinkrace', defaultTransport: 'TCP' },
  { id: 97, port: 5099, name: 'pathaway', protocol: 'pathaway', defaultTransport: 'TCP' },
  { id: 100, port: 5102, name: 'kenji', protocol: 'kenji', defaultTransport: 'TCP' },
  { id: 101, port: 5103, name: 'astra', protocol: 'astra', defaultTransport: 'TCP' },
  { id: 102, port: 5104, name: 'homtecs', protocol: 'homtecs', defaultTransport: 'TCP' },
  { id: 103, port: 5105, name: 'fox', protocol: 'fox', defaultTransport: 'TCP' },
  { id: 104, port: 5106, name: 'gnx', protocol: 'gnx', defaultTransport: 'TCP' },
  { id: 105, port: 5107, name: 'arknav', protocol: 'arknav', defaultTransport: 'TCP' },
  { id: 106, port: 5108, name: 'supermate', protocol: 'supermate', defaultTransport: 'TCP' },
  { id: 107, port: 5109, name: 'appello', protocol: 'appello', defaultTransport: 'TCP' },
  { id: 108, port: 5110, name: 'idpl', protocol: 'idpl', defaultTransport: 'TCP' },
  { id: 109, port: 5111, name: 'huasheng', protocol: 'huasheng', defaultTransport: 'TCP' },
  { id: 110, port: 5112, name: 'granit', protocol: 'granit', defaultTransport: 'TCP' },
  { id: 111, port: 5113, name: 'granit', protocol: 'granit', defaultTransport: 'TCP' },
  { id: 112, port: 5114, name: 'carcell', protocol: 'carcell', defaultTransport: 'TCP' },
  { id: 113, port: 5117, name: 'raveon', protocol: 'raveon', defaultTransport: 'TCP' },
  { id: 114, port: 5118, name: 'cradlepoint', protocol: 'cradlepoint', defaultTransport: 'TCP' },
  { id: 115, port: 5119, name: 'arknavx8', protocol: 'arknavx8', defaultTransport: 'TCP' },
  { id: 116, port: 5120, name: 'autograde', protocol: 'autograde', defaultTransport: 'TCP' },
  { id: 117, port: 5121, name: 'oigo', protocol: 'oigo', defaultTransport: 'TCP' },
  { id: 118, port: 5122, name: 'jpkorjar', protocol: 'jpkorjar', defaultTransport: 'TCP' },
  { id: 119, port: 5123, name: 'cguard', protocol: 'cguard', defaultTransport: 'TCP' },
  { id: 120, port: 5124, name: 'fifotrack', protocol: 'fifotrack', defaultTransport: 'TCP' },
  { id: 121, port: 5126, name: 'extremtrac', protocol: 'extremtrac', defaultTransport: 'TCP' },
  { id: 122, port: 5127, name: 'trakmate', protocol: 'trakmate', defaultTransport: 'TCP' },
  { id: 123, port: 5128, name: 'at2000', protocol: 'at2000', defaultTransport: 'TCP' },
  { id: 124, port: 5129, name: 'maestro', protocol: 'maestro', defaultTransport: 'TCP' },
  { id: 125, port: 5130, name: 'ais', protocol: 'ais', defaultTransport: 'TCP' },
  { id: 126, port: 5131, name: 'gt30', protocol: 'gt30', defaultTransport: 'TCP' },
  { id: 127, port: 5132, name: 'tmg', protocol: 'tmg', defaultTransport: 'TCP' },
  { id: 128, port: 5133, name: 'pretrace', protocol: 'pretrace', defaultTransport: 'TCP' },
  { id: 129, port: 5134, name: 'pricol', protocol: 'pricol', defaultTransport: 'TCP' },
  { id: 130, port: 5135, name: 'siwi', protocol: 'siwi', defaultTransport: 'TCP' },
  { id: 131, port: 5136, name: 'starlink', protocol: 'starlink', defaultTransport: 'TCP' },
  { id: 132, port: 5137, name: 'dmt', protocol: 'dmt', defaultTransport: 'TCP' },
  { id: 133, port: 5138, name: 'xt2400', protocol: 'xt2400', defaultTransport: 'TCP' },
  { id: 134, port: 5139, name: 'dmthttp', protocol: 'dmthttp', defaultTransport: 'HTTP' },
  { id: 135, port: 5140, name: 'alematics', protocol: 'alematics', defaultTransport: 'TCP' },
  { id: 136, port: 5141, name: 'gps056', protocol: 'gps056', defaultTransport: 'TCP' },
  { id: 137, port: 5142, name: 'flexcomm', protocol: 'flexcomm', defaultTransport: 'TCP' },
  { id: 138, port: 5143, name: 'vt200', protocol: 'vt200', defaultTransport: 'TCP' },
  { id: 139, port: 5144, name: 'owntracks', protocol: 'owntracks', defaultTransport: 'HTTP' },
  { id: 140, port: 5145, name: 'vtfms', protocol: 'vtfms', defaultTransport: 'TCP' },
  { id: 141, port: 5146, name: 'tlv', protocol: 'tlv', defaultTransport: 'TCP' },
  { id: 142, port: 5147, name: 'esky', protocol: 'esky', defaultTransport: 'TCP' },
  { id: 143, port: 5148, name: 'genx', protocol: 'genx', defaultTransport: 'TCP' },
  { id: 144, port: 5149, name: 'flespi', protocol: 'flespi', defaultTransport: 'HTTP' },
  { id: 145, port: 5150, name: 'dway', protocol: 'dway', defaultTransport: 'TCP' },
  { id: 146, port: 5151, name: 'recoda', protocol: 'recoda', defaultTransport: 'TCP' },
  { id: 147, port: 5152, name: 'oko', protocol: 'oko', defaultTransport: 'TCP' },
  { id: 148, port: 5153, name: 'ivt401', protocol: 'ivt401', defaultTransport: 'TCP' },
  { id: 149, port: 5154, name: 'sigfox', protocol: 'sigfox', defaultTransport: 'HTTP' },
  { id: 150, port: 5155, name: 't57', protocol: 't57', defaultTransport: 'TCP' },
  { id: 151, port: 5156, name: 'spot', protocol: 'spot', defaultTransport: 'HTTP' },
  { id: 152, port: 5157, name: 'm2c', protocol: 'm2c', defaultTransport: 'TCP' },
  { id: 153, port: 5158, name: 'globekeeper', protocol: 'globekeeper', defaultTransport: 'HTTP' },
  { id: 154, port: 5159, name: 'opengts', protocol: 'opengts', defaultTransport: 'HTTP' },
  { id: 155, port: 5160, name: 'cautela', protocol: 'cautela', defaultTransport: 'TCP' },
  { id: 156, port: 5161, name: 'continental', protocol: 'continental', defaultTransport: 'TCP' },
  { id: 157, port: 5162, name: 'egts', protocol: 'egts', defaultTransport: 'TCP' },
  { id: 158, port: 5163, name: 'robotrack', protocol: 'robotrack', defaultTransport: 'TCP' },
  { id: 159, port: 5164, name: 'pt60', protocol: 'pt60', defaultTransport: 'TCP' },
  { id: 160, port: 5165, name: 'telemax', protocol: 'telemax', defaultTransport: 'TCP' },
  { id: 161, port: 5166, name: 'sabertek', protocol: 'sabertek', defaultTransport: 'TCP' },
  { id: 162, port: 5167, name: 'retranslator', protocol: 'retranslator', defaultTransport: 'TCP' },
  { id: 163, port: 5168, name: 'vias', protocol: 'vias', defaultTransport: 'TCP' },
  { id: 164, port: 5169, name: 'eseal', protocol: 'eseal', defaultTransport: 'TCP' },
  { id: 165, port: 5170, name: 'freematics', protocol: 'freematics', defaultTransport: 'UDP' },
  { id: 166, port: 5171, name: 'avema', protocol: 'avema', defaultTransport: 'TCP' },
  { id: 167, port: 5172, name: 'autotrack', protocol: 'autotrack', defaultTransport: 'TCP' },
  { id: 168, port: 5173, name: 'tek', protocol: 'tek', defaultTransport: 'TCP' },
  { id: 169, port: 5174, name: 'wristband', protocol: 'wristband', defaultTransport: 'TCP' },
  { id: 170, port: 5176, name: 'milesmate', protocol: 'milesmate', defaultTransport: 'TCP' },
  { id: 171, port: 5177, name: 'anytrek', protocol: 'anytrek', defaultTransport: 'TCP' },
  { id: 172, port: 5178, name: 'smartsole', protocol: 'smartsole', defaultTransport: 'HTTP' },
  { id: 173, port: 5179, name: 'its', protocol: 'its', defaultTransport: 'TCP' },
  { id: 174, port: 5180, name: 'xrb28', protocol: 'xrb28', defaultTransport: 'TCP' },
  { id: 175, port: 5181, name: 'c2stek', protocol: 'c2stek', defaultTransport: 'TCP' },
  { id: 176, port: 5182, name: 'nyitech', protocol: 'nyitech', defaultTransport: 'TCP' },
  { id: 177, port: 5183, name: 'neos', protocol: 'neos', defaultTransport: 'TCP' },
  { id: 178, port: 5184, name: 'satsol', protocol: 'satsol', defaultTransport: 'TCP' },
  { id: 179, port: 5185, name: 'globalstar', protocol: 'globalstar', defaultTransport: 'HTTP' },
  { id: 180, port: 5186, name: 'sanul', protocol: 'sanul', defaultTransport: 'TCP' },
  { id: 181, port: 5187, name: 'minifinder2', protocol: 'minifinder2', defaultTransport: 'TCP' },
  { id: 182, port: 5188, name: 'radar', protocol: 'radar', defaultTransport: 'TCP' },
  { id: 183, port: 5189, name: 'techtlt', protocol: 'techtlt', defaultTransport: 'TCP' },
  { id: 184, port: 5190, name: 'starcom', protocol: 'starcom', defaultTransport: 'TCP' },
  { id: 185, port: 5191, name: 'mictrack', protocol: 'mictrack', defaultTransport: 'TCP' },
  { id: 186, port: 5192, name: 'plugin', protocol: 'plugin', defaultTransport: 'TCP' },
  { id: 187, port: 5193, name: 'leafspy', protocol: 'leafspy', defaultTransport: 'HTTP' },
  { id: 188, port: 5194, name: 'naviset', protocol: 'naviset', defaultTransport: 'TCP' },
  { id: 189, port: 5195, name: 'racedynamics', protocol: 'racedynamics', defaultTransport: 'TCP' },
  { id: 190, port: 5196, name: 'rst', protocol: 'rst', defaultTransport: 'TCP' },
  { id: 191, port: 5197, name: 'pt215', protocol: 'pt215', defaultTransport: 'TCP' },
  { id: 192, port: 5198, name: 'pacifictrack', protocol: 'pacifictrack', defaultTransport: 'TCP' },
  { id: 193, port: 5199, name: 'topin', protocol: 'topin', defaultTransport: 'TCP' },
  { id: 194, port: 5200, name: 'outsafe', protocol: 'outsafe', defaultTransport: 'TCP' },
  { id: 195, port: 5201, name: 'solarpowered', protocol: 'solarpowered', defaultTransport: 'TCP' },
  { id: 196, port: 5202, name: 'motor', protocol: 'motor', defaultTransport: 'TCP' },
  { id: 197, port: 5203, name: 'omnicomm', protocol: 'omnicomm', defaultTransport: 'TCP' },
  { id: 198, port: 5204, name: 's168', protocol: 's168', defaultTransport: 'TCP' },
  { id: 199, port: 5205, name: 'vnet', protocol: 'vnet', defaultTransport: 'TCP' },
  { id: 200, port: 5206, name: 'blue', protocol: 'blue', defaultTransport: 'TCP' },
  { id: 201, port: 5207, name: 'pst', protocol: 'pst', defaultTransport: 'TCP' },
  { id: 202, port: 5208, name: 'dingtek', protocol: 'dingtek', defaultTransport: 'TCP' },
  { id: 203, port: 5209, name: 'wli', protocol: 'wli', defaultTransport: 'TCP' },
  { id: 204, port: 5210, name: 'niot', protocol: 'niot', defaultTransport: 'TCP' },
  { id: 205, port: 5211, name: 'portman', protocol: 'portman', defaultTransport: 'TCP' },
  { id: 206, port: 5212, name: 'moovbox', protocol: 'moovbox', defaultTransport: 'TCP' },
  { id: 207, port: 5213, name: 'futureway', protocol: 'futureway', defaultTransport: 'TCP' },
  { id: 208, port: 5214, name: 'polte', protocol: 'polte', defaultTransport: 'HTTP' },
  { id: 209, port: 5215, name: 'net', protocol: 'net', defaultTransport: 'TCP' },
  { id: 210, port: 5216, name: 'mobilogix', protocol: 'mobilogix', defaultTransport: 'TCP' },
  { id: 211, port: 5217, name: 'swiftech', protocol: 'swiftech', defaultTransport: 'TCP' },
  { id: 212, port: 5218, name: 'iotm', protocol: 'iotm', defaultTransport: 'TCP' },
  { id: 213, port: 5219, name: 'dolphin', protocol: 'dolphin', defaultTransport: 'TCP' },
  { id: 214, port: 5220, name: 'ennfu', protocol: 'ennfu', defaultTransport: 'TCP' },
  { id: 215, port: 5221, name: 'maxpb', protocol: 'maxpb', defaultTransport: 'TCP' },
  { id: 216, port: 5222, name: 'startek', protocol: 'startek', defaultTransport: 'TCP' },
  { id: 217, port: 5223, name: 'gs100', protocol: 'gs100', defaultTransport: 'TCP' },
  { id: 218, port: 5224, name: 'mavlink2', protocol: 'mavlink2', defaultTransport: 'UDP' },
  { id: 219, port: 5225, name: 'uux', protocol: 'uux', defaultTransport: 'TCP' },
  { id: 220, port: 5226, name: 'r12w', protocol: 'r12w', defaultTransport: 'TCP' },
  { id: 221, port: 5227, name: 'flexiblereport', protocol: 'flexiblereport', defaultTransport: 'HTTP' },
  { id: 222, port: 5228, name: 'thinkpower', protocol: 'thinkpower', defaultTransport: 'TCP' },
  { id: 223, port: 5229, name: 'stb', protocol: 'stb', defaultTransport: 'TCP' },
  { id: 224, port: 5230, name: 'b2316', protocol: 'b2316', defaultTransport: 'TCP' },
  { id: 225, port: 5231, name: 'hoopo', protocol: 'hoopo', defaultTransport: 'HTTP' },
  { id: 226, port: 5232, name: 'dualcam', protocol: 'dualcam', defaultTransport: 'TCP' },
  { id: 227, port: 5233, name: 'xexun2', protocol: 'xexun2', defaultTransport: 'TCP' },
  { id: 228, port: 5234, name: 'techtocruz', protocol: 'techtocruz', defaultTransport: 'TCP' },
  { id: 229, port: 5235, name: 'flexapi', protocol: 'flexapi', defaultTransport: 'HTTP' },
  { id: 230, port: 5236, name: 'dsf22', protocol: 'dsf22', defaultTransport: 'TCP' },
  { id: 231, port: 5237, name: 'jido', protocol: 'jido', defaultTransport: 'TCP' },
  { id: 232, port: 5238, name: 'armoli', protocol: 'armoli', defaultTransport: 'TCP' },
  { id: 233, port: 5239, name: 'teratrack', protocol: 'teratrack', defaultTransport: 'TCP' },
  { id: 234, port: 5240, name: 'envotech', protocol: 'envotech', defaultTransport: 'TCP' },
  { id: 235, port: 5241, name: 'bstpl', protocol: 'bstpl', defaultTransport: 'TCP' },
  { id: 236, port: 5242, name: 'thuraya', protocol: 'thuraya', defaultTransport: 'TCP' },
  { id: 237, port: 5243, name: 'ndtpv6', protocol: 'ndtpv6', defaultTransport: 'TCP' },
  { id: 238, port: 5244, name: 'g1rus', protocol: 'g1rus', defaultTransport: 'TCP' },
  { id: 239, port: 5245, name: 'rftrack', protocol: 'rftrack', defaultTransport: 'TCP' },
  { id: 240, port: 5246, name: 'vlt', protocol: 'vlt', defaultTransport: 'TCP' },
  { id: 241, port: 5247, name: 'transync', protocol: 'transync', defaultTransport: 'TCP' },
  { id: 242, port: 5248, name: 't622iridium', protocol: 't622iridium', defaultTransport: 'TCP' },
  { id: 243, port: 5249, name: 'pui', protocol: 'pui', defaultTransport: 'TCP' },
  { id: 244, port: 5250, name: 'nto', protocol: 'nto', defaultTransport: 'TCP' },
  { id: 245, port: 5251, name: 'ramac', protocol: 'ramac', defaultTransport: 'TCP' },
  { id: 246, port: 5252, name: 'positrex', protocol: 'positrex', defaultTransport: 'TCP' },
  { id: 247, port: 5253, name: 'dragino', protocol: 'dragino', defaultTransport: 'UDP' },
  { id: 248, port: 5254, name: 'fleetguide', protocol: 'fleetguide', defaultTransport: 'TCP' },
  { id: 249, port: 5255, name: 'valtrack', protocol: 'valtrack', defaultTransport: 'TCP' },
  { id: 250, port: 5256, name: 'snapper', protocol: 'snapper', defaultTransport: 'TCP' },
  { id: 251, port: 5257, name: 'gl601', protocol: 'gl601', defaultTransport: 'TCP' },
  { id: 252, port: 5258, name: 'hyn600', protocol: 'hyn600', defaultTransport: 'TCP' },
  { id: 253, port: 5259, name: 'jmak', protocol: 'jmak', defaultTransport: 'TCP' },
  { id: 254, port: 5260, name: 'bws', protocol: 'bws', defaultTransport: 'TCP' },
  { id: 255, port: 5261, name: 'ttnhttp', protocol: 'ttnhttp', defaultTransport: 'HTTP' },
  { id: 256, port: 5262, name: 'smartcar', protocol: 'smartcar', defaultTransport: 'HTTP' },
  { id: 257, port: 5263, name: 'jt1078', protocol: 'jt1078', defaultTransport: 'TCP' },
  { id: 258, port: 5264, name: 'xexun3', protocol: 'xexun3', defaultTransport: 'TCP' },
  { id: 259, port: 5265, name: 'radshid', protocol: 'radshid', defaultTransport: 'TCP' },
  { id: 260, port: 5266, name: 'r16h', protocol: 'r16h', defaultTransport: 'TCP' },
];

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

const PortTableRow = memo(({ item, isServerOnline }) => {
  const transport = String(
    item.transport || item.defaultTransport || item.type || 'TCP'
  ).toUpperCase();

  const isTcp = transport === 'TCP' || transport === 'BOTH';
  const isUdp = transport === 'UDP' || transport === 'BOTH';

  return (
    <TableRow
      hover
      sx={{
        height: { xs: '42px', sm: '46px' },
        '&:hover': {
          backgroundColor: '#e6f7f5 !important',
        },
        '& td': {
          py: { xs: '6px', sm: '9px' },
          px: { xs: '8px', sm: '14px' },
          fontSize: { xs: '12px', sm: '13px' },
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
      {/* Status: Active (Green) if server is online, Inactive (Red) if server is down */}
      <TableCell align="center" sx={{ width: 110 }}>
        <Chip
          label={isServerOnline ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            height: '22px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: isServerOnline ? PRIMARY : '#ef4444',
            color: '#ffffff',
            borderRadius: '4px',
            ...fontStyle,
          }}
        />
      </TableCell>

      {/* Port Number */}
      <TableCell sx={{ color: '#0f172a !important', fontWeight: '700 !important' }}>
        {item.port}
      </TableCell>

      {/* Protocol Name */}
      <TableCell sx={{ color: '#0f172a', fontWeight: 600 }}>
        {item.name}
      </TableCell>

      {/* TCP Connection Status: Shows green badge when active and server is online */}
      <TableCell align="center" sx={{ width: 130 }}>
        {isTcp && isServerOnline ? (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#15803d !important' }} />}
            label="TCP"
            size="small"
            sx={{
              height: '22px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1.5px solid #86efac',
              borderRadius: '4px',
              ...fontStyle,
            }}
          />
        ) : null}
      </TableCell>

      {/* UDP Connection Status: Shows green badge when active and server is online */}
      <TableCell align="center" sx={{ width: 130 }}>
        {isUdp && isServerOnline ? (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#15803d !important' }} />}
            label="UDP"
            size="small"
            sx={{
              height: '22px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1.5px solid #86efac',
              borderRadius: '4px',
              ...fontStyle,
            }}
          />
        ) : null}
      </TableCell>

      {/* Connected Unit: Live with blinking/pulsing green dot if server is online, not connected / red dot if down */}
      <TableCell align="center" sx={{ borderRight: 'none !important' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isServerOnline ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isServerOnline ? '#a7f3d0' : '#fecaca'}`,
            px: 1.2,
            py: 0.3,
            borderRadius: '16px',
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isServerOnline ? '#10b981' : '#ef4444',
              boxShadow: isServerOnline ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none',
              animation: isServerOnline ? 'livePulse 1.5s infinite ease-in-out' : 'none',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: isServerOnline ? '#047857' : '#991b1b',
              letterSpacing: '0.2px',
              ...fontStyle,
            }}
          >
            {isServerOnline ? 'Live' : 'Not Connected'}
          </span>
        </Box>
      </TableCell>
    </TableRow>
  );
});

PortTableRow.displayName = 'PortTableRow';

export default function PortsView() {
  const { classes } = useStyles();

  const server = useSelector((state) => state.session?.server || {}, shallowEqual);

  const serverVersion = server?.version || '6.0';
  const serverHostIp = window.location.hostname || '127.0.0.1';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activePortList, setActivePortList] = useState(DEFAULT_PORTS_LIST);
  const [isServerOnline, setIsServerOnline] = useState(true);

  // Check live server listener status
  const loadPortData = useCallback(async () => {
    try {
      const response = await fetch('/api/server', { credentials: 'include' });
      if (response.ok) {
        setIsServerOnline(true);
        const data = await response.json();
        if (Array.isArray(data?.ports) && data.ports.length > 0) {
          setActivePortList(data.ports);
        }
      } else {
        setIsServerOnline(false);
      }
    } catch {
      setIsServerOnline(false);
    }
  }, []);

  useEffect(() => {
    loadPortData();
    const interval = setInterval(loadPortData, 15000);
    return () => clearInterval(interval);
  }, [loadPortData]);

  const filteredPorts = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) {
      return activePortList;
    }

    return activePortList.filter(
      (p) =>
        String(p.port).includes(q) ||
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.protocol || '').toLowerCase().includes(q)
    );
  }, [activePortList, searchKeyword]);

  return (
    <Box className={classes.root}>
      {/* Top Header */}
      <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 } }}>
            <DnsOutlinedIcon sx={{ color: PRIMARY, fontSize: { xs: '20px', sm: '24px' } }} />
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
              Tracking Ports
            </Typography>
          </Box>
        </Box>

        {/* Clean Standard Search Box */}
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, boxSizing: 'border-box' }}>
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
                backgroundColor: SURFACE,
                boxShadow: '0 0 0 2px rgba(0, 171, 142, 0.15)',
              },
            }}
          >
            <SearchIcon sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', sm: '17px' }, marginRight: { xs: '4px', sm: '8px' }, flexShrink: 0 }} />
            <InputBase
              placeholder="Search ports or protocol..."
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
              minWidth: '700px',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontFamily: FONT_FAMILY,
            }}
          >
            <TableHead>
              <TableRow>
                {[
                  ['Status', 110],
                  ['Port', 120],
                  ['Name', 220],
                  ['TCP', 140],
                  ['UDP', 140],
                  ['Connected Units', 160],
                ].map(([label, width], index) => (
                  <TableCell
                    key={label}
                    align={index === 0 || index >= 3 ? 'center' : 'left'}
                    sx={{
                      width,
                      fontWeight: '700 !important',
                      fontSize: { xs: '12px !important', sm: '13px !important' },
                      color: '#0f172a',
                      backgroundColor: '#e6f7f5',
                      borderBottom: '2px solid #00ab8e',
                      borderRight: index === 5 ? 'none' : '1px solid #cbd5e1',
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
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredPorts.length > 0 ? (
                filteredPorts.map((item) => (
                  <PortTableRow
                    key={`${item.id || 'port'}-${item.port}`}
                    item={item}
                    isServerOnline={isServerOnline}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 4,
                      color: '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 400,
                      ...fontStyle,
                    }}
                  >
                    No tracking ports found.
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
            backgroundColor: isServerOnline ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isServerOnline ? '#a7f3d0' : '#fecaca'}`,
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
              backgroundColor: isServerOnline ? '#10b981' : '#ef4444',
              boxShadow: isServerOnline ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none',
              animation: isServerOnline ? 'livePulse 1.5s infinite ease-in-out' : 'none',
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: isServerOnline ? '#047857' : '#991b1b', letterSpacing: '0.2px', ...fontStyle }}>
            {isServerOnline ? 'Live Connection Active' : 'Server Disconnected'}
          </span>
        </Box>
      </Box>
    </Box>
  );
}