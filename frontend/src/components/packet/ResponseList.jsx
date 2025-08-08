import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const ResponseList = ({ responses = [], onSelect }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>응답 목록 현황</Typography>
    {responses.length === 0 ? (
      <Typography variant="body2" color="text.secondary">응답이 없습니다.</Typography>
    ) : (
      responses.map((res, idx) => (
        <Button
          key={idx}
          onClick={() => onSelect(res)}
          sx={{ mr: 1, mb: 1, color: res.valid ? 'inherit' : 'error.main' }}
          variant="outlined"
          size="small"
        >
          {`${res.packetName}-${res.messageId}`}
        </Button>
      ))
    )}
  </Box>
);

export default ResponseList;
