package config

import "testing"

func TestGetConfig(t *testing.T) {
    LoadConfig()
    cfg := GetConfig()
    if cfg == nil {
        t.Fatal("config should not be nil")
    }
    if cfg.ServerPort == "" || cfg.DBPath == "" {
        t.Fatalf("invalid config values: %#v", cfg)
    }
}

