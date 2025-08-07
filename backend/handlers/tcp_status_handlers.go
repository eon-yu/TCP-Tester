package handlers

import (
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// CheckTCPStatus는 TCP 서버의 연결 상태를 확인합니다.
func (h *TCPServerHandler) CheckTCPStatus(c *gin.Context) {
	server, ok := h.getServerByID(c)
	if !ok {
		return
	}

	// TCP 연결 시도
	addr := net.JoinHostPort(server.Host, strconv.Itoa(server.Port))
	conn, err := net.DialTimeout("tcp", addr, 3*time.Second)

	status := "Dead"
	if err == nil {
		status = "Alive"
		conn.Close()
	}

	c.JSON(http.StatusOK, gin.H{
		"id":     server.ID,
		"name":   server.Name,
		"status": status,
	})
}

// StartTCPServer는 TCP 서버를 시작합니다. (실제로는 상태 변경만 수행)
func (h *TCPServerHandler) StartTCPServer(c *gin.Context) {
	server, ok := h.getServerByID(c)
	if !ok {
		return
	}

	// 실제 환경에서는 여기서 TCP 서버 시작 로직을 구현
	// 이 예제에서는 상태만 반환

	c.JSON(http.StatusOK, gin.H{
		"id":      server.ID,
		"name":    server.Name,
		"message": "TCP 서버 시작됨",
		"status":  "Alive",
	})
}

// StopTCPServer는 TCP 서버를 중지합니다. (실제로는 상태 변경만 수행)
func (h *TCPServerHandler) StopTCPServer(c *gin.Context) {
	server, ok := h.getServerByID(c)
	if !ok {
		return
	}

	// 실제 환경에서는 여기서 TCP 서버 중지 로직을 구현
	// 이 예제에서는 상태만 반환

	c.JSON(http.StatusOK, gin.H{
		"id":      server.ID,
		"name":    server.Name,
		"message": "TCP 서버 중지됨",
		"status":  "Dead",
	})
}

// GetTCPRequests는 특정 TCP 서버와 관련된 요청 목록을 반환합니다.
func (h *TCPServerHandler) GetTCPRequests(c *gin.Context) {
	if _, ok := h.getServerByID(c); !ok {
		return
	}

	// 실제 환경에서는 여기서 해당 TCP 서버에 대한 요청 목록을 조회
	// 이 예제에서는 빈 배열 반환
	c.JSON(http.StatusOK, []gin.H{})
}

// GetTCPLogs는 특정 TCP 서버와 관련된 로그 목록을 반환합니다.
func (h *TCPServerHandler) GetTCPLogs(c *gin.Context) {
	if _, ok := h.getServerByID(c); !ok {
		return
	}

	// 실제 환경에서는 여기서 해당 TCP 서버에 대한 로그 목록을 조회
	// 이 예제에서는 빈 배열 반환
	c.JSON(http.StatusOK, []gin.H{})
}
