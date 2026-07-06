---
title: "Validation and Errors"
category: "api"
language: "both"
order: 5
summary: "TypeScript의 스키마 검증 및 예외 제어 감각을 Kotlin/Spring의 선언적 유효성 검증과 Go의 명시적 에러 파이프라인으로 이식합니다."
---

# Validation and Errors

## TypeScript 환경의 기준점

TypeScript 컴파일 타임의 타입 정의는 빌드 결과물인 자바스크립트 파일에 아무런 런타임 영향력을 주지 못합니다. 이에 따라 백엔드 유입 데이터의 구조를 실제로 단단하게 격리 보호하기 위해서 Zod, Valibot, class-validator 등 런타임 스키마 유효성 검증(Schema Validation) 도구를 필수로 사용하게 됩니다.

```ts
const Body = z.object({
  title: z.string().min(1),
  tokenList: z.array(z.string()).min(1),
});
```

Kotlin과 Go 환경도 역시 JSON 원시 문자열 데이터를 파싱하여 인스턴스 객체에 주입할 때, 단순 언어 레벨의 타입 바인딩 시도만으로는 내부 프로퍼티의 값 제약(최소/최대 크기, 정규식 구조 등)까지 원천 방어하지 못합니다. 역직렬화 수행 즉시 페이로드 규격을 검증하는 전문적인 검증 계층을 마련해 두어야 안전합니다.

---

## Kotlin/Spring 선언적 유효성 검증

Kotlin Spring MVC 환경에서는 입력 DTO 객체 정의에 Jakarta Bean Validation 애노테이션(`@NotNull`, `@NotBlank`, `@Size` 등)을 선언하고, 컨트롤러 진입부 파라미터 영역에 `@Valid` 지시어를 붙여 데이터 필터링을 프레임워크가 가로채어 사전 대행하도록 구성하는 패턴이 핵심입니다.

```kotlin
@PostMapping
fun createTenant(@Valid @RequestBody request: CreateTenantRequest): TenantResponse =
    tenantService.createTenant(request)
```

리뷰 포인트:

- **검증 트리거 누락 여부**: 컨트롤러 초입 매개변수 앞에 `@Valid` 또는 `@Validated` 선언이 생략되는 실수로 인해 DTO 객체 내부에 걸어둔 모든 유효성 조건문들이 작동하지 않고 서비스 하위 레이어로 그대로 깨끗하게 패싱되어 들어가는 사각지대를 예방합니다.
- **Nullability와 검증 애노테이션의 부조화 정돈**: Kotlin의 Null-Safe 타입 규칙과 Jakarta Validation 애노테이션의 검증 범위가 어색하게 상충하는 지점이 없는지 봅니다. (예: Non-null인 `String` 타입에 굳이 `@NotNull`을 붙이거나, Nullable인 `String?`로 설정해놓고서 필수 필드인 것처럼 오해하고 있지는 않은지 대조)
- **Enum 매핑 가로채기 실패 대응**: 컨트롤러 파라미터 수준에서 문자열을 Enum 타입으로 바로 치환하려고 시도(예: Jackson의 기본 컨버터 작동)하면, 규격 외 값 인입 시 어색한 서버 프레임워크 자체의 디코딩 예외 응답(Jackson 파싱 오류 등)이 노출되어 에러 디테일을 세련되게 반환하기 어려우므로, 컨트롤러 수준에서는 DTO 문자열로 안전하게 받아온 후 서비스 변환 단계에서 도메인에 부합하는 적절한 예외 메시지를 태워 수동 매핑했는지 확인합니다.
- **비즈니스 도메인 검증의 위치 구분**: 단순 값 규격 검증(예: 최소 3글자 이상 등)은 DTO 레이어에 두고, 데이터베이스 상태나 다른 테이블 레코드와 결합된 복잡한 비즈니스 규칙(예: 이미 가입된 이메일 유무) 등은 컨트롤러의 DTO 검증기가 아닌 비즈니스 서비스 도메인 내부에서 검증하도록 확실히 위치가 분할되어 있는지 검증합니다.

---

## Kotlin 예외(Exception) 전파와 API 표준 에러

