---
title: "Kotlin Spring Review Guide"
category: "review"
language: "kotlin"
order: 7
summary: "Kotlin/Spring Boot 코드 리뷰에서 controller, service, entity, transaction, test를 확인하는 기준."
---

# Kotlin Spring Review Guide

## Controller

좋은 controller는 얇다.

```kotlin
@RestController
@RequestMapping("/api/tenants")
class TenantController(
    private val tenantService: TenantService,
) {
    @GetMapping("/{id}")
    fun getTenant(@PathVariable id: UUID): TenantResponse = tenantService.getTenant(id)
}
```

리뷰 포인트:

- request parsing, validation, auth principal extraction까지만 담당하는가?
- business rule과 DB transaction은 service로 내려가는가?
- `@Valid`, `@RequestBody`, `@PathVariable`, `@RequestParam`의 nullable/default가 API spec과 맞는가?
- entity를 response로 직접 반환하지 않는가?

## Service

Spring service는 transaction과 business rule의 중심이다.

```kotlin
@Service
@Transactional(readOnly = true)
class TenantService(...)
```

리뷰 포인트:

- class-level `readOnly = true`와 write method의 `@Transactional` override가 맞는가?
- transaction 내부에서 외부 I/O를 호출하지 않는가?
- repository/DAO 호출 순서가 lock 순서와 일관되는가?
- idempotency key, duplicate request, retry-safe behavior가 필요한 API인지 확인했는가?

## Entity vs DTO

JPA entity는 mutable lifecycle object다.

```kotlin
@Entity
class Identity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    var email: String,
)
```

리뷰 포인트:

- entity의 mutable field가 service 밖으로 노출되지 않는가?
- nullable field가 실제 DB nullable과 business invariant를 반영하는가?
- lazy relation 접근이 transaction 밖에서 발생하지 않는가?
- entity logging이 PII를 노출하지 않는가?

## Transaction and Locking

리뷰 포인트:

- transaction boundary가 use case 단위로 적절한가?
- read-only transaction에서 mutation이 일어나지 않는가?
- lock acquisition order가 일관되는가?
- timeout과 retry 정책이 명시적인가?
- outbox/event publish가 commit timing과 맞는가?

## Kotlin 문법 신호

좋은 신호:

- constructor injection 사용
- nullable 제거가 명시적
- domain enum/value object로 의미 표현
- `when`이 enum case를 명확히 처리
- 테스트가 service invariant와 API mapping을 둘 다 확인

주의 신호:

- `!!` 사용
- service에서 request DTO를 너무 깊게 들고 다님
- broad catch로 exception을 삼킴
- transaction 내부 외부 API call
- `valueOf` 직접 호출 후 error response mapping 없음
- entity를 API response로 직접 반환
- nullable과 default value로 실제 invariant를 숨김

## 테스트 관점

- controller slice: request mapping, validation, security gate
- service unit/integration: business rule, transaction behavior
- repository/DAO integration: SQL, schema, lock behavior
- architecture guard: 금지된 dependency direction이나 layer rule

AI가 테스트를 작성했다면 "happy path만 있는지"보다 "실패/경합/권한/validation을 실제로 잡는지"를 본다.
