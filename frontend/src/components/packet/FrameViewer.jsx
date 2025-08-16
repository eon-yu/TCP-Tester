import React, { useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, TextField } from '@mui/material';
import FrameDisplay from './FrameDisplay';

const FrameViewer = ({ data = [] }) => {
  const [viewType, setViewType] = useState('frame');
  const handleChange = (_event, next) => {
    if (next !== null) {
      setViewType(next);
    }
  };

  const jsonValue = JSON.stringify(
    data.sort((a, b) => a.offset - b.offset),
    null,
    2
  );

  return (
    <Box>
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{ mb: 1 }}
      >
        <ToggleButton value="frame">Frame</ToggleButton>
        <ToggleButton value="json">JSON</ToggleButton>
      </ToggleButtonGroup>
      {viewType === 'frame' ? (
        <FrameDisplay data={data} />
      ) : (
        <TextField
          multiline
          fullWidth
          value={jsonValue}
          InputProps={{ readOnly: true }}
          minRows={6}
        />
      )}
    </Box>
  );
};

export default FrameViewer;

