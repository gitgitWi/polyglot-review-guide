---
title: "Kotlin Ecosystem"
category: "ecosystem"
language: "kotlin"
order: 6
summary: "Kotlin 서버 개발에서 자주 만나는 JVM, Spring, Ktor, Gradle, ORM, 테스트 생태계."
---

# Kotlin Ecosystem

Kotlin은 언어 자체보다 JVM 생태계와 함께 이해해야 한다. 서버 프로젝트 대부분은 Java library, Gradle build, Spring Boot 또는 Ktor, JDBC/JPA/jOOQ, JUnit/Testcontainers를 조합한다.

## JVM과 Java interop

Kotlin은 JVM 위에서 실행된다. Java library를 거의 그대로 사용할 수 있고, Java 코드와 Kotlin 코드가 같은 프로젝트에 섞일 수 있다.

리뷰 포인트:

- Java API가 반환하는 값은 Kotlin 타입상 non-null이어도 실제 null일 수 있다.
- Java checked exception은 Kotlin에서 강제되지 않는다.
- reflection, annotation processing, proxy 기반 framework가 Kotlin의 final class 기본값과 충돌할 수 있다.

## Spring Boot

Kotlin 서버에서 가장 흔한 선택이다.

주요 구성:

- `@RestController`, `@Service`, `@Repository`
- constructor injection
- `@ConfigurationProperties`
- `@Transactional`
- Bean Validation
- Spring Security
- Actuator, Micrometer

리뷰 포인트:

- controller는 얇고 service가 business rule을 가져야 한다.
- `@Transactional`은 proxy 기반이므로 self-invocation 제약을 이해해야 한다.
- Kotlin class는 기본 final이므로 Spring plugin 또는 all-open 설정이 필요할 수 있다.
- `lateinit`과 nullable property로 configuration 문제를 숨기지 않는지 본다.

## Ktor

Ktor는 Spring보다 가벼운 Kotlin-native web framework다. coroutine 기반 API와 명시적인 routing이 특징이다.

리뷰 포인트:

- plugin 설치 순서와 route scope를 확인한다.
- coroutine cancellation과 blocking call 혼용을 본다.
- Spring처럼 많은 convention을 제공하지 않으므로 explicit wiring 품질이 중요하다.

## Persistence

Kotlin 서버에서 자주 쓰는 선택지:

- JPA/Hibernate: entity lifecycle, lazy loading, dirty checking
- jOOQ: type-safe SQL, 명시적 query, schema 중심
- Exposed: Kotlin DSL 기반 ORM/SQL toolkit
- JDBC/R2DBC: 낮은 수준의 직접 접근

리뷰 포인트:

- JPA entity와 API DTO가 분리되어 있는가?
- N+1 query, lazy loading boundary, transaction scope를 확인했는가?
- jOOQ를 쓴다면 generated code와 migration이 동기화되는가?
- money/ledger 성격의 도메인은 lock order와 transaction isolation이 명시적인가?

## Build and Tooling

Kotlin 프로젝트는 대개 Gradle Kotlin DSL을 쓴다.

리뷰 포인트:

- Kotlin, Java toolchain, Spring Boot version이 호환되는가?
- annotation processing 또는 KSP/kapt 설정이 필요한 library가 있는가?
- dependency version drift가 없는가?
- build script에 secret이 들어가 있지 않은가?

## Testing

일반적인 조합:

- JUnit 5
- Spring Boot Test
- MockK 또는 Mockito Kotlin
- Testcontainers
- Kotest property testing

리뷰 포인트:

- controller mapping, validation, security gate를 slice test로 확인하는가?
- service invariant와 transaction behavior를 integration test로 확인하는가?
- DB query는 실제 DB 또는 Testcontainers로 검증하는가?
- property-based test가 domain invariant를 잘 표현하는가?
