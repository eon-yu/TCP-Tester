import React from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DATA_TYPES, TYPE_RANGES, TYPE_COLORS } from './constants';

const PacketDataTable = ({
  selectedPacket,
  packetData,
  selectedRows,
  toggleRowSelection,
  handleContextMenu,
  handleAddRow,
  handleChainRows,
  initiateUnchainRows,
  loading,
  getChainedItems,
  getInputValue,
  handleDisplayChange,
  getDisplayValue,
  handleRowChange,
  handleDeleteRow
}) => {
  if (!selectedPacket) return null;

  return (
    <Box>
      {selectedRows.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={handleChainRows}
            disabled={selectedRows.length < 2}
          >
            선택 항목 묶기
          </Button>
          <Button
            variant="outlined"
            startIcon={<LinkOffIcon />}
            onClick={initiateUnchainRows}
            disabled={selectedRows.length === 0}
          >
            묶음 해제
          </Button>
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{ maxHeight: 400 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddRow();
          }
        }}
      >
        <Table stickyHeader size="small" sx={{ '& th, & td': { border: '1px solid rgba(224,224,224,1)' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Offset</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Display</TableCell>
              <TableCell>설명</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packetData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    데이터가 없습니다. '행 추가' 버튼을 클릭하여 데이터를 추가하세요.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              packetData
                .sort((a, b) => a.offset - b.offset)
                .map((item) => {
                  const range = TYPE_RANGES[item.type] || {};
                  const chain = item.is_chained ? getChainedItems(item.offset) : [];
                  const isChainStart = item.is_chained && chain.length > 0 && chain[0].offset === item.offset;
                  const typeInfo = DATA_TYPES.find((t) => t.value === item.type);
                  const showTypeLabel = isChainStart || (!item.is_chained && typeInfo?.size === 1);
                  const typeLabel = typeInfo?.label;
                  const inputType = 'text'; // (item.type === 10 || item.type === 11) ? 'text' : 'number';
                  return (
                    <TableRow
                      key={item.offset}
                      selected={selectedRows.includes(item.offset)}
                      onClick={() => toggleRowSelection(item.offset)}
                      sx={{ cursor: 'pointer', backgroundColor: item.is_chained ? TYPE_COLORS[item.type] : 'inherit' }}
                    >
                      <TableCell
                        onContextMenu={(e) => handleContextMenu(e, item.offset)}
                        sx={{ fontWeight: item.is_chained ? 'bold' : 'normal' }}
                      >
                        {item.offset}
                      </TableCell>
                      <TableCell>
                        {item.is_chained ? (
                          isChainStart ? (
                            <input
                              type={inputType}
                              value={getInputValue(item)}
                              onChange={(e) => handleDisplayChange(item.offset, e.target.value)}
                              min={range.min}
                              max={range.max}
                              style={{ width: 80 }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : null
                        ) : (
                          <input
                            type={inputType}
                            value={getInputValue(item)}
                            onChange={(e) => handleDisplayChange(item.offset, e.target.value)}
                            min={range.min}
                            max={range.max}
                            style={{ width: 80 }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {showTypeLabel && <span style={{ marginLeft: 4 }}>{typeLabel}</span>}
                      </TableCell>
                      <TableCell>{getDisplayValue(item)}</TableCell>
                      <TableCell>
                        <TextField
                          value={item.desc || ''}
                          onChange={(e) => handleRowChange(item.offset, 'desc', e.target.value)}
                          size="small"
                          fullWidth
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(item.offset);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined" disabled={loading}>
          행 추가
        </Button>
      </Box>
    </Box>
  );
};

export default PacketDataTable;
