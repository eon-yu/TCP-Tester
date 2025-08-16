package database

import (
	"github.com/fake-edge-server/config"
	"github.com/fake-edge-server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// InitDB는 데이터베이스 연결을 초기화하고 마이그레이션을 수행합니다.
func InitDB() (*gorm.DB, error) {
	cfg := config.GetConfig()
	db, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// 마이그레이션
	err = db.AutoMigrate(
		&models.Request{},
		&models.TCPConnection{},
		&models.TCPServer{},
		&models.TCPPacket{},
		&models.TCPPacketHistory{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}
