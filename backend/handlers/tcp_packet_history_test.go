package handlers

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/fake-edge-server/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func setupPacketRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	handler := NewTCPPacketHandler(db)
	tc := r.Group("/api/tcp")
	{
		tc.POST("/:id/packets/:packet_id/send", handler.SendTCPPacket)
		tc.GET("/:id/history", handler.GetTCPPacketHistory)
	}
	return r
}

func TestSendTCPPacketStoresHistory(t *testing.T) {
	db := setupTestDB()
	router := setupPacketRouter(db)

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	assert.NoError(t, err)
	defer ln.Close()
	go func() {
		conn, _ := ln.Accept()
		buf := make([]byte, 1024)
		n, _ := conn.Read(buf)
		conn.Write(buf[:n])
		conn.Close()
	}()

	addr := ln.Addr().(*net.TCPAddr)
	server := models.TCPServer{Name: "test", Host: "127.0.0.1", Port: addr.Port}
	db.Create(&server)
	packet := models.TCPPacket{TCPServerID: server.ID, Data: models.PacketData{{Offset: 0, Value: 1, Type: models.TypeUint8}}}
	db.Create(&packet)

	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/tcp/%d/packets/%d/send", server.ID, packet.ID), nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusOK, resp.Code)

	var history models.TCPPacketHistory
	err = json.Unmarshal(resp.Body.Bytes(), &history)
	assert.NoError(t, err)
	assert.Equal(t, "01", history.Request)
	assert.Equal(t, "01", history.Response)

	var count int64
	db.Model(&models.TCPPacketHistory{}).Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestGetTCPPacketHistory(t *testing.T) {
	db := setupTestDB()
	router := setupPacketRouter(db)

	server := models.TCPServer{Name: "test", Host: "127.0.0.1", Port: 1234}
	db.Create(&server)
	packet := models.TCPPacket{TCPServerID: server.ID, Data: models.PacketData{{Offset: 0, Value: 1, Type: models.TypeUint8}}}
	db.Create(&packet)
	hist := models.TCPPacketHistory{TCPServerID: server.ID, TCPPacketID: packet.ID, Request: "01", Response: "02"}
	db.Create(&hist)

	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/tcp/%d/history", server.ID), nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusOK, resp.Code)

	var histories []models.TCPPacketHistory
	err := json.Unmarshal(resp.Body.Bytes(), &histories)
	assert.NoError(t, err)
	assert.Len(t, histories, 1)
	assert.Equal(t, "01", histories[0].Request)
}
