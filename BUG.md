# BUG

## 수정된 버그
- TCP 패킷 라우트에서 `/:id/packets/:id`로 정의되어 패킷 ID를 인식하지 못하는 문제를 발견하여 `:packet_id`로 수정했습니다.

## 추가 확인 필요
- 일부 API 응답이 비어 있을 때 `fetchWithErrorHandling`에서 `response.json()` 호출이 실패할 수 있음
- 프론트엔드 `checkTCPStatus` 함수가 오류 응답을 세부적으로 처리하지 않음
