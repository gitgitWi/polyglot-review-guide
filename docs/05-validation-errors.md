---
title: "Validation and Errors"
category: "api"
language: "both"
order: 5
summary: "TypeScript schema validation 관점에서 Kotlin/Spring과 Go의 request validation 및 실패 처리 방식을 읽는다."
---

# Validation and Errors

## TypeScript 기준점

Node.js에서는 TypeScript 타입이 런타임 payload를 검증하지 않는다. 그래서 Zod, Valibot, class-validator, OpenAPI schema 같은 별도 검증이 필요하다.

```ts
const Body = z.object({
  title: z.string().min(1),
  tokenList: z.array(z.string()).min(1),
});
```

Kotlin과 Go도 JSON payload를 컴파일 타입만으로 완전히 검증하지 않는다. decode 이후 validation layer가 필요하다.

## Kotlin/Spring validation

Kotlin Spring에서는 request DTO에 Bean Validation annotation을 붙이고 controller parameter에 `@Valid`를 붙인다.

```kotlin
@PostMapping
fun createTenant(@Valid @RequestBody request: CreateTenantRequest): TenantResponse =
    tenantService.createTenant(request)
```

리뷰 포인트:

- controller에 `@Valid`가 빠지면 DTO annotation이 실행되지 않을 수 있다.
- Kotlin nullable과 validation annotation 의미가 겹친다. `String`, `String?`, `@NotBlank` 조합을 확인한다.
- enum string을 `valueOf`로 바로 바꾸면 잘못된 값에서 framework error가 날 수 있다.
- business rule은 DTO validation이 아니라 service/domain layer에 있어야 한다.

## Kotlin 예외와 API error

Spring에서는 service에서 exception을 던지고 `@ControllerAdvice` 또는 global exception handler가 HTTP 응답으로 변환하는 패턴이 흔하다.

리뷰 포인트:

- exception type과 HTTP status 매핑이 명확한지 본다.
- domain error code가 있다면 client가 안정적으로 처리할 수 있는지 확인한다.
- transaction 내부에서 exception을 잡아먹으면 rollback이 안 될 수 있다.
- idempotency conflict처럼 "정상 경합"과 "진짜 장애"를 같은 500으로 보내지 않는지 본다.

## Go validation

Go에서는 request struct, JSON tag, validation library, domain conversion을 조합한다.

```go
type MarketingPushRequest struct {
	Title     string   `json:"title" validate:"required"`
	TokenList []string `json:"token_list" validate:"min=1"`
}
```

리뷰 포인트:

- struct tag와 schema key가 실제 decoder/validator와 맞는지 본다.
- decode 실패와 validation 실패가 같은 400인지, 메시지가 충분한지 확인한다.
- validation 이후 domain 변환이 필요하면 별도 함수로 분리하는 것이 좋다.
- allowlist가 여러 곳에 중복되면 drift 위험이 있다.

## Go error handling

Go는 exception보다 명시적 `error` 반환이 기본이다.

```go
if err != nil {
	return fmt.Errorf("init messaging client: %w", err)
}
```

리뷰 포인트:

- `%w`로 wrapping해야 `errors.Is`와 `errors.As`가 작동한다.
- handler에서 client error와 upstream/server error status가 구분되는지 본다.
- partial success가 가능한 작업은 response에 partial result가 담기는지 확인한다.
- log에는 운영자가 필요한 context가 있어야 하지만 secret/token은 들어가면 안 된다.

## 좋은 API error shape

- status code가 의미와 맞다.
- machine-readable code 또는 안정적인 error field가 있다.
- validation details는 field 단위로 추적 가능하다.
- 내부 stack trace, credential, token은 노출하지 않는다.
- retry 가능한 오류와 불가능한 오류가 구분된다.

TypeScript에서 schema validation을 엄격히 보던 습관은 Kotlin/Go에서도 그대로 유효하다. 다만 검증의 위치가 annotation, schema, handler, domain, DB constraint로 분산되므로 전체 경로를 따라가야 한다.
