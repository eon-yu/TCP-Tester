import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Typography,
} from "@mui/material";
import FrameDisplay from "./FrameDisplay";

const FrameViewer = ({ data = [] }) => {
  const [viewType, setViewType] = useState("frame");
  const handleChange = (_event, next) => {
    if (next !== null) {
      setViewType(next);
    }
  };

  const buildJsonView = () => {
    if (!data || data.length === 0) return { json: "[]", error: null };
    const maxOffset = Math.max(...data.map((d) => d.offset));
    const bytes = new Uint8Array(maxOffset + 1);
    data.forEach((d) => {
      bytes[d.offset] = d.value;
    });
    try {
      const text = new TextDecoder().decode(bytes);
      const obj = JSON.parse(text);
      return { json: JSON.stringify(obj, null, 2), error: null };
    } catch (e) {
      return { json: "", error: "Json으로 호환되는 응답이 아닙니다." };
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{ mb: 1 }}
      >
        <ToggleButton value="frame">Frame</ToggleButton>
        <ToggleButton value="json">JSON</ToggleButton>
      </ToggleButtonGroup>
      {viewType === "frame" ? (
        <FrameDisplay data={data} />
      ) : (
        (() => {
          const { json, error } = buildJsonView();
          return error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <TextField
              multiline
              fullWidth
              value={json}
              InputProps={{ readOnly: true }}
              minRows={6}
            />
          );
        })()
      )}
    </Box>
  );
};

export default FrameViewer;