Spring 백엔드 환경에서는 비즈니스 검증 실패 시 호출 스택을 따라 특정한 도메인 커스텀 예외(Exception)를 즉시 던지고, 이를 최상단의 Global Exception Handler(`@ControllerAdvice`)가 요격하여 공통 규격의 HTTP JSON 오류 응답으로 안전하게 정돈하여 브라우저에 반환해주는 아키텍처 패턴이 정석입니다.

리뷰 포인트:

- **예외 계층 및 HTTP 상태 코드 분리**: 도메인 유효성 실패나 비즈니스 경합 상황(예: 이미 생성된 리소스)을 모조리 generic 500이나 어색한 400 코드로 퉁쳐서 응답하지 않고, 비즈니스 상황에 부합하는 명확한 HTTP Status(예: `409 Conflict`, `422 Unprocessable Entity` 등) 및 전용 에러 코드 사전을 만들어 상세 메시지를 리턴하고 있는지 봅니다.
- **예외 삼킴에 의한 트랜잭션 롤백 무산 검출**: `@Transactional`이 선언된 서비스 호출 스택 내부에서 특정 예외를 억지로 잡아서 뭉개거나(`try-catch` 이후 무시) 적절한 커스텀 에러로 재발행(Re-throw)하지 않고 삼켜 버리면, 하부 데이터베이스 영속 계층은 이미 트랜잭션 마크다운(Rollback-only) 처리가 되어 있음에도 불구하고 무리하게 커밋을 유도하다 더 큰 시스템 충돌을 야기하므로 주의 깊게 봅니다.

---

## Go 구조체 태그 기반 유효성 검증

Go 서비스 환경에서는 JSON 파싱을 마친 Request struct 변수를 구조체 태그에 걸어둔 유효성 명세를 바탕으로 라이브러리(예: `github.com/go-playground/validator`)를 통해 명시적 조건식으로 실행하는 방식이 보편적입니다.

```go
type MarketingPushRequest struct {
	Title     string   `json:"title" validate:"required"`
	TokenList []string `json:"token_list" validate:"min=1"`
}
```

리뷰 포인트:

- **JSON 및 유효성 태그 무결성 점검**: API 규격 명세상의 키값과 구조체 내부 태그의 문자열이 어긋나서 디코딩이 유실되지 않는지 교차 모니터링합니다.
- **체계적인 에러 필드 반환**: 단순 400 Bad Request 문구만 딸랑 던져주기보다는, 오류가 발생한 구체적 필드 경로(`fields[0].path = title`)와 세부 원인이 클라이언트 프론트엔드 유효성 폼 컴포넌트까지 객체 트리 구조로 온전히 전송되는 구조인지 확인합니다.

---

## Go 명시적 에러 처리

Go 환경에서는 호출 스택을 거치는 예외 전파 방식이 없으므로, 에러를 수집하고 래핑하여 리턴하는 전 경로를 명시적으로 조작하고 의미를 부여해야 합니다.

```go
if err != nil {
	return fmt.Errorf("init messaging client: %w", err)
}
```

리뷰 포인트:

- **원인 에러 보존 및 전파**: 하위 시스템에서 넘어오는 에러에 호출 문맥 정보(Context)를 덧붙여 상위 레이어로 다시 버블링할 때는 `%w` 포맷 지정자를 사용한 wrapping 구조를 갖추어, 에러 전파 루트가 디버깅 기록에 명징하게 흐를 수 있게 설계되었는지 봅니다.
- **로그 및 보안 감사 준수**: 장애 추적에 절실한 고유 식별 컨텍스트는 로그에 실어 주어야 마땅하지만, 사용자 인가 토큰, 암호키, 패스워드, 이메일 등의 주요 보안 대상 값(PII)이 마스킹 필터 없이 적나라하게 파일 로그에 남겨지고 있지는 않은지 검증합니다.
- **비즈니스 에러 식별 편의성**: 상단 API 핸들러 영역에서 특정 예외 원인을 분석할 때, `errors.Is(err, ErrDuplicateEntry)` 혹은 `errors.As` API 등을 사용해 타입 안전하게 에러 카테고리를 분기하여 알맞은 HTTP 응답을 쓰고 있는지 봅니다.
