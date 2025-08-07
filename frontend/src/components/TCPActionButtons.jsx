import React from 'react';
import { Box, Tooltip, IconButton, Button } from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayCircleIcon,
  StopCircle as StopCircleIcon
} from '@mui/icons-material';

const TCPActionButtons = ({ currentTCP, onAdd, onEdit, onDelete, onStart, onStop }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
    <Box>
      <Tooltip title="TCP 서버 추가">
        <IconButton onClick={onAdd} color="primary">
          <AddIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="TCP 서버 설정 수정">
        <span>
          <IconButton onClick={onEdit} color="primary" disabled={!currentTCP}>
            <SettingsIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="TCP 서버 삭제 (오직 Dead 상태일 때만)">
        <span>
          <IconButton onClick={onDelete} color="error" disabled={!currentTCP || currentTCP.status !== 'Dead'}>
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>

    <Box>
      <Tooltip title="TCP 서버 시작">
        <span>
          <Button
            startIcon={<PlayCircleIcon />}
            variant="contained"
            color="success"
            disabled={!currentTCP || currentTCP.status === 'Alive'}
            onClick={onStart}
            sx={{ mr: 1 }}
          >
            시작
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="TCP 서버 중지 (오직 Alive 상태일 때만)">
        <span>
          <Button
            startIcon={<StopCircleIcon />}
            variant="contained"
            color="error"
            disabled={!currentTCP || currentTCP.status !== 'Alive'}
            onClick={onStop}
          >
            중지
          </Button>
        </span>
      </Tooltip>
    </Box>
  </Box>
);

export default TCPActionButtons;
