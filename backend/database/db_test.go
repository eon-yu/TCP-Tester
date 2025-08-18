package database

import (
    "testing"
    "github.com/fake-edge-server/config"
    "github.com/fake-edge-server/models"
)

func TestInitDB(t *testing.T) {
    cfg := config.GetConfig()
    cfg.DBPath = ":memory:"
    db, err := InitDB()
    if err != nil {
        t.Fatalf("InitDB failed: %v", err)
    }
    if !db.Migrator().HasTable(&models.Request{}) {
        t.Fatal("Request table not created")
    }
}

