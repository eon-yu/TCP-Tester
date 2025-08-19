import { useEffect, useState } from "react";
import { fetchTCPPacketHistory } from "../api/packetApi";
import { API_BASE_URL } from "../api/config";

const useResponseHistory = (currentTCP, msgIdOffset = 0) => {
  const [responseHistory, setResponseHistory] = useState([]);

  const bytesToHex = (bytes) =>
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const hexToBytes = (hex) =>
    (hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16));

  const loadHistory = async () => {
    if (!currentTCP) return;
    try {
      const history = await fetchTCPPacketHistory(currentTCP.id);
      const mapped = history.map((h) => {
        const reqBytes = hexToBytes(h.request || "");
        const respBytes = hexToBytes(h.response || "");
        const msgIdBytes = reqBytes.slice(msgIdOffset, msgIdOffset + 8);
        const messageId = bytesToHex(msgIdBytes);
        const valid =
          msgIdBytes.length === 8 &&
          respBytes
            .slice(msgIdOffset, msgIdOffset + 8)
            .every((b, i) => b === msgIdBytes[i]);
        return {
          packetId: h.tcp_packet_id,
          packetName: h.packet_name || `패킷 ${h.tcp_packet_id}`,
          messageId,
          // 프레임 기반 뷰어를 위해 요청과 응답을 오프셋 배열로 구성
          requestData: reqBytes.map((v, i) => ({ offset: i, value: v })),
          responseData: respBytes.map((v, i) => ({ offset: i, value: v })),
          valid,
        };
      });
      setResponseHistory(mapped);
    } catch (error) {
      console.error("응답 이력 로드 실패:", error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentTCP, msgIdOffset]);

  useEffect(() => {
    if (!currentTCP) return;
    const url = API_BASE_URL.replace("http", "ws") + "/ws";
    const socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "response") {
          const reqBytes = hexToBytes(msg.request || "");
          const respBytes = hexToBytes(msg.response || "");
          // 요청/응답 바이트 배열을 FrameViewer에서 사용할 수 있는
          // 오프셋-값 쌍의 프레임 형태로 변환한다.
          const requestFrame = reqBytes.map((v, i) => ({ offset: i, value: v }));
          const responseFrame = respBytes.map((v, i) => ({ offset: i, value: v }));
          const msgId = reqBytes.slice(msgIdOffset, msgIdOffset + 8);
          const valid =
            msgId.length === 8 &&
            respBytes
              .slice(msgIdOffset, msgIdOffset + 8)
              .every((b, i) => b === msgId[i]);
          const historyItem = {
            packetId: msg.packet_id,
            packetName: msg.packet_name || `패킷 ${msg.packet_id}`,
            messageId: bytesToHex(msgId),
            requestData: requestFrame,
            responseData: responseFrame,
            valid,
          };
          setResponseHistory((prev) => [historyItem, ...prev]);
        }
      } catch (e) {
        console.error("WS message error", e);
      }
    };
    return () => socket.close();
  }, [currentTCP, msgIdOffset]);

  return { responseHistory };
};

export default useResponseHistory;
