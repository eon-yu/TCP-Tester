import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Link as LinkIcon,
    LinkOff as LinkOffIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Send as SendIcon
} from '@mui/icons-material';
import {
    createTCPPacket,
    deleteTCPPacket,
    fetchTCPPackets,
    sendTCPPacket,
    updateTCPPacketData,
    updateTCPPacketInfo
} from '../api/packetApi';

// 데이터 타입 정의
const DATA_TYPES = [
  { value: 0, label: 'Int8', size: 1 },
  { value: 1, label: 'Int16', size: 2 },
  { value: 2, label: 'Int32', size: 4 },
  { value: 3, label: 'Int64', size: 8 },
  { value: 4, label: 'Uint8', size: 1 },
  { value: 5, label: 'Uint16', size: 2 },
  { value: 6, label: 'Uint32', size: 4 },
  { value: 7, label: 'Uint64', size: 8 },
  { value: 8, label: 'Float32', size: 4 },
  { value: 9, label: 'Float64', size: 8 },
  { value: 10, label: 'String', size: 0 },
  { value: 11, label: 'Hex', size: 0 }
];

const TYPE_RANGES = {
  0: { min: -128, max: 127 },
  1: { min: -32768, max: 32767 },
  2: { min: -2147483648, max: 2147483647 },
  3: { min: BigInt('-9223372036854775808'), max: BigInt('9223372036854775807') },
  4: { min: 0, max: 255 },
  5: { min: 0, max: 65535 },
  6: { min: 0, max: 4294967295 },
  7: { min: BigInt(0), max: BigInt('18446744073709551615') }
};

const TYPE_COLORS = {
  0: 'rgba(255, 0, 0, 0.1)',
  1: 'rgba(0, 255, 0, 0.1)',
  2: 'rgba(0, 0, 255, 0.1)',
  3: 'rgba(255, 255, 0, 0.1)',
  4: 'rgba(255, 0, 255, 0.1)',
  5: 'rgba(0, 255, 255, 0.1)',
  6: 'rgba(255, 165, 0, 0.1)',
  7: 'rgba(128, 0, 128, 0.1)',
  8: 'rgba(0, 128, 0, 0.1)',
  9: 'rgba(0, 0, 128, 0.1)',
  10: 'rgba(128, 128, 0, 0.1)',
  11: 'rgba(128, 128, 128, 0.1)'
};

