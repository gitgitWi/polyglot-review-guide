---
title: "Syntax Map: TypeScript에서 Kotlin/Go로"
category: "syntax"
language: "both"
order: 1
summary: "변수 선언, 함수 정의, 클래스와 구조체, 패키지 및 임포트, 접근 제어자(Visibility)를 TypeScript 기준으로 대조합니다."
---

# Syntax Map: TypeScript에서 Kotlin/Go로

## 변수 선언 (Variable Declaration)

TypeScript:

```ts
const name: string = "Alan";
let count = 0;
let maybeId: string | null = null;
```

Kotlin:

```kotlin
val name: String = "Alan"
var count = 0
var maybeId: String? = null
```

Go:

```go
var name string = "Alan"
count := 0
var maybeID *string = nil
```

리뷰 포인트:

- **Kotlin val의 재할당 제약**: Kotlin `val`은 참조(Reference)의 재할당을 금지할 뿐입니다. 객체 내부 필드가 가변(`var`)으로 선언되어 있다면 객체 내부 상태까지 불변(Immutable)으로 유지되지는 않는다는 점을 유념해야 합니다.
- **Kotlin Nullable 명시성**: Kotlin은 타입 시스템 수준에서 널 허용 여부를 구분합니다. 타입명 뒤에 `?`를 붙이며, 컴파일러 관점에서 논-널 타입인 `String`과 널러블 타입인 `String?`는 완전히 호환되지 않는 별개의 타입으로 취급됩니다.
- **Go의 옵셔널 값 표현**: Go에는 TypeScript의 유니온 타입(`string | null`)이나 Kotlin의 내장 널러블 타입이 없습니다. 옵셔널한 스칼라 값을 다룰 때는 포인터(Pointer), 명시적 유효성 판별 플래그, 널러블 래퍼 구조체(예: `sql.NullString`), 혹은 도메인 센티널 값(Sentinel Value) 중 비즈니스 요구에 부합하는 명확한 패턴을 적용했는지 확인해야 합니다.
- **Go 제로 값(Zero Value)**: Go는 선언 시 기본적으로 제로 값(`0`, `""`, `false`, `nil`)으로 초기화됩니다. 이 제로 값이 도메인 비즈니스 규칙상 올바르고 안전한 상태인지 반드시 확인해야 합니다.

---

## 함수 (Functions)

TypeScript:

```ts
function add(a: number, b: number): number {
  return a + b;
}

const label = (id: string) => `user:${id}`;
```

Kotlin:

```kotlin
fun add(a: Int, b: Int): Int {
    return a + b
}

fun label(id: String): String = "user:$id"
```

Go:

```go
func add(a int, b int) int {
	return a + b
}

func label(id string) string {
	return "user:" + id
}
```

리뷰 포인트:

- **Kotlin 단일 표현식 함수(Expression Body)**: `fun label(...) = ...` 형태의 단일 표현식 함수는 객체 변환이나 매핑 로직에 유용합니다. 하지만 내부에 다수의 부수효과(Side Effect)나 복잡한 조건 분기가 포함되어 있다면 가독성을 위해 전통적인 블록 본문(`{ ... }`) 형식으로 가다듬는 것이 좋습니다.
- **Go 오버로딩 부재**: Go 언어는 함수 및 메서드 오버로딩(Overloading)을 지원하지 않습니다. 따라서 동일한 성격의 행위라도 `Create`, `CreateWithTimeout`처럼 함수 이름 자체를 명확하고 구체적으로 구별하여 명명해야 합니다.
- **Go의 다중 반환값 관례**: Go는 처리 결과와 실패 여부를 `(Result, error)`와 같은 형태로 동시에 반환하는 구조를 선호합니다. 에러가 발생할 수 있는 잠재적 실패 경로가 함수 시그니처 자체에 드러나므로, 이를 무시하지 않고 처리했는지 점검해야 합니다.

---

## 클래스와 구조체 (Classes and Structs)

TypeScript:

