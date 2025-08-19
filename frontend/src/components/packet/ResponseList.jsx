import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';

const ResponseList = ({ responses = [], onSelect }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>
      응답 목록 현황
    </Typography>
    {responses.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        응답이 없습니다.
      </Typography>
    ) : (
      <List
        sx={{
          maxHeight: 200,
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {responses.map((res, idx) => (
          <ListItemButton
            key={idx}
            onClick={() => onSelect(res)}
            sx={{ color: res.valid ? 'inherit' : 'error.main' }}
          >
            <ListItemText
              primary={`${res.packetName}-${res.messageId}`}
            />
          </ListItemButton>
        ))}
      </List>
    )}
  </Box>
);

export default ResponseList;
