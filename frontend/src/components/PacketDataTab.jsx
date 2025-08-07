import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
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
import PacketDataTable from './packet/PacketDataTable';
import PacketFormDialog from './packet/PacketFormDialog';
import TypeSelectDialog from './packet/TypeSelectDialog';
import ConfirmUnchainDialog from './packet/ConfirmUnchainDialog';
import ResponseDialog from './packet/ResponseDialog';
import { DATA_TYPES, TYPE_RANGES, TYPE_COLORS } from './packet/constants';

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
    let newOffset = 0;
    setPacketData(prev => {
      newOffset = prev.length > 0 ? Math.max(...prev.map(item => item.offset)) + 1 : 0;
      const newRow = {
        offset: newOffset,
        value: 0,
        type: 0, // Int8
        is_chained: false,
        desc: ''
      };
      return [...prev, newRow];
    });
    return newOffset;
  };

  // 행 삭제
  const handleDeleteRow = (offsetToDelete) => {
    const updated = packetData
      .filter(item => item.offset !== offsetToDelete)
      .map(item =>
        item.offset > offsetToDelete ? { ...item, offset: item.offset - 1 } : item
      );
    setPacketData(updated);
    setSelectedRows(prev =>
      prev
        .filter(row => row !== offsetToDelete)
        .map(row => (row > offsetToDelete ? row - 1 : row))
    );
    autoSave(updated);
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
          case 10: {
            let str = '';
            for (const b of bytes) {
              if (b === 0) break;
              str += String.fromCharCode(b);
            }
            return str;
          }
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
        return item.value ? String.fromCharCode(item.value) : '';
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
    let chain = getChainedItems(offset);
    const typeForEmptyCheck = chain.length > 0 ? chain[0].type : packetData.find(item => item.offset === offset)?.type;
    if (value === '' && typeForEmptyCheck !== 10 && typeForEmptyCheck !== 11) value = '0';

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
          for (const ch of value) {
            if (ch.charCodeAt(0) > 127) {
              showAlert('영문 및 특수문자만 입력 가능합니다', 'error');
              return;
            }
          }
          const chars = value.slice(0, chain.length).split('');
          chars.forEach((ch, i) => view.setUint8(i, ch.charCodeAt(0)));
          for (let i = chars.length; i < chain.length; i++) {
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

      <PacketDataTable
        selectedPacket={selectedPacket}
        packetData={packetData}
        selectedRows={selectedRows}
        toggleRowSelection={toggleRowSelection}
        handleContextMenu={handleContextMenu}
        handleAddRow={handleAddRow}
        handleChainRows={handleChainRows}
        initiateUnchainRows={initiateUnchainRows}
        loading={loading}
        getChainedItems={getChainedItems}
        getInputValue={getInputValue}
        handleDisplayChange={handleDisplayChange}
        getDisplayValue={getDisplayValue}
        handleRowChange={handleRowChange}
        handleDeleteRow={handleDeleteRow}
      />

      <PacketFormDialog
        open={openDialog}
        loading={loading}
        packetName={packetName}
        packetDesc={packetDesc}
        setPacketName={setPacketName}
        setPacketDesc={setPacketDesc}
        selectedPacket={selectedPacket}
        onSave={selectedPacket ? handleUpdatePacketInfo : handleCreatePacket}
        onClose={() => setOpenDialog(false)}
      />

      <TypeSelectDialog
        open={openTypeDialog}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedRows={selectedRows}
        onApply={applyChainType}
        onClose={() => setOpenTypeDialog(false)}
      />

      <ConfirmUnchainDialog
        open={confirmUnchain.open}
        groups={confirmUnchain.groups}
        onConfirm={handleUnchainRows}
        onCancel={cancelUnchain}
      />

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

      <ResponseDialog
        open={responseDialog.open}
        response={responseDialog.response}
        onClose={() => setResponseDialog({ open: false, response: null })}
      />
    </Box>
  );
};

export default PacketDataTab;
