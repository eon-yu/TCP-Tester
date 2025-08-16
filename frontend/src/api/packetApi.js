import {fetchWithErrorHandling} from './common';
import {API_BASE_URL} from './config';

// TCP 패킷 목록 조회
export async function fetchTCPPackets(tcpId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets`);
}

// TCP 패킷 상세 조회
export async function fetchTCPPacket(tcpId, packetId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets/${packetId}`);
}

// TCP 패킷 생성
export async function createTCPPacket(tcpId, packetData) {
  console.log('패킷 생성 요청:', tcpId, packetData);
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(packetData),
  });
  console.log('패킷 생성 응답:', response);
  return response;
}

// TCP 패킷 수정
export async function updateTCPPacketData(tcpId, packetId, packetData) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets/${packetId}/data`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(packetData),
  });
}

// TCP 패킷 수정
export async function updateTCPPacketInfo(tcpId, packetId, packetData) {
    return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets/${packetId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(packetData),
    });
}

// TCP 패킷 삭제
export async function deleteTCPPacket(tcpId, packetId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets/${packetId}`, {
    method: 'DELETE',
  });
}

// TCP 패킷 전송
export async function sendTCPPacket(tcpId, packetId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/packets/${packetId}/send`, {
    method: 'POST',
  });
}

// TCP 요청/응답 이력 조회
export async function fetchTCPPacketHistory(tcpId) {
  return await fetchWithErrorHandling(`${API_BASE_URL}/tcp/${tcpId}/history`);
}
