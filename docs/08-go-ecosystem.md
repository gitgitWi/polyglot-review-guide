---
title: "Go Ecosystem"
category: "ecosystem"
language: "go"
order: 8
summary: "Go 서버 개발에서 자주 만나는 표준 라이브러리, router, validation, logging, testing, deployment 생태계."
---

# Go Ecosystem

Go는 표준 라이브러리가 강하고, framework보다 작은 library 조합을 선호하는 문화가 있다. 좋은 Go 프로젝트는 dependency가 적고, package boundary와 error flow가 명확하다.

## Standard Library

자주 쓰는 패키지:

- `net/http`: HTTP server/client
- `context`: cancellation, deadline
- `encoding/json`: JSON encode/decode
- `errors`, `fmt`: error wrapping
- `log/slog`: structured logging
- `sync`, `sync/atomic`: concurrency primitive
- `testing`, `httptest`: test

리뷰 포인트:

- 표준 library로 충분한데 무거운 framework를 도입하지 않았는가?
- `http.Client` timeout이 설정되어 있는가?
- `json.Decoder` 사용 시 unknown field 정책이 필요한가?
- structured log field에 secret이 들어가지 않는가?

## HTTP Router

자주 쓰는 router:

- chi: idiomatic, middleware ecosystem, 작고 명시적
- Gin: 더 framework-like, 빠른 개발
- Echo/Fiber: 편의 기능이 많음
- stdlib `ServeMux`: 최신 Go에서는 충분히 강력한 선택지

리뷰 포인트:

- middleware 순서가 의도와 맞는가?
- base path와 reverse proxy/gateway path rewrite가 맞는가?
- request body limit, timeout, CORS가 명시적인가?
- handler가 너무 많은 책임을 갖지 않는가?

## Validation

자주 쓰는 방식:

- struct tag 기반 validator
- schema library
- explicit validation function
- OpenAPI generator 기반 validation

리뷰 포인트:

- JSON tag와 validation tag가 drift되지 않는가?
- decode, validation, domain conversion 순서가 명확한가?
- field-level error를 client가 이해할 수 있는가?
- validation 이후에도 domain invariant를 별도로 확인하는가?

## Dependency Injection

Go는 framework DI보다 explicit constructor가 일반적이다.

```go
func NewHandler(sender Sender, logger *slog.Logger) *Handler {
	return &Handler{sender: sender, log: logger}
}
```

리뷰 포인트:

- constructor가 dependency를 명확히 보여주는가?
- interface가 consumer package에 작게 정의되는가?
- global mutable singleton을 남용하지 않는가?
- test fake를 쉽게 주입할 수 있는가?

## Testing

일반적인 조합:

- standard `testing`
- table-driven test
- `httptest`
- `testify` 또는 `go-cmp`
- integration test는 Docker/Testcontainers 또는 실제 dependent service fake

리뷰 포인트:

- table case가 edge case를 포함하는가?
- HTTP handler test가 status, body, side effect를 확인하는가?
- error wrapping을 `errors.Is`/`errors.As`로 검증하는가?
- race 가능성이 있으면 `go test -race` 대상인지 확인한다.

## Deployment

Go는 static binary 배포가 쉽다.

리뷰 포인트:

- container image가 불필요하게 크지 않은가?
- shutdown signal과 graceful shutdown이 있는가?
- readiness/liveness endpoint가 실제 의존성 상태와 맞는가?
- build metadata(version, commit)가 binary에 주입되는가?
