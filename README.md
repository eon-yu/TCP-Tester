# Fake-Edge-Server

Fake-Edge-Server는 REST API를 제공하고 다른 서버와 TCP 통신을 수행하는 Go 기반 백엔드 서버입니다. 이 서버는 들어오는 HTTP 요청을 처리하고, 필요에 따라 외부 TCP 서버로 요청을 전달합니다.

## 기능

- REST API 서버 제공
- 지정된 TCP 서버와의 통신
- SQLite3 데이터베이스 사용 (GORM ORM 사용)
- 요청 및 TCP 연결 로깅
- 프론트엔드와의 통합 (React + MUI)
- 패킷 요청/응답 이력 저장 및 조회
- WebSocket을 통한 실시간 상태/응답 스트리밍

## 완료된 작업 요약

- **백엔드**: TCP 서버 CRUD, 패킷 관리 API, 프록시 요청 처리, 상태 모니터링 로직을 구현했습니다. 라우트 파라미터 오류를 수정하고 설정/DB 초기화 테스트를 추가했습니다. Goroutine 기반 패킷 반복 전송과 WebSocket 알림을 도입했습니다.
- **프론트엔드**: 패킷 체인 행 색상 표시, 패킷 에디터 모듈화, 문자열 입력 정리 등 UI 개선을 진행했습니다. API 모듈과 유틸리티 함수에 대한 테스트를 작성했습니다.
- **공통**: Go 및 Vitest 기반의 테스트 코드가 함수별로 추가되어 안정성을 높였습니다.

## 프로젝트 구조

```
├── backend/           # 백엔드 코드
│   ├── config/        # 설정 관리
│   ├── database/      # 데이터베이스 연결 관리
│   ├── handlers/      # HTTP 요청 핸들러
│   ├── models/        # 데이터 모델
│   ├── routes/        # 라우트 설정
│   ├── services/      # 비즈니스 로직 서비스
│   ├── main.go        # 애플리케이션 진입점
│   └── go.mod         # Go 모듈 정의
├── frontend/          # 프론트엔드 코드 (React + MUI)
└── README.md          # 프로젝트 문서
```

## 시작하기

### 사전 요구사항

- Go 1.24 이상
- Node.js 및 npm (프론트엔드 개발용)

### 백엔드 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
go mod tidy

# 서버 실행
go run main.go
```

서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.

### 프론트엔드 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 스크립트로 한 번에 실행/빌드

루트에서 다음 스크립트를 사용하면 프론트엔드와 백엔드를 동시에 실행하거나 빌드할 수 있습니다.

```bash
# 실행
./run_start.sh

# 빌드
./run_build.sh
```

## 업데이트 내역

| 날짜 | 내용 | 관련 |
| --- | --- | --- |
| 2025-08-08 | 패킷 요청/응답 이력 저장 및 UI 조회 기능 추가 | Frontend/Backend |
| 2025-08-07 | `UpdateTCPPacketInfo` API로 패킷 정보 수정 기능 추가 | Backend |
| 2025-08-05 | 패킷 편집 UI 모듈화 및 오류 처리 개선 | Frontend |
| 2025-08-01 | 체인 행 색상 표시로 가독성 향상 | Frontend |

<img width="2956" height="1772" alt="image" src="https://github.com/user-attachments/assets/92e65257-af25-42af-9175-3bfc221460a1" />


## 설정

서버는 `config.json` 파일을 통해 설정할 수 있습니다. 첫 실행 시 기본 설정으로 파일이 자동 생성됩니다.

```json
{
  "server_port": "8080",
  "db_path": "./data.db",
  "tcp_servers": [
    {
      "name": "default-server",
      "address": "127.0.0.1",
      "port": "9000"
    }
  ]
}
```

## 라이센스

MIT
