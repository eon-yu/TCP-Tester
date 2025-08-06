package handlers

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"github.com/fake-edge-server/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net"
	"net/http"
	"sort"
	"strconv"
)

// TCPPacketHandler는 TCP 패킷 관리를 위한 핸들러 구조체입니다.
type TCPPacketHandler struct {
	DB *gorm.DB
}

// NewTCPPacketHandler는 새로운 TCPPacketHandler 인스턴스를 생성합니다.
func NewTCPPacketHandler(db *gorm.DB) *TCPPacketHandler {
	return &TCPPacketHandler{
		DB: db,
	}
}

// CreateTCPPacket는 새로운 TCP 패킷을 생성합니다.
func (h *TCPPacketHandler) CreateTCPPacket(c *gin.Context) {
	var packet models.TCPPacket
	serverID := c.Param("id")

	if err := c.ShouldBindJSON(&packet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청 형식: " + err.Error()})
		return
	}

	// TCP 서버 ID 설정
	servIDInt, err := strconv.Atoi(serverID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효하지 않은 서버 ID: " + err.Error()})
		return
	}
	packet.TCPServerID = uint(servIDInt)

	if err := validatePacketData(packet.Data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := h.DB.Create(&packet)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "패킷 생성 실패: " + result.Error.Error()})
		return
	}

	// 생성된 패킷을 다시 조회하여 모든 필드 확인
	var createdPacket models.TCPPacket
	h.DB.First(&createdPacket, packet.ID)
	c.JSON(http.StatusCreated, createdPacket)
}

// GetTCPPackets는 특정 TCP 서버에 대한 모든 패킷을 조회합니다.
func (h *TCPPacketHandler) GetTCPPackets(c *gin.Context) {
	serverID := c.Param("id")

	var packets []models.TCPPacket
	result := h.DB.Where("tcp_server_id = ?", serverID).Find(&packets)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "패킷 조회 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, packets)
}

// GetTCPPacketByID는 특정 TCP 패킷을 ID로 조회합니다.
func (h *TCPPacketHandler) GetTCPPacketByID(c *gin.Context) {
	packetID := c.Param("packet_id")

	var packet models.TCPPacket
	result := h.DB.First(&packet, packetID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "패킷을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, packet)
}

// UpdateTCPPacket는 기존 TCP 패킷을 업데이트합니다.
func (h *TCPPacketHandler) UpdateTCPPacket(c *gin.Context) {
	packetID := c.Param("packet_id")

	var packet models.TCPPacket
	result := h.DB.First(&packet, packetID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "패킷을 찾을 수 없습니다"})
		return
	}

	var updatedPacket models.TCPPacket
	if err := c.ShouldBindJSON(&updatedPacket); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청 형식: " + err.Error()})
		return
	}

	// 업데이트할 필드 설정
	packet.Data = updatedPacket.Data
	packet.Desc = updatedPacket.Desc

	if err := validatePacketData(packet.Data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result = h.DB.Save(&packet)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "패킷 업데이트 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, packet)
}

// DeleteTCPPacket는 TCP 패킷을 삭제합니다.
func (h *TCPPacketHandler) DeleteTCPPacket(c *gin.Context) {
	packetID := c.Param("packet_id")

	var packet models.TCPPacket
	result := h.DB.First(&packet, packetID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "패킷을 찾을 수 없습니다"})
		return
	}

	result = h.DB.Delete(&packet)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "패킷 삭제 실패: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "패킷이 성공적으로 삭제되었습니다"})
}

