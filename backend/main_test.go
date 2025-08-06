package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/fake-edge-server/config"
	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/routes"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var testDB *gorm.DB
var testRouter *gin.Engine

func TestMain(m *testing.M) {
	// 테스트용 설정 로드
	config.LoadConfig()

	// 테스트용 인메모리 데이터베이스 설정
	var err error
	testDB, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("테스트 데이터베이스 연결 실패: " + err.Error())
	}

	// 실제 프로젝트의 마이그레이션과 동일하게 설정
	err = testDB.AutoMigrate(
		&models.Request{},
		&models.TCPConnection{},
		&models.TCPServer{},
		&models.TCPPacket{},
	)
	if err != nil {
		panic("마이그레이션 실패: " + err.Error())
	}

	// Gin을 테스트 모드로 설정
	gin.SetMode(gin.TestMode)

	// 테스트용 라우터 설정
	testRouter = gin.New()
	routes.SetupRoutes(testRouter, testDB)

	// 테스트 실행
	code := m.Run()

	os.Exit(code)
}

func setupTestData() {
	// 테스트용 데이터 설정
	testDB.Create(&models.Request{
		Method: "GET",
		Path:   "/test",
		Body:   "test body",
		IP:     "127.0.0.1",
	})

	testDB.Create(&models.TCPServer{
		Name:    "test-server",
		Address: "localhost:8080",
		Status:  "active",
	})
}

func cleanupTestData() {
	// 테스트 데이터 정리
	testDB.Exec("DELETE FROM requests")
	testDB.Exec("DELETE FROM tcp_connections")
	testDB.Exec("DELETE FROM tcp_servers")
	testDB.Exec("DELETE FROM tcp_packets")
}

// Helper function for making HTTP requests
func makeRequest(method, url string, body interface{}) (*httptest.ResponseRecorder, error) {
	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	testRouter.ServeHTTP(recorder, req)

	return recorder, nil
}

func TestHealthCheck(t *testing.T) {
	recorder, err := makeRequest("GET", "/api/v1/health", nil)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestRequestsAPI(t *testing.T) {
	// 테스트 데이터 설정
	setupTestData()
	defer cleanupTestData()

	// GET /api/v1/requests
	recorder, err := makeRequest("GET", "/api/v1/requests", nil)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)

	var requests []models.Request
	err = json.Unmarshal(recorder.Body.Bytes(), &requests)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(requests), 1)
}

func TestTCPConnectionsAPI(t *testing.T) {
	// 테스트 데이터 설정
	setupTestData()
	defer cleanupTestData()

	// GET /api/v1/tcp-connections
	recorder, err := makeRequest("GET", "/api/v1/tcp-connections", nil)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestProxyAPI(t *testing.T) {
	defer cleanupTestData()

	// POST /api/v1/proxy
	testBody := map[string]string{"message": "test proxy"}
	recorder, err := makeRequest("POST", "/api/v1/proxy", testBody)
	assert.NoError(t, err)

	// TCP 서버가 실제로 없으므로 에러가 예상됨
	assert.Equal(t, http.StatusInternalServerError, recorder.Code)

	// 하지만 요청은 DB에 저장되어야 함
	var requests []models.Request
	testDB.Find(&requests)
	assert.GreaterOrEqual(t, len(requests), 1)
}
