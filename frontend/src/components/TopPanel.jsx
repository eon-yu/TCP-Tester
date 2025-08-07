import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import TCPServerDialog from './TCPServerDialog';
import TCPList from './TCPList';
import TCPActionButtons from './TCPActionButtons';
import { startTCPServer, stopTCPServer, deleteTCPServer } from '../api/tcpApi';

const TopPanel = ({ tcpServers, currentTCP, onSelectTCP, onTCPChange, loading }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editServer, setEditServer] = useState(null);

  // TCP 서버 시작
  const handleStartTCP = async () => {
    if (currentTCP) {
      try {
        await startTCPServer(currentTCP.id);
        onTCPChange(); // 서버 목록 갱신
      } catch (error) {
        console.error('TCP 서버 시작 실패:', error);
      }
    }
  };

  // TCP 서버 중지
  const handleStopTCP = async () => {
    if (currentTCP) {
      try {
        await stopTCPServer(currentTCP.id);
        onTCPChange(); // 서버 목록 갱신
      } catch (error) {
        console.error('TCP 서버 중지 실패:', error);
      }
    }
  };

  // TCP 서버 삭제
  const handleDeleteTCP = async () => {
    if (currentTCP && currentTCP.status === 'Dead') {
      try {
        await deleteTCPServer(currentTCP.id);
        onTCPChange(); // 서버 목록 갱신
      } catch (error) {
        console.error('TCP 서버 삭제 실패:', error);
      }
    }
  };

  // 서버 추가 대화상자 열기
  const handleOpenAddDialog = () => {
    setEditServer(null);
    setOpenDialog(true);
  };

  // 서버 수정 대화상자 열기
  const handleOpenEditDialog = () => {
    setEditServer(currentTCP);
    setOpenDialog(true);
  };

  // 대화상자 닫기
  const handleCloseDialog = (updated) => {
    setOpenDialog(false);
    if (updated) {
      onTCPChange(); // 서버 목록 갱신
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mt: 2, 
        height: '20%', 
        minHeight: '150px',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }
      }}
    >
      {/* TCP 서버 목록 */}
      <Box sx={{ width: { xs: '100%', md: '60%' }, pr: { md: 2 } }}>
        <Typography variant="h6" gutterBottom>TCP 연결 목록</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TCPList 
            tcpServers={tcpServers} 
            currentTCP={currentTCP} 
            onSelectTCP={onSelectTCP} 
          />
        )}
      </Box>

      {/* 컨트롤 패널 */}
      <Box sx={{ 
        width: { xs: '100%', md: '40%' }, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        mt: { xs: 2, md: 0 }
      }}>
        {/* 현재 선택된 TCP 정보 */}
        <Box>
          <Typography variant="h6">현재 선택된 TCP</Typography>
          {currentTCP ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                {currentTCP.name} ({currentTCP.host}:{currentTCP.port})
              </Typography>
              <Chip 
                label={currentTCP.status}
                color={currentTCP.status === 'Alive' ? 'success' : 'error'}
                size="small"
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              선택된 TCP 서버가 없습니다
            </Typography>
          )}
        </Box>

        <TCPActionButtons
          currentTCP={currentTCP}
          onAdd={handleOpenAddDialog}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteTCP}
          onStart={handleStartTCP}
          onStop={handleStopTCP}
        />
      </Box>

      {/* TCP 서버 추가/수정 대화상자 */}
      <TCPServerDialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        server={editServer}
      />
    </Paper>
  );
};

export default TopPanel;
