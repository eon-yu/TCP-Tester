import { fetchWithErrorHandling } from './common';
import { API_BASE_URL } from './config';

// TCP 서버 목록 조회
export async function fetchTCPServers() {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp`);
}

// TCP 서버 상세 조회
export async function fetchTCPServer(id) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}`);
}

// TCP 서버 생성
export async function createTCPServer(serverData) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serverData),
  });
}

// TCP 서버 수정
export async function updateTCPServer(id, serverData) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serverData),
  });
}

// TCP 서버 삭제
export async function deleteTCPServer(id) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}`, {
    method: 'DELETE',
  });
}

// TCP 서버 상태 확인
export async function checkTCPStatus(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/tcp/${id}/status`);
    if (!response.ok) return 'Dead';
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('TCP 상태 확인 실패:', error);
    return 'Dead';
  }
}

// TCP 서버 시작
export async function startTCPServer(id) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}/start`, {
    method: 'POST',
  });
}

// TCP 서버 중지
export async function stopTCPServer(id) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}/stop`, {
    method: 'POST',
  });
}

// TCP 서버 프로세스 강제 종료
export async function killTCPServer(id) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${id}/kill`, {
    method: 'POST',
  });
}

// TCP 요청 내역 조회
export async function fetchTCPRequests(tcpId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/requests`);
}

// TCP 로그 조회
export async function fetchTCPLogs(tcpId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/logs`);
}
