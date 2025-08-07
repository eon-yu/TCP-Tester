import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Typography, Button } from '@mui/material';
import { DATA_TYPES } from './constants';

const TypeSelectDialog = ({ open, selectedType, setSelectedType, selectedRows, onApply, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>데이터 타입 선택</DialogTitle>
    <DialogContent>
      <FormControl fullWidth margin="normal">
        <InputLabel id="data-type-select-label">데이터 타입</InputLabel>
        <Select
          labelId="data-type-select-label"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          label="데이터 타입"
        >
          {DATA_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        선택한 {selectedRows.length}개의 바이트를 {DATA_TYPES.find(t => t.value === selectedType)?.label} 타입으로 묶습니다.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>
        취소
      </Button>
      <Button onClick={onApply} variant="contained" color="primary">
        적용
      </Button>
    </DialogActions>
  </Dialog>
);

export default TypeSelectDialog;
