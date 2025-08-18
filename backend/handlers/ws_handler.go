package handlers

import (
	"net/http"

	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WSHandler handles WebSocket upgrade requests.
type WSHandler struct {
	Hub *services.WebSocketHub
}

// NewWSHandler creates a new WSHandler.
func NewWSHandler(hub *services.WebSocketHub) *WSHandler {
	return &WSHandler{Hub: hub}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Handle upgrades the connection and registers the client.
func (h *WSHandler) Handle(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.Hub.Add(conn)
}
