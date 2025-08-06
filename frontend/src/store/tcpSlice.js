import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchTCPServers, checkTCPStatus } from '../api/tcpApi';

// 비동기 thunk: TCP 서버 목록 로드 및 상태 확인
export const loadTcpServers = createAsyncThunk(
  'tcp/loadTcpServers',
  async () => {
    const servers = await fetchTCPServers();
    const serversWithStatus = await Promise.all(
      servers.map(async (server) => {
        const status = await checkTCPStatus(server.id);
        return { ...server, status: status ? 'Alive' : 'Dead' };
      })
    );
    return serversWithStatus;
  }
);

const tcpSlice = createSlice({
  name: 'tcp',
  initialState: {
    servers: [],
    current: null,
    loading: false,
  },
  reducers: {
    setCurrentTCP(state, action) {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTcpServers.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadTcpServers.fulfilled, (state, action) => {
        state.loading = false;
        state.servers = action.payload;
        if (action.payload.length > 0) {
          if (!state.current) {
            state.current = action.payload[0];
          } else {
            const match = action.payload.find(
              (s) => s.id === state.current.id
            );
            state.current = match || action.payload[0];
          }
        } else {
          state.current = null;
        }
      })
      .addCase(loadTcpServers.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setCurrentTCP } = tcpSlice.actions;
export default tcpSlice.reducer;
