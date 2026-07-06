---
title: "Go Service Review Guide"
category: "review"
language: "go"
order: 9
summary: "Go HTTP 서비스 리뷰에서 main, router, handler, interface, client wrapper를 확인하는 기준."
---

# Go Service Review Guide

## Entry Point

좋은 `main.go`는 시작 실패와 종료 흐름이 분명하다.

리뷰 포인트:

- config validation이 startup에서 fail-fast하는가?
- credential source 우선순위가 명확한가?
- observability 도구가 optional일 때 no-op 경로가 안전한가?
- HTTP server timeout이 설정되어 있는가?
- signal handling과 graceful shutdown이 있는가?

## Router and Middleware

```go
r.Use(middleware.RequestID)
r.Use(middleware.Recoverer)
r.Use(maxBytes(maxRequestBytes))
r.Use(middleware.Timeout(30 * time.Second))
```

리뷰 포인트:

- middleware 순서가 의도와 맞는가?
- panic recovery, tracing, body limit, timeout이 충돌하지 않는가?
- CORS wildcard와 credentials 조합이 spec과 맞는가?
- body size limit이 실제 payload 상한과 맞는가?

## Handler

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

- 에러 response를 쓴 뒤 `return`이 있는가?
- request context를 downstream I/O에 전달하는가?
- handler가 domain branching을 너무 많이 갖지 않는가?
- response helper가 content type과 status code를 일관되게 쓰는가?

## Client Wrapper

외부 SDK나 HTTP API는 얇은 wrapper로 감싸는 경우가 많다.

리뷰 포인트:

- timeout, retry, partial failure 정책이 명확한가?
- SDK error를 domain/API error로 변환하는 경계가 있는가?
- batch size 제한이 코드 상수와 테스트로 잡히는가?
- credential이나 token이 log에 노출되지 않는가?

## Interfaces and Tests

```go
type Sender interface {
	Send(ctx context.Context, payload Payload) (*Result, error)
}
```

리뷰 포인트:

- interface가 작고 consumer package에 있는가?
- fake 구현으로 handler behavior를 검증할 수 있는가?
- concrete type을 불필요하게 interface로 감싸지 않는가?

## Go 코드 품질 신호

좋은 신호:

- package boundary가 작다.
- exported symbol이 필요한 만큼만 있다.
- error가 context와 함께 wrapping된다.
- context가 I/O 경계까지 전달된다.
- timeout/body limit/shutdown이 명시적이다.
- table-driven test가 edge case를 포함한다.

주의 신호:

- `panic`으로 일반 오류 처리
- `context.Background()`를 request-scoped I/O에 사용
- goroutine이 종료 조건 없이 생성됨
- `err` 무시
- global mutable state가 많음
- handler에서 decode, validation, business rule, SDK call, response shape가 모두 뒤섞임
