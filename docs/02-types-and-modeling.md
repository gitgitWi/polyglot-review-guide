---
title: "Types and Modeling"
category: "types"
language: "both"
order: 2
summary: "TypeScript의 스키마 지향 타입 감각을 Kotlin의 data class, enum 및 Go의 struct, implicit interface로 안전하게 전환합니다."
tags: [type-system, data-modeling, null-safety, dto, structs, interfaces]
---

# Types and Modeling

## 구조적 타입(Structural)과 명목적 타입(Nominal)

TypeScript는 **구조적 타입 시스템**을 채택하고 있습니다. 형태(Shape)가 호환된다면 물리적으로 다른 타입 선언이라 하더라도 동등하게 취급됩니다.

```ts
type UserId = string;
type TenantId = string;
```

위 두 타입은 런타임뿐 아니라 컴파일 시점에도 모두 원시 타입인 `string`으로 취급됩니다. TypeScript에서 Branded Type(`string & { readonly __brand: unique symbol }`) 기법을 명시적으로 도입하지 않는 한, `UserId`가 유입되어야 할 파라미터 자리에 실수로 `TenantId`를 주입하더라도 컴파일러는 오류를 잡아내지 못합니다.

반면, Kotlin은 엄격한 **명목적 타입 시스템**이 기본입니다.

```kotlin
@JvmInline
value class UserId(val value: String)
```

Go 역시 명명 타입(Named Type) 선언을 통해 새로운 독립적 타입을 선언하여 런타임 혼용 실수를 원천적으로 봉쇄합니다.

```go
type UserID string
type TenantID string
```

리뷰 포인트:

- **원시 타입 지향(Primitive Obsession) 제거**: 식별자(ID), 화폐 단위, 권한 명칭, 비즈니스 상태 값 등 비즈니스적 가치가 크고 실수가 잦은 데이터들이 날것의 `string`이나 `int` 형태로 아무런 제약 없이 유통되고 있지 않은지 검증합니다.
- **역직렬화 및 영속성 호환성**: 원시 타입을 감싸는 래퍼 타입(Value Class 등)을 신규 도입했을 때, 데이터베이스 드라이버나 JSON 직렬화/역직렬화기(Jackson, jsoniter 등)가 이를 올바르게 매핑할 수 있도록 추가 어댑터가 누락되지 않았는지 확인합니다.
- **불필요한 보일러플레이트(Ceremony) 경계**: 단순히 컴파일 경고를 지우기 위해 타입 정의만 무수히 늘어났을 뿐, 실질적인 비즈니스 유효성 검증(Invariant)이나 안전성을 제공하지 못하고 있다면 비즈니스 결합 비용만 가중시키는 패턴일 수 있습니다.

---

## Kotlin 데이터 클래스 (Data Class)

Kotlin에서 데이터 전송 객체(DTO)나 값 객체(Value Object)를 설계할 때는 `data class` 키워드가 기본입니다.

```kotlin
data class TokenResponse(
    val accessToken: String,
    val expiresIn: Long,
)
```

특징 및 주의사항:

- 컴파일러가 `equals()`, `hashCode()`, `toString()`, `copy()`, 그리고 구조 분해 선언(Destructuring Declaration)을 내부적으로 자동 생성해 줍니다.
- 순수한 불변성 데이터 구조나 API Request/Response DTO 정의에는 매우 유용합니다.
- **JPA 엔티티(Entity) 적용 배제**: JPA 엔티티에는 `data class` 사용을 강력하게 피해야 합니다. JPA 엔티티의 객체 식별자 동등성 규칙, 프록시 기반 지연 로딩(Lazy Loading), 가변 생명주기 등이 `data class`의 자동 생성 컴파일러 메서드들과 충돌하여 예기치 못한 버그를 유발합니다.

리뷰 포인트:

- **DTO의 불변성**: 외부에 노출되는 데이터 전송 객체(DTO)가 가변적인 `var`가 아닌, 모두 불변 참조인 `val` 중심으로 선언되었는지 확인합니다.
- **copy() 메서드를 통한 불변성 훼손**: `copy()` 기능을 무분별하게 호출하여 도메인 객체 내부의 생성 단계에서 검증했던 도메인 규칙(Invariant)을 임의로 우회하여 객체 상태를 갱신하고 있는지 점검합니다.
- **로깅 시 민감 정보 노출**: `toString()`이 자동 생성되므로, 로그에 사용자 개인정보(PII)나 비밀번호, 엑세스 토큰 등 민감 비밀 정보가 마스킹 없이 그대로 출력될 위험이 없는지 점검합니다.

---

## Kotlin Null-Safety

```kotlin
val email: String = "a@example.com"
val providerId: String? = null
val length = providerId?.length ?: 0
```

리뷰 포인트:

