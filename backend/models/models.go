package models

import (
	"time"

	"gorm.io/gorm"
)

// Request는 HTTP 요청 데이터를 저장하는 모델입니다.
type Request struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	Method      string          `json:"method"`
	Path        string          `json:"path"`
	Headers     string          `json:"headers"`
	Body        string          `json:"body"`
	IP          string          `json:"ip"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt  `json:"deleted_at" gorm:"index"`
	TCPRequests []TCPConnection `json:"tcp_requests" gorm:"foreignKey:RequestID"`
}

// TCPConnection은 외부 TCP 서버와의 통신 정보를 저장하는 모델입니다.
type TCPConnection struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	RequestID    uint           `json:"request_id"`
	ServerName   string         `json:"server_name"`
	ServerAddr   string         `json:"server_addr"`
	SentData     string         `json:"sent_data"`
	ReceivedData string         `json:"received_data"`
	Success      bool           `json:"success"`
	Error        string         `json:"error"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