// SendTCPPacket은 TCP 패킷을 지정된 서버로 전송합니다.
func (h *TCPPacketHandler) SendTCPPacket(c *gin.Context) {
	packetID := c.Param("packet_id")
	serverID := c.Param("id")

	// 패킷 데이터 조회
	var packet models.TCPPacket
	result := h.DB.First(&packet, packetID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "패킷을 찾을 수 없습니다"})
		return
	}

	// 서버 정보 조회
	var server models.TCPServer
	result = h.DB.First(&server, serverID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "서버를 찾을 수 없습니다"})
		return
	}

	// 패킷 데이터를 바이트 배열로 변환
	data := packetDataToBytes(packet.Data)

	// TCP 연결 설정
	addr := fmt.Sprintf("%s:%d", server.Host, server.Port)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "TCP 연결 실패: " + err.Error()})
		return
	}
	defer conn.Close()

	// 데이터 전송
	_, err = conn.Write(data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "데이터 전송 실패: " + err.Error()})
		return
	}

	// 응답 수신
	buffer := make([]byte, 4096)
	n, err := conn.Read(buffer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "응답 수신 실패: " + err.Error()})
		return
	}

	// 응답 처리
	response := buffer[:n]
	c.JSON(http.StatusOK, gin.H{
		"message":       "패킷이 성공적으로 전송되었습니다",
		"response":      hex.EncodeToString(response),
		"response_text": string(response),
	})
}

// validatePacketData는 체인된 데이터의 길이가 타입 크기와 일치하는지 검증합니다.
func validatePacketData(data models.PacketData) error {
	// 오프셋 기준으로 정렬
	sort.Slice(data, func(i, j int) bool { return data[i].Offset < data[j].Offset })

	for i := 0; i < len(data); {
		item := data[i]
		if item.IsChained {
			j := i
			for j+1 < len(data) && data[j+1].IsChained && data[j+1].Offset == data[j].Offset+1 {
				j++
			}
			group := data[i : j+1]
			expected := item.Type.Size()
			if expected > 0 && len(group) != expected {
				return fmt.Errorf("offset %d: 체인된 길이가 %d바이트가 아닙니다", item.Offset, expected)
			}
			i = j + 1
		} else {
			i++
		}
	}
	return nil
}

// packetDataToBytes는 패킷 데이터를 바이트 배열로 변환합니다.
func packetDataToBytes(data models.PacketData) []byte {
	// 마지막 오프셋 찾기
	var maxOffset int
	for _, item := range data {
		if item.Offset > maxOffset {
			maxOffset = item.Offset
		}
	}

	// 충분한 크기의 바이트 배열 생성
	result := make([]byte, maxOffset+1)

	// 데이터 채우기
	for _, item := range data {
		result[item.Offset] = byte(item.Value)
	}

	return result
}

// ParseChainedValues는 연결된 값을 타입에 따라 파싱합니다.
func ParseChainedValues(dataType models.DataType, values []byte) (string, error) {
	buf := bytes.NewBuffer(values)

	switch dataType {
	case models.TypeInt8:
		var v int8
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.Itoa(int(v)), err

	case models.TypeInt16:
		var v int16
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.Itoa(int(v)), err

	case models.TypeInt32:
		var v int32
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.Itoa(int(v)), err

	case models.TypeInt64:
		var v int64
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.FormatInt(v, 10), err

	case models.TypeUint8:
		var v uint8
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.FormatUint(uint64(v), 10), err

	case models.TypeUint16:
		var v uint16
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.FormatUint(uint64(v), 10), err

	case models.TypeUint32:
		var v uint32
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.FormatUint(uint64(v), 10), err

	case models.TypeUint64:
		var v uint64
		err := binary.Read(buf, binary.LittleEndian, &v)
		return strconv.FormatUint(v, 10), err

	case models.TypeFloat32:
		var v float32
		err := binary.Read(buf, binary.LittleEndian, &v)
		return fmt.Sprintf("%f", v), err

	case models.TypeFloat64:
		var v float64
		err := binary.Read(buf, binary.LittleEndian, &v)
		return fmt.Sprintf("%f", v), err

	case models.TypeString:
		return string(values), nil

	case models.TypeHex:
		return hex.EncodeToString(values), nil

	default:
		return "", fmt.Errorf("지원되지 않는 데이터 타입: %d", dataType)
	}
}
