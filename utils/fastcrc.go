package utils

import (
	"hash"
	"hash/crc32"
	"sync"
)

var crc32Table = crc32.MakeTable(crc32.IEEE)
var crc32Pool = sync.Pool{
	New: func() interface{} {
		return crc32.New(crc32Table)
	},
}

// FastCRC32 는 풀링된 해시 객체를 사용하여 CRC32 계산 속도 향상
func FastCRC32(data []byte) uint32 {
	// hash.Hash32 인터페이스로 변환
	h := crc32Pool.Get().(hash.Hash32)
	h.Reset()
	h.Write(data)
	crc := h.Sum32()
	crc32Pool.Put(h)
	return crc
}
