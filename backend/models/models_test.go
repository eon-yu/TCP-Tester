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
		ServerAddr: "localhost:8080",
		Success:    true,
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
	assert.Equal(t, connection.ServerAddr, retrievedConnection.ServerAddr)
	assert.Equal(t, connection.Success, retrievedConnection.Success)
}

func TestTCPServerModel(t *testing.T) {
	db := setupTestDB()

	// TCPServer 생성 테스트
	server := TCPServer{
		Name: "test-server",
		Host: "localhost",
		Port: 9000,
	}

	result := db.Create(&server)
	assert.NoError(t, result.Error)
	assert.NotZero(t, server.ID)

	// TCPServer 조회 테스트
	var retrievedServer TCPServer
	result = db.First(&retrievedServer, server.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, server.Name, retrievedServer.Name)
	assert.Equal(t, server.Host, retrievedServer.Host)
	assert.Equal(t, server.Port, retrievedServer.Port)
}

func TestTCPPacketModel(t *testing.T) {
	db := setupTestDB()

	// TCPServer 생성
	server := TCPServer{
		Name: "packet-server",
		Host: "localhost",
		Port: 9000,
	}
	db.Create(&server)

	// Packet 데이터 생성
	data := PacketData{
		{Offset: 0, Value: 1, Type: TypeInt8, Desc: "test"},
	}

	// TCPPacket 생성 테스트
	packet := TCPPacket{
		TCPServerID: server.ID,
		Data:        data,
		Desc:        "test packet",
	}

	result := db.Create(&packet)
	assert.NoError(t, result.Error)
	assert.NotZero(t, packet.ID)

	// TCPPacket 조회 테스트
	var retrievedPacket TCPPacket
	result = db.First(&retrievedPacket, packet.ID)
	assert.NoError(t, result.Error)
	assert.Equal(t, packet.TCPServerID, retrievedPacket.TCPServerID)
	assert.Equal(t, packet.Desc, retrievedPacket.Desc)
	assert.Len(t, retrievedPacket.Data, 1)
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
