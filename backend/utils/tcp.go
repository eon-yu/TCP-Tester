package utils

import (
	"encoding/binary"
	"fmt"
	"net"
	"strconv"
	"strings"
)

const (
	MagicHeader        uint32 = 0xABCD1234
	HeaderSize                = 12 // 4 bytes magic + 4 bytes length + 4 bytes crc
	EdgeMsgStartOffset        = 1
	EdgeMsgEndOffset          = 9
	EdgePayloadOffset         = EdgeMsgEndOffset
	EdgeIdOffset              = 0
)

func GetLocalIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok &&
			!ipnet.IP.IsLoopback() &&
			ipnet.IP.To4() != nil {
			return ipnet.IP.String(), nil
		}
	}
	return "", fmt.Errorf("로컬 IP 찾기 실패")
}

func CompareIP(ip1, ip2 string) int {
	parts1 := strings.Split(ip1, ".")
	parts2 := strings.Split(ip2, ".")
	for i := 0; i < 4; i++ {
		if parts1[i] > parts2[i] {
			return 1
		} else if parts1[i] < parts2[i] {
			return -1
		}
	}
	port1, _ := strconv.Atoi(strings.Split(ip1, ":")[1])
	port2, _ := strconv.Atoi(strings.Split(ip2, ":")[1])
	return comparePort(port1, port2)
}

func comparePort(port1, port2 int) int {
	if port1 > port2 {
		return 1
	}
	return -1
}

func GenerateAddr(host string, port int) string {
	return host + ":" + strconv.Itoa(port)
}

func BuildPacket(payload []byte) []byte {
	length := uint32(len(payload))
	crc := FastCRC32(payload)
	buf := make([]byte, HeaderSize+len(payload))
	binary.LittleEndian.PutUint32(buf[0:4], MagicHeader)
	binary.LittleEndian.PutUint32(buf[4:8], length)
	binary.LittleEndian.PutUint32(buf[8:12], crc)
	copy(buf[12:], payload)
	return buf
}

// UnpackPacket for Tests
func UnpackPacket(buf []byte) ([]byte, error) {
	if len(buf) < HeaderSize {
		return nil, fmt.Errorf("패킷 길이 부족")
	}

	// 1. magic 확인
	if binary.LittleEndian.Uint32(buf[0:4]) != MagicHeader {
		return nil, fmt.Errorf("magic 불일치")
	}

	// 2. 길이 읽기
	length := binary.LittleEndian.Uint32(buf[4:8])
	if len(buf) < int(HeaderSize+length) {
		return nil, fmt.Errorf("전체 패킷 미도착")
	}

	// 3. CRC 확인
	expectedCRC := binary.LittleEndian.Uint32(buf[8:12])
	payload := buf[12 : 12+length]
	actualCRC := FastCRC32(payload)
	if actualCRC != expectedCRC {
		return nil, fmt.Errorf("CRC 불일치: 기대 %x, 실제 %x", expectedCRC, actualCRC)
	}

	return payload, nil
}
