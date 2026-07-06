---
title: "Overview: TypeScript 개발자를 위한 다국어 리뷰 지도"
category: "orientation"
language: "both"
order: 0
summary: "Kotlin과 Go를 TypeScript 개발자의 기존 사고방식 위에 얹어 빠르게 리뷰하는 방법."
---

# Overview: TypeScript 개발자를 위한 다국어 리뷰 지도

이 가이드는 TypeScript/Node.js 개발자가 Kotlin과 Go 서버 코드를 빠르게 읽고 리뷰할 수 있도록 만든 공개용 문서다. 목표는 당장 모든 코드를 직접 작성하는 것이 아니라, AI나 동료가 작성한 코드를 검토하고 위험한 설계 결정을 알아볼 수 있는 수준까지 올라가는 것이다.

Alan 같은 제품 조직에서는 한 서비스 안에서도 TypeScript, Kotlin, Go가 함께 쓰일 수 있다. 언어 문법만 외우면 충분하지 않다. 각 언어가 선호하는 런타임 모델, 실패 처리 방식, 생태계 관성, 배포 방식까지 같이 봐야 한다.

## TypeScript 경험을 기준점으로 삼기

TypeScript/Node.js에서 익숙한 주요 과제는 다음이다.

- `async`/`await`, `Promise.all`, 이벤트 루프, 병렬 실행 순서
- 타입 선언과 런타임 schema validation의 간극
- DTO, domain model, API response shape 관리
- npm 생태계의 빠른 변화와 라이브러리 선택
- framework convention이 만드는 구조: Nest.js, Hono, Next.js

Kotlin과 Go도 같은 문제를 다루지만, 해법이 다르다.

| 관심사 | TypeScript/Node.js | Kotlin/Spring | Go |
|---|---|---|---|
| 실행 모델 | event loop + Promise | JVM thread + transaction | goroutine + blocking I/O |
| 타입 철학 | 구조적 타입, 점진적 타입 | null-safe 명목 타입 | 단순한 명목 타입 + implicit interface |
| 실패 처리 | throw/reject | exception + rollback | explicit `error` |
| API validation | Zod/class-validator 등 | Bean Validation + service rule | struct tag + validator + explicit checks |
| 좋은 코드의 중심 | async boundary와 schema | transaction, nullability, domain invariant | context, small interface, error path |

## Kotlin을 읽는 관점

Kotlin은 Java 생태계를 더 안전하고 간결하게 쓰기 위한 언어다. 서버 실무에서는 Spring Boot와 함께 쓰이는 경우가 많다. TypeScript 개발자에게는 "엄격한 타입과 JVM 런타임을 가진 Nest.js"처럼 보일 수 있지만, 실제 리뷰 포인트는 다음에 가깝다.

- nullable이 제거되는 경로가 명확한가?
- DTO, entity, domain model이 섞이지 않는가?
- `@Transactional` 경계가 맞는가?
- JPA lazy loading, proxy, entity lifecycle을 이해하고 있는가?
- 외부 I/O가 transaction 안에 들어가지 않는가?
- 예외가 일관된 API error로 변환되는가?

## Go를 읽는 관점

Go는 언어 기능을 의도적으로 작게 유지한다. 좋은 Go 코드는 똑똑한 추상화보다 명시적인 흐름을 선호한다. TypeScript에서 framework가 숨겨주는 일을 Go에서는 직접 wiring하는 경우가 많다.

- `if err != nil` 경로가 올바르게 처리되는가?
- `context.Context`가 request-scoped I/O까지 전달되는가?
- goroutine은 종료 조건과 backpressure를 갖는가?
- interface가 작고 consumer 쪽에 정의되는가?
- package boundary와 exported symbol이 과하지 않은가?
- timeout, body limit, graceful shutdown이 명시적인가?

## 이 가이드의 사용법

1. 문법 생김새는 `Syntax Map`에서 빠르게 맞춘다.
2. 타입과 모델링은 `Types and Modeling`에서 TypeScript schema 감각과 비교한다.
3. 실행 순서와 병렬성은 `Async and Concurrency`에서 확인한다.
4. Kotlin 코드는 `Kotlin Ecosystem`과 `Kotlin Spring Review Guide`를 함께 본다.
5. Go 코드는 `Go Ecosystem`과 `Go Service Review Guide`를 함께 본다.
6. AI가 만든 코드는 `AI Code Review Checklist`로 검토한다.

## 리뷰 목표

이 문서의 기준은 "언어다운 코드"와 "운영 가능한 서버 코드"다. 컴파일 성공만으로 충분하지 않다. public API contract, validation, observability, security, transaction safety, concurrency safety, testability를 같이 확인해야 한다.
