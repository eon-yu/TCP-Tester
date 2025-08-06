package services

import (
	"testing"

	"github.com/fake-edge-server/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("테스트 데이터베이스 연결 실패: " + err.Error())
	}

	// 실제 프로젝트의 모델들로 테이블 생성
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

// TCPService 테스트 (실제 TCP 연결 없이)
func TestTCPService_NewTCPService(t *testing.T) {
	db := setupTestDB()
	service := NewTCPService(db)

	assert.NotNil(t, service)
	assert.Equal(t, db, service.DB)
}

// Mock TCPService를 사용한 테스트
func TestTCPService_SendRequest_Mock(t *testing.T) {
	db := setupTestDB()

	// 테스트용 TCP 서버 데이터 생성
	server := models.TCPServer{
		Name:    "test-server",
		Address: "localhost:8080",
		Status:  "active",
	}
	db.Create(&server)

	service := NewTCPService(db)

	// 실제 TCP 연결이 없으므로 에러가 예상됨
	response, err := service.SendRequest("test-server", "test message", 1)
	assert.Error(t, err) // 실제 연결이 없으므로 에러 발생
	assert.Empty(t, response)
}

// TCPConnection 관련 서비스 테스트
func TestTCPService_ConnectionManagement(t *testing.T) {
	db := setupTestDB()
	service := NewTCPService(db)

	// TCP 연결 정보 생성 테스트
	connection := &models.TCPConnection{
		ServerName: "test-server",
		Address:    "localhost:8080",
		Status:     "connecting",
	}

	result := db.Create(connection)
	assert.NoError(t, result.Error)
	assert.NotZero(t, connection.ID)

	// 연결 상태 업데이트
	connection.Status = "connected"
	result = db.Save(connection)
	assert.NoError(t, result.Error)

	// 연결 조회
	var retrievedConnection models.TCPConnection
	result = db.First(&retrievedConnection, connection.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, "connected", retrievedConnection.Status)
}

// RequestService 테스트 (가정)
func TestRequestService_SaveRequest(t *testing.T) {
	db := setupTestDB()

	request := models.Request{
		Method:  "POST",
		Path:    "/api/test",
		Headers: `{"Content-Type": "application/json"}`,
		Body:    `{"message": "test"}`,
		IP:      "192.168.1.1",
	}

	// 요청 저장
	result := db.Create(&request)
	assert.NoError(t, result.Error)
	assert.NotZero(t, request.ID)

	// 저장된 요청 조회
	var savedRequest models.Request
	result = db.First(&savedRequest, request.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, request.Method, savedRequest.Method)
	assert.Equal(t, request.Path, savedRequest.Path)
}

func TestRequestService_GetRequests(t *testing.T) {
	db := setupTestDB()

	// 테스트 데이터 생성
	requests := []models.Request{
		{Method: "GET", Path: "/api/test1", IP: "127.0.0.1"},
		{Method: "POST", Path: "/api/test2", IP: "127.0.0.1"},
		{Method: "PUT", Path: "/api/test3", IP: "127.0.0.1"},
	}

	for _, req := range requests {
		db.Create(&req)
	}

	// 모든 요청 조회
	var retrievedRequests []models.Request
	result := db.Find(&retrievedRequests)
	assert.NoError(t, result.Error)
	assert.Len(t, retrievedRequests, 3)
}

func TestRequestService_GetRequestWithTCPData(t *testing.T) {
	db := setupTestDB()

	// 관련 데이터 생성
	request := models.Request{
		Method: "POST",
		Path:   "/api/data",
		IP:     "127.0.0.1",
	}
	db.Create(&request)

	connection := models.TCPConnection{
		ServerName: "test-server",
		Address:    "localhost:8080",
		Status:     "connected",
	}
	db.Create(&connection)

	packet := models.TCPPacket{
		RequestID:    request.ID,
		ConnectionID: connection.ID,
		Direction:    "outbound",
		Data:         "test packet",
		Size:         11,
	}
	db.Create(&packet)

	// Request와 관련 TCP 데이터 조회
	var requestWithTCP models.Request
	result := db.Preload("TCPRequests").First(&requestWithTCP, request.ID)
	assert.NoError(t, result.Error)
	assert.Len(t, requestWithTCP.TCPRequests, 1)
	assert.Equal(t, "outbound", requestWithTCP.TCPRequests[0].Direction)
}

// TCPServer 관련 서비스 테스트
func TestTCPServerService_ManageServers(t *testing.T) {
	db := setupTestDB()

	// TCP 서버 생성
	server := models.TCPServer{
		Name:    "production-server",
		Address: "prod.example.com:8080",
		Status:  "active",
	}

	result := db.Create(&server)
	assert.NoError(t, result.Error)
	assert.NotZero(t, server.ID)

	// 서버 목록 조회
	var servers []models.TCPServer
	result = db.Find(&servers)
	assert.NoError(t, result.Error)
	assert.Len(t, servers, 1)
	assert.Equal(t, "production-server", servers[0].Name)

	// 서버 상태 업데이트
	server.Status = "inactive"
	result = db.Save(&server)
	assert.NoError(t, result.Error)

	// 업데이트 확인
	var updatedServer models.TCPServer
	result = db.First(&updatedServer, server.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, "inactive", updatedServer.Status)
}

// 패킷 처리 서비스 테스트
func TestPacketService_ProcessPackets(t *testing.T) {
	db := setupTestDB()

	// 관련 데이터 생성
	request := models.Request{Method: "GET", Path: "/test", IP: "127.0.0.1"}
	db.Create(&request)

	connection := models.TCPConnection{ServerName: "test", Address: "localhost:8080", Status: "connected"}
	db.Create(&connection)

	// 여러 패킷 생성
	packets := []models.TCPPacket{
		{
			RequestID:      request.ID,
			ConnectionID:   connection.ID,
			Direction:      "outbound",
			Data:           "request data",
			Size:           12,
			ProcessingTime: 50,
		},
		{
			RequestID:      request.ID,
			ConnectionID:   connection.ID,
			Direction:      "inbound",
			Data:           "response data",
			Size:           13,
			ProcessingTime: 30,
		},
	}

	for _, packet := range packets {
		result := db.Create(&packet)
		assert.NoError(t, result.Error)
	}

	// 특정 요청의 패킷들 조회
	var requestPackets []models.TCPPacket
	result := db.Where("request_id = ?", request.ID).Find(&requestPackets)
	assert.NoError(t, result.Error)
	assert.Len(t, requestPackets, 2)

	// 방향별 패킷 조회
	var outboundPackets []models.TCPPacket
	result = db.Where("direction = ?", "outbound").Find(&outboundPackets)
	assert.NoError(t, result.Error)
	assert.Len(t, outboundPackets, 1)
	assert.Equal(t, "request data", outboundPackets[0].Data)
}
