import React from 'react';
import {
    Alert,
    Box,
    Button,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
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
import PacketDataTable from './packet/PacketDataTable';
import PacketFormDialog from './packet/PacketFormDialog';
import TypeSelectDialog from './packet/TypeSelectDialog';
import ConfirmUnchainDialog from './packet/ConfirmUnchainDialog';
import ResponseHistoryPanel from './packet/ResponseHistoryPanel';
import usePacketData from '../hooks/usePacketData';

const PacketDataTab = ({ currentTCP }) => {
  const {
    packets,
    selectedPacket,
    packetData,
    loading,
    openDialog,
    packetName,
    packetDesc,
    contextMenu,
    selectedRows,
    openTypeDialog,
    selectedType,
    alertInfo,
    confirmUnchain,
    msgIdOffset,
    currentMsgId,
    responseHistory,
    setPacketName,
    setPacketDesc,
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
    getChainedItems,
    getInputValue,
    handleDisplayChange,
    getDisplayValue,
    handleRowChange,
    handleDeleteRow,
    toggleRowSelection,
    handleContextMenu,
    handleGenerateMessageId,
    handleSendPacket,
    handleCloseContextMenu,
    handleUnchainRows,
    cancelUnchain,
    showAlert,
    handleCloseAlert,
    autoSave,
    bytesToHex
  } = usePacketData(currentTCP);
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
              {packet.name || `패킷 ${packet.id}`}
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              type="number"
              label="MsgID 위치"
              size="small"
              value={msgIdOffset}
              onChange={(e) => setMsgIdOffset(parseInt(e.target.value) || 0)}
              sx={{ width: 100, mr: 1 }}
            />
            <Button
              sx={{ mr: 1 }}
              onClick={handleGenerateMessageId}
              disabled={loading}
            >
              Message ID 생성
            </Button>
            {currentMsgId.length === 8 && (
              <Typography variant="caption" sx={{ mr: 1 }}>
                {bytesToHex(currentMsgId)}
              </Typography>
            )}
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

      <ResponseHistoryPanel history={responseHistory} />

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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default PacketDataTab;

