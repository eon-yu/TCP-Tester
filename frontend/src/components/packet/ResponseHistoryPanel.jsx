import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import FrameViewer from './FrameViewer';

const ResponseHistoryPanel = ({ history = [] }) => {
  const [selected, setSelected] = useState(null);

  return (
    <Box sx={{ display: 'flex', mt: 2 }}>
      <Box sx={{ width: '50%', pr: 1 }}>
        <Typography variant="h6" gutterBottom>
          요청
        </Typography>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            요청이 없습니다.
          </Typography>
        ) : (
          history.map((item, idx) => (
            <Button
              key={idx}
              onClick={() => setSelected(item)}
              sx={{ mr: 1, mb: 1 }}
              variant="outlined"
              size="small"
            >
              {`${item.packetName}-${item.messageId}`}
            </Button>
          ))
        )}
        {selected && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              상세보기
            </Typography>
            <FrameViewer data={selected.requestData} />
          </Box>
        )}
      </Box>
      <Box sx={{ width: '50%', pl: 1 }}>
        <Typography variant="h6" gutterBottom>
          응답
        </Typography>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            응답이 없습니다.
          </Typography>
        ) : (
          history.map((item, idx) => (
            <Button
              key={idx}
              onClick={() => setSelected(item)}
              sx={{ mr: 1, mb: 1, color: item.valid ? 'inherit' : 'error.main' }}
              variant="outlined"
              size="small"
            >
              {`${item.packetName}-${item.messageId}`}
            </Button>
          ))
        )}
        {selected && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              상세보기
            </Typography>
            <FrameViewer data={selected.responseData} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ResponseHistoryPanel;

