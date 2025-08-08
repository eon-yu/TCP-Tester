import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const FrameDisplay = ({ data = [] }) => (
  <TableContainer component={Paper} sx={{ maxHeight: 200, mb: 2 }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Offset</TableCell>
          <TableCell>Int8 값</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data
          .sort((a, b) => a.offset - b.offset)
          .map((item) => (
            <TableRow key={item.offset}>
              <TableCell>{item.offset}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default FrameDisplay;
