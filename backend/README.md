# Fake-Edge-Server 백엔드

이 문서는 Fake-Edge-Server 백엔드의 구조와 각 모듈의 역할을 설명합니다.

## 구조 개요

```
├── config/        # 설정 관리
├── database/      # 데이터베이스 연결 관리
├── handlers/      # HTTP 요청 핸들러
├── models/        # 데이터 모델
├── routes/        # 라우트 설정
├── services/      # 비즈니스 로직 서비스
├── main.go        # 애플리케이션 진입점
├── go.mod         # Go 모듈 정의
└── config.json    # 설정 파일
```

## 실행 스크립트

빠른 실행과 빌드를 위해 다음 스크립트를 제공합니다.

- `./run_start.sh` – 백엔드 서버 실행
- `./run_build.sh` – 바이너리 빌드

## 모듈 세부 설명

### `main.go`

애플리케이션의 진입점으로, 다음 작업을 수행합니다:

- 설정 로드
- 데이터베이스 연결 초기화
- Gin 웹 프레임워크 설정
- CORS 미들웨어 설정
- 라우트 설정
- HTTP 서버 시작

### `config/`

애플리케이션 설정을 관리하는 패키지입니다.

#### `config.go`

- `Config` 구조체: 서버 포트, 데이터베이스 경로, TCP 서버 목록 등 설정 정보 포함
- `LoadConfig()`: 설정 파일에서 설정을 로드하거나, 없는 경우 기본 설정으로 파일 생성
- `GetConfig()`: 애플리케이션 내에서 설정에 접근하기 위한 함수

### `database/`

데이터베이스 연결과 마이그레이션을 관리하는 패키지입니다.

#### `db.go`

- `InitDB()`: SQLite3 데이터베이스 연결 초기화 및 모델 마이그레이션 수행

### `models/`

데이터베이스 모델을 정의하는 패키지입니다.

#### `models.go`

- `Request`: HTTP 요청 정보를 저장하는 모델
  - 메서드, 경로, 헤더, 바디, IP 주소 등 HTTP 요청 정보 포함
  - TCP 요청과 1:N 관계 구성
- `TCPConnection`: 외부 TCP 서버와의 통신 정보를 저장하는 모델
  - 서버 이름, 주소, 전송 데이터, 수신 데이터, 성공 여부 등 포함

#### `tcp_server.go`

- `TCPServer`: TCP 서버 연결 정보를 저장하는 모델
  - 서버 이름, 호스트, 포트 정보 포함
  - 고유 ID 및 생성/수정/삭제 일자 자동 관리(gorm.Model)
- `TCPServerRequest`: TCP 서버 생성/수정 요청을 위한 구조체

### `handlers/`

HTTP 요청을 처리하는 핸들러를 포함하는 패키지입니다.

#### `api_handlers.go`

- `APIHandler`: API 요청 처리를 위한 구조체
- 주요 메서드:
  - `ProxyRequest`: 클라이언트 요청을 TCP 서버로 전달하고 응답 반환
  - `GetRequests`: 저장된 모든 HTTP 요청 목록 반환
  - `GetRequestByID`: 특정 ID의 요청 및 관련 TCP 연결 정보 반환
  - `GetTCPConnections`: 모든 TCP 연결 목록 반환
  - `GetHealth`: 서버 상태 확인 정보 반환

#### `tcp_server_handlers.go`

- `TCPServerHandler`: TCP 서버 관리를 위한 구조체
- 주요 메서드:
  - `CreateTCPServer`: 새로운 TCP 서버 정보 등록
  - `GetTCPServers`: 모든 TCP 서버 목록 반환
  - `GetTCPServerByID`: 특정 ID의 TCP 서버 정보 반환
  - `UpdateTCPServer`: TCP 서버 정보 수정
  - `DeleteTCPServer`: TCP 서버 정보 삭제

공통적으로 사용되는 서버 조회 로직은 `getServerByID` 헬퍼로 분리되어 중복을 줄였습니다.

### `services/`

비즈니스 로직을 처리하는 서비스를 포함하는 패키지입니다.

#### `tcp_service.go`

- `TCPService`: TCP 서버와의 통신을 관리하는 서비스
- 주요 메서드:
  - `SendRequest`: 지정된 TCP 서버로 데이터를 전송하고 응답을 받는 함수
    - TCP 연결 생성, 데이터 전송, 응답 수신 처리
    - 연결 정보를 `logConnection` 헬퍼를 통해 데이터베이스에 기록

### `routes/`

애플리케이션의 라우트를 설정하는 패키지입니다.

#### `routes.go`

- `SetupRoutes`: 애플리케이션 라우트를 설정하는 함수
  - 엔드포인트 등록: 상태 확인, 요청 관리, TCP 연결 관리, 프록시 요청 등
  - 정적 파일 제공 및 SPA 라우팅 설정

### `config.json`

애플리케이션 설정 파일입니다. 다음 정보를 포함합니다:

- `server_port`: HTTP 서버 포트
- `db_path`: SQLite3 데이터베이스 파일 경로
- `tcp_servers`: TCP 서버 목록 (이름, 주소, 포트)

## 주요 기능 흐름

1. 클라이언트가 `/api/proxy` 또는 `/api/proxy/:server`로 요청 전송
2. `APIHandler.ProxyRequest`가 요청을 처리
3. 요청 정보를 데이터베이스에 저장
4. `TCPService.SendRequest`를 통해 지정된 TCP 서버로 데이터 전송
5. TCP 서버의 응답을 받아 클라이언트에 반환
6. TCP 통신 정보를 데이터베이스에 기록

## API 엔드포인트

### 상태 확인
```
GET /api/health
```

### 요청 관리
```
GET /api/requests         # 모든 요청 목록 조회
GET /api/requests/:id     # 특정 요청 상세 조회
```

### TCP 연결 관리
```
GET /api/tcp-connections  # 모든 TCP 연결 조회
```

### 프록시 요청
```
POST /api/proxy           # 기본 TCP 서버로 요청 전달
POST /api/proxy/:server   # 지정된 TCP 서버로 요청 전달
```

### TCP 서버 관리
```
POST /api/tcp             # TCP 서버 등록
GET /api/tcp              # TCP 서버 목록 조회
GET /api/tcp/:id          # 특정 TCP 서버 조회
PUT /api/tcp/:id          # TCP 서버 정보 수정
DELETE /api/tcp/:id       # TCP 서버 삭제
```

#### TCP 서버 등록/수정 요청 형식
```json
{
  "name": "서버 이름",
  "host": "서버 호스트/IP",
  "port": 9000
}
```

## 통신 흐름도

```
클라이언트 → REST API 서버 → TCP 서버
           ↑                ↓
           └──── 응답 ←─────┘
```

## 개발 가이드라인

### 새로운 API 엔드포인트 추가

1. `handlers/` 패키지에 새로운 핸들러 메서드 작성
2. `routes/routes.go`에 새 엔드포인트 등록

### 새로운 데이터 모델 추가

1. `models/models.go`에 새 구조체 정의
2. `database/db.go`의 `InitDB()` 함수에 마이그레이션 추가

### 설정 변경

1. `config/config.go`의 `Config` 구조체에 새 필드 추가
2. `config.json` 파일에 해당 설정 추가
