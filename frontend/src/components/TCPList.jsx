import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemSecondaryAction,
  Chip,
  Box,
  Typography
} from '@mui/material';

const TCPList = ({ tcpServers, currentTCP, onSelectTCP }) => {
  if (!tcpServers || tcpServers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
        <Typography variant="body2" color="text.secondary">
          등록된 TCP 서버가 없습니다. 오른쪽 + 버튼을 눌러 추가하세요.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ maxHeight: '100px', overflow: 'auto', bgcolor: 'background.paper' }}>
      {tcpServers.map((server) => (
        <ListItem 
          key={server.id}
          disablePadding
          secondaryAction={
            <Chip 
              label={server.status}
              color={server.status === 'Alive' ? 'success' : 'error'}
              size="small"
            />
          }
        >
          <ListItemButton 
            selected={currentTCP && currentTCP.id === server.id}
            onClick={() => onSelectTCP(server)}
          >
            <ListItemText 
              primary={server.name} 
              secondary={`${server.host}:${server.port}`} 
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default TCPList;
