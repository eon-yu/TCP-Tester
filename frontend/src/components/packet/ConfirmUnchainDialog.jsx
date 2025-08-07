import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Button } from '@mui/material';

const ConfirmUnchainDialog = ({ open, groups, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>묶음 해제</DialogTitle>
    <DialogContent>
      <Typography variant="body2" sx={{ mb: 2 }}>
        선택한 항목은 다음 묶음에 포함되어 있습니다:
      </Typography>
      <Box component="ul" sx={{ pl: 2, mb: 0 }}>
        {groups.map((g, idx) => (
          <li key={idx}>오프셋 {g[0]} - {g[g.length - 1]}</li>
        ))}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        이 묶들을 모두 해제하시겠습니까?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>취소</Button>
      <Button onClick={onConfirm} color="primary" variant="contained">해제</Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmUnchainDialog;
