package config

import (
	"encoding/json"
	"log"
	"os"
	"sync"
)

type Config struct {
	ServerPort string `json:"server_port"`
	DBPath     string `json:"db_path"`
	TCPServers []struct {
		Name    string `json:"name"`
		Address string `json:"address"`
		Port    string `json:"port"`
	} `json:"tcp_servers"`
}

var (
	config     *Config
	configOnce sync.Once
)

// LoadConfig는 config.json 파일에서 설정을 로드합니다.
func LoadConfig() {
	configOnce.Do(func() {
		// 기본 설정
		config = &Config{
			ServerPort: "8080",
			DBPath:     "./data.db",
			TCPServers: []struct {
				Name    string `json:"name"`
				Address string `json:"address"`
				Port    string `json:"port"`
			}{
				{
					Name:    "default-server",
					Address: "127.0.0.1",
					Port:    "9000",
				},
			},
		}

		// 설정 파일이 존재하는지 확인
		if _, err := os.Stat("config.json"); os.IsNotExist(err) {
			// 설정 파일이 없으면 기본 설정으로 새 파일 생성
			data, err := json.MarshalIndent(config, "", "  ")
			if err != nil {
				log.Fatalf("설정 마샬링 실패: %v", err)
			}

			err = os.WriteFile("config.json", data, 0644)
			if err != nil {
				log.Fatalf("설정 파일 생성 실패: %v", err)
			}
			log.Println("기본 설정으로 config.json 파일을 생성했습니다.")
		} else {
			// 설정 파일이 있으면 로드
			data, err := os.ReadFile("config.json")
			if err != nil {
				log.Fatalf("설정 파일 읽기 실패: %v", err)
			}

			err = json.Unmarshal(data, config)
			if err != nil {
				log.Fatalf("설정 언마샬링 실패: %v", err)
			}
			log.Println("config.json에서 설정을 로드했습니다.")
		}
	})
}

// GetConfig는 애플리케이션 설정을 반환합니다.
func GetConfig() *Config {
	if config == nil {
		LoadConfig()
	}
	return config
}
