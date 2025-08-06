package services

import (
	"errors"
	"fmt"
	"io"
	"net"
	"time"

	"github.com/fake-edge-server/config"
	"github.com/fake-edge-server/models"
	"gorm.io/gorm"
)

// TCPService는 TCP 서버와의 통신을 관리합니다.
type TCPService struct {
	DB *gorm.DB
}

// NewTCPService는 새로운 TCPService 인스턴스를 생성합니다.
func NewTCPService(db *gorm.DB) *TCPService {
	return &TCPService{
		DB: db,
	}
}

// SendRequest는 지정된 TCP 서버로 데이터를 전송하고 응답을 받습니다.
func (s *TCPService) SendRequest(serverName, data string, requestID uint) (string, error) {
	// 설정에서 서버 찾기
	var serverAddr string
	var serverPort string
	serverFound := false

	for _, server := range config.GetConfig().TCPServers {
		if server.Name == serverName {
			serverAddr = server.Address
			serverPort = server.Port
			serverFound = true
			break
		}
	}

	if !serverFound {
		return "", errors.New("지정된 서버를 찾을 수 없습니다")
	}

	// TCP 연결 생성
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%s", serverAddr, serverPort), 5*time.Second)
	if err != nil {
		// 연결 실패 기록
		tcpConn := models.TCPConnection{
			RequestID:  requestID,
			ServerName: serverName,
			ServerAddr: fmt.Sprintf("%s:%s", serverAddr, serverPort),
			SentData:   data,
			Success:    false,
			Error:      err.Error(),
		}
		s.DB.Create(&tcpConn)

		return "", fmt.Errorf("TCP 서버에 연결할 수 없습니다: %v", err)
	}
	defer conn.Close()

	// 데이터 전송
	_, err = conn.Write([]byte(data))
	if err != nil {
		// 전송 실패 기록
		tcpConn := models.TCPConnection{
			RequestID:  requestID,
			ServerName: serverName,
			ServerAddr: fmt.Sprintf("%s:%s", serverAddr, serverPort),
			SentData:   data,
			Success:    false,
			Error:      err.Error(),
		}
		s.DB.Create(&tcpConn)

		return "", fmt.Errorf("데이터 전송 실패: %v", err)
	}

	// 응답 읽기
	response := make([]byte, 4096)
	conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	n, err := conn.Read(response)
	if err != nil && err != io.EOF {
		// 읽기 실패 기록
		tcpConn := models.TCPConnection{
			RequestID:  requestID,
			ServerName: serverName,
			ServerAddr: fmt.Sprintf("%s:%s", serverAddr, serverPort),
			SentData:   data,
			Success:    false,
			Error:      err.Error(),
		}
		s.DB.Create(&tcpConn)

		return "", fmt.Errorf("응답 읽기 실패: %v", err)
	}

	responseStr := string(response[:n])

	// 성공 기록
	tcpConn := models.TCPConnection{
		RequestID:    requestID,
		ServerName:   serverName,
		ServerAddr:   fmt.Sprintf("%s:%s", serverAddr, serverPort),
		SentData:     data,
		ReceivedData: responseStr,
		Success:      true,
	}
	s.DB.Create(&tcpConn)

	return responseStr, nil
}
