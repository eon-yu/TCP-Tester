import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import FrameViewer from './FrameViewer';

const ResponseDialog = ({ open, response, onClose }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>응답 상세</DialogTitle>
    <DialogContent>
      {response && (
        <>
          {!response.valid && (
            <Typography color="error" sx={{ mb: 2 }}>
              비정상적인 응답입니다.
            </Typography>
          )}
          <Typography variant="subtitle1" gutterBottom>
            요청 패킷
          </Typography>
          <FrameViewer data={response.requestData} />
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            응답 프레임
          </Typography>
          <FrameViewer data={response.responseData} />
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>닫기</Button>
    </DialogActions>
  </Dialog>
);

export default ResponseDialog;
