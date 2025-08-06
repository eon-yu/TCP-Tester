import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Refresh as RefreshIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

const TCPRequestsTab = ({ requests, onRefresh }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 요청 상세 정보 대화상자 열기
  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  // 요청 상세 정보 대화상자 닫기
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">요청 내역</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          새로고침
        </Button>
      </Box>

      {requests.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
          이 TCP 서버에 대한 요청 내역이 없습니다
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader aria-label="요청 내역 테이블" size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>메서드</TableCell>
                <TableCell>경로</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>시간</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.method}</TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 150 }}>
                      {request.path}
                    </Typography>
                  </TableCell>
                  <TableCell>{request.ip}</TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.success ? '성공' : '실패'}
                      color={request.success ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDetails(request)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 요청 상세 정보 대화상자 */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          요청 상세 정보 (ID: {selectedRequest?.id})
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="메서드"
                  value={selectedRequest.method}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ width: '20%' }}
                />
                <TextField
                  label="경로"
                  value={selectedRequest.path}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ width: '50%' }}
                />
                <TextField
                  label="IP"
                  value={selectedRequest.ip}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ width: '30%' }}
                />
              </Box>

              <TextField
                label="헤더"
                value={selectedRequest.headers || ''}
                InputProps={{ readOnly: true }}
                multiline
                rows={4}
              />

              <TextField
                label="바디"
                value={selectedRequest.body || ''}
                InputProps={{ readOnly: true }}
                multiline
                rows={6}
              />

              <TextField
                label="응답"
                value={selectedRequest.response || ''}
                InputProps={{ readOnly: true }}
                multiline
                rows={6}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TCPRequestsTab;