- **Double Bang(!!) 사용 지양**: 널 단언 연산자 `!!`는 TypeScript의 Non-null Assertion `!`과 마찬가지로 런타임에 즉각적인 NullPointerException(NPE)을 던질 수 있는 코드 냄새(Code Smell)입니다. 스마트 캐스트나 안전 호출 연산자(`?.`), 엘비스 연산자(`?:`)를 사용하여 안전하게 널을 제거하도록 개선합니다.
- **널 제거 지점의 적절성**: 널이 유입될 수 있는 경로에서 어느 컨트롤러나 서비스 진입점 레이어를 거쳐 널 상태가 완전히 정제되고 논-널 객체로 전환되는지 그 흐름의 명확성을 추적합니다.
- **외부 연동 경계에서의 널 유입**: Java 라이브러리와의 상호 연동(Java Interop), 리플렉션 동작, 혹은 JSON 역직렬화 과정(Jackson) 등 JVM 경계 영역에서는 Kotlin 변수 타입이 non-null로 정의되어 있더라도 실제 런타임에는 null이 무단 침투하여 크래시를 유발할 수 있음을 기억해야 합니다.
- **데이터베이스 컬럼 명세 일치**: DB 마이그레이션 정의 상 Nullable 컬럼으로 설계된 항목이 Kotlin 엔티티 단에서 non-null로 부정합하게 맵핑되어 있지 않은지 대조합니다.

---

## Go 구조체(Struct)와 태그(Tag)

```go
type AgentNotifyRequest struct {
	Agent     string   `json:"agent" validate:"required"`
	Title     string   `json:"title" validate:"required"`
	TokenList []string `json:"token_list" validate:"min=1"`
}
```

Go의 구조체 태그(Struct Tag)는 런타임 리플렉션(Reflection)을 기반으로 라이브러리가 파싱하여 처리합니다. 컴파일러가 태그 문자열의 오탈자나 의미적 유효성을 미리 검증해주지 못합니다.

리뷰 포인트:

- **구조체 태그 불일치 검증**: JSON 키 이름, 유효성 검증 규칙(`validate`), 데이터베이스 바인딩 매핑 등이 오탈자로 인해 실제 인코더/디코더 모듈과 어긋나지 않는지 꼼꼼하게 대조해야 합니다.
- **비노출 필드의 직렬화 배제**: Go 패키지 외부로 노출되지 않는 소문자 멤버 필드(Unexported Field)는 외부 JSON 인코딩 모듈(`encoding/json`) 등이 해당 필드를 읽어 들일 수 없으므로 무시된다는 점을 이해하고 적절한 대소문자로 정의되었는지 확인합니다.
- **Slice의 제로 값과 빈 값의 차이**: Go에서 `nil` slice와 길이가 0인 빈 slice(`[]string{}`)는 JSON으로 인코딩될 때 각각 `null`과 `[]`로 상이하게 출력되어 클라이언트 파서에 영향을 미치므로 이를 의도하고 제어하는지 점검합니다.
- **Map 쓰기 시 런타임 패닉 방지**: 초기화되지 않은 nil 맵 상태에서 쓰기 연산을 시도하면 즉각적인 런타임 패닉(Panic)이 발생합니다. 명시적으로 초기화된 맵에 쓰기를 시도하도록 코드가 보호되고 있는지 검토합니다.

---

## Go 인터페이스(Interface)

Go의 인터페이스는 암시적(Implicit) 구현 방식을 취합니다. 인터페이스를 구현하는 구조체가 명시적으로 인터페이스명을 선언하거나 임포트할 필요가 없으며, 단지 명세에 적힌 함수 시그니처만 동일하게 구현하면 결합됩니다.

리뷰 포인트:

- **사용자 관점(Consumer)의 미니멀 인터페이스**: 인터페이스는 해당 인터페이스를 직접 구현하는(Provider) 패키지가 아닌, 필요로 하는(Consumer) 패키지 쪽에 정의하는 것이 Go의 전통적인 아키텍처 규칙입니다. 인터페이스의 크기는 단 1~2개 메서드 수준으로 작게 설계되는지 점검합니다.
- **과도한 사전 추상화 경계**: "미래의 가상 확장성"을 목적으로 비즈니스 시작 단계부터 너무 크고 무거운 다목적 인터페이스를 남용하면 도메인 로직의 흐름을 파악하기 힘든 복잡성 비용만 초래합니다.

---

## 도메인 모델링 설계 권장 사항 (Best Practices)

- **DTO와 엔티티/도메인 모델의 엄격한 분리**: 외부에 제공할 JSON API 응답 규격과 내부 영속성 테이블 구조, 그리고 비즈니스 핵심 정책 객체를 1:1로 일치시키지 말고 각자의 변환 경계를 명확히 분리합니다.
- **금액 및 소수점 처리 규칙 명문화**: 금액(Money), 이율(Rate), 자원 사용량과 같이 민감한 수치들은 단순 float 타입 대신 정수형 스케일 아웃(예: 센트 단위를 원화 단위에 매핑)이나 고정소수점 전용 구조체를 사용하며, 반올림/올림/내림 정책이 테스트 코드로 확실히 검증되고 있는지 확인합니다.
- **검증 레이어 다층화**: 페이로드의 형태적 유효성을 확인하는 요청 스키마 수준의 검증(DTO Validation), 비즈니스 논리 무결성을 지키는 도메인 검증(Domain Invariant), 그리고 데이터 영속성을 방어하는 스토리지 검증(DB Constraints)이 알맞게 분산되어 제어되고 있는지 추적합니다.
