package models

import (
	"gorm.io/gorm"
)

// TCPServer는 TCP 서버 연결 정보를 저장하는 모델입니다.
type TCPServer struct {
	gorm.Model
	Id   uint64 `json:"id" gorm:"primaryKey;autoIncrement:true"`
	Name string `json:"name" gorm:"uniqueIndex"`
	Host string `json:"host"`
	Port int    `json:"port"`
}

// TCPServerRequest는 TCP 서버 생성/수정 요청 구조체입니다.
type TCPServerRequest struct {
	Name string `json:"name" binding:"required"`
	Host string `json:"host" binding:"required"`
	Port int    `json:"port" binding:"required"`
}
