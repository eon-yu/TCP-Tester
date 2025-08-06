import React, { useEffect } from 'react';
import { Box, Container } from '@mui/material';
import TopPanel from './components/TopPanel';
import ContentPanel from './components/ContentPanel';
import { useDispatch, useSelector } from 'react-redux';
import { loadTcpServers, setCurrentTCP } from './store/tcpSlice';

function App() {
  const dispatch = useDispatch();
  const { servers: tcpServers, current: currentTCP, loading } = useSelector(
    (state) => state.tcp
  );

  useEffect(() => {
    dispatch(loadTcpServers());
  }, [dispatch]);

  const handleSelectTCP = (tcpServer) => {
    dispatch(setCurrentTCP(tcpServer));
  };

  const handleTCPChange = () => {
    dispatch(loadTcpServers());
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopPanel
        tcpServers={tcpServers}
        currentTCP={currentTCP}
        onSelectTCP={handleSelectTCP}
        onTCPChange={handleTCPChange}
        loading={loading}
      />
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <ContentPanel currentTCP={currentTCP} />
      </Box>
    </Container>
  );
}

export default App;
