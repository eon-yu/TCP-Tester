import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import ResponseList from "./packet/ResponseList";
import FrameViewer from "./packet/FrameViewer";
import useResponseHistory from "../hooks/useResponseHistory";

const TCPRequestsTab = ({ currentTCP }) => {
  const { responseHistory } = useResponseHistory(currentTCP);
  const [selectedResponse, setSelectedResponse] = useState(null);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        응답 목록 현황 (전체)
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ width: "40%" }}>
          <ResponseList
            responses={responseHistory}
            onSelect={(res) => setSelectedResponse(res)}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {selectedResponse ? (
            <>
              {!selectedResponse.valid && (
                <Typography color="error" sx={{ mb: 2 }}>
                  비정상적인 응답입니다.
                </Typography>
              )}
              <Typography variant="subtitle1" gutterBottom>
                요청 패킷
              </Typography>
              <FrameViewer data={selectedResponse.requestData} />
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                응답 프레임
              </Typography>
              <FrameViewer data={selectedResponse.responseData} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              왼쪽 목록에서 응답을 선택하세요.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TCPRequestsTab;
