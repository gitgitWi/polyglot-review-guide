---
title: "Go Service Review Guide"
category: "review"
language: "go"
order: 11
summary: "Go HTTP 및 시스템 서비스 영역의 진입점(Main), 라우터와 미들웨어, 핸들러 규칙, 그리고 테스트 seams 설계 기준을 점검합니다."
tags: [code-review, http, middleware, context, graceful-shutdown, testing]
---

# Go Service Review Guide

## 진입점 및 환경 로드 (Entry Point: main.go)

Go 서버 서비스의 `main.go` 파일은 시스템의 전체 기동 실패 케이스를 사전에 감지하고(Fail-fast), 종료 시그널 요격 시 우아한 소멸 절차를 투명하게 제어하는 핵심 영역입니다.

리뷰 포인트:

- **기동 시 무조건 실패 처리(Fail-fast) 검증**: 인프라 연결 정보 누락이나 잘못 설정된 설정값 등이 들어왔을 때, 구동 이후 런타임 중에 불시 에러를 내며 죽지 않고 기동 즉시 `log.Fatal`을 타며 프로세스를 즉각 정상 중단시키는지 검토합니다.
- **안전한 기본 인증 정보 처리**: DB 비밀번호나 인증용 토큰 등의 보안 세부 정보가 환경 변수 설정 등 외부 공급자로부터 안전하게 로드되는지 확인하고 코드 내에 하드코딩된 누수가 없는지 검증합니다.
- **Graceful Shutdown 시그널 요격**: 시스템 중단 시그널(`SIGTERM`, `SIGINT`) 수신 즉시 수신 대기 중인 HTTP 서버의 신규 접속을 닫고, 현재 처리 중인 잔여 요청들 및 데이터베이스 커넥션 자원을 안전하게 반환받아 프로세스를 최종적으로 깨끗하게 종료하는지 구현 흐름을 봅니다.

---

## 라우터와 미들웨어 (Router and Middleware)

```go
r.Use(middleware.RequestID)
r.Use(middleware.Recoverer)
r.Use(maxBytes(maxRequestBytes))
r.Use(middleware.Timeout(30 * time.Second))
```

리뷰 포인트:

- **미들웨어 파이프라인 배치 순서**: 예외 패닉 복원 미들웨어(`Recoverer`)가 HTTP 요청 로깅 및 메트릭 기록기보다 우선 동작해야 패닉 폭발 시에도 로그가 유실되거나 프로세스가 붕괴되는 현상을 차단할 수 있습니다. 배치 우선순위를 교차 검증합니다.
- **바디 본문 용량 제한**: 멀티파트 폼 업로드 등 대량 페이로드 탈을 쓴 침입을 사전에 강제 중단하도록 `http.MaxBytesReader` 처리가 핸들러 이전 길목에 걸쳐져 있는지 점검합니다.

---

## HTTP 웹 핸들러 (HTTP Handlers)

```go
func (h *Handler) Notify(w http.ResponseWriter, r *http.Request) {
	var req NotifyRequest
	if err := decodeAndValidate(r, &req); err != nil {
		writeValidationError(w, err)
		return
	}
}
```

리뷰 포인트:

- **응답 작성 후 조기 복귀(Return) 보장**: 에러 발생 조건문 내에서 `http.Error` 등으로 오류 페이로드를 웹 소켓 라이터에 흘린 다음 즉시 아래에 `return` 제어문을 호출하여 함수의 작동을 완전히 끝내도록 보장하고 있는지 엄격하게 확인합니다.
- **다운스트림 비동기 컨텍스트 연결**: 데이터베이스 쿼리를 던지거나 외부 클라이언트 호출기를 이용할 때 무심코 `context.Background()`를 공급하지 않고, HTTP 요청이 소유한 캔슬레이션 신호 변환기인 `r.Context()`를 전파해주고 있는지 검증합니다.
- **핸들러 내 비즈니스 비대화 차단**: 웹 핸들러는 단순한 디코딩과 가벼운 데이터 정제 역할에 제한하고, 주요 데이터 모델 제어 및 비즈니스 연산 분기는 전용 서비스 구조체 내부로 전부 감춰 이관했는지 봅니다.

---

## 외부 연동 래퍼 (Client SDK Wrappers)

서드파티 API 통신이나 전용 클라이언트 인스턴스들은 얇은 전용 래퍼 구조체로 한번 격리하여 유통하는 것이 유지보수에 유리합니다.

리뷰 포인트:

- **외부 연동 장애 전파 격리**: 외부 업스트림 서비스 장애 시 무한 대기로 아군 서버 스레드까지 함께 고사하는 일을 방어하기 위해 적합한 네트워크 서킷 브레이커 설정이나 타임아웃, 그리고 재시도 백오프(Backoff) 룰이 설정되어 있는지 봅니다.
- **에러 정제 및 누수 방지**: 서드파티 SDK가 뿜는 복잡한 하부 라이브러리 예외 문자가 비즈니스 서비스 심장부까지 날것 그대로 노출되지 않도록 가공하여 리턴하는 어댑터가 잘 설계되어 있는지 확인합니다.

---

## Go 코드 품질 판단 신호 (Review Summary)

### 좋은 신호 (Green Flags)

- 패키지 디렉터리별 결합 면적이 좁고 외부에 굳이 개방하지 않을 소문자 멤버 필드들의 캡슐화가 철저함
- 모든 I/O 경로가 상단에서 하단 드라이버까지 `ctx`의 전달로 엮여 취소 신호를 전파함
- 에러 래핑 시 `%w`로 유기적 체인을 보존함
- 복잡한 핸들러 테스트가 테이블 기반 기법(Table-driven Test)을 타며 다양한 입력 조건을 검증함

### 경계 신호 (Red Flags)

- 일반적인 비즈니스 오류 흐름을 `panic`을 터뜨려 처리하려는 습관이 잔존함
- HTTP 응답 작성부 바로 다음 줄에 `return` 조기 중단이 누락됨
- 비동기 고루틴이 캔슬 신호와 락 감시 대기 없이 백그라운드에 불안정하게 기동됨
- 언더스코어 문자로 에러 반환을 검사 없이 방치하고 넘어감
