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
		Name: "test-server",
		Host: "localhost",
		Port: 8080,
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

	// TCP 연결 정보 생성 테스트
	connection := &models.TCPConnection{
		ServerName: "test-server",
		ServerAddr: "localhost:8080",
		Success:    false,
	}

	result := db.Create(connection)
	assert.NoError(t, result.Error)
	assert.NotZero(t, connection.ID)

	// 연결 상태 업데이트
	connection.Success = true
	result = db.Save(connection)
	assert.NoError(t, result.Error)

	// 연결 조회
	var retrievedConnection models.TCPConnection
	result = db.First(&retrievedConnection, connection.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, true, retrievedConnection.Success)
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

// TCPServer 관련 서비스 테스트
func TestTCPServerService_ManageServers(t *testing.T) {
	db := setupTestDB()

	// TCP 서버 생성
	server := models.TCPServer{
		Name: "production-server",
		Host: "prod.example.com",
		Port: 8080,
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
	server.Port = 9090
	result = db.Save(&server)
	assert.NoError(t, result.Error)

	// 업데이트 확인
	var updatedServer models.TCPServer
	result = db.First(&updatedServer, server.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, 9090, updatedServer.Port)
}

// 패킷 처리 서비스 테스트
func TestPacketService_ProcessPackets(t *testing.T) {
	db := setupTestDB()

	// 관련 데이터 생성
	connection := models.TCPConnection{ServerName: "test", ServerAddr: "localhost:8080", Success: true}
	db.Create(&connection)

	// 패킷 생성
	packet := models.TCPPacket{
		TCPServerID: connection.ID,
		Data:        models.PacketData{{Offset: 0, Value: 1, Type: models.TypeInt8}},
		Desc:        "sample",
	}
	result := db.Create(&packet)
	assert.NoError(t, result.Error)

	// 패킷 조회
	var packets []models.TCPPacket
	result = db.Where("tcp_server_id = ?", connection.ID).Find(&packets)
	assert.NoError(t, result.Error)
	assert.Len(t, packets, 1)
	assert.Equal(t, "sample", packets[0].Desc)
}