const PacketDataTab = ({ currentTCP }) => {
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [packetData, setPacketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [packetName, setPacketName] = useState('');
  const [packetDesc, setPacketDesc] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [selectedType, setSelectedType] = useState(0);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  const [responseDialog, setResponseDialog] = useState({ open: false, response: null });
  const [confirmUnchain, setConfirmUnchain] = useState({ open: false, groups: [] });

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
        setPacketDesc(data[0].desc || '');
      }
      console.log('로드된 패킷:', data);
    } catch (error) {
      console.error('패킷 데이터 로드 실패:', error);
      showAlert('패킷 데이터 로드 실패: ' + error.message, 'error');
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

  // 선택된 패킷 변경 시 패킷 데이터 업데이트
  const handleSelectPacket = (packet) => {
    setSelectedPacket(packet);
    setPacketData(packet.data || []);
    setPacketDesc(packet.desc || '');
  };

  // 새 패킷 생성 대화상자 열기
  const handleOpenNewPacketDialog = () => {
    setSelectedPacket(null);
    setPacketData([]);
    setPacketDesc('');
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
                desc: packetDesc
            };

            await createTCPPacket(currentTCP.id, packetToSave);
            showAlert(`'${packetName}' 패킷이 성공적으로 생성되었습니다`, 'success');
            setOpenDialog(false);
            loadPackets();
        } catch (error) {
            console.error('패킷 저장 실패:', error);
            showAlert('패킷 저장 실패: ' + (error.message || '알 수 없는 오류'), 'error');
            // 자세한 오류 내용 로깅
            if (error.response) {
                console.error('응답 데이터:', error.response);
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
          desc: packetDesc
      };

        await updateTCPPacketInfo(currentTCP.id, selectedPacket.id, packetToSave);
        showAlert('패킷이 성공적으로 업데이트되었습니다', 'success');


      setOpenDialog(false);
      loadPackets();
    } catch (error) {
      console.error('패킷 저장 실패:', error);
        showAlert('패킷 저장 실패: ' + (error.message || '알 수 없는 오류'), 'error');
        // 자세한 오류 내용 로깅
        if (error.response) {
          console.error('응답 데이터:', error.response);
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
      showAlert('패킷이 성공적으로 삭제되었습니다', 'success');

      setSelectedPacket(null);
      setPacketData([]);
      setPacketDesc('');
      loadPackets();
    } catch (error) {
      console.error('패킷 삭제 실패:', error);
      showAlert('패킷 삭제 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 행 추가
  const handleAddRow = () => {
    const newOffset = packetData.length > 0 ? Math.max(...packetData.map(item => item.offset)) + 1 : 0;

    const newRow = {
      offset: newOffset,
      value: 0,
      type: 0, // Int8
      is_chained: false,
      desc: ''
    };

    setPacketData([...packetData, newRow]);
  };

  // 행 삭제
  const handleDeleteRow = (offsetToDelete) => {
    setPacketData(packetData.filter(item => item.offset !== offsetToDelete));
  };

  // 행 값 변경
  const handleRowChange = (offset, field, value) => {
    const updated = packetData.map(item => {
      if (item.offset === offset) {
        if (field === 'value') {
          if (item.is_chained) {
            return item;
          }
          const range = TYPE_RANGES[item.type];
          let v = value;
          if (range) {
            if (typeof range.min === 'bigint') {
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
      setSelectedRows(selectedRows.filter(row => row !== offset));
    } else {
      setSelectedRows([...selectedRows, offset]);
    }
  };

  // 행 체인 설정
  const handleChainRows = () => {
    if (selectedRows.length < 2) {
      showAlert('최소 2개 이상의 행을 선택해야 합니다', 'warning');
      return;
    }

    // 타입 선택 대화상자 열기
    setOpenTypeDialog(true);
  };

  // 타입 선택 후 행 체인 설정 적용
  const applyChainType = () => {
    const typeInfo = DATA_TYPES.find(t => t.value === selectedType);
    const required = typeInfo?.size || 0;

    const sortedRows = [...selectedRows].sort((a, b) => a - b);

    // 선택된 행이 연속적인지 확인
    for (let i = 1; i < sortedRows.length; i++) {
      if (sortedRows[i] !== sortedRows[i - 1] + 1) {
        showAlert('선택한 행은 연속된 항목이어야 합니다', 'error');
        return;
      }
    }

    if (required > 0 && sortedRows.length !== required) {
      showAlert(`${typeInfo.label} 타입은 ${required}칸을 선택해야 합니다`, 'error');
      return;
    }

    const updatedData = packetData.map(item => (
      selectedRows.includes(item.offset)
        ? { ...item, type: selectedType, is_chained: true }
        : item
    ));

    setPacketData(updatedData);
    autoSave(updatedData);
    setOpenTypeDialog(false);
    setSelectedRows([]);
    showAlert('선택한 행이 성공적으로 묶였습니다', 'success');
  };

  // 행 체인 해제 확인
  const initiateUnchainRows = () => {
    const groups = [];
    const seen = new Set();
    selectedRows.forEach(offset => {
      const chain = getChainedItems(offset);
      if (chain.length > 0) {
        const start = chain[0].offset;
        if (!seen.has(start)) {
          seen.add(start);
          groups.push(chain.map(ci => ci.offset));
        }
      }
    });
    if (groups.length === 0) return;
    setConfirmUnchain({ open: true, groups });
  };

  const handleUnchainRows = () => {
    const offsets = new Set(confirmUnchain.groups.flat());
    const updatedData = packetData.map(item => (
      offsets.has(item.offset) ? { ...item, is_chained: false, type: 0 } : item
    ));
    setPacketData(updatedData);
    setSelectedRows([]);
    autoSave(updatedData);
    showAlert('선택한 행의 묶음이 해제되었습니다', 'success');
    setConfirmUnchain({ open: false, groups: [] });
  };

  const cancelUnchain = () => setConfirmUnchain({ open: false, groups: [] });

  const autoSave = async (dataToSave) => {
    if (!selectedPacket) return;
    if (!validateChainLengths(dataToSave)) return;
    try {
      await updateTCPPacketData(currentTCP.id, selectedPacket.id, {
        tcp_server_id: currentTCP.id,
        data: dataToSave
      });
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  };

  // 입력창에 표시될 값 계산
  const getInputValue = (item) => {
    const typeInfo = DATA_TYPES.find(t => t.value === item.type);

    if (item.is_chained) {
      const chain = getChainedItems(item.offset);
      if (chain.length > 0 && chain[0].offset === item.offset) {
        const required = typeInfo ? typeInfo.size : 0;
        if (required > 0 && chain.length < required) {
          return '';
        }

        const bytes = chain.map(ci => ci.value);
        const buffer = new ArrayBuffer(bytes.length);
        const view = new DataView(buffer);
        bytes.forEach((b, i) => view.setUint8(i, b));
        switch (item.type) {
          case 0: return view.getInt8(0).toString();
          case 1: return view.getInt16(0, true).toString();
          case 2: return view.getInt32(0, true).toString();
          case 3: return view.getBigInt64(0, true).toString();
          case 4: return view.getUint8(0).toString();
          case 5: return view.getUint16(0, true).toString();
          case 6: return view.getUint32(0, true).toString();
          case 7: return view.getBigUint64(0, true).toString();
          case 8: return view.getFloat32(0, true).toString();
          case 9: return view.getFloat64(0, true).toString();
          case 10:
            return new TextDecoder().decode(new Uint8Array(bytes));
          case 11:
            return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
          default:
            return '';
        }
      }
      return '';
    }

    switch (item.type) {
      case 10:
        return String.fromCharCode(item.value || 0);
      case 11:
        return (item.value || 0).toString(16).padStart(2, '0');
      default:
        return (item.value ?? '').toString();
    }
  };

  // 각 오프셋별 표시 값
  const getDisplayValue = (item) => {
    return item.value !== undefined ? item.value.toString() : '';
  };

  // 체인된 값 변경 및 단일 값 처리
  const handleDisplayChange = (offset, value) => {
    if (value === '') value = '0';
    let chain = getChainedItems(offset);

    // 체인이 아닌 경우 단일 항목을 체인처럼 처리
    if (chain.length === 0) {
      const target = packetData.find(item => item.offset === offset);
      if (!target) return;
      chain = [target];
    }

    const type = chain[0].type;
    const typeInfo = DATA_TYPES.find(t => t.value === type);
    const required = typeInfo ? typeInfo.size : 0;
    if (required > 0 && chain.length < required) {
      showAlert('체인 길이가 타입 크기보다 작습니다', 'error');
      return;
    }
    const buffer = new ArrayBuffer(chain.length);
    const view = new DataView(buffer);

    try {
      switch (type) {
        case 0: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[0].min || v > TYPE_RANGES[0].max) {
            showAlert('Int8 범위를 벗어났습니다', 'error');
            return;
          }
          view.setInt8(0, v);
          break;
        }
        case 1: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[1].min || v > TYPE_RANGES[1].max) {
            showAlert('Int16 범위를 벗어났습니다', 'error');
            return;
          }
          view.setInt16(0, v, true);
          break;
        }
        case 2: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[2].min || v > TYPE_RANGES[2].max) {
            showAlert('Int32 범위를 벗어났습니다', 'error');
            return;
          }
          view.setInt32(0, v, true);
          break;
        }
        case 3: {
          let v = BigInt(value || 0);
          if (v < TYPE_RANGES[3].min || v > TYPE_RANGES[3].max) {
            showAlert('Int64 범위를 벗어났습니다', 'error');
            return;
          }
          view.setBigInt64(0, v, true);
          break;
        }
        case 4: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[4].min || v > TYPE_RANGES[4].max) {
            showAlert('Uint8 범위를 벗어났습니다', 'error');
            return;
          }
          view.setUint8(0, v);
          break;
        }
        case 5: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[5].min || v > TYPE_RANGES[5].max) {
            showAlert('Uint16 범위를 벗어났습니다', 'error');
            return;
          }
          view.setUint16(0, v, true);
          break;
        }
        case 6: {
          const v = parseInt(value);
          if (isNaN(v) || v < TYPE_RANGES[6].min || v > TYPE_RANGES[6].max) {
            showAlert('Uint32 범위를 벗어났습니다', 'error');
            return;
          }
          view.setUint32(0, v, true);
          break;
        }
        case 7: {
          let v = BigInt(value || 0);
          if (v < TYPE_RANGES[7].min || v > TYPE_RANGES[7].max) {
            showAlert('Uint64 범위를 벗어났습니다', 'error');
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
          const bytes = Array.from(new TextEncoder().encode(value || '')).slice(0, chain.length);
          bytes.forEach((b, i) => view.setUint8(i, b));
          for (let i = bytes.length; i < chain.length; i++) {
            view.setUint8(i, 0);
          }
          break;
        }
        case 11: {
          const cleaned = (value || '').replace(/\s+/g, '');
          for (let i = 0; i < chain.length; i++) {
            const byteStr = cleaned.slice(i * 2, i * 2 + 2);
            view.setUint8(i, parseInt(byteStr || '0', 16));
          }
          break;
        }
        default:
          break;
      }
    } catch (e) {
      console.error('Display 값 변환 실패:', e);
      return;
    }

    const bytes = new Uint8Array(buffer);
    const updated = packetData.map(item => {
      const idx = chain.findIndex(ci => ci.offset === item.offset);
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
    const index = sorted.findIndex(item => item.offset === offset);

    // 체인되지 않은 항목이거나 존재하지 않으면 빈 배열 반환
    if (index === -1 || !sorted[index].is_chained) {
      return [];
    }

    // 체인의 시작점까지 역방향 탐색
    let start = index;
    while (start > 0 &&
           sorted[start - 1].is_chained &&
           sorted[start - 1].offset === sorted[start].offset - 1) {
      start--;
    }

    // 체인의 끝까지 정방향 탐색
    let end = index;
    while (end + 1 < sorted.length &&
           sorted[end + 1].is_chained &&
           sorted[end + 1].offset === sorted[end].offset + 1) {
      end++;
    }

    // 시작부터 끝까지 잘라서 반환
    return sorted.slice(start, end + 1);
  };

  // 전체 체인 길이 검증
  const validateChainLengths = (data = packetData) => {
    const sorted = [...data].sort((a, b) => a.offset - b.offset);
    for (let i = 0; i < sorted.length;) {
      const item = sorted[i];
      if (item.is_chained) {
        let j = i;
        while (j + 1 < sorted.length && sorted[j + 1].is_chained && sorted[j + 1].offset === sorted[j].offset + 1) {
          j++;
        }
        const group = sorted.slice(i, j + 1);
        const typeInfo = DATA_TYPES.find(t => t.value === group[0].type);
        const expected = typeInfo?.size || 0;
        if (expected > 0 && group.length !== expected) {
          showAlert(`오프셋 ${group[0].offset}부터 ${expected}칸이 필요합니다`, 'error');
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
      const response = await sendTCPPacket(currentTCP.id, selectedPacket.id);

      // 응답 대화상자 열기
      setResponseDialog({
        open: true,
        response: response
      });

      showAlert('패킷이 성공적으로 전송되었습니다', 'success');
    } catch (error) {
      console.error('패킷 전송 실패:', error);
      showAlert('패킷 전송 실패: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 알림 표시
  const showAlert = (message, severity = 'info') => {
    setAlertInfo({
      open: true,
      message,
      severity
    });
  };

  // 알림 닫기
  const handleCloseAlert = () => {
    setAlertInfo({
      ...alertInfo,
      open: false
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">패킷 데이터</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadPackets}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewPacketDialog}
            disabled={!currentTCP || loading}
          >
            새 패킷
          </Button>
        </Box>
      </Box>

      {/* 패킷 선택 영역 */}
      {packets.length > 0 ? (
        <Box sx={{ mb: 2, display: 'flex', overflowX: 'auto' }}>
          {packets.map(packet => (
            <Button
              key={packet.id}
              variant={selectedPacket && selectedPacket.id === packet.id ? "contained" : "outlined"}
              size="small"
              onClick={() => handleSelectPacket(packet)}
              sx={{ mr: 1, mb: 1, whiteSpace: 'nowrap' }}
            >
              {packet.desc || `패킷 ${packet.id}`}
            </Button>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2 }}>
          저장된 패킷이 없습니다. '새 패킷' 버튼을 클릭하여 패킷을 생성하세요.
        </Typography>
      )}

      {selectedPacket && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            {selectedPacket.desc || `패킷 ${selectedPacket.id}`}
          </Typography>
          <Box>
            <Button
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              수정
            </Button>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeletePacket}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              삭제
            </Button>
            <Button
              color="success"
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendPacket}
              disabled={loading || packetData.length === 0}
            >
              전송
            </Button>
          </Box>
        </Box>
      )}

      {/* 패킷 데이터 테이블 */}
      {selectedPacket && (
        <Box>
          {selectedRows.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={handleChainRows}
                disabled={selectedRows.length < 2}
              >
                선택 항목 묶기
              </Button>
              <Button
                variant="outlined"
                startIcon={<LinkOffIcon />}
                onClick={initiateUnchainRows}
                disabled={selectedRows.length === 0}
              >
                묶음 해제
              </Button>
            </Box>
          )}

          <TableContainer
            component={Paper}
            sx={{ maxHeight: 400 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRow();
              }
            }}
          >
            <Table stickyHeader size="small" sx={{ '& th, & td': { border: '1px solid rgba(224,224,224,1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Offset</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Display</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell align="right">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packetData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다. '행 추가' 버튼을 클릭하여 데이터를 추가하세요.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  packetData.sort((a, b) => a.offset - b.offset).map((item) => {
                    const range = TYPE_RANGES[item.type] || {};
                    const chain = item.is_chained ? getChainedItems(item.offset) : [];
                    const isChainStart = item.is_chained && chain.length > 0 && chain[0].offset === item.offset;
                    console.log(item,isChainStart, chain)
                    const typeInfo = DATA_TYPES.find(t => t.value === item.type);
                    const showTypeLabel = isChainStart || (!item.is_chained && typeInfo?.size === 1);
                    const typeLabel = typeInfo?.label;
                    const inputType = 'text'//(item.type === 10 || item.type === 11) ? 'text' : 'number';
                    return (
                    <TableRow
                      key={item.offset}
                      selected={selectedRows.includes(item.offset)}
                      onClick={() => toggleRowSelection(item.offset)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: item.is_chained ? TYPE_COLORS[item.type] : 'inherit'
                      }}
                    >
                      <TableCell
                        onContextMenu={(e) => handleContextMenu(e, item.offset)}
                        sx={{ fontWeight: item.is_chained ? 'bold' : 'normal' }}
                      >
                        {item.offset}
                      </TableCell>
                      <TableCell>
                        {item.is_chained ? (
                            <input
                              type={inputType}
                              value={getInputValue(item)}
                              onChange={(e) => handleDisplayChange(item.offset, e.target.value)}
                              min={range.min}
                              max={range.max}
                              style={{ width: 80 }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={!isChainStart}
                            />

                        ) : (
                          <input
                            type={inputType}
                            value={getInputValue(item)}
                            onChange={(e) => handleDisplayChange(item.offset, e.target.value)}
                            min={range.min}
                            max={range.max}
                            style={{ width: 80 }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {showTypeLabel && <span style={{ marginLeft: 4 }}>{typeLabel}</span>}
                      </TableCell>
                      <TableCell>
                        {getDisplayValue(item)}
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={item.desc || ''}
                          onChange={(e) => handleRowChange(item.offset, 'desc', e.target.value)}
                          size="small"
                          fullWidth
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(item.offset);
                        }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              variant="outlined"
              disabled={loading}
            >
              행 추가
            </Button>
          </Box>
        </Box>
      )}

      {/* 패킷 저장 대화상자 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedPacket ? '패킷 수정' : '새 패킷 생성'}</DialogTitle>
        <DialogContent>
            <TextField
                label="패킷 이름"
                value={packetName}
                onChange={(e) => setPacketName(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="패킷의 이름을 설정해주세요"
            />
          <TextField
            label="패킷 설명"
            value={packetDesc}
            onChange={(e) => setPacketDesc(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="패킷의 용도나 특징을 간단히 설명해주세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={selectedPacket ? handleUpdatePacketInfo: handleCreatePacket} variant="contained" color="primary" disabled={loading}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 타입 선택 대화상자 */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>데이터 타입 선택</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="data-type-select-label">데이터 타입</InputLabel>
            <Select
              labelId="data-type-select-label"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="데이터 타입"
            >
              {DATA_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            선택한 {selectedRows.length}개의 바이트를 {DATA_TYPES.find(t => t.value === selectedType)?.label} 타입으로 묶습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>
            취소
          </Button>
          <Button onClick={applyChainType} variant="contained" color="primary">
            적용
          </Button>
        </DialogActions>
      </Dialog>

      {/* 묶음 해제 확인 대화상자 */}
      <Dialog open={confirmUnchain.open} onClose={cancelUnchain}>
        <DialogTitle>묶음 해제</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            선택한 항목은 다음 묶음에 포함되어 있습니다:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            {confirmUnchain.groups.map((g, idx) => (
              <li key={idx}>오프셋 {g[0]} - {g[g.length - 1]}</li>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            이 묶음들을 모두 해제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelUnchain}>취소</Button>
          <Button onClick={handleUnchainRows} color="primary" variant="contained">해제</Button>
        </DialogActions>
      </Dialog>

      {/* 오프셋 컨텍스트 메뉴 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          setOpenTypeDialog(true);
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>타입 설정</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const chain = getChainedItems(contextMenu.offset);
          if (chain.length > 0) {
            const offsets = chain.map(ci => ci.offset);
            const updated = packetData.map(item => (
              offsets.includes(item.offset) ? { ...item, is_chained: false, type: 0 } : item
            ));
            setPacketData(updated);
            autoSave(updated);
            showAlert('체인이 해제되었습니다', 'success');
          }
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <LinkOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>묶음 해제</ListItemText>
        </MenuItem>
      </Menu>

      {/* 알림 메시지 */}
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={4000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>

      {/* 응답 대화상자 */}
      <Dialog
        open={responseDialog.open}
        onClose={() => setResponseDialog({ open: false, response: null })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>TCP 패킷 응답</DialogTitle>
        <DialogContent>
          {responseDialog.response && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>응답 메시지</Typography>
              <Typography variant="body2" color="success.main" gutterBottom>
                {responseDialog.response.message}
              </Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>텍스트 응답</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={responseDialog.response.response_text || ''}
                InputProps={{ readOnly: true }}
              />

              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>16진수 응답</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={responseDialog.response.response || ''}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog({ open: false, response: null })}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PacketDataTab;
