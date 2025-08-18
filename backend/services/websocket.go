package services

import (
	"github.com/gorilla/websocket"
	"sync"
)

// WebSocketHub manages active WebSocket clients and broadcasts messages.
type WebSocketHub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]bool
}

// NewWebSocketHub creates a new WebSocketHub instance.
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{clients: make(map[*websocket.Conn]bool)}
}

// Add registers a new client connection.
func (h *WebSocketHub) Add(conn *websocket.Conn) {
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()
}

// Remove unregisters a client connection.
func (h *WebSocketHub) Remove(conn *websocket.Conn) {
	h.mu.Lock()
	if _, ok := h.clients[conn]; ok {
		delete(h.clients, conn)
		conn.Close()
	}
	h.mu.Unlock()
}

// Broadcast sends the given message to all connected clients.
func (h *WebSocketHub) Broadcast(msg interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for conn := range h.clients {
		conn.WriteJSON(msg)
	}
}
