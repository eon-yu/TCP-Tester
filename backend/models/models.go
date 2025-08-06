package models

import (
	"time"

	"gorm.io/gorm"
)

// Request는 HTTP 요청 데이터를 저장하는 모델입니다.
type Request struct {
	gorm.Model
	Id          uint64          `json:"id" gorm:"primaryKey;autoIncrement:true"`
	Method      string          `json:"method"`
	Path        string          `json:"path"`
	Headers     string          `json:"headers"`
	Body        string          `json:"body"`
	IP          string          `json:"ip"`
	CreatedAt   time.Time       `json:"created_at"`
	TCPRequests []TCPConnection `json:"tcp_requests" gorm:"foreignKey:RequestID"`
}

// TCPConnection은 외부 TCP 서버와의 통신 정보를 저장하는 모델입니다.
type TCPConnection struct {
	gorm.Model
	Id           uint64    `json:"id" gorm:"primaryKey;autoIncrement:true"`
	RequestID    uint      `json:"request_id"`
	ServerName   string    `json:"server_name"`
	ServerAddr   string    `json:"server_addr"`
	SentData     string    `json:"sent_data"`
	ReceivedData string    `json:"received_data"`
	Success      bool      `json:"success"`
	Error        string    `json:"error"`
	CreatedAt    time.Time `json:"created_at"`
}
