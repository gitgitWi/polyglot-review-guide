---
title: "Functions and Control Flow"
category: "syntax"
language: "both"
order: 3
summary: "Kotlin과 Go의 조건 분기 표현식, 스코프 함수, 지연 평가 및 Go의 에러 조기 반환(Early Return), 지연 실행(Defer) 방식을 다룹니다."
---

# Functions and Control Flow

## Kotlin 조건문과 when 식 (Expressions)

Kotlin에서 `if`는 구문(Statement)이 아닌 결과 값을 반환하는 **식(Expression)**입니다. 삼항 연산자(`? :`)가 없는 대신 `if-else` 구조 자체를 바로 값에 할당할 수 있습니다.

```kotlin
val result = if (search.isNullOrBlank()) {
    repository.findAll(pageable)
} else {
    repository.findByNameContainingIgnoreCase(search, pageable)
}
```

`when` 구문 역시 TypeScript의 `switch`보다 강력하고 유연하며, 주로 표현식(Expression) 형태로 즐겨 사용됩니다.

```kotlin
val status = when (hold.status) {
    HoldStatus.ACTIVE -> "open"
    HoldStatus.SETTLED -> "closed"
    HoldStatus.RELEASED, HoldStatus.EXPIRED -> "closed"
}
```

리뷰 포인트:

- **when 식의 컴파일러 분기 검증**: enum이나 sealed class 계열의 상태를 처리하는 `when` 식이 값으로 할당될 때는 모든 가능한 케이스를 누락 없이 열거(Exhaustive)해야 합니다. 
- **광범위한 else 분기의 위험성**: 모든 분기를 뭉뚱그려 처리하는 광범위한 `else` 분기가 정의되어 있다면, 미래에 신규 enum 값이 추가될 때 컴파일 타임 에러가 발생하지 않아 비즈니스 누락 버그가 발견되지 않은 채 프로덕션으로 나갈 수 있으므로 가급적 개별 분기를 명시하는 것이 안전합니다.
- **표현식 바디와 부수효과 결합 차단**: 단일 표현식 함수나 `when` 분기 내부에서 복잡한 부수효과(State Mutation 등)를 많이 일으키고 있다면, 코드를 명시적인 블록 바디 형태로 전환하여 실행 순서와 부수효과를 한눈에 식별하기 좋게 개선합니다.

---

## Kotlin 스코프 함수 (Scope Functions)

Kotlin 표준 라이브러리는 객체의 컨텍스트 내에서 특정 코드 블록을 실행할 수 있도록 하는 5가지 스코프 함수(`let`, `also`, `apply`, `run`, `with`)를 제공합니다.

- `let`: nullable 객체를 바인딩하여 널이 아닐 때 실행하거나 다른 타입으로 매핑 변환할 때 사용합니다.
- `also`: 전달받은 수신 객체를 변경 없이 그대로 반환하면서 로그 기록 등 추가적인 부수효과 행위를 함께 엮을 때 활용합니다.
- `apply`: 주로 빌더 패턴처럼 신규 생성한 객체의 초기 설정을 체이닝 형태로 마무리하고 객체를 즉시 반환받고 싶을 때 사용합니다.
- `run`: 어떤 연산이나 일련의 셋업을 실행한 최종 블록의 계산 값을 획득할 때 씁니다.

```kotlin
request.name?.let { tenant.name = it }
```

리뷰 포인트:

- **중첩된 스코프 함수 금지**: 스코프 함수가 깊게 중첩(`let { let { ... } }`)되면, 암시적으로 자동 할당되는 매개변수명 `it`이 무엇을 지칭하는지 추적하기가 대단히 곤란해집니다. 이럴 때는 파라미터 이름을 명시적으로 선언하거나 일반적인 `if-else` 분기 및 임시 변수 구조로 단순화하는 것이 낫습니다.
- **가독성을 해치는 남용**: 복잡하게 체이닝된 스코프 함수는 오히려 흐름을 한 번에 읽기 어렵게 만들 수 있습니다. 억지로 비즈니스 흐름을 스코프 함수로 압축하여 감추려 하지 않는지 꼼꼼하게 살핍니다.
- **엔티티 상태 변경 시 할당문 사용**: 도메인 엔티티의 핵심 상태를 수정하는 과정에서 스코프 함수 내부로 할당 흐름이 숨어 들어가면 상태 전이의 의도가 불분명해집니다. 이럴 때는 비즈니스 의도가 노출되도록 명시적 할당문(`a.status = ACTIVE`)이나 변경 전용 메서드를 사용하는 것이 더 좋습니다.

