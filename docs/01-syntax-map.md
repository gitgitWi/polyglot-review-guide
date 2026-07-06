---
title: "Syntax Map: TypeScript에서 Kotlin/Go로"
category: "syntax"
language: "both"
order: 1
summary: "변수, 함수, 클래스, 패키지, import, visibility를 TypeScript 기준으로 비교한다."
---

# Syntax Map: TypeScript에서 Kotlin/Go로

## 변수 선언

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

- Kotlin `val`은 reference 재할당 금지다. 객체 내부까지 immutable이라는 뜻은 아니다.
- Kotlin nullable은 타입에 `?`가 붙는다. `String`과 `String?`는 다른 타입이다.
- Go에는 일반적인 union type이 없다. optional scalar는 pointer, separate boolean, nullable wrapper, domain sentinel 중 하나를 골라야 한다.
- Go zero value는 설계 요소다. `0`, `""`, `false`, `nil`이 domain에서 유효한 값인지 확인한다.

## 함수

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

- Kotlin expression body는 mapping 함수에 잘 맞는다. 부수효과가 많으면 block body가 낫다.
- Go는 overload가 없다. 이름을 더 구체적으로 붙인다.
- Go는 `(value, error)` 반환이 흔하다. 실패 경로가 signature에 드러난다.

## 클래스와 구조체

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

- Kotlin/Spring은 constructor injection이 일반적이다.
- Go는 framework DI보다 explicit constructor와 composition을 많이 쓴다.
- Go method receiver `func (h *Handler) Notify(...)`는 class method처럼 읽으면 된다.

## 패키지와 import

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

- Kotlin package는 디렉토리와 보통 맞지만 언어적으로 강제되지는 않는다.
- Go package는 디렉토리 단위다. 같은 디렉토리의 `.go` 파일은 같은 package여야 한다.
- Go `internal/` 디렉토리는 외부 module import를 막는 실질적 경계다.

## Visibility

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

- Kotlin 기본 visibility는 public이다. helper는 `private`인지 확인한다.
- Kotlin `internal`은 같은 module 안에서만 보인다.
- Go는 대문자로 시작하면 exported, 소문자로 시작하면 package-private이다.
- public/exported surface가 클수록 compatibility 비용이 커진다.
