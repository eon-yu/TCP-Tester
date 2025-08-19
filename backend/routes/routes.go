package routes

import (
	"github.com/fake-edge-server/handlers"
	"github.com/fake-edge-server/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes는 애플리케이션의 라우트를 설정합니다.
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// TCP 서비스 및 연결 관리자 생성
	tcpService := services.NewTCPService(db)
	connManager := services.NewTCPConnectionManager()
	hub := services.NewWebSocketHub()
	sender := services.NewPacketSender(db, connManager, hub)

	// API 핸들러 생성
	apiHandler := handlers.NewAPIHandler(db, tcpService)
	tcpServerHandler := handlers.NewTCPServerHandler(db, connManager, hub)
	tcpPacketHandler := handlers.NewTCPPacketHandler(db, connManager, hub, sender)
	wsHandler := handlers.NewWSHandler(hub)

	// 라우트 그룹
	api := r.Group("/api")
	{
		// 상태 확인 엔드포인트
		api.GET("/health", apiHandler.GetHealth)
		api.GET("/ws", wsHandler.Handle)

		// 요청 관련 엔드포인트
		api.GET("/requests", apiHandler.GetRequests)
		api.GET("/requests/:id", apiHandler.GetRequestByID)

		// TCP 연결 관련 엔드포인트
		api.GET("/tcp-connections", apiHandler.GetTCPConnections)

		// 프록시 요청 처리
		api.POST("/proxy", apiHandler.ProxyRequest)
		api.POST("/proxy/:server", apiHandler.ProxyRequest)
		tc := api.Group("/tcp")

		{ // TCP 서버 관리 엔드포인트
			tc.POST("", tcpServerHandler.CreateTCPServer)       // TCP 서버 생성
			tc.GET("", tcpServerHandler.GetTCPServers)          // TCP 서버 목록 조회
			tc.GET("/:id", tcpServerHandler.GetTCPServerByID)   // 특정 TCP 서버 조회
			tc.PUT("/:id", tcpServerHandler.UpdateTCPServer)    // TCP 서버 정보 수정
			tc.DELETE("/:id", tcpServerHandler.DeleteTCPServer) // TCP 서버 삭제

			// TCP 서버 상태 관리 엔드포인트
			tc.GET("/:id/status", tcpServerHandler.CheckTCPStatus)   // TCP 서버 상태 확인
			tc.POST("/:id/start", tcpServerHandler.StartTCPServer)   // TCP 서버 시작
			tc.POST("/:id/stop", tcpServerHandler.StopTCPServer)     // TCP 서버 중지
			tc.POST("/:id/kill", tcpServerHandler.KillTCPServer)     // TCP 서버 프로세스 종료
			tc.GET("/:id/requests", tcpServerHandler.GetTCPRequests) // TCP 서버 요청 목록
			tc.GET("/:id/logs", tcpServerHandler.GetTCPLogs)         // TCP 서버 로그 목록

			tc.GET("/:id/packets", tcpPacketHandler.GetTCPPackets) // 특정 TCP 서버 조회
			tc.POST("/:id/packets", tcpPacketHandler.CreateTCPPacket)
			tc.GET("/:id/packets/export", tcpPacketHandler.ExportTCPPackets)
			tc.POST("/:id/packets/import", tcpPacketHandler.ImportTCPPackets)
			tc.DELETE("/:id/packets/:packet_id", tcpPacketHandler.DeleteTCPPacket)
			tc.PUT("/:id/packets/:packet_id", tcpPacketHandler.UpdateTCPPacketInfo)
			tc.PUT("/:id/packets/:packet_id/data", tcpPacketHandler.UpdateTCPPacketData)
			tc.POST("/:id/packets/:packet_id/send", tcpPacketHandler.SendTCPPacket)
			tc.POST("/:id/packets/:packet_id/stop", tcpPacketHandler.StopTCPPacketSend)
			tc.GET("/:id/history", tcpPacketHandler.GetTCPPacketHistory)

		}
	}

	// 프론트엔드 정적 파일 제공 (있는 경우)
	r.Static("/static", "../frontend/dist")

	// SPA 라우팅을 위한 fallback 처리
	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"error": "경로를 찾을 수 없습니다"})
	})
}
