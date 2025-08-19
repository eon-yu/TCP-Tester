import { useEffect, useState } from "react";
import {
  createTCPPacket,
  deleteTCPPacket,
  fetchTCPPackets,
  sendTCPPacket,
  stopTCPPacket,
  updateTCPPacketData,
  updateTCPPacketInfo,
} from "../api/packetApi";
import { API_BASE_URL } from "../api/config";
import { DATA_TYPES, TYPE_RANGES } from "../components/packet/constants";

const usePacketData = (currentTCP) => {
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [packetData, setPacketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [packetName, setPacketName] = useState("");
  const [packetDesc, setPacketDesc] = useState("");
  const [useCRC, setUseCRC] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [selectedType, setSelectedType] = useState(0);
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [confirmUnchain, setConfirmUnchain] = useState({
    open: false,
    groups: [],
  });
  const [msgIdOffset, setMsgIdOffset] = useState(0);
  const [currentMsgId, setCurrentMsgId] = useState([]);
  const [autoMsgId, setAutoMsgId] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1000);
  const [sendCount, setSendCount] = useState(1);
  const [isSending, setIsSending] = useState(false);

  const bytesToHex = (bytes) =>
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const hexToBytes = (hex) =>
    (hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16));

  const handleGenerateMessageId = async (silent = false) => {
    const id = crypto.getRandomValues(new Uint8Array(8));
    const updated = [...packetData];
    for (let i = 0; i < 8; i++) {
      const offset = msgIdOffset + i;
      const existing = updated.find((d) => d.offset === offset);
      if (existing) {
        existing.value = id[i];
      } else {
        updated.push({
          offset,
          value: id[i],
          type: 0,
          is_chained: false,
          desc: "",
        });
      }
    }
    setPacketData(updated);
    setCurrentMsgId(Array.from(id));
    await autoSave(updated);
    if (!silent) {
      showAlert("Message ID가 생성되었습니다", "success");
    }
    return id;
  };

  // 패킷 데이터 로드
  const loadPackets = async () => {
    if (!currentTCP) return;

    setLoading(true);
    try {
      const data = await fetchTCPPackets(currentTCP.id);
      setPackets(data);

      if (data.length > 0 && !selectedPacket) {
        setSelectedPacket(data[0]);
        setPacketData(data[0].data || []);
        setPacketDesc(data[0].desc || "");
        setUseCRC(data[0].use_crc || false);
      }
      console.log("로드된 패킷:", data);
    } catch (error) {
      console.error("패킷 데이터 로드 실패:", error);
      showAlert("패킷 데이터 로드 실패: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 패킷 데이터 로드
  useEffect(() => {
    if (currentTCP) {
      loadPackets();
    }
  }, [currentTCP]);

  // WebSocket 연결
  useEffect(() => {
    if (!currentTCP) return;
    const url = API_BASE_URL.replace("http", "ws") + "/ws";
    const socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "response") {
          const reqBytes = hexToBytes(msg.request || "");
          const msgId = reqBytes.slice(msgIdOffset, msgIdOffset + 8);
          setCurrentMsgId(msgId);
        } else if (msg.type === "status") {
          showAlert(`서버 상태: ${msg.status}`, "info");
        } else if (msg.type === "packet_update") {
          loadPackets();
        } else if (msg.type === "log") {
          console.log("LOG:", msg.message);
        }
      } catch (e) {
        console.error("WS message error", e);
      }
    };
    return () => socket.close();
  }, [currentTCP, msgIdOffset, selectedPacket]);

  // 선택된 패킷 변경 시 패킷 데이터 업데이트
  const handleSelectPacket = (packet) => {
    setSelectedPacket(packet);
    setPacketData(packet.data || []);
    setPacketDesc(packet.desc || "");
    setUseCRC(packet.use_crc || false);
  };

  // 새 패킷 생성 대화상자 열기
  const handleOpenNewPacketDialog = () => {
    setSelectedPacket(null);
    setPacketData([]);
    setPacketDesc("");
    setUseCRC(false);
    setOpenDialog(true);
  };

  // 패킷 저장
  const handleCreatePacket = async () => {
    if (!validateChainLengths()) return;
    try {
      setLoading(true);

      const packetToSave = {
        tcp_server_id: currentTCP.id,
        name: packetName,
        desc: packetDesc,
        use_crc: useCRC,
      };

      await createTCPPacket(currentTCP.id, packetToSave);
      showAlert(`'${packetName}' 패킷이 성공적으로 생성되었습니다`, "success");
      setOpenDialog(false);
      loadPackets();
    } catch (error) {
      console.error("패킷 저장 실패:", error);
      showAlert(
        "패킷 저장 실패: " + (error.message || "알 수 없는 오류"),
        "error",
      );
      // 자세한 오류 내용 로깅
      if (error.response) {
        console.error("응답 데이터:", error.response);
      }
    } finally {
      setLoading(false);
    }
  };
  // 패킷 저장
  const handleUpdatePacketInfo = async () => {
    if (!validateChainLengths()) return;
    try {
      setLoading(true);

      const packetToSave = {
        tcp_server_id: currentTCP.id,
        name: packetName,
        desc: packetDesc,
        use_crc: useCRC,
      };

      await updateTCPPacketInfo(currentTCP.id, selectedPacket.id, packetToSave);
      showAlert("패킷이 성공적으로 업데이트되었습니다", "success");

      setOpenDialog(false);
      loadPackets();
    } catch (error) {
      console.error("패킷 저장 실패:", error);
      showAlert(
        "패킷 저장 실패: " + (error.message || "알 수 없는 오류"),
        "error",
      );
      // 자세한 오류 내용 로깅
      if (error.response) {
        console.error("응답 데이터:", error.response);
      }
    } finally {
      setLoading(false);
    }
  };

  // 패킷 삭제
  const handleDeletePacket = async () => {
    if (!selectedPacket) return;

    try {
      setLoading(true);
      await deleteTCPPacket(currentTCP.id, selectedPacket.id);
      showAlert("패킷이 성공적으로 삭제되었습니다", "success");

      setSelectedPacket(null);
      setPacketData([]);
      setPacketDesc("");
      loadPackets();
    } catch (error) {
      console.error("패킷 삭제 실패:", error);
      showAlert("패킷 삭제 실패: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCRCChange = async (checked) => {
    if (!selectedPacket) {
      setUseCRC(checked);
      return;
    }
    try {
      setLoading(true);
      setUseCRC(checked);
      await updateTCPPacketInfo(currentTCP.id, selectedPacket.id, {
        name: selectedPacket.name,
        desc: selectedPacket.desc,
        use_crc: checked,
      });
      setSelectedPacket({ ...selectedPacket, use_crc: checked });
      setPackets((prev) =>
        prev.map((p) =>
          p.id === selectedPacket.id ? { ...p, use_crc: checked } : p,
        ),
      );
    } catch (error) {
      console.error("CRC 설정 실패:", error);
      showAlert("CRC 설정 실패: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 행 추가
  const handleAddRow = () => {
    let newOffset = 0;
    setPacketData((prev) => {
      newOffset =
        prev.length > 0 ? Math.max(...prev.map((item) => item.offset)) + 1 : 0;
      const newRow = {
        offset: newOffset,
        value: 0,
        type: 0, // Int8
        is_chained: false,
        desc: "",
      };
      return [...prev, newRow];
    });
    return newOffset;
  };

  // 행 삭제
  const handleDeleteRow = (offsetToDelete) => {
    const target = packetData.find((item) => item.offset === offsetToDelete);
    if (target && target.type === 12 && target.is_chained) {
      const chain = getChainedItems(offsetToDelete);
      if (chain.length > 0 && chain[0].offset !== offsetToDelete) {
        showAlert("JSON 값은 시작 위치에서만 삭제 가능합니다", "warning");
        return;
      }
      const length = chain.length;
      const updated = packetData
        .filter((item) => !chain.some((ci) => ci.offset === item.offset))
        .map((item) =>
          item.offset > offsetToDelete + length - 1
            ? { ...item, offset: item.offset - length }
            : item,
        );
      setPacketData(updated);
      setSelectedRows((prev) =>
        prev
          .filter((row) => !chain.some((ci) => ci.offset === row))
          .map((row) =>
            row > offsetToDelete + length - 1 ? row - length : row,
          ),
      );
      autoSave(updated);
      return;
    }

    const updated = packetData
      .filter((item) => item.offset !== offsetToDelete)
      .map((item) =>
        item.offset > offsetToDelete
          ? { ...item, offset: item.offset - 1 }
          : item,
      );
    setPacketData(updated);
    setSelectedRows((prev) =>
      prev
        .filter((row) => row !== offsetToDelete)
        .map((row) => (row > offsetToDelete ? row - 1 : row)),
    );
    autoSave(updated);
  };

  // 행 값 변경
  const handleRowChange = (offset, field, value) => {
    const updated = packetData.map((item) => {
      if (item.offset === offset) {
        if (field === "value") {
          if (item.is_chained) {
            return item;
          }
          const range = TYPE_RANGES[item.type];
          let v = value;
          if (range) {
            if (typeof range.min === "bigint") {
              let bigV = BigInt(value);
              if (bigV < range.min) bigV = range.min;
              if (bigV > range.max) bigV = range.max;
              v = Number(bigV);
            } else {
              if (v < range.min) v = range.min;
              if (v > range.max) v = range.max;
            }
          }
          return { ...item, value: v };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setPacketData(updated);
    autoSave(updated);
  };

  // 컨텍스트 메뉴 열기
  const handleContextMenu = (event, offset) => {
    event.preventDefault();
    if (!selectedRows.includes(offset)) {
      setSelectedRows([offset]);
    }
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, offset });
  };

  // 컨텍스트 메뉴 닫기
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // 행 선택 토글
  const toggleRowSelection = (offset) => {
    if (selectedRows.includes(offset)) {
      setSelectedRows(selectedRows.filter((row) => row !== offset));
    } else {
      setSelectedRows([...selectedRows, offset]);
    }
  };

  // 행 체인 설정
  const handleChainRows = () => {
    if (selectedRows.length < 2) {
      showAlert("최소 2개 이상의 행을 선택해야 합니다", "warning");
      return;
    }

    // 타입 선택 대화상자 열기
    setOpenTypeDialog(true);
  };

  // 타입 선택 후 행 체인 설정 적용
  const applyChainType = () => {
    const typeInfo = DATA_TYPES.find((t) => t.value === selectedType);
    const required = typeInfo?.size || 0;

    const sortedRows = [...selectedRows].sort((a, b) => a - b);

    // 선택된 행이 연속적인지 확인
    for (let i = 1; i < sortedRows.length; i++) {
      if (sortedRows[i] !== sortedRows[i - 1] + 1) {
        showAlert("선택한 행은 연속된 항목이어야 합니다", "error");
        return;
      }
    }

    if (required > 0 && sortedRows.length !== required) {
      showAlert(
        `${typeInfo.label} 타입은 ${required}칸을 선택해야 합니다`,
        "error",
      );
      return;
    }

    const updatedData = packetData.map((item) =>
      selectedRows.includes(item.offset)
        ? { ...item, type: selectedType, is_chained: true }
        : item,
    );

    setPacketData(updatedData);
    autoSave(updatedData);
    setOpenTypeDialog(false);
    setSelectedRows([]);
    showAlert("선택한 행이 성공적으로 묶였습니다", "success");
  };

  // 행 체인 해제 확인
  const initiateUnchainRows = () => {
    const groups = [];
    const seen = new Set();
    selectedRows.forEach((offset) => {
      const chain = getChainedItems(offset);
      if (chain.length > 0) {
        const start = chain[0].offset;
        if (!seen.has(start)) {
          seen.add(start);
          groups.push(chain.map((ci) => ci.offset));
        }
      }
    });
    if (groups.length === 0) return;
    setConfirmUnchain({ open: true, groups });
  };

  const handleUnchainRows = () => {
    const offsets = new Set(confirmUnchain.groups.flat());
    const updatedData = packetData.map((item) =>
      offsets.has(item.offset) ? { ...item, is_chained: false, type: 0 } : item,
    );
    setPacketData(updatedData);
    setSelectedRows([]);
    autoSave(updatedData);
    showAlert("선택한 행의 묶음이 해제되었습니다", "success");
    setConfirmUnchain({ open: false, groups: [] });
  };

  const cancelUnchain = () => setConfirmUnchain({ open: false, groups: [] });

  const autoSave = async (dataToSave) => {
    if (!selectedPacket) return;
    if (!validateChainLengths(dataToSave)) return;
    try {
      await updateTCPPacketData(currentTCP.id, selectedPacket.id, {
        tcp_server_id: currentTCP.id,
        data: dataToSave,
      });
    } catch (error) {
      console.error("자동 저장 실패:", error);
    }
  };

  // 입력창에 표시될 값 계산
  const getInputValue = (item) => {
    const typeInfo = DATA_TYPES.find((t) => t.value === item.type);

    if (item.is_chained) {
      const chain = getChainedItems(item.offset);
      if (chain.length > 0 && chain[0].offset === item.offset) {
        const required = typeInfo ? typeInfo.size : 0;
        if (required > 0 && chain.length < required) {
          return "";
        }

        const bytes = chain.map((ci) => ci.value);
        const buffer = new ArrayBuffer(bytes.length);
        const view = new DataView(buffer);
        bytes.forEach((b, i) => view.setUint8(i, b));
        switch (item.type) {
          case 0:
            return view.getInt8(0).toString();
          case 1:
            return view.getInt16(0, true).toString();
          case 2:
            return view.getInt32(0, true).toString();
          case 3:
            return view.getBigInt64(0, true).toString();
          case 4:
            return view.getUint8(0).toString();
          case 5:
            return view.getUint16(0, true).toString();
          case 6:
            return view.getUint32(0, true).toString();
          case 7:
            return view.getBigUint64(0, true).toString();
          case 8:
            return view.getFloat32(0, true).toString();
          case 9:
            return view.getFloat64(0, true).toString();
          case 10: {
            let str = "";
            for (const b of bytes) {
              if (b === 0) break;
              str += String.fromCharCode(b);
            }
            return str;
          }
        case 11:
          return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
        case 12:
          try {
            return new TextDecoder().decode(new Uint8Array(bytes));
          } catch {
            return "";
          }
        default:
          return "";
        }
      }
      return "";
    }

    switch (item.type) {
      case 10:
        return item.value ? String.fromCharCode(item.value) : "";
      case 11:
        return (item.value || 0).toString(16).padStart(2, "0");
      case 12: {
        const chain = getChainedItems(item.offset);
        try {
          const bytes = chain.map((ci) => ci.value);
          return new TextDecoder().decode(new Uint8Array(bytes));
        } catch {
          return "";
        }
      }
      default:
        return (item.value ?? "").toString();
    }
  };

  // 각 오프셋별 표시 값
  const getDisplayValue = (item) => {
    if (item.type === 12) {
      const chain = getChainedItems(item.offset);
      try {
        const bytes = chain.map((ci) => ci.value);
        return new TextDecoder().decode(new Uint8Array(bytes));
      } catch {
        return "";
      }
    }
    return item.value !== undefined ? item.value.toString() : "";
  };

  // 체인된 값 변경 및 단일 값 처리
  const handleDisplayChange = (offset, value) => {
    let chain = getChainedItems(offset);
    const typeForEmptyCheck =
      chain.length > 0
        ? chain[0].type
        : packetData.find((item) => item.offset === offset)?.type;
    if (value === "" && typeForEmptyCheck !== 10 && typeForEmptyCheck !== 11)
      value = "0";

    // 체인이 아닌 경우 단일 항목을 체인처럼 처리
    if (chain.length === 0) {
      const target = packetData.find((item) => item.offset === offset);
      if (!target) return;
      chain = [target];
    }

    const type = chain[0].type;
    const typeInfo = DATA_TYPES.find((t) => t.value === type);
    const required = typeInfo ? typeInfo.size : 0;
    if (required > 0 && chain.length < required) {
      showAlert("체인 길이가 타입 크기보다 작습니다", "error");
      return;
    }
    const buffer = new ArrayBuffer(chain.length);
    const view = new DataView(buffer);

    try {
      switch (type) {
        case 0: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[0].min || v > TYPE_RANGES[0].max) {
            showAlert("Int8 범위를 벗어났습니다", "error");
            return;
          }
          view.setInt8(0, v);
          break;
        }
        case 1: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[1].min || v > TYPE_RANGES[1].max) {
            showAlert("Int16 범위를 벗어났습니다", "error");
            return;
          }
          view.setInt16(0, v, true);
          break;
        }
        case 2: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[2].min || v > TYPE_RANGES[2].max) {
            showAlert("Int32 범위를 벗어났습니다", "error");
            return;
          }
          view.setInt32(0, v, true);
          break;
        }
        case 3: {
          let v = BigInt(value || 0);
          if (v < TYPE_RANGES[3].min || v > TYPE_RANGES[3].max) {
            showAlert("Int64 범위를 벗어났습니다", "error");
            return;
          }
          view.setBigInt64(0, v, true);
          break;
        }
        case 4: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[4].min || v > TYPE_RANGES[4].max) {
            showAlert("Uint8 범위를 벗어났습니다", "error");
            return;
          }
          view.setUint8(0, v);
          break;
        }
        case 5: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[5].min || v > TYPE_RANGES[5].max) {
            showAlert("Uint16 범위를 벗어났습니다", "error");
            return;
          }
          view.setUint16(0, v, true);
          break;
        }
        case 6: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[6].min || v > TYPE_RANGES[6].max) {
            showAlert("Uint32 범위를 벗어났습니다", "error");
            return;
          }
          view.setUint32(0, v, true);
          break;
        }
        case 7: {
          let v = BigInt(value || 0);
          if (v < TYPE_RANGES[7].min || v > TYPE_RANGES[7].max) {
            showAlert("Uint64 범위를 벗어났습니다", "error");
            return;
          }
          view.setBigUint64(0, v, true);
          break;
        }
        case 8:
          view.setFloat32(0, parseFloat(value) || 0, true);
          break;
        case 9:
          view.setFloat64(0, parseFloat(value) || 0, true);
          break;
        case 10: {
          for (const ch of value) {
            if (ch.charCodeAt(0) > 127) {
              showAlert("영문 및 특수문자만 입력 가능합니다", "error");
              return;
            }
          }
          const chars = value.slice(0, chain.length).split("");
          chars.forEach((ch, i) => view.setUint8(i, ch.charCodeAt(0)));
          for (let i = chars.length; i < chain.length; i++) {
            view.setUint8(i, 0);
          }
          break;
        }
        case 11: {
          const cleaned = (value || "").replace(/\s+/g, "");
          for (let i = 0; i < chain.length; i++) {
            const byteStr = cleaned.slice(i * 2, i * 2 + 2);
            view.setUint8(i, parseInt(byteStr || "0", 16));
          }
          break;
        }
        case 12: {
          let obj;
          try {
            obj = JSON.parse(value || "");
          } catch {
            showAlert("Json으로 호환되는 응답이 아닙니다", "error");
            return;
          }
          const jsonStr = JSON.stringify(obj);
          const encoder = new TextEncoder();
          const bytes = Array.from(encoder.encode(jsonStr));
          const start = chain[0].offset;
          const currentLen = chain.length;
          const newLen = bytes.length;
          let updated = packetData.filter(
            (item) => !chain.some((ci) => ci.offset === item.offset),
          );
          const delta = newLen - currentLen;
          updated = updated.map((item) =>
            item.offset >= start + currentLen
              ? { ...item, offset: item.offset + delta }
              : item,
          );
          const newItems = bytes.map((b, i) => ({
            offset: start + i,
            value: b,
            type: 12,
            is_chained: true,
            desc: "",
          }));
          updated = [...updated, ...newItems];
          setPacketData(updated);
          setSelectedRows((prev) =>
            prev.map((row) =>
              row >= start + currentLen ? row + delta : row,
            ),
          );
          autoSave(updated);
          return;
        }
        default:
          break;
      }
    } catch (e) {
      console.error("Display 값 변환 실패:", e);
      return;
    }

    const bytes = new Uint8Array(buffer);
    const updated = packetData.map((item) => {
      const idx = chain.findIndex((ci) => ci.offset === item.offset);
      if (idx !== -1) {
        return { ...item, value: bytes[idx] };
      }
      return item;
    });
    setPacketData(updated);
    autoSave(updated);
  };

  // 특정 오프셋을 포함하는 체인된 항목들 가져오기
  const getChainedItems = (offset) => {
    // 정렬된 데이터 복사본 생성
    const sorted = [...packetData].sort((a, b) => a.offset - b.offset);

    // 현재 오프셋의 위치 찾기
    const index = sorted.findIndex((item) => item.offset === offset);

    // 체인되지 않은 항목이거나 존재하지 않으면 빈 배열 반환
    if (index === -1 || !sorted[index].is_chained) {
      return [];
    }

    // 체인의 시작점까지 역방향 탐색
    let start = index;
    while (
      start > 0 &&
      sorted[start - 1].is_chained &&
      sorted[start - 1].offset === sorted[start].offset - 1
    ) {
      start--;
    }

    // 체인의 끝까지 정방향 탐색
    let end = index;
    while (
      end + 1 < sorted.length &&
      sorted[end + 1].is_chained &&
      sorted[end + 1].offset === sorted[end].offset + 1
    ) {
      end++;
    }

    // 시작부터 끝까지 잘라서 반환
    return sorted.slice(start, end + 1);
  };

  // 전체 체인 길이 검증
  const validateChainLengths = (data = packetData) => {
    const sorted = [...data].sort((a, b) => a.offset - b.offset);
    for (let i = 0; i < sorted.length; ) {
      const item = sorted[i];
      if (item.is_chained) {
        let j = i;
        while (
          j + 1 < sorted.length &&
          sorted[j + 1].is_chained &&
          sorted[j + 1].offset === sorted[j].offset + 1
        ) {
          j++;
        }
        const group = sorted.slice(i, j + 1);
        const typeInfo = DATA_TYPES.find((t) => t.value === group[0].type);
        const expected = typeInfo?.size || 0;
        if (expected > 0 && group.length !== expected) {
          showAlert(
            `오프셋 ${group[0].offset}부터 ${expected}칸이 필요합니다`,
            "error",
          );
          return false;
        }
        i = j + 1;
      } else {
        i++;
      }
    }
    return true;
  };

  // 패킷 전송
  const handleSendPacket = async () => {
    if (!selectedPacket) return;
    try {
      setLoading(true);
      if (sendCount === 0) {
        if (!isSending) {
          if (autoMsgId) {
            await handleGenerateMessageId(true);
          }
          await sendTCPPacket(currentTCP.id, selectedPacket.id, intervalMs);
          setIsSending(true);
          showAlert("패킷 전송을 시작합니다", "success");
        } else {
          await stopTCPPacket(currentTCP.id, selectedPacket.id);
          setIsSending(false);
          showAlert("패킷 전송을 중지합니다", "info");
        }
      } else {
        for (let i = 0; i < sendCount; i++) {
          if (autoMsgId) {
            await handleGenerateMessageId(true);
          }
          await sendTCPPacket(currentTCP.id, selectedPacket.id);
          if (intervalMs > 0 && i < sendCount - 1) {
            await new Promise((res) => setTimeout(res, intervalMs));
          }
        }
        showAlert(`패킷을 ${sendCount}회 전송했습니다`, "success");
      }
    } catch (error) {
      console.error("패킷 전송 실패:", error);
      showAlert("패킷 전송 실패: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 알림 표시
  const showAlert = (message, severity = "info") => {
    setAlertInfo({
      open: true,
      message,
      severity,
    });
  };

  // 알림 닫기
  const handleCloseAlert = () => {
    setAlertInfo({
      ...alertInfo,
      open: false,
    });
  };

  return {
    packets,
    selectedPacket,
    packetData,
    loading,
    openDialog,
    packetName,
    packetDesc,
    useCRC,
    contextMenu,
    selectedRows,
    openTypeDialog,
    selectedType,
    alertInfo,
    confirmUnchain,
    msgIdOffset,
    currentMsgId,
    intervalMs,
    isSending,
    sendCount,
    setPacketName,
    setPacketDesc,
    handleCRCChange,
    setMsgIdOffset,
    setOpenDialog,
    setOpenTypeDialog,
    setSelectedType,
    setConfirmUnchain,
    setPacketData,
    loadPackets,
    handleSelectPacket,
    handleOpenNewPacketDialog,
    handleCreatePacket,
    handleUpdatePacketInfo,
    handleDeletePacket,
    handleAddRow,
    handleChainRows,
    initiateUnchainRows,
    applyChainType,
    handleUnchainRows,
    cancelUnchain,
    getChainedItems,
    getInputValue,
    handleDisplayChange,
    getDisplayValue,
    handleRowChange,
    handleDeleteRow,
    toggleRowSelection,
    handleContextMenu,
    handleSendPacket,
    handleCloseContextMenu,
    showAlert,
    handleCloseAlert,
    autoSave,
    bytesToHex,
    setIntervalMs,
    setSendCount,
    autoMsgId,
    setAutoMsgId,
  };
};

export default usePacketData;
