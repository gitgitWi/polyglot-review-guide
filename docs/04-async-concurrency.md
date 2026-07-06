---
title: "Async and Concurrency"
category: "runtime"
language: "both"
order: 4
summary: "Node.js async/await, Kotlin/Spring 스레드/트랜잭션, Go goroutine/context의 실행 모델 차이."
---

# Async and Concurrency

## TypeScript/Node.js 기준점

Node.js에서 주요 과제는 event loop를 막지 않는 것, Promise 실행 순서, 병렬 실행 범위, backpressure다.

```ts
const a = await fetchA();
const [b, c] = await Promise.all([fetchB(), fetchC()]);
```

리뷰할 때는 "무엇이 동시에 실행되는가", "에러가 어디로 전파되는가", "취소/타임아웃이 있는가"를 본다.

## Kotlin/Spring MVC

Kotlin 서버는 Spring MVC, JDBC/JPA/jOOQ, transaction 기반인 경우가 많다. 이 stack에서는 `async/await` 감각보다 다음이 중요하다.

- 요청당 worker thread가 할당된다.
- DB transaction은 thread-local context에 묶인다.
- `@Transactional` 경계 안에서 DB 작업을 묶는다.
- 외부 I/O를 transaction 안에서 오래 잡으면 lock과 connection을 낭비한다.

리뷰 포인트:

- `@Transactional(readOnly = true)`와 write transaction이 의도대로 나뉘었는지 본다.
- transaction 내부에서 HTTP call, email, push notification, long-running computation이 없는지 확인한다.
- lock timeout, statement timeout, idempotency key, retry 정책이 일관되는지 본다.
- coroutine을 도입한다면 blocking ORM/JDBC stack과 섞이는 비용을 별도로 검토한다.

## Kotlin Coroutines

Kotlin coroutine은 lightweight concurrency 모델이다. Spring WebFlux나 coroutine-aware client와 함께 쓸 때 장점이 크다.

```kotlin
suspend fun fetchUser(id: String): User
```

리뷰 포인트:

- `suspend` 함수가 실제 non-blocking I/O를 쓰는지 확인한다.
- blocking call을 coroutine dispatcher 위에서 무심코 호출하지 않는지 본다.
- structured concurrency를 깨는 global coroutine scope 사용은 위험하다.
- cancellation이 DB transaction과 어떻게 상호작용하는지 확인한다.

## Go goroutine

Go의 goroutine은 싸게 만들 수 있는 concurrent execution unit이다.

```go
go func() {
	if err := srv.ListenAndServe(); err != nil {
		serverErr <- err
	}
}()
```

리뷰 포인트:

- goroutine이 끝나는 조건이 있는지 본다.
- parent context 취소를 받는지 확인한다.
- channel send/receive가 block될 수 있는지 본다.
- unbounded fan-out이면 semaphore, worker pool, `errgroup` 같은 제한이 필요하다.

## Go context

`context.Context`는 request cancellation, deadline, trace/request scoped value 전달의 표준 수단이다.

```go
res, err := sender.Send(r.Context(), tokens, notification)
```

리뷰 포인트:

- HTTP request에서 시작한 I/O는 `r.Context()`를 전달해야 한다.
- `context.WithTimeout`을 만들면 `defer cancel()`이 있어야 한다.
- context를 struct field에 저장하지 않는다. 함수 인자로 전달한다.
- request-scoped value는 남용하지 않는다. 필수 dependency 전달 용도가 아니다.

## 비교 요약

| 관심사 | TypeScript/Node.js | Kotlin/Spring | Go |
|---|---|---|---|
| 기본 실행 | event loop + Promise | request thread + transaction | goroutine + blocking I/O |
| 병렬 실행 | `Promise.all` | thread/coroutine/executor | `go`, channel, context |
| 취소 | AbortController | timeout, transaction rollback, coroutine cancellation | `context.Context` |
| 실패 | throw/reject | exception + rollback | explicit `error` |
| 리뷰 핵심 | await 순서, unhandled rejection | transaction 경계, lock, nullable | error wrapping, context, lifecycle |
