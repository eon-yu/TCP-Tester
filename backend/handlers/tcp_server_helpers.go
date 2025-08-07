package handlers

import (
	"net/http"

	"github.com/fake-edge-server/models"
	"github.com/gin-gonic/gin"
)

// getServerByID는 URL 파라미터에서 ID를 추출하여 TCP 서버를 조회합니다.
func (h *TCPServerHandler) getServerByID(c *gin.Context) (*models.TCPServer, bool) {
	id := c.Param("id")
	var server models.TCPServer
	result := h.DB.First(&server, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "TCP 서버를 찾을 수 없습니다"})
		return nil, false
	}
	return &server, true
}
