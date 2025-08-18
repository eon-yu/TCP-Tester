import { describe, it, expect, vi, beforeEach } from 'vitest';
import { API_BASE_URL } from './config';
import * as common from './common';
import {
  fetchTCPServers,
  fetchTCPServer,
  createTCPServer,
  updateTCPServer,
  deleteTCPServer,
  checkTCPStatus,
  startTCPServer,
  stopTCPServer,
  killTCPServer,
  fetchTCPRequests,
  fetchTCPLogs
} from './tcpApi';

vi.mock('./common');

beforeEach(() => {
  common.fetchWithErrorHandling.mockReset().mockResolvedValue({});
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'Alive' }) });
});

describe('tcpApi', () => {
  it('fetchTCPServers calls correct URL', async () => {
    await fetchTCPServers();
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp`);
  });

  it('fetchTCPServer calls correct URL', async () => {
    await fetchTCPServer(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1`);
  });

  it('createTCPServer posts data', async () => {
    await createTCPServer({ a: 1 });
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('updateTCPServer puts data', async () => {
    await updateTCPServer(1, { a: 1 });
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1`,
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('deleteTCPServer deletes', async () => {
    await deleteTCPServer(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('checkTCPStatus uses fetch', async () => {
    await checkTCPStatus(1);
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/status`);
  });

  it('startTCPServer posts start', async () => {
    await startTCPServer(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/start`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('stopTCPServer posts stop', async () => {
    await stopTCPServer(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/stop`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('killTCPServer posts kill', async () => {
    await killTCPServer(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(
      `${API_BASE_URL}/tcp/1/kill`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchTCPRequests calls requests endpoint', async () => {
    await fetchTCPRequests(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/requests`);
  });

  it('fetchTCPLogs calls logs endpoint', async () => {
    await fetchTCPLogs(1);
    expect(common.fetchWithErrorHandling).toHaveBeenCalledWith(`${API_BASE_URL}/tcp/1/logs`);
  });
});

