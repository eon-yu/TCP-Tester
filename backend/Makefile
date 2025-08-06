# 프로젝트 변수 설정
GO=go
GOFMT=gofmt
PACKAGES=./...

# 기본 타겟
all: build

# 빌드
build:
	$(GO) build -o bin/server ./main.go

# 테스트
test:
	$(GO) test $(PACKAGES) -v

# 단위 테스트
test-unit:
	$(GO) test ./handlers -v

# 통합 테스트
test-integration:
	$(GO) test ./tests -v

# 코드 포맷팅
fmt:
	$(GOFMT) -w .

# 의존성 설치
deps:
	$(GO) mod tidy

# 실행
run:
	$(GO) run main.go

# 테스트 커버리지 리포트
cover:
	$(GO) test $(PACKAGES) -coverprofile=coverage.out
	$(GO) tool cover -html=coverage.out

# 클린
clean:
	rm -rf bin/
	rm -f coverage.out

.PHONY: all build test test-unit test-integration fmt deps run cover clean
