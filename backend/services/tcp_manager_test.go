package services

import (
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestTCPConnectionManager(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	assert.NoError(t, err)
	defer ln.Close()

	mgr := NewTCPConnectionManager()

	port := ln.Addr().(*net.TCPAddr).Port
	acceptCh := make(chan net.Conn)
	go func() {
		conn, _ := ln.Accept()
		acceptCh <- conn
	}()

	err = mgr.Connect(1, "127.0.0.1", port)
	assert.NoError(t, err)
	serverConn := <-acceptCh
	assert.Equal(t, "Alive", mgr.GetStatus(1))

	mgr.Disconnect(1)
	assert.Equal(t, "Wait", mgr.GetStatus(1))

	go func() {
		conn, _ := ln.Accept()
		acceptCh <- conn
	}()
	err = mgr.Connect(1, "127.0.0.1", port)
	assert.NoError(t, err)
	serverConn = <-acceptCh
	assert.Equal(t, "Alive", mgr.GetStatus(1))

	serverConn.Close()
	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, "Dead", mgr.GetStatus(1))
}
