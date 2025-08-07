import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, TextField, Button } from '@mui/material';

const ResponseDialog = ({ open, response, onClose }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>TCP 패킷 응답</DialogTitle>
    <DialogContent>
      {response && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>응답 메시지</Typography>
          <Typography variant="body2" color="success.main" gutterBottom>
            {response.message}
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>텍스트 응답</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={response.response_text || ''}
            InputProps={{ readOnly: true }}
          />

          <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>16진수 응답</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={response.response || ''}
            InputProps={{ readOnly: true }}
          />
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>닫기</Button>
    </DialogActions>
  </Dialog>
);

export default ResponseDialog;
