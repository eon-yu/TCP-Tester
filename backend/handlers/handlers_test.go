package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("테스트 데이터베이스 연결 실패: " + err.Error())
	}

	// 실제 프로젝트의 마이그레이션과 동일하게 설정
	err = db.AutoMigrate(
		&models.Request{},
		&models.TCPConnection{},
		&models.TCPServer{},
		&models.TCPPacket{},
	)
	if err != nil {
		panic("마이그레이션 실패: " + err.Error())
	}

	return db
}

func setupTestRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// TCP 서비스 설정 (실제 TCP 연결 없이 테스트)
	tcpService := services.NewTCPService(db)

	// 실제 APIHandler 사용
	handler := NewAPIHandler(db, tcpService)

	api := router.Group("/api")
	{
		api.GET("/health", handler.GetHealth)
		api.GET("/requests", handler.GetRequests)
		api.GET("/requests/:id", handler.GetRequestByID)
		api.GET("/tcp-connections", handler.GetTCPConnections)
		api.POST("/proxy/:server", handler.ProxyRequest)
		api.POST("/proxy", handler.ProxyRequest)
	}

	return router
}

func TestGetHealth(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	req, _ := http.NewRequest("GET", "/api/health", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "Fake-Edge-Server is running", response["message"])
}

func TestGetRequests(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	// 테스트 데이터 생성
	request := models.Request{
		Method: "GET",
		Path:   "/test",
		Body:   "test body",
		IP:     "127.0.0.1",
	}
	db.Create(&request)

	req, _ := http.NewRequest("GET", "/api/requests", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var requests []models.Request
	err := json.Unmarshal(resp.Body.Bytes(), &requests)
	assert.NoError(t, err)
	assert.Len(t, requests, 1)
	assert.Equal(t, "GET", requests[0].Method)
	assert.Equal(t, "/test", requests[0].Path)
}

func TestGetRequestByID(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	// 테스트 데이터 생성
	request := models.Request{
		Method: "POST",
		Path:   "/test",
		Body:   "test body",
		IP:     "127.0.0.1",
	}
	db.Create(&request)

	req, _ := http.NewRequest("GET", "/api/requests/1", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var retrievedRequest models.Request
	err := json.Unmarshal(resp.Body.Bytes(), &retrievedRequest)
	assert.NoError(t, err)
	assert.Equal(t, "POST", retrievedRequest.Method)
	assert.Equal(t, "/test", retrievedRequest.Path)
}

func TestGetRequestByID_NotFound(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	req, _ := http.NewRequest("GET", "/api/requests/9999", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusNotFound, resp.Code)

	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "요청을 찾을 수 없습니다", response["error"])
}

func TestGetTCPConnections(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	// 테스트 데이터 생성
	connection := models.TCPConnection{
		ServerName: "test-server",
		ServerAddr: "localhost:8080",
		Success:    true,
	}
	db.Create(&connection)

	req, _ := http.NewRequest("GET", "/api/tcp-connections", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var connections []models.TCPConnection
	err := json.Unmarshal(resp.Body.Bytes(), &connections)
	assert.NoError(t, err)
	assert.Len(t, connections, 1)
	assert.Equal(t, "test-server", connections[0].ServerName)
}

func TestProxyRequest(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	// 프록시 요청 테스트 (실제 TCP 서버 없이)
	testBody := `{"message": "test proxy request"}`
	req, _ := http.NewRequest("POST", "/api/proxy/test-server", bytes.NewBufferString(testBody))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// TCP 서비스가 실제로 연결되지 않았으므로 에러가 예상됨
	assert.Equal(t, http.StatusInternalServerError, resp.Code)

	// 하지만 요청은 데이터베이스에 저장되어야 함
	var requests []models.Request
	db.Find(&requests)
	assert.Len(t, requests, 1)
	assert.Equal(t, "POST", requests[0].Method)
	assert.Equal(t, "/api/proxy/test-server", requests[0].Path)
	assert.Equal(t, testBody, requests[0].Body)
}

func TestProxyRequest_DefaultServer(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	testBody := `{"message": "test default proxy"}`
	req, _ := http.NewRequest("POST", "/api/proxy", bytes.NewBufferString(testBody))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// TCP 서비스가 실제로 연결되지 않았으므로 에러가 예상됨
	assert.Equal(t, http.StatusInternalServerError, resp.Code)

	// 요청은 데이터베이스에 저장되어야 함
	var requests []models.Request
	db.Find(&requests)
	assert.Len(t, requests, 1)
	assert.Equal(t, "POST", requests[0].Method)
	assert.Equal(t, "/api/proxy", requests[0].Path)
}

func TestProxyRequest_InvalidBody(t *testing.T) {
	db := setupTestDB()
	router := setupTestRouter(db)

	// 요청 바디를 읽을 수 없는 경우를 시뮬레이션하기는 어려우므로
	// 빈 바디로 테스트
	req, _ := http.NewRequest("POST", "/api/proxy/test-server", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// 빈 바디도 유효한 요청이므로 TCP 서비스 에러가 발생함
	assert.Equal(t, http.StatusInternalServerError, resp.Code)
}
