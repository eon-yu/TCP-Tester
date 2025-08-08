# Fake-Edge-Server 프론트엔드

React와 Vite로 작성된 프론트엔드 애플리케이션입니다. TCP 서버 목록과 요청/로그를 조회하고 관리합니다.

## 신규 기능

| 기능 | 설명 | 이미지 |
| --- | --- | --- |
| 체인 행 색상 표시 | 패킷 체인 유형별로 행 배경색을 적용해 가독성을 높였습니다. | ![row color](https://via.placeholder.com/120x80.png?text=Row+Color) |
| 패킷 에디터 개선 | 패킷 편집 UI를 모듈화하고 오류 처리를 강화했습니다. | ![packet editor](https://via.placeholder.com/120x80.png?text=Editor) |
| 문자열 입력 정리 | 문자열 입력 시 불필요한 Null 바이트를 제거합니다. | ![string input](https://via.placeholder.com/120x80.png?text=Input) |

## 주요 디렉터리
```
src/
  api/        # 백엔드와 통신하는 API 모듈
  components/ # UI 컴포넌트
  store/      # 상태 관리(Redux)
  utils/      # 공통 유틸리티 함수
```

API 모듈은 `api/config.js`의 `API_BASE_URL`을 사용하여 중복을 줄였습니다. `utils/format.js`는 날짜 포맷 함수 등을 제공합니다.

## 실행 방법

### 개발 서버 시작
```bash
./run_start.sh
```

### 빌드
```bash
./run_build.sh
```

빌드 결과물은 `dist/` 디렉터리에 생성됩니다.
