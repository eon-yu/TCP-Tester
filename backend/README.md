# Fake-Edge-Server 백엔드

Go 기반의 REST API 서버로 TCP 서버와의 통신을 담당합니다.

![API Flow](https://via.placeholder.com/500x120.png?text=API+Flow)

## 완료된 작업 요약

- TCP 서버 CRUD 및 상태 관리 API 구현
- 패킷 생성/수정/전송 기능과 이력 저장
- 프록시 요청 처리와 요청/응답 로깅
- 라우트 파라미터 오류 수정 및 설정/DB 초기화 테스트 코드 추가
- 패킷 이름/설명과 JSON 데이터를 이력에 저장하고 WebSocket으로 방송
- 패킷 Export/Import API와 JSON 필드 오프셋 자동 조정 구현

## API 리스트

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | /api/health | 서버 상태 확인 |
| GET | /api/requests | 저장된 HTTP 요청 목록 |
| GET | /api/requests/:id | 특정 요청 상세 |
| GET | /api/tcp-connections | TCP 연결 로그 |
| POST | /api/proxy | 기본 TCP 서버로 요청 전달 |
| POST | /api/proxy/:server | 지정된 서버로 요청 |
| POST | /api/tcp | TCP 서버 등록 |
| GET | /api/tcp | TCP 서버 목록 조회 |
| GET | /api/tcp/:id | TCP 서버 상세 |
| PUT | /api/tcp/:id | TCP 서버 수정 |
| DELETE | /api/tcp/:id | TCP 서버 삭제 |
| POST | /api/tcp/:id/packets | TCP 패킷 생성 |
| GET | /api/tcp/:id/packets | TCP 패킷 목록 |
| GET | /api/tcp/:id/packets/:packet_id | TCP 패킷 조회 |
| PUT | /api/tcp/:id/packets/:packet_id | TCP 패킷 수정 |
| DELETE | /api/tcp/:id/packets/:packet_id | TCP 패킷 삭제 |
| POST | /api/tcp/:id/packets/:packet_id/send | TCP 패킷 전송 |
| GET | /api/tcp/:id/packets/export | TCP 패킷 Export |
| POST | /api/tcp/:id/packets/import | TCP 패킷 Import |
| GET | /api/tcp/:id/status | TCP 서버 상태 |
| POST | /api/tcp/:id/start | TCP 서버 시작 |
| POST | /api/tcp/:id/stop | TCP 서버 중지 |
| GET | /api/tcp/:id/requests | TCP 서버 요청 목록 |
| GET | /api/tcp/:id/logs | TCP 서버 로그 목록 |

## DB 구조

| 테이블 | 주요 필드 | 설명 |
| --- | --- | --- |
| tcp_servers | id, name, host, port | TCP 서버 정보 |
| requests | id, method, path, headers, body | HTTP 요청 기록 |
| tcp_connections | id, server_id, sent_data, received_data, success | TCP 통신 로그 |
| tcp_packets | id, server_id, name, data | TCP 패킷 정의 |

![DB Diagram](https://via.placeholder.com/600x200.png?text=DB+Schema)

## 변경된 로직

- `UpdateTCPPacketInfo` 핸들러를 추가하여 패킷 정보를 수정할 수 있습니다.
- 문자열 입력에서 Null 바이트를 제거해 데이터 정합성을 보장합니다.
- 패킷 전송 과정의 오류 처리를 개선했습니다.
- 패킷 이름과 설명을 이력에 포함하고 WebSocket으로 즉시 전송합니다.
- JSON 타입 필드와 크기 변경에 따른 오프셋 자동 조정 로직을 추가했습니다.
- 패킷 Export/Import 핸들러를 통해 정의를 파일로 주고받을 수 있습니다.