```ts
class TenantService {
  constructor(private readonly repo: TenantRepository) {}
}
```

Kotlin:

```kotlin
@Service
class TenantService(
    private val tenantRepository: TenantRepository,
)
```

Go:

```go
type Handler struct {
	sender Sender
	log    *slog.Logger
}

func New(sender Sender, logger *slog.Logger) *Handler {
	return &Handler{sender: sender, log: logger}
}
```

리뷰 포인트:

- **Kotlin/Spring 생성자 주입**: Kotlin/Spring 환경에서는 별도의 `@Autowired` 없이 주 생성자 선언부에 의존성을 선언하는 생성자 주입(Constructor Injection) 형식을 사용합니다.
- **Go의 명시적 의존성 바인딩**: Go 생태계는 마법 같은 DI 프레임워크보다 명시적인 생성자 함수(`New`)와 구조체 결합(Composition)을 활용합니다. 의존 관계가 흐름상 투명하게 드러나고 테스트 시 대역 주입이 용이하도록 설계되었는지 점검합니다.
- **Go 포인터 리시버**: Go에서 정의되는 메서드 리시버 `func (h *Handler) Notify(...)`는 TypeScript의 클래스 메서드와 유사하게 이해할 수 있습니다. 상태 값의 변경 여부나 복사 비용에 따라 포인터 리시버(`*Handler`)와 값 리시버(`Handler`)가 구분되어 적절하게 사용되었는지 검토합니다.

---

## 패키지와 임포트 (Packages and Imports)

TypeScript:

```ts
import { TenantService } from "./tenant.service";
export class TenantController {}
```

Kotlin:

```kotlin
package com.example.admin.controller

import com.example.admin.service.TenantService
```

Go:

```go
package handler

import (
	"net/http"
	"github.com/go-chi/chi/v5"
)
```

리뷰 포인트:

- **Kotlin 패키지 구조**: Kotlin 패키지 경로는 물리적 디렉터리 경로와 일치시키는 것이 유지보수상 강력히 권장됩니다.
- **Go 패키지 경계와 디렉터리**: Go는 디렉터리 단위로 패키지가 결정됩니다. 하나의 동일한 디렉터리 아래에 존재하는 모든 `.go` 소스 파일은 동일한 패키지 선언을 가져야 합니다.
- **Go internal 폴더 규격**: Go 모듈 내의 `internal/` 폴더 하위에 정의된 패키지는 해당 모듈 외부에서 절대로 임포트할 수 없는 강력한 캡슐화 경계를 형성합니다. 외부 노출을 제어하기 위해 `internal/` 구조를 적절히 활용하고 있는지 확인합니다.

---

## 접근 제어자 (Visibility)

Kotlin:

```kotlin
private fun parse() {}
internal class DomainRule
class PublicService
```

Go:

```go
func PublicFunction() {}
func privateFunction() {}
type Handler struct {}
type sender interface {}
```

리뷰 포인트:

- **Kotlin 기본 접근 제어자**: Kotlin의 클래스 및 멤버의 기본 접근 제어자는 `public`입니다. 외부 노출이 불필요한 헬퍼 메서드나 유틸리티 클래스가 `private`으로 안전하게 감춰져 있는지 검증해야 합니다.
- **Kotlin internal의 범위**: `internal` 클래스 및 함수는 컴파일 단위(같은 Gradle 모듈) 내에서만 참조를 허용합니다. 모듈 경계를 분리하고 내부 상세 구현을 숨기는 수단으로 용이합니다.
- **Go의 대소문자 기반 식별자 노출**: Go에서는 식별자의 첫 글자가 대문자(예: `PublicFunction`, `Handler`)로 시작하면 패키지 외부로 노출(Exported)되며, 소문자(예: `privateFunction`, `sender`)로 시작하면 패키지 격리(Package-private) 처리됩니다. 불필요하게 외부 패키지로 식별자가 노출되어 불필요한 결합도를 높이고 있지는 않은지 확인합니다.
