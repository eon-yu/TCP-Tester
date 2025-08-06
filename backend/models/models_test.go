package models

import (
	"testing"
	"time"

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
		&Request{},
		&TCPConnection{},
		&TCPServer{},
		&TCPPacket{},
	)
	if err != nil {
		panic("마이그레이션 실패: " + err.Error())
	}

	return db
}

func TestRequestModel(t *testing.T) {
	db := setupTestDB()

	// Request 생성 테스트
	request := Request{
		Method:  "POST",
		Path:    "/api/test",
		Headers: `{"Content-Type": "application/json"}`,
		Body:    `{"message": "test"}`,
		IP:      "192.168.1.1",
	}

	result := db.Create(&request)
	assert.NoError(t, result.Error)
	assert.NotZero(t, request.ID)
	assert.NotZero(t, request.CreatedAt)

	// Request 조회 테스트
	var retrievedRequest Request
	result = db.First(&retrievedRequest, request.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, request.Method, retrievedRequest.Method)
	assert.Equal(t, request.Path, retrievedRequest.Path)
	assert.Equal(t, request.IP, retrievedRequest.IP)

	// Request 업데이트 테스트
	updatedMethod := "PUT"
	result = db.Model(&retrievedRequest).Update("method", updatedMethod)
	assert.NoError(t, result.Error)

	// 업데이트 확인
	var updatedRequest Request
	result = db.First(&updatedRequest, request.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, updatedMethod, updatedRequest.Method)
}

func TestTCPConnectionModel(t *testing.T) {
	db := setupTestDB()

	// TCPConnection 생성 테스트
	connection := TCPConnection{
		ServerName: "test-server",
		Address:    "localhost:8080",
		Status:     "connected",
	}

	result := db.Create(&connection)
	assert.NoError(t, result.Error)
	assert.NotZero(t, connection.ID)
	assert.NotZero(t, connection.CreatedAt)

	// TCPConnection 조회 테스트
	var retrievedConnection TCPConnection
	result = db.First(&retrievedConnection, connection.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, connection.ServerName, retrievedConnection.ServerName)
	assert.Equal(t, connection.Address, retrievedConnection.Address)
	assert.Equal(t, connection.Status, retrievedConnection.Status)
}

func TestTCPServerModel(t *testing.T) {
	db := setupTestDB()

	// TCPServer 생성 테스트
	server := TCPServer{
		Name:    "test-server",
		Address: "localhost:9000",
		Status:  "active",
	}

	result := db.Create(&server)
	assert.NoError(t, result.Error)
	assert.NotZero(t, server.ID)

	// TCPServer 조회 테스트
	var retrievedServer TCPServer
	result = db.First(&retrievedServer, server.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, server.Name, retrievedServer.Name)
	assert.Equal(t, server.Address, retrievedServer.Address)
	assert.Equal(t, server.Status, retrievedServer.Status)
}

func TestTCPPacketModel(t *testing.T) {
	db := setupTestDB()

	// TCPPacket 생성을 위한 관련 데이터 먼저 생성
	request := Request{
		Method: "GET",
		Path:   "/test",
		IP:     "127.0.0.1",
	}
	db.Create(&request)

	connection := TCPConnection{
		ServerName: "test-server",
		Address:    "localhost:8080",
		Status:     "connected",
	}
	db.Create(&connection)

	// TCPPacket 생성 테스트
	packet := TCPPacket{
		RequestID:      request.ID,
		ConnectionID:   connection.ID,
		Direction:      "outbound",
		Data:           "test packet data",
		Size:           len("test packet data"),
		ProcessingTime: 100,
	}

	result := db.Create(&packet)
	assert.NoError(t, result.Error)
	assert.NotZero(t, packet.ID)
	assert.NotZero(t, packet.CreatedAt)

	// TCPPacket 조회 테스트 (관계 포함)
	var retrievedPacket TCPPacket
	result = db.Preload("Request").Preload("Connection").First(&retrievedPacket, packet.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, packet.Direction, retrievedPacket.Direction)
	assert.Equal(t, packet.Data, retrievedPacket.Data)
	assert.Equal(t, packet.Size, retrievedPacket.Size)
	assert.NotNil(t, retrievedPacket.Request)
	assert.NotNil(t, retrievedPacket.Connection)
}

func TestModelRelationships(t *testing.T) {
	db := setupTestDB()

	// Request와 TCPPacket 관계 테스트
	request := Request{
		Method: "POST",
		Path:   "/api/data",
		Body:   "test data",
		IP:     "192.168.1.100",
	}
	db.Create(&request)

	connection := TCPConnection{
		ServerName: "data-server",
		Address:    "localhost:8081",
		Status:     "connected",
	}
	db.Create(&connection)

	// 여러 패킷 생성
	packets := []TCPPacket{
		{
			RequestID:    request.ID,
			ConnectionID: connection.ID,
			Direction:    "outbound",
			Data:         "packet 1",
			Size:         8,
		},
		{
			RequestID:    request.ID,
			ConnectionID: connection.ID,
			Direction:    "inbound",
			Data:         "packet 2",
			Size:         8,
		},
	}

	for _, packet := range packets {
		db.Create(&packet)
	}

	// Request와 관련된 TCPPacket들 조회
	var requestWithPackets Request
	result := db.Preload("TCPRequests").First(&requestWithPackets, request.ID)
	assert.NoError(t, result.Error)
	assert.Len(t, requestWithPackets.TCPRequests, 2)
}

func TestTimestamps(t *testing.T) {
	db := setupTestDB()

	request := Request{
		Method: "GET",
		Path:   "/timestamp-test",
		IP:     "127.0.0.1",
	}

	beforeCreate := time.Now()
	result := db.Create(&request)
	afterCreate := time.Now()

	assert.NoError(t, result.Error)
	assert.True(t, request.CreatedAt.After(beforeCreate))
	assert.True(t, request.CreatedAt.Before(afterCreate))
	assert.True(t, request.UpdatedAt.After(beforeCreate))
	assert.True(t, request.UpdatedAt.Before(afterCreate))
}

func TestModelValidation(t *testing.T) {
	db := setupTestDB()

	// 필수 필드가 비어있는 경우 테스트
	request := Request{
		Method: "", // 비어있는 필드
		Path:   "/test",
		IP:     "127.0.0.1",
	}

	result := db.Create(&request)
	// 현재는 기본적인 검증만 수행 (실제 검증 로직이 있다면 에러 확인)
	assert.NoError(t, result.Error)
}
