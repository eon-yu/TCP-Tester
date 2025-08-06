import { configureStore } from '@reduxjs/toolkit';
import tcpReducer from './tcpSlice';

const store = configureStore({
  reducer: {
    tcp: tcpReducer,
  },
});

export default store;
