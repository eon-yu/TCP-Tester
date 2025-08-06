import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import TopPanel from './components/TopPanel';
import ContentPanel from './components/ContentPanel';
import { fetchTCPServers, checkTCPStatus } from './api/tcpApi';

function App() {
  const [tcpServers, setTcpServers] = useState([]);
  const [currentTCP, setCurrentTCP] = useState(null);
  const [loading, setLoading] = useState(true);

  // TCP 서버 목록 로드
  const loadTCPServers = async () => {
    try {
      setLoading(true);
      const servers = await fetchTCPServers();

      // 각 서버의 상태 확인
      const serversWithStatus = await Promise.all(
        servers.map(async (server) => {
          const status = await checkTCPStatus(server.id);
          return { ...server, status: status ? 'Alive' : 'Dead' };
        })
      );

      setTcpServers(serversWithStatus);
      if (serversWithStatus.length > 0 && !currentTCP) {
        setCurrentTCP(serversWithStatus[0]);
      }
    } catch (error) {
      console.error('TCP 서버 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 TCP 서버 목록 로드
  useEffect(() => {
    loadTCPServers();

    // 10초마다 TCP 상태 갱신
    const intervalId = setInterval(() => {
      loadTCPServers();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // 현재 선택된 TCP 서버 변경
  const handleSelectTCP = (tcpServer) => {
    setCurrentTCP(tcpServer);
  };

  // TCP 서버 목록 변경 후 리로드
  const handleTCPChange = () => {
    loadTCPServers();
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
