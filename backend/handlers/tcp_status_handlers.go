package handlers

import (
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
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

// KillTCPServer는 활성화된 로컬 TCP 서버 프로세스를 강제 종료합니다.
func (h *TCPServerHandler) KillTCPServer(c *gin.Context) {
	server, ok := h.getServerByID(c)
	if !ok {
		return
	}

	if server.Host != "127.0.0.1" && server.Host != "localhost" {
		c.JSON(http.StatusForbidden, gin.H{"error": "로컬 서버만 종료할 수 있습니다"})
		return
	}

	addr := net.JoinHostPort(server.Host, strconv.Itoa(server.Port))
	conn, err := net.DialTimeout("tcp", addr, 3*time.Second)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "포트가 활성화되어 있지 않습니다"})
		return
	}
	conn.Close()

	cmd := exec.Command("sh", "-c", fmt.Sprintf("lsof -ti:%d", server.Port))
	output, err := cmd.Output()
	if err != nil || len(output) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "프로세스 ID를 찾을 수 없습니다"})
		return
	}

	for _, pid := range strings.Fields(string(output)) {
		_ = exec.Command("kill", "-9", pid).Run()
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      server.ID,
		"name":    server.Name,
		"message": "프로세스 종료됨",
		"status":  "Dead",
	})
}
