---
title: "Functions and Control Flow"
category: "syntax"
language: "both"
order: 3
summary: "Kotlin과 Go의 함수, if/when/switch, early return, collection 처리 방식을 비교한다."
---

# Functions and Control Flow

## Kotlin if와 when

Kotlin의 `if`는 expression이다.

```kotlin
val result = if (search.isNullOrBlank()) {
    repository.findAll(pageable)
} else {
    repository.findByNameContainingIgnoreCase(search, pageable)
}
```

`when`은 TypeScript의 `switch`보다 expression으로 자주 쓰인다.

```kotlin
val status = when (hold.status) {
    HoldStatus.ACTIVE -> "open"
    HoldStatus.SETTLED -> "closed"
    HoldStatus.RELEASED, HoldStatus.EXPIRED -> "closed"
}
```

리뷰 포인트:

- enum `when`은 모든 case를 다루는지 본다.
- `else`가 너무 넓으면 새 enum 값 추가 시 버그를 숨길 수 있다.
- expression body에 side effect가 많으면 block body로 풀어 쓰는 편이 낫다.

## Kotlin scope function

자주 보이는 함수:

- `let`: nullable 값이 있을 때 처리하거나 변환
- `also`: 같은 객체를 반환하면서 부수효과
- `apply`: 객체 설정 후 반환
- `run`: block 결과 반환

```kotlin
request.name?.let { tenant.name = it }
```

리뷰 포인트:

- scope function이 중첩되면 `it`이 무엇인지 불명확해진다.
- nullable 처리에는 좋지만 business flow를 숨기면 읽기 어려워진다.
- entity mutation에는 명시적인 assignment가 더 읽기 쉬운 경우가 많다.

## Kotlin collections

```kotlin
val ids = allocations.map { it.lotId }
val byId = lots.associateBy { it.id }
val total = sorted.sumOf { it.available }
```

리뷰 포인트:

- TypeScript 배열 메서드와 유사하지만 Kotlin collection은 eager evaluation이 기본이다.
- 대량 데이터라면 DB에서 처리해야 할 일을 메모리에서 처리하는지 확인한다.
- `Sequence`는 lazy evaluation이 필요할 때만 쓴다.

## Go if err 패턴

Go 코드는 실패 경로가 명시적으로 반복된다.

```go
cfg, err := config.Load()
if err != nil {
	return err
}
```

리뷰 포인트:

- `_ = something()`으로 에러를 무시한다면 의도가 설명되어야 한다.
- wrapping은 `fmt.Errorf("load config: %w", err)`로 cause를 보존한다.
- 에러 메시지는 호출 경계를 따라 의미가 누적되어야 한다.

## Go early return

```go
if !ok {
	writeError(w, http.StatusBadRequest, "unsupported agent")
	return
}
```

Go는 nested block보다 guard clause와 early return을 선호한다.

리뷰 포인트:

- handler는 response를 쓴 뒤 반드시 `return`하는지 본다.
- switch default가 필요한지, enum-like string의 허용 목록이 한 곳인지 확인한다.
- readability를 위해 happy path가 왼쪽으로 유지되는지 본다.

## Defer

Go `defer`는 현재 함수가 끝날 때 실행된다.

```go
defer rows.Close()
defer cancel()
```

리뷰 포인트:

- loop 안에서 `defer`를 쓰면 함수 끝까지 쌓인다.
- resource close, context cancel, flush에 적합하다.
- close error를 무시해도 되는지 확인한다.
