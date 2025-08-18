import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

const PacketFormDialog = ({
  open,
  loading,
  packetName,
  packetDesc,
  useCRC,
  setPacketName,
  setPacketDesc,
  setUseCRC,
  selectedPacket,
  onSave,
  onClose,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{selectedPacket ? "패킷 수정" : "새 패킷 생성"}</DialogTitle>
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
      <FormControlLabel
        control={
          <Checkbox
            checked={useCRC}
            onChange={(e) => setUseCRC(e.target.checked)}
          />
        }
        label="CRC 적용"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        취소
      </Button>
      <Button
        onClick={onSave}
        variant="contained"
        color="primary"
        disabled={loading}
      >
        저장
      </Button>
    </DialogActions>
  </Dialog>
);

export default PacketFormDialog;
