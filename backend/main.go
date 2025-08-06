package main

import (
	"log"

	"github.com/fake-edge-server/config"
	"github.com/fake-edge-server/database"
	"github.com/fake-edge-server/routes"
	"github.com/gin-gonic/gin"

	_ "github.com/fake-edge-server/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title TCP Tester API
// @version 1.0
// @description This is the API documentation for TCP Tester.
// @BasePath /api

func main() {
	// 설정 로드
	config.LoadConfig()

	// 데이터베이스 연결
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("데이터베이스 초기화 실패: %v", err)
	}

	// Gin 라우터 초기화
	r := gin.Default()

	// CORS 설정
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 라우트 설정
	routes.SetupRoutes(r, db)

	// Swagger 설정
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 서버 시작
	port := config.GetConfig().ServerPort
	log.Printf("서버가 http://localhost:%s에서 실행 중입니다.", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("서버 시작 실패: %v", err)
	}
}
