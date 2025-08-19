package services

import (
	"fmt"
	"net"
	"sync"
	"time"
)

// TCPConnectionManager manages persistent TCP connections keyed by ID.
type TCPConnectionManager struct {
	mu     sync.Mutex
	conns  map[uint]net.Conn
	status map[uint]string
}

// NewTCPConnectionManager creates a new TCPConnectionManager instance.
func NewTCPConnectionManager() *TCPConnectionManager {
	return &TCPConnectionManager{
		conns:  make(map[uint]net.Conn),
		status: make(map[uint]string),
	}
}

// Connect establishes a TCP connection for the given id and stores it.
// No timeouts or deadlines are set; the connection remains until Stop is called.
func (m *TCPConnectionManager) Connect(id uint, host string, port int) error {
	addr := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		m.mu.Lock()
		m.status[id] = "Dead"
		m.mu.Unlock()
		return err
	}

	m.mu.Lock()
	if old, ok := m.conns[id]; ok {
		old.Close()
	}
	m.conns[id] = conn
	m.status[id] = "Alive"
	m.mu.Unlock()

	go m.monitor(id, conn)
	return nil
}

// monitor waits for the connection to be closed and marks it as Dead.
func (m *TCPConnectionManager) monitor(id uint, conn net.Conn) {
	buf := make([]byte, 1)
	for {
		time.Sleep(10 * time.Millisecond)
		_, err := conn.Read(buf)
		if err != nil {
			m.mu.Lock()
			conn.Close()
			delete(m.conns, id)
			m.status[id] = "Dead"
			m.mu.Unlock()
			return
		}
	}
}

// Disconnect closes and removes the connection for the given id and sets status to Wait.
func (m *TCPConnectionManager) Disconnect(id uint) {
	m.mu.Lock()
	if conn, ok := m.conns[id]; ok {
		conn.Close()
		delete(m.conns, id)
	}
	m.status[id] = "Wait"
	m.mu.Unlock()
}

// MarkDead forcibly marks the connection as Dead and closes it if present.
func (m *TCPConnectionManager) MarkDead(id uint) {
	m.mu.Lock()
	if conn, ok := m.conns[id]; ok {
		conn.Close()
		delete(m.conns, id)
	}
	m.status[id] = "Dead"
	m.mu.Unlock()
}

// GetStatus returns the current status for the given id.
// If no status is recorded, it returns "Wait" by default.
func (m *TCPConnectionManager) GetStatus(id uint) string {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s, ok := m.status[id]; ok {
		return s
	}
	return "Wait"
}

func (m *TCPConnectionManager) GetConn(id uint) net.Conn {
	m.mu.Lock()
	defer m.mu.Unlock()
	if conn, ok := m.conns[id]; ok {
		return conn
	}
	return nil
}
