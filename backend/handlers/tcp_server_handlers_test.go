package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupTCPServerRouter(db *gorm.DB, mgr *services.TCPConnectionManager) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	hub := services.NewWebSocketHub()
	handler := NewTCPServerHandler(db, mgr, hub)
	router.POST("/tcp", handler.CreateTCPServer)
	return router
}

func TestCreateTCPServerInvalidHost(t *testing.T) {
	db := setupTestDB()
	router := setupTCPServerRouter(db, services.NewTCPConnectionManager())

	body := `{"name":"s","host":"invalid","port":1234}`
	req, _ := http.NewRequest("POST", "/tcp", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestCreateTCPServerInvalidPort(t *testing.T) {
	db := setupTestDB()
	router := setupTCPServerRouter(db, services.NewTCPConnectionManager())

	body := `{"name":"s","host":"127.0.0.1","port":70000}`
	req, _ := http.NewRequest("POST", "/tcp", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}
