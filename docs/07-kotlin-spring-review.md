---
title: "Kotlin Spring Review Guide"
category: "review"
language: "kotlin"
order: 7
summary: "Kotlin과 Spring Boot 프레임워크 환경에서 코드 리뷰를 진행할 때 컨트롤러, 서비스, 영속 엔티티, 트랜잭션 경계 및 단위 테스트를 진단하는 아키텍처 기준을 수립합니다."
---

# Kotlin Spring Review Guide

## 컨트롤러 레이어 (Controller Layer)

컨트롤러는 오직 웹 요청 규격을 해석하고 인가 권한을 판정하며 하부 서비스 레이어로 위임하는 일에만 전념해야 합니다. 비즈니스 세부 규칙이나 가공 연산이 여기에 침투하면 아키텍처 결합도가 급격히 높아집니다.

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

- **웹 단기 역할 위임**: 입력값 바인딩, 미니멀한 폼 형상 유효성 검증(`@Valid`), 그리고 사용자 인증 주체(Principal) 파싱까지만 수행하고 그 밖의 제어 흐름은 서비스 계층으로 내려보내는지 확인합니다.
- **Nullability 및 기본값 예외 대처**: 컨트롤러의 매개변수 선언부(`@RequestParam`, `@PathVariable` 등)에서 필수 유입 값 여부(`required = true`)와 널 허용 여부, 그리고 기본값 정의가 클라이언트 연동 규격과 엄격히 부합하는지 확인합니다.
- **영속성 객체의 직접 노출 전면 차단**: 영속성 엔티티(Entity) 객체를 절대로 API 응답(Response) DTO에 직접 매핑하여 반환하지 않도록 통제합니다. 이는 도메인 테이블 스키마 스펙 변화가 클라이언트 응답 규격을 깨뜨리고, 데이터베이스 커넥션이 열린 채 프레젠테이션 레이어로 넘어가 원하지 않는 지연 로딩(Lazy Loading) 쿼리를 연속 실행하는 성능 참사(Open Session in View 부작용)를 초래하기 때문입니다.

---

## 서비스 및 비즈니스 도메인 레이어 (Service Layer)

Spring의 Service 객체는 데이터베이스 트랜잭션의 명시적 시작 지점이자 비즈니스 도메인 유스케이스 구현의 종착지입니다.

```kotlin
@Service
@Transactional(readOnly = true)
class TenantService(...)
```

리뷰 포인트:

- **클래스 및 메서드 레벨 트랜잭션 튜닝**: 클래스 단위에는 읽기 전용 성능 최적화와 복제 DB 라우팅을 지원하기 위해 `@Transactional(readOnly = true)`를 광범위하게 깔아두고, 데이터 수정이 수반되는 구체 메서드 위에만 수동으로 `@Transactional`을 오버라이딩하여 가용성을 관리하고 있는지 점검합니다.
- **비즈니스 격리와 외부 I/O 배제**: 트랜잭션이 선언된 함수 스코프 내에서 오랜 지연이 발생하는 외부 HTTP 호출이나 푸시 알림 발송 로직이 실행되고 있지는 않은지 격리 여부를 봅니다.
- **멱등성 및 재시도 대처**: 동일 요청이 연이어 재입력될 때를 견디도록 멱등성 검증 플로우나 중복 검출 로직이 유스케이스 시작 부분에 탑재되어 있는지 진단합니다.

---

## 영속 데이터 엔티티 레이어 (JPA Entity Layer)

JPA 엔티티는 단순 데이터 구조물이 아닌 영속성 컨텍스트(Persistence Context)에 의해 지속적으로 상태 변화가 추적되고 관리되는 가변 수명 주기 객체(Mutable Lifecycle Object)입니다.

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

- **가변 상태 필드의 내부 캡슐화**: 엔티티의 상태 변경(Mutation)을 일으키는 setter 성격의 필드 수정이 서비스 계층 외부로 자유롭게 방치되지 않도록 접근 제어 범위를 닫아두고, 도메인 비즈니스 이유가 명시된 전용 행동 메서드를 제공하고 있는지 확인합니다.
- **널 대응성과 DB 스키마 일치**: 엔티티의 속성 필드가 가진 Nullable 타입 형태(`String?` 등)가 백엔드 데이터베이스 테이블의 실제 Null 허용 정보 및 비즈니스 정책의 무결성(Not null constraints)과 안전하게 대응되는지 대조합니다.
- **지연 로딩 에러 방어**: 트랜잭션 수명 주기가 닫힌 외부 컨트롤러나 로깅 필터 레이어에서 엔티티의 연관 관계 필드를 조회하다 `LazyInitializationException` 런타임 오류가 날 가능성이 없는지 식별하고 미리 Fetch Join으로 객체 그래프를 묶어 반환하도록 유도합니다.

---

## 코드 리뷰 시 주의 신호 (Warning Signals)

> [!WARNING]
> Kotlin 및 Spring MVC 코드 리뷰 중 발견 즉시 반드시 조치를 제안해야 하는 대표적인 결함들입니다.
>
> - **널 강제 단언 연산자 `!!` 사용**: 런타임 NullPointerException 크래시를 유발하는 위험 신호입니다.
> - **광범위한 에러 삼킴(Catching Exception)**: 오류의 원인 추적을 막고 영속성 롤백 정상 작동을 마비시키는 `catch (e: Exception)` 남용을 경계합니다.
> - **트랜잭션 스코프 내부의 외부 지연 I/O 연동**: 데이터베이스 커넥션 고갈을 촉발시키는 주요 성능 병목 요인입니다.
> - **DTO 생략 및 엔티티의 바깥 노출**: 아키텍처 캡슐화를 붕괴시키고 예기치 못한 필드 노출 보안 사고를 유발합니다.
