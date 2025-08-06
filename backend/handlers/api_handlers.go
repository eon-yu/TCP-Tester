package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// APIHandler는 API 요청을 처리하기 위한 핸들러 구조체입니다.
type APIHandler struct {
	DB         *gorm.DB
	TCPService *services.TCPService
}

// NewAPIHandler는 새로운 APIHandler 인스턴스를 생성합니다.
func NewAPIHandler(db *gorm.DB, tcpService *services.TCPService) *APIHandler {
	return &APIHandler{
		DB:         db,
		TCPService: tcpService,
	}
}

// ProxyRequest는 TCP 서버로 요청을 프록시합니다.
func (h *APIHandler) ProxyRequest(c *gin.Context) {
	// 요청 바디 읽기
	var body []byte
	var err error
	if c.Request.Body != nil {
		body, err = io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "요청 바디를 읽을 수 없습니다"})
			return
		}
	}
	// 바디 복원 (다시 사용하기 위해)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	// 요청 저장
	var headers string
	headersBytes, _ := json.Marshal(c.Request.Header)
	headers = string(headersBytes)

	request := models.Request{
		Method:  c.Request.Method,
		Path:    c.Request.URL.Path,
		Headers: headers,
		Body:    string(body),
		IP:      c.ClientIP(),
	}

	result := h.DB.Create(&request)
	if result.Error != nil {
		log.Printf("요청 저장 실패: %v", result.Error)
	}

	// 서버 이름 가져오기
	serverName := c.Param("server")
	if serverName == "" {
		serverName = "default-server" // 기본 서버 사용
	}

	// TCP 서비스를 통해 요청 전송
	response, err := h.TCPService.SendRequest(serverName, string(body), request.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.String(http.StatusOK, response)
}

// GetRequests는 저장된 모든 HTTP 요청을 반환합니다.
func (h *APIHandler) GetRequests(c *gin.Context) {
	var requests []models.Request
	result := h.DB.Find(&requests)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// GetRequestByID는 특정 ID의 요청 및 관련 TCP 연결을 반환합니다.
func (h *APIHandler) GetRequestByID(c *gin.Context) {
	id := c.Param("id")
	var request models.Request
	result := h.DB.Preload("TCPRequests").First(&request, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "요청을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, request)
}

// GetTCPConnections는 모든 TCP 연결을 반환합니다.
func (h *APIHandler) GetTCPConnections(c *gin.Context) {
	var connections []models.TCPConnection
	result := h.DB.Find(&connections)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, connections)
}

// GetHealth godoc
// @Summary 서버 상태 확인
// @Tags Health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func (h *APIHandler) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "Fake-Edge-Server is running",
	})
}
