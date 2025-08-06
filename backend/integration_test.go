package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fake-edge-server/config"
	"github.com/fake-edge-server/database"
	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/routes"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type IntegrationTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *gin.Engine
}

func (suite *IntegrationTestSuite) SetupSuite() {
	// 테스트용 설정 로드
	config.LoadConfig()

	// 테스트용 인메모리 데이터베이스 설정
	var err error
	suite.db, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)

	// 데이터베이스 초기화
	database.MigrateDB(suite.db)

	// Gin을 테스트 모드로 설정
	gin.SetMode(gin.TestMode)

	// 테스트용 라우터 설정
	suite.router = gin.New()
	routes.SetupRoutes(suite.router, suite.db)
}

func (suite *IntegrationTestSuite) SetupTest() {
	// 각 테스트 전에 데이터베이스 정리
	suite.db.Exec("DELETE FROM requests")
	suite.db.Exec("DELETE FROM tcp_connections")
	suite.db.Exec("DELETE FROM tcp_servers")
	suite.db.Exec("DELETE FROM tcp_packets")
}

func (suite *IntegrationTestSuite) TearDownSuite() {
	// 테스트 완료 후 정리 작업
}

// Helper method for making HTTP requests
func (suite *IntegrationTestSuite) makeRequest(method, url string, body interface{}) (*httptest.ResponseRecorder, error) {
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
	suite.router.ServeHTTP(recorder, req)

	return recorder, nil
}

func (suite *IntegrationTestSuite) TestHealthCheck() {
	recorder, err := suite.makeRequest("GET", "/api/v1/health", nil)
	suite.NoError(err)
	suite.Equal(http.StatusOK, recorder.Code)

	var response map[string]interface{}
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	suite.NoError(err)
	suite.Equal("healthy", response["status"])
	suite.Equal("Fake-Edge-Server is running", response["message"])
}

func (suite *IntegrationTestSuite) TestProxyRequest() {
	// 프록시 요청 테스트
	testData := map[string]interface{}{
		"message": "test proxy request",
		"data":    "sample data",
	}

	// POST /api/v1/proxy/test-server
	recorder, err := suite.makeRequest("POST", "/api/v1/proxy/test-server", testData)
	suite.NoError(err)
	// TCP 서버가 실제로 없으므로 에러가 예상됨
	suite.Equal(http.StatusInternalServerError, recorder.Code)

	// 하지만 요청은 데이터베이스에 저장되어야 함
	var requests []models.Request
	result := suite.db.Find(&requests)
	suite.NoError(result.Error)
	suite.GreaterOrEqual(len(requests), 1)

	// 마지막 요청 확인
	var lastRequest models.Request
	result = suite.db.Last(&lastRequest)
	suite.NoError(result.Error)
	suite.Equal("POST", lastRequest.Method)
	suite.Equal("/proxy/test-server", lastRequest.Path)
	suite.Contains(lastRequest.Body, "test proxy request")
}

func (suite *IntegrationTestSuite) TestGetRequests() {
	// 테스트 데이터 생성
	requests := []models.Request{
		{Method: "GET", Path: "/api/test1", Body: "test body 1", IP: "127.0.0.1"},
		{Method: "POST", Path: "/api/test2", Body: "test body 2", IP: "127.0.0.1"},
		{Method: "PUT", Path: "/api/test3", Body: "test body 3", IP: "127.0.0.1"},
	}

	for _, req := range requests {
		suite.db.Create(&req)
	}

	// GET /api/v1/requests
	recorder, err := suite.makeRequest("GET", "/api/v1/requests", nil)
	suite.NoError(err)
	suite.Equal(http.StatusOK, recorder.Code)

	var retrievedRequests []models.Request
	err = json.Unmarshal(recorder.Body.Bytes(), &retrievedRequests)
	suite.NoError(err)
	suite.Len(retrievedRequests, 3)
}

