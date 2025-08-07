import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { formatDate } from '../utils/format';

const TCPLogsTab = ({ logs, onRefresh }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">로그</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          새로고침
        </Button>
      </Box>

      {logs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
          이 TCP 서버에 대한 로그가 없습니다
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader aria-label="로그 테이블" size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이벤트</TableCell>
                <TableCell>세부 정보</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>시간</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.event_type}</TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 300 }}>
                      {log.details}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.success ? '성공' : '실패'}
                      color={log.success ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TCPLogsTab;
