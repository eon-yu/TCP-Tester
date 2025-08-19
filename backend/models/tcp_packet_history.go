package models

import (
	"gorm.io/gorm"
	"time"
)

// TCPPacketHistory stores request/response pairs for sent packets.
type TCPPacketHistory struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TCPServerID uint           `json:"tcp_server_id"`
	TCPPacketID uint           `json:"tcp_packet_id"`
	PacketName  string         `json:"packet_name"`
	PacketDesc  string         `json:"packet_desc"`
	Request     string         `json:"request" gorm:"type:text"`
	Response    string         `json:"response" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