func (suite *IntegrationTestSuite) TestGetRequestByID() {
	// 테스트 데이터 생성
	request := models.Request{
		Method: "POST",
		Path:   "/api/integration-test",
		Body:   "integration test body",
		IP:     "192.168.1.100",
	}
	suite.db.Create(&request)

	// GET /api/v1/requests/{id}
	recorder, err := suite.makeRequest("GET", fmt.Sprintf("/api/v1/requests/%d", request.ID), nil)
	suite.NoError(err)
	suite.Equal(http.StatusOK, recorder.Code)

	var retrievedRequest models.Request
	err = json.Unmarshal(recorder.Body.Bytes(), &retrievedRequest)
	suite.NoError(err)
	suite.Equal(request.ID, retrievedRequest.ID)
	suite.Equal(request.Method, retrievedRequest.Method)
	suite.Equal(request.Path, retrievedRequest.Path)
}

func (suite *IntegrationTestSuite) TestGetTCPConnections() {
	// 테스트 데이터 생성
	connections := []models.TCPConnection{
		{ServerName: "server1", Address: "localhost:8081", Status: "connected"},
		{ServerName: "server2", Address: "localhost:8082", Status: "disconnected"},
	}

	for _, conn := range connections {
		suite.db.Create(&conn)
	}

	// GET /api/v1/tcp-connections
	recorder, err := suite.makeRequest("GET", "/api/v1/tcp-connections", nil)
	suite.NoError(err)
	suite.Equal(http.StatusOK, recorder.Code)

	var retrievedConnections []models.TCPConnection
	err = json.Unmarshal(recorder.Body.Bytes(), &retrievedConnections)
	suite.NoError(err)
	suite.Len(retrievedConnections, 2)
}

func (suite *IntegrationTestSuite) TestErrorHandling() {
	// 잘못된 JSON으로 프록시 요청 시도
	invalidJSON := []byte(`{"message": "incomplete json"`)

	req, _ := http.NewRequest("POST", "/api/v1/proxy/test-server", bytes.NewBuffer(invalidJSON))
	req.Header.Set("Content-Type", "application/json")

	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)

	// 잘못된 JSON이어도 요청은 저장되고 TCP 서비스에서 에러가 발생함
	suite.Equal(http.StatusInternalServerError, recorder.Code)

	// 존재하지 않는 요청 조회
	recorder, err := suite.makeRequest("GET", "/api/v1/requests/9999", nil)
	suite.NoError(err)
	suite.Equal(http.StatusNotFound, recorder.Code)
}

func (suite *IntegrationTestSuite) TestConcurrentProxyRequests() {
	// 동시성 테스트 - 여러 프록시 요청을 동시에 처리
	done := make(chan bool, 5)

	for i := 0; i < 5; i++ {
		go func(index int) {
			testData := map[string]interface{}{
				"message": fmt.Sprintf("concurrent test %d", index),
				"index":   index,
			}

			recorder, err := suite.makeRequest("POST", "/api/v1/proxy/test-server", testData)
			suite.NoError(err)
			// TCP 서버가 없으므로 에러가 예상됨
			suite.Equal(http.StatusInternalServerError, recorder.Code)

			done <- true
		}(i)
	}

	// 모든 고루틴 완료 대기
	for i := 0; i < 5; i++ {
		<-done
	}

	// 생성된 요청 수 확인
	recorder, err := suite.makeRequest("GET", "/api/v1/requests", nil)
	suite.NoError(err)
	suite.Equal(http.StatusOK, recorder.Code)

	var requests []models.Request
	err = json.Unmarshal(recorder.Body.Bytes(), &requests)
	suite.NoError(err)
	suite.Len(requests, 5)
}

func (suite *IntegrationTestSuite) TestProxyRequestWithDifferentServers() {
	// 다양한 서버로 프록시 요청 테스트
	servers := []string{"server1", "server2", "server3"}

	for _, server := range servers {
		testData := map[string]interface{}{
			"target_server": server,
			"message":       fmt.Sprintf("request to %s", server),
		}

		recorder, err := suite.makeRequest("POST", fmt.Sprintf("/api/v1/proxy/%s", server), testData)
		suite.NoError(err)
		suite.Equal(http.StatusInternalServerError, recorder.Code) // TCP 서버가 없으므로
	}

	// 모든 요청이 저장되었는지 확인
	var requests []models.Request
	suite.db.Find(&requests)
	suite.Len(requests, 3)

	// 각 요청이 올바른 경로로 저장되었는지 확인
	for i, req := range requests {
		suite.Equal("POST", req.Method)
		suite.Contains(req.Path, fmt.Sprintf("server%d", i+1))
	}
}

func TestIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(IntegrationTestSuite))
}