---

## Kotlin 컬렉션 (Collections)

```kotlin
val ids = allocations.map { it.lotId }
val byId = lots.associateBy { it.id }
val total = sorted.sumOf { it.available }
```

리뷰 포인트:

- **즉시 평가(Eager Evaluation)에 따른 메모리 확인**: TypeScript의 배열 메서드처럼 Kotlin의 기본 컬렉션 조작 함수들(`map`, `filter` 등)은 매 단계마다 임시 새로운 컬렉션을 메모리에 복제 생성하는 즉시 평가(Eager) 방식입니다. 
- **DB와 애플리케이션의 메모리 처리 격리**: 수만 건 이상의 데이터를 메모리에 통째로 로드하여 필터링 및 통계를 내는 가벼운 코드가 숨어 있는지 점검하고, 대규모 집계 연산은 원천적으로 DB 쿼리 수준에서 최적화하여 좁혀오도록 유도해야 합니다.
- **Sequence의 적절한 채택**: 지연 평가(Lazy Evaluation) 기반의 연산이 성능상 확실한 이득을 보장하는 매우 큰 리스트 데이터 파이프라인에서만 제한적으로 `asSequence()`를 열어 연산하도록 구성되었는지 검토합니다.

---

## Go 에러 검증 패턴 (if err != nil)

Go에서는 예외 전파 메커니즘이 없는 대신 함수 호출 성공 여부를 명시적으로 즉각 점검해야 합니다.

```go
cfg, err := config.Load()
if err != nil {
	return err
}
```

리뷰 포인트:

- **에러 묵살 검출**: 에러 반환 값을 언더스코어 식별자(`_, _ = something()`)를 통해 아무런 처리나 로그 기록 없이 조용히 묵인하고 지나친 코드가 존재한다면 비즈니스 운영상 치명적인 사각지대가 됩니다.
- **원인 에러 보존(Error Wrapping)**: 상위 레이어로 에러를 버블링하여 전달할 때는 단순히 문자열만 덧붙이지 말고, `fmt.Errorf("비즈니스 문맥 설명: %w", err)`와 같이 `%w` 동사(Verb)를 사용하여 에러 체인을 형성해야 최상단에서 원인 에러의 타입과 원인을 안전하게 분석할 수 있습니다.

---

## Go 조기 반환 (Early Return)

```go
if !ok {
	writeError(w, http.StatusBadRequest, "unsupported agent")
	return
}
```

Go 스타일은 중첩된 조건문 블록을 길게 늘어뜨려 복잡하게 만드는 것보다, 사전에 맞지 않는 조건은 조기 반환하여 메서드를 끝내고 본 코드를 바깥에 나열하는 것을 매우 권장합니다.

리뷰 포인트:

- **응답 기록 후 리턴 누락 검증**: HTTP 핸들러 구현 중 에러가 발생하여 `http.Error`나 `writeError`를 작성했음에도 그 밑에 즉시 `return` 구문을 빼먹어 하위 비즈니스 로직이 계속 실행되는 치명적인 오동작 버그를 방지하고 있는지 눈여겨보아야 합니다.
- **성공 경로(Happy Path) 정렬**: 조건 분기가 중첩되지 않고 주 성공 비즈니스 흐름이 항상 코드의 가장 왼쪽 들여쓰기 라인(Happy Path Left)을 따라 매끄럽게 흐르고 있는지 정렬 형태를 검토합니다.

---

## Defer (지연 실행)

Go의 `defer` 키워드로 지정된 구문은 함수가 최종적으로 복귀(Return)하기 직전에 역순으로 일괄 지연 호출됩니다.

```go
defer rows.Close()
defer cancel()
```

리뷰 포인트:

- **루프 내 defer 누적 방지**: 반복문(`for` 루프) 내부에서 무분별하게 `defer`를 선언하여 호출하면, 루프가 끝날 때가 아닌 전체 감싸고 있는 바깥쪽 "함수"가 반환될 때까지 리소스 정리 작업이 실행되지 않고 누적되므로, 이 경우 루프 단위를 내부 헬퍼 함수로 격리하든가 명시적으로 직접 자원을 해제해야 합니다.
- **에러 핸들러와 커넥션 반환**: 데이터베이스 커넥션 풀 반환이나 파일 채널 닫기, 락 해제 작업 등 임시 사용한 주요 시스템 자원들이 예기치 못한 패닉이나 에러 반환 경로에서도 누출되지 않고 `defer`를 통해 반드시 회수되도록 보장되어 있는지 확인합니다.
