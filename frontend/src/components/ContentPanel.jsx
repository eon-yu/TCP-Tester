import React, {useEffect, useState} from 'react';
import {Box, CircularProgress, Paper, Tab, Tabs, Typography} from '@mui/material';
import TCPRequestsTab from './TCPRequestsTab';
import TCPLogsTab from './TCPLogsTab';
import PacketDataTab from './PacketDataTab';
import {fetchTCPLogs, fetchTCPRequests} from '../api/tcpApi';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tcp-tabpanel-${index}`}
      aria-labelledby={`tcp-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ContentPanel = ({ currentTCP }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 현재 TCP 서버가 변경되면 데이터 로드
  useEffect(() => {
    if (currentTCP) {
      loadData();
    }
  }, [currentTCP]);

  // 데이터 로드 함수
  const loadData = async () => {
    if (!currentTCP) return;

    setLoading(true);
    try {
      // 선택된 탭에 따라 데이터 로드
      if (tabValue === 0) {
        const requestsData = await fetchTCPRequests(currentTCP.id);
        setRequests(requestsData);
      } else {
        const logsData = await fetchTCPLogs(currentTCP.id);
        setLogs(logsData);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 탭이 변경되면 데이터 로드
  useEffect(() => {
    loadData();
  }, [tabValue]);

  return (
    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="TCP 서버 탭">
          <Tab label="패킷 데이터" id="tcp-tab-0" aria-controls="tcp-tabpanel-0" />
          <Tab label="요청 내역" id="tcp-tab-1" aria-controls="tcp-tabpanel-1" />
          <Tab label="로그" id="tcp-tab-2" aria-controls="tcp-tabpanel-2" />
        </Tabs>
      </Box>

      {!currentTCP ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography variant="body1" color="text.secondary">
            TCP 서버를 선택하여 데이터를 확인하세요
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <PacketDataTab currentTCP={currentTCP} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <TCPRequestsTab requests={requests} onRefresh={loadData} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <TCPLogsTab logs={logs} onRefresh={loadData} />
          </TabPanel>
        </>
      )}
    </Paper>
  );
};

export default ContentPanel;
