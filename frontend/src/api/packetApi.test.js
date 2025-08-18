import { describe, it, expect, vi, beforeEach } from 'vitest';
import { API_BASE_URL } from './config';
import * as common from './common';
import {
  fetchTCPPackets,
  fetchTCPPacket,
  createTCPPacket,
  updateTCPPacketData,
  updateTCPPacketInfo,
  deleteTCPPacket,
  sendTCPPacket,
  fetchTCPPacketHistory
} from './packetApi';

vi.mock('./common');

beforeEach(() => {
  common.fetchWithErrorHandling.mockReset().mockResolvedValue({});
});

describe('packetApi', () => {
  it('fetchTCPPackets calls correct URL', async () => {
    await fetchTCPPackets(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/packets`);
  });

  it('fetchTCPPacket calls correct URL', async () => {
    await fetchTCPPacket(1, 2);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/packets/2`);
  });

  it('createTCPPacket posts data', async () => {
    await createTCPPacket(1, { a: 1 });
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/packets`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('updateTCPPacketData uses data endpoint', async () => {
    await updateTCPPacketData(1, 2, { a: 1 });
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/packets/2/data`,
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('updateTCPPacketInfo uses info endpoint', async () => {
    await updateTCPPacketInfo(1, 2, { a: 1 });
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/packets/2`,
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('deleteTCPPacket calls delete', async () => {
    await deleteTCPPacket(1, 2);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/packets/2`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('sendTCPPacket calls send endpoint', async () => {
    await sendTCPPacket(1, 2);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/packets/2/send`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchTCPPacketHistory calls history endpoint', async () => {
    await fetchTCPPacketHistory(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/history`);
  });
});

