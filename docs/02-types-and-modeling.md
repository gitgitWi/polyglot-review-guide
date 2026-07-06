---
title: "Types and Modeling"
category: "types"
language: "both"
order: 2
summary: "TypeScript의 타입/스키마 감각을 Kotlin data class, enum, Go struct/interface로 옮긴다."
---

# Types and Modeling

## 구조적 타입과 명목 타입

TypeScript는 구조적 타입이다. 같은 shape이면 같은 타입처럼 취급된다.

```ts
type UserId = string;
type TenantId = string;
```

두 타입 모두 결국 `string`이다. branded type을 쓰지 않으면 서로 섞이기 쉽다.

Kotlin은 명목 타입이 기본이다.

```kotlin
@JvmInline
value class UserId(val value: String)
```

Go도 named type으로 의미를 부여할 수 있다.

```go
type UserID string
type TenantID string
```

리뷰 포인트:

- ID, money, credit, permission, status처럼 domain 의미가 큰 값이 raw string/number로만 흐르는지 본다.
- wrapper type을 만들었다면 JSON/DB 변환까지 자연스럽게 처리되는지 확인한다.
- 타입이 많아졌지만 invariant가 늘지 않았다면 ceremony일 수 있다.

## Kotlin data class

Kotlin DTO와 value object는 `data class`가 기본이다.

```kotlin
data class TokenResponse(
    val accessToken: String,
    val expiresIn: Long,
)
```

특징:

- `equals`, `hashCode`, `toString`, `copy`, destructuring이 자동 생성된다.
- request/response DTO에는 적합하다.
- JPA entity에는 보통 피한다. entity identity, lazy loading, proxy, mutable lifecycle과 충돌하기 쉽다.

리뷰 포인트:

- DTO는 `val` 중심인지 확인한다.
- `copy()`가 domain invariant를 우회하지 않는지 본다.
- `toString()`이 token, email, secret 같은 민감 정보를 노출하지 않는지 확인한다.

## Kotlin null-safety

```kotlin
val email: String = "a@example.com"
val providerId: String? = null
val length = providerId?.length ?: 0
```

리뷰 포인트:

- `!!`는 TypeScript의 non-null assertion처럼 위험 신호다.
- nullable을 받는 함수가 어디서 null을 제거하는지 봐야 한다.
- Java interop, reflection, serialization, ORM boundary에서는 non-null 타입에도 null이 들어올 수 있다.
- DB nullable, migration, API optional field가 Kotlin 타입과 맞는지 확인한다.

## Go struct와 tag

```go
type AgentNotifyRequest struct {
	Agent     string   `json:"agent" validate:"required"`
	Title     string   `json:"title" validate:"required"`
	TokenList []string `json:"token_list" validate:"min=1"`
}
```

Go struct tag는 runtime reflection 기반 library가 읽는다. compiler가 tag 의미를 검증하지 않는다.

리뷰 포인트:

- JSON tag, validation tag, DB tag가 실제 decoder/validator와 맞는지 확인한다.
- exported field만 `encoding/json`이 읽고 쓴다.
- nil slice와 empty slice가 JSON에서 다르게 보일 수 있다.
- map zero value는 nil이고 nil map에 write하면 panic이 난다.

## Go interface

Go interface는 구현체가 명시적으로 `implements`를 쓰지 않는다.

```go
type Sender interface {
	Send(ctx context.Context, tokens []string, n Notification) (*Result, error)
}
```

리뷰 포인트:

- interface는 consumer 쪽에 작게 두는 것이 보통 좋다.
- 테스트 fake를 위해 작은 interface를 두는 것은 좋은 패턴이다.
- "미래 확장성"을 이유로 큰 interface를 만들면 변경 비용이 커진다.

## Modeling Best Practice

- DTO와 domain model을 분리한다.
- external API field name과 internal domain name을 무리하게 같게 만들지 않는다.
- enum은 새 값 추가 시 API, DB, OpenAPI, test fixture가 같이 바뀌는지 확인한다.
- money/credit/usage 단위는 raw number만 쓰지 말고 단위와 rounding rule을 문서화한다.
- validation은 request shape, domain invariant, persistence constraint의 세 층으로 나눠 본다.
