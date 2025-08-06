import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box
} from '@mui/material';
import { createTCPServer, updateTCPServer } from '../api/tcpApi';

const TCPServerDialog = ({ open, onClose, server }) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 서버 정보가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (server) {
      setName(server.name);
      setHost(server.host);
      setPort(server.port.toString());
    } else {
      resetForm();
    }
  }, [server, open]);

  // 폼 초기화
  const resetForm = () => {
    setName('');
    setHost('');
    setPort('');
    setError('');
  };

  // 폼 유효성 검사
  const validateForm = () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return false;
    }

    if (!host.trim()) {
      setError('호스트를 입력해주세요');
      return false;
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError('유효한 포트 번호를 입력해주세요 (1-65535)');
      return false;
    }

    return true;
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const tcpData = {
        name,
        host,
        port: parseInt(port, 10)
      };

      if (server) {
        // 서버 수정
        await updateTCPServer(server.id, tcpData);
      } else {
        // 새 서버 생성
        await createTCPServer(tcpData);
      }

      onClose(true); // 성공 시 부모 컴포넌트에 알림
      resetForm();
    } catch (err) {
      console.error('TCP 서버 저장 실패:', err);
      setError(err.message || '서버 저장 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // 대화상자 닫기
  const handleClose = () => {
    resetForm();
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{server ? 'TCP 서버 수정' : 'TCP 서버 추가'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="이름"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />

          <TextField
            label="호스트"
            fullWidth
            value={host}
            onChange={(e) => setHost(e.target.value)}
            disabled={submitting}
            placeholder="예: 127.0.0.1 또는 example.com"
          />

          <TextField
            label="포트"
            fullWidth
            value={port}
            onChange={(e) => setPort(e.target.value)}
            disabled={submitting}
            type="number"
            inputProps={{ min: 1, max: 65535 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={submitting}
        >
          {submitting ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TCPServerDialog;
