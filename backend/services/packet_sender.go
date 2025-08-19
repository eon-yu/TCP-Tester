package services

import (
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/fake-edge-server/models"
	"github.com/fake-edge-server/utils"
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
func (p *PacketSender) SendOnce(server models.TCPServer, packet models.TCPPacket) error {
	data := packetDataToBytes(packet.Data)
	return p.sendOnce(server, packet, data)
}

func (p *PacketSender) sendOnce(server models.TCPServer, packet models.TCPPacket, data []byte) error {
	conn := p.connManager.GetConn(server.ID)
	if conn == nil {
		err := p.connManager.Connect(server.ID, server.Host, server.Port)
		if err != nil {
			return err
		}
		conn = p.connManager.GetConn(server.ID)
	}

	sendData := data
	if packet.UseCRC {
		sendData = utils.BuildPacket(data)
	}
	if _, err := conn.Write(sendData); err != nil {
		return err
	}

	buf := make([]byte, 4096)
	go func() {
		for {
			n, err := conn.Read(buf)
			if err != nil {
				log.Print(err)
				return
			}
			responseData := buf[:n]
			var response []byte
			if packet.UseCRC {
				response, err = utils.UnpackPacket(responseData)
				if err != nil {
					log.Print(err)
					return
				}
			} else {
				response = responseData
			}
			reqHex := hex.EncodeToString(data)
			respHex := hex.EncodeToString(response)
			history := models.TCPPacketHistory{
				TCPServerID: server.ID,
				TCPPacketID: packet.ID,
				PacketName:  packet.Name,
				PacketDesc:  packet.Desc,
				Request:     reqHex,
				Response:    respHex,
			}
			if err := p.db.Create(&history).Error; err != nil {
				log.Fatal(err)
			}
			// broadcast response via websocket
			p.hub.Broadcast(map[string]interface{}{
				"type":        "response",
				"server_id":   server.ID,
				"packet_id":   packet.ID,
				"packet_name": packet.Name,
				"packet_desc": packet.Desc,
				"request":     reqHex,
				"response":    respHex,
			})
			log.Printf("Success to send Server[%d] packet %d", packet.TCPServerID, packet.ID)
			return
		}
	}()
	return nil
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
