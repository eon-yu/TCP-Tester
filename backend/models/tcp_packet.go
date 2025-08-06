package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// DataType은 패킷 데이터 타입을 정의합니다.
type DataType int

const (
	TypeInt8 DataType = iota
	TypeInt16
	TypeInt32
	TypeInt64
	TypeUint8
	TypeUint16
	TypeUint32
	TypeUint64
	TypeFloat32
	TypeFloat64
	TypeString
	TypeHex
)

// Size는 각 데이터 타입이 차지하는 바이트 수를 반환합니다.
// 문자열과 HEX 타입은 가변 길이이므로 0을 반환합니다.
func (dt DataType) Size() int {
	switch dt {
	case TypeInt8, TypeUint8:
		return 1
	case TypeInt16, TypeUint16:
		return 2
	case TypeInt32, TypeUint32, TypeFloat32:
		return 4
	case TypeInt64, TypeUint64, TypeFloat64:
		return 8
	default:
		return 0
	}
}

// PacketDataItem은 패킷의 개별 데이터 항목을 나타냅니다.
type PacketDataItem struct {
        Offset    int      `json:"offset"`
       Value     int      `json:"value"`
        Type      DataType `json:"type"`
        IsChained bool     `json:"is_chained"`
        Desc      string   `json:"desc"`
}

// PacketData는 패킷 데이터 항목의 배열입니다.
type PacketData []PacketDataItem

// Value는 GORM을 위한 driver.Value 인터페이스를 구현합니다.
func (pd PacketData) Value() (driver.Value, error) {
	if pd == nil {
		return nil, nil
	}
	return json.Marshal(pd)
}

// Scan은 GORM을 위한 sql.Scanner 인터페이스를 구현합니다.
func (pd *PacketData) Scan(value interface{}) error {
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("패킷 데이터를 스캔할 수 없음")
	}

	if len(bytes) == 0 {
		*pd = PacketData{}
		return nil
	}

	return json.Unmarshal(bytes, pd)
}

// TCPPacket은 TCP 패킷 모델을 정의합니다.
type TCPPacket struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TCPServerID uint           `json:"tcp_server_id"`
	Data        PacketData     `json:"data" gorm:"type:text"`
	Desc        string         `json:"desc"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
