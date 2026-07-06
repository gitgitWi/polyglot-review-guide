---
title: "AI Code Review Checklist"
category: "review"
language: "both"
order: 10
summary: "AI가 작성한 Kotlin/Go 코드를 리뷰할 때 빠뜨리기 쉬운 항목을 언어별로 점검한다."
---

# AI Code Review Checklist

AI가 작성한 코드는 문법적으로 그럴듯하지만 경계 조건, 운영 제약, 기존 아키텍처 관성을 놓치기 쉽다. 리뷰는 "컴파일되는가"보다 "이 시스템의 규칙을 지키는가"에 맞춘다.

## 공통 체크

- 기존 프로젝트의 dependency와 패턴을 따르는가?
- 새 라이브러리를 추가했다면 여러 명확한 이점이 있는가?
- request validation, domain validation, DB constraint 책임이 분리되어 있는가?
- happy path뿐 아니라 validation failure, auth failure, duplicate request, timeout, partial failure를 다루는가?
- log에 credential, token, PII가 들어가지 않는가?
- 테스트가 실제 버그를 잡을 수 있는 assertion을 갖는가?
- generated code, migration, OpenAPI, docs와 drift가 없는가?

## Kotlin/Spring 체크

- `@Transactional` 경계가 맞는가?
- write method에 transaction이 빠지지 않았는가?
- read-only transaction에서 entity mutation이 일어나지 않는가?
- transaction 내부에 외부 HTTP/SDK/email/push 호출이 없는가?
- `!!`, broad catch, `runCatching` 남용이 없는가?
- nullable field가 DB schema와 business rule을 정확히 반영하는가?
- `@Valid`와 DTO annotation이 실제 controller path에서 실행되는가?
- exception이 global handler에서 올바른 HTTP status/error code로 변환되는가?
- JPA entity를 API response로 직접 노출하지 않는가?

## Go 체크

- 모든 `err`가 처리되는가?
- error wrapping에 `%w`를 사용해 cause를 보존하는가?
- HTTP handler가 error response 후 return하는가?
- `r.Context()`가 downstream I/O까지 전달되는가?
- request body size, server timeout, shutdown timeout이 있는가?
- goroutine lifecycle이 context나 channel로 닫히는가?
- channel이 unbuffered/blocking일 때 deadlock 가능성이 없는가?
- exported symbol이 불필요하게 많지 않은가?
- struct tag와 validation schema가 실제 JSON field와 맞는가?
- fake/test seam을 위한 interface가 작고 consumer 쪽에 있는가?

## 리뷰 질문 템플릿

- 이 코드의 실패 경로는 어디로 흐르는가?
- 같은 요청이 두 번 들어오면 어떻게 되는가?
- timeout/cancel이 걸리면 어떤 resource가 정리되는가?
- transaction 또는 goroutine이 예상보다 오래 살아남을 수 있는가?
- 타입은 domain 의미를 충분히 보존하는가?
- 테스트가 이 변경의 가장 위험한 가정을 검증하는가?
