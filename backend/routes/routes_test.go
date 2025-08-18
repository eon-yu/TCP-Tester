package routes

import (
    "testing"

    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func TestPacketRoutes(t *testing.T) {
    gin.SetMode(gin.TestMode)
    r := gin.New()
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    if err != nil {
        t.Fatalf("db open: %v", err)
    }
    SetupRoutes(r, db)
    paths := map[string]bool{}
    for _, rt := range r.Routes() {
        paths[rt.Path] = true
    }
    want := []string{
        "/api/tcp/:id/packets/:packet_id",
        "/api/tcp/:id/packets/:packet_id/data",
    }
    for _, p := range want {
        if !paths[p] {
            t.Fatalf("expected route %s", p)
        }
    }
}

