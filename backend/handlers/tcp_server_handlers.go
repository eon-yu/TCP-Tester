package handlers

import (
	"net"
	"net/http"

	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// TCPServerHandler는 TCP 서버 관리를 위한 핸들러 구조체입니다.
type TCPServerHandler struct {
	DB          *gorm.DB
	ConnManager *services.TCPConnectionManager
}

// NewTCPServerHandler는 새로운 TCPServerHandler 인스턴스를 생성합니다.
func NewTCPServerHandler(db *gorm.DB, mgr *services.TCPConnectionManager) *TCPServerHandler {
	return &TCPServerHandler{
		DB:          db,
		ConnManager: mgr,
	}
}

// CreateTCPServer는 새로운 TCP 서버 연결 정보를 생성합니다.
func (h *TCPServerHandler) CreateTCPServer(c *gin.Context) {
	var req models.TCPServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효하지 않은 요청 형식: " + err.Error()})
		return
	}

	if net.ParseIP(req.Host) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효한 IP 주소를 입력해주세요"})
		return
	}

	if req.Port < 1 || req.Port > 65535 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효한 포트 번호를 입력해주세요 (1-65535)"})
		return
	}

	// 같은 이름의 서버가 이미 있는지 확인
	var existingServer models.TCPServer
	result := h.DB.Where("name = ?", req.Name).First(&existingServer)
	if result.RowsAffected > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "같은 이름의 TCP 서버가 이미 존재합니다"})
		return
	}

	// 새 TCP 서버 생성
	tcpServer := models.TCPServer{
		Name: req.Name,
		Host: req.Host,
		Port: req.Port,
	}

	result = h.DB.Create(&tcpServer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "TCP 서버 생성 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, tcpServer)
}

// GetTCPServers는 저장된 모든 TCP 서버 목록을 반환합니다.
func (h *TCPServerHandler) GetTCPServers(c *gin.Context) {
	var servers []models.TCPServer
	result := h.DB.Find(&servers)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, servers)
}

// GetTCPServerByID는 특정 ID의 TCP 서버 정보를 반환합니다.
func (h *TCPServerHandler) GetTCPServerByID(c *gin.Context) {
	id := c.Param("id")
	var server models.TCPServer
	result := h.DB.First(&server, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "TCP 서버를 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, server)
}

// UpdateTCPServer는 TCP 서버 정보를 업데이트합니다.
func (h *TCPServerHandler) UpdateTCPServer(c *gin.Context) {
	id := c.Param("id")

	// 서버가 존재하는지 확인
	var server models.TCPServer
	result := h.DB.First(&server, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "TCP 서버를 찾을 수 없습니다"})
		return
	}

	var req models.TCPServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효하지 않은 요청 형식: " + err.Error()})
		return
	}

	if net.ParseIP(req.Host) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효한 IP 주소를 입력해주세요"})
		return
	}

	if req.Port < 1 || req.Port > 65535 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효한 포트 번호를 입력해주세요 (1-65535)"})
		return
	}

	// 이름이 변경되었을 경우 중복 확인
	if req.Name != server.Name {
		var existingServer models.TCPServer
		result = h.DB.Where("name = ? AND id != ?", req.Name, id).First(&existingServer)
		if result.RowsAffected > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "같은 이름의 TCP 서버가 이미 존재합니다"})
			return
		}
	}

	// 업데이트
	server.Name = req.Name
	server.Host = req.Host
	server.Port = req.Port

	result = h.DB.Save(&server)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "TCP 서버 업데이트 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, server)
}

// DeleteTCPServer는 TCP 서버를 삭제합니다.
func (h *TCPServerHandler) DeleteTCPServer(c *gin.Context) {
	id := c.Param("id")

	// 서버가 존재하는지 확인
	var server models.TCPServer
	result := h.DB.First(&server, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "TCP 서버를 찾을 수 없습니다"})
		return
	}

	// 삭제
	result = h.DB.Delete(&server)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "TCP 서버 삭제 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "TCP 서버가 성공적으로 삭제되었습니다"})
}
