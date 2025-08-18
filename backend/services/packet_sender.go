package services

import (
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/fake-edge-server/models"
	"gorm.io/gorm"
)

// PacketSender manages background packet sending jobs.
type PacketSender struct {
	mu          sync.Mutex
	jobs        map[string]chan struct{}
	connManager *TCPConnectionManager
	hub         *WebSocketHub
	db          *gorm.DB
}

// NewPacketSender creates a new PacketSender.
func NewPacketSender(db *gorm.DB, cm *TCPConnectionManager, hub *WebSocketHub) *PacketSender {
	return &PacketSender{
		jobs:        make(map[string]chan struct{}),
		connManager: cm,
		hub:         hub,
		db:          db,
	}
}

func jobKey(serverID, packetID uint) string {
	return fmt.Sprintf("%d:%d", serverID, packetID)
}

// Start begins sending the packet repeatedly at the given interval.
func (p *PacketSender) Start(server models.TCPServer, packet models.TCPPacket, interval time.Duration) {
	key := jobKey(server.ID, packet.ID)
	p.mu.Lock()
	if _, exists := p.jobs[key]; exists {
		p.mu.Unlock()
		return
	}
	stop := make(chan struct{})
	p.jobs[key] = stop
	p.mu.Unlock()

	data := packetDataToBytes(packet.Data)
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				p.sendOnce(server, packet, data)
			case <-stop:
				return
			}
		}
	}()
}

// Stop terminates the background sending job.
func (p *PacketSender) Stop(serverID, packetID uint) {
	key := jobKey(serverID, packetID)
	p.mu.Lock()
	if ch, ok := p.jobs[key]; ok {
		close(ch)
		delete(p.jobs, key)
	}
	p.mu.Unlock()
}

// SendOnce sends the packet a single time and stores the history.
func (p *PacketSender) SendOnce(server models.TCPServer, packet models.TCPPacket) (*models.TCPPacketHistory, error) {
	data := packetDataToBytes(packet.Data)
	return p.sendOnce(server, packet, data)
}

func (p *PacketSender) sendOnce(server models.TCPServer, packet models.TCPPacket, data []byte) (*models.TCPPacketHistory, error) {
	conn := p.connManager.GetConn(server.ID)
	if conn == nil {
		return nil, fmt.Errorf("TCP 연결 실패: 연결이 없습니다")
	}
	if _, err := conn.Write(data); err != nil {
		return nil, err
	}
	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, err
	}
	response := buf[:n]
	reqHex := hex.EncodeToString(data)
	respHex := hex.EncodeToString(response)
	history := models.TCPPacketHistory{
		TCPServerID: server.ID,
		TCPPacketID: packet.ID,
		Request:     reqHex,
		Response:    respHex,
	}
	if err := p.db.Create(&history).Error; err != nil {
		return nil, err
	}
	// broadcast response via websocket
	p.hub.Broadcast(map[string]interface{}{
		"type":      "response",
		"server_id": server.ID,
		"packet_id": packet.ID,
		"request":   reqHex,
		"response":  respHex,
	})
	return &history, nil
}

// packetDataToBytes converts packet data to a byte slice.
func packetDataToBytes(data models.PacketData) []byte {
	var maxOffset int
	for _, item := range data {
		if item.Offset > maxOffset {
			maxOffset = item.Offset
		}
	}
	result := make([]byte, maxOffset+1)
	for _, item := range data {
		result[item.Offset] = byte(item.Value)
	}
	return result
}
