---
title: "Kotlin Idioms: JS/TS에 없는 문법"
category: "syntax"
language: "kotlin"
order: 6
summary: "sealed class, object, 확장 함수, by 위임, 스마트 캐스트, 연산자 오버로딩처럼 JavaScript/TypeScript에 대응물이 없어 처음 보면 추측하기 어려운 Kotlin 고유 문법을 읽는 법을 정리합니다."
tags: [syntax, idioms, null-safety, pattern-matching, extension-functions, delegation, scope-functions]
---

# Kotlin Idioms: JS/TS에 없는 문법

`Syntax Map`과 `Functions and Control Flow` 문서가 TypeScript와 1:1로 대응되는 문법을 다뤘다면, 이 문서는 **JavaScript/TypeScript에 대응물이 아예 없거나, 있더라도 의미가 달라서 처음 보면 오해하기 쉬운** Kotlin 고유 문법을 모았습니다. 코드 리뷰 중 "이 기호가 무슨 뜻이지?"라는 순간을 줄이는 것이 목표이며, 각 문법이 리뷰에서 어떤 신호가 되는지도 함께 짚습니다.

> [!NOTE]
> 여기 나오는 문법은 대부분 "읽기"에 초점을 둡니다. 직접 작성하지 않더라도, AI나 동료가 제안한 코드에서 이 패턴들이 무엇을 의도하는지 즉시 파악할 수 있어야 리뷰 속도가 붙습니다.

---

## 문자열 템플릿과 여러 줄 문자열

TypeScript의 백틱 템플릿 리터럴(`` `${x}` ``)과 유사하지만, Kotlin은 일반 큰따옴표 문자열 안에서 `$` 하나로 변수를 바로 끼워 넣습니다. 표현식은 `${ ... }`로 감쌉니다.

```kotlin
val name = "Alan"
val greeting = "Hello, $name (${name.length} chars)"

// 여러 줄 문자열은 삼중 따옴표. 이스케이프가 필요 없어 SQL, JSON 리터럴에 유용합니다.
val query = """
    SELECT id, email
    FROM users
    WHERE tenant_id = ?
""".trimIndent()
```

리뷰 포인트:

- **`$` 이스케이프 누락**: 통화 기호 등 실제 달러 문자를 출력해야 할 때는 `${'$'}` 또는 `\$`로 이스케이프해야 합니다. 로그 포맷 문자열에서 `$`가 의도치 않게 변수 참조로 해석되지 않는지 봅니다.
- **민감 정보 삽입**: 템플릿으로 토큰·비밀번호를 로그 문자열에 손쉽게 끼워 넣을 수 있으므로, PII가 그대로 문자열에 박제되는 경로가 없는지 확인합니다.

---

## 범위(Range)와 `in` 연산자

Kotlin에는 숫자·문자의 연속 구간을 값으로 표현하는 범위 문법이 있습니다. JS에는 대응물이 없어 `for (i in 0 until n)` 같은 코드를 처음 보면 낯섭니다.

```kotlin
for (i in 1..5) { }        // 1, 2, 3, 4, 5 (양끝 포함, closed range)
for (i in 0 until 5) { }   // 0, 1, 2, 3, 4 (끝 제외, half-open)
for (i in 10 downTo 1) { } // 10, 9, ... 1 (역순)
for (i in 0..10 step 2) { }// 0, 2, 4, ... 10

val ok = age in 18..64     // 범위 포함 검사 → boolean
val letter = c in 'a'..'z' // 문자 범위
if (name !in blockedList) { } // in / !in 은 컬렉션 멤버십 검사에도 사용
```

리뷰 포인트:

- **`..` vs `until` 경계 오류(Off-by-one)**: `1..n`은 n을 **포함**하고 `0 until n`은 n을 **제외**합니다. 인덱스 순회에서 이 둘을 혼동하면 마지막 원소 누락이나 `IndexOutOfBounds`가 발생하므로 경계 의도를 확인합니다.
- **`in`의 이중 의미**: `in`은 범위 포함 검사와 컬렉션 멤버십(`x in list`, 내부적으로 `contains`) 양쪽에 쓰입니다. 대상이 무엇인지 보고 의미를 구분합니다.

---

## 스마트 캐스트와 `is` / `as` / `as?`

TypeScript는 `typeof`/`instanceof`로 타입을 좁히면(narrowing) 이후 블록에서 자동으로 그 타입으로 취급합니다. Kotlin도 `is`로 검사하면 **스마트 캐스트**가 일어나 별도 캐스팅 없이 그 타입의 멤버에 접근할 수 있습니다.

```kotlin
fun describe(value: Any): String {
    if (value is String) {
        return "문자열 길이 ${value.length}" // 여기서 value는 String으로 스마트 캐스트됨
    }
    return "알 수 없음"
}

val n = obj as Int       // 강제 캐스트: 실패하면 ClassCastException(런타임 크래시)
val n2 = obj as? Int      // 안전 캐스트: 실패하면 예외 대신 null 반환
```

리뷰 포인트:

- **`as` 강제 캐스트 남용**: `as`는 TypeScript의 `as` 단언과 달리 런타임에 타입을 실제로 검사하며, 불일치 시 `ClassCastException`으로 크래시합니다. 외부·역직렬화 경계에서는 `as?` + 엘비스(`?:`)로 방어했는지 봅니다.
- **스마트 캐스트가 깨지는 경우**: 대상이 `var` **프로퍼티**이거나 커스텀 getter·다른 모듈의 프로퍼티(검사 이후 값이 바뀔 수 있어 컴파일러가 불변임을 증명하지 못하는 경우)면 스마트 캐스트가 적용되지 않습니다. 이때 억지로 `!!`를 붙이지 않고 지역 `val`에 담아 캐스트되도록 유도했는지 확인합니다.

---

## `when`: 인자 없는 형태와 타입 분기

`Functions and Control Flow` 문서에서 `when`을 값으로 쓰는 형태를 다뤘습니다. 여기서는 JS의 `switch`로는 표현할 수 없는 두 형태를 봅니다.

```kotlin
// (1) 인자 없는 when: if-else if 사슬을 표로 정리 — 각 분기가 boolean 조건
val grade = when {
    score >= 90 -> "A"
    score >= 80 -> "B"
    else -> "F"
}

// (2) is / in 을 조건으로 쓰는 when: 타입·범위로 분기하며 스마트 캐스트까지 동작
fun area(shape: Shape): Double = when (shape) {
    is Circle -> Math.PI * shape.radius * shape.radius // shape가 Circle로 캐스트됨
    is Rect -> shape.width * shape.height
}
```

리뷰 포인트:

- **`else` 없는 `when`의 안전성**: 대상이 `sealed`/`enum`이면 모든 경우를 나열했을 때 컴파일러가 완전성(exhaustiveness)을 보장하므로 `else`가 불필요합니다. 오히려 `else`를 두면 새 케이스 추가 시 컴파일 에러가 안 나 누락을 놓칩니다(아래 sealed class 참고).

---

## sealed class / sealed interface: 봉인된 계층

TypeScript는 `type Result = Success | Failure` 같은 **판별 유니온(discriminated union)**으로 "가능한 경우가 이게 전부"라고 표현합니다. Kotlin의 대응물이 `sealed`입니다. 하위 타입 집합이 컴파일 시점에 고정되어, `when`에서 모든 경우를 다뤘는지 컴파일러가 검증합니다.

```kotlin
sealed interface PaymentResult {
    data class Approved(val txId: String) : PaymentResult
    data class Declined(val reason: String) : PaymentResult
    data object Pending : PaymentResult
}

fun handle(result: PaymentResult): String = when (result) {
    is PaymentResult.Approved -> "승인: ${result.txId}"
    is PaymentResult.Declined -> "거절: ${result.reason}"
    PaymentResult.Pending -> "대기 중"
    // else 불필요: 새 하위 타입이 생기면 이 when이 컴파일 에러를 내며 누락을 알려줌
}
```

리뷰 포인트:

- **결과·상태 모델링에 `sealed` 활용**: 성공/실패, 주문 상태처럼 "정해진 경우의 집합"을 nullable 필드 조합이나 문자열 상수로 표현하고 있다면 `sealed`로 승격해 컴파일 시점 완전성을 확보하도록 제안합니다.
- **`when`에 방어적 `else`를 넣지 않았는지**: `sealed`의 최대 강점은 케이스 누락을 컴파일러가 잡아주는 것입니다. 습관적으로 넣은 `else -> throw ...`가 이 안전망을 무력화하지 않는지 봅니다.

---

## `object`와 `companion object`: 싱글톤과 정적 멤버

Kotlin에는 `static` 키워드가 없습니다. 대신 `object` 선언이 그 자리를 대신하며, JS의 클래스 문법만 알던 개발자에게는 가장 낯선 부분입니다.

```kotlin
// (1) object 선언: 그 자체로 스레드 안전한 싱글톤 인스턴스
object FeatureFlags {
    val betaEnabled = true
}
FeatureFlags.betaEnabled // 인스턴스 생성 없이 바로 접근

// (2) companion object: 클래스에 종속된 정적 멤버 / 팩토리
class Tenant private constructor(val id: String) {
    companion object {
        fun of(raw: String): Tenant = Tenant(raw.trim()) // 정적 팩토리 메서드
    }
}
Tenant.of("acme")

// (3) object 표현식: JS의 익명 객체/일회용 구현체에 해당 (자바의 익명 클래스)
val comparator = object : Comparator<Int> {
    override fun compare(a: Int, b: Int) = a - b
}
```

리뷰 포인트:

- **`object` 싱글톤의 가변 상태**: `object`는 애플리케이션 전역에서 공유되는 단일 인스턴스입니다. 그 안에 `var` 가변 상태를 두면 멀티 스레드 환경에서 경합(race)이 생깁니다. 전역 가변 상태가 숨어 있지 않은지 봅니다.
- **`companion object`와 DI의 충돌**: 정적 팩토리는 편리하지만, 여기서 리포지토리·클라이언트 같은 의존성을 직접 생성해 버리면 테스트에서 대역 주입이 불가능해집니다. 의존성은 생성자 주입으로 흐르는지 확인합니다.

---

## 확장 함수와 확장 프로퍼티 (Extension Functions)

기존 클래스를 상속·수정하지 않고 외부에서 메서드를 "붙이는" 문법입니다. JS의 프로토타입 확장(monkey-patching)과 겉모습은 비슷하지만, Kotlin의 확장은 **정적으로 디스패치**되며 원본 클래스를 실제로 변경하지 않습니다.

```kotlin
// String에 새 메서드를 붙이는 것처럼 보이지만, 실제로는 정적 함수의 문법 설탕
fun String.toSlug(): String = trim().lowercase().replace(" ", "-")

"Hello World".toSlug() // "hello-world"

// 확장 프로퍼티
val String.wordCount: Int get() = trim().split("\\s+".toRegex()).size
```

리뷰 포인트:

- **정적 디스패치로 인한 오해**: 확장 함수는 **선언된 정적 타입** 기준으로 결정됩니다. 다형성(오버라이드)이 동작하지 않으므로, 부모 타입 변수로 호출하면 부모의 확장이 불립니다. 다형적 동작이 필요한 곳에 확장을 쓰지 않았는지 봅니다.
- **`null` 수신 확장의 의도**: `fun String?.orEmpty()`처럼 nullable 수신 객체에 붙인 확장은 `null`에도 호출됩니다. 이것이 의도된 널 처리인지, 아니면 널 검사를 우회하는 것인지 구분합니다.
- **가시성과 위치**: 도메인 핵심 로직이 여기저기 흩어진 최상위 확장 함수로 새어 나가 응집도를 해치고 있지 않은지, 확장의 스코프(`private`/파일 국소)가 적절한지 확인합니다.

---

## 위임 (`by`): 프로퍼티 위임과 클래스 위임

`by` 키워드는 "이 프로퍼티/인터페이스 구현을 다른 객체에게 맡긴다"는 뜻입니다. JS에는 대응 문법이 없어 처음 보면 가장 해독하기 어려운 기호 중 하나입니다.

```kotlin
// (1) 프로퍼티 위임 — by lazy: 최초 접근 시 한 번만 계산 후 캐시 (스레드 안전 기본값)
val config: Config by lazy { loadConfigExpensively() }

// (2) 프로퍼티 위임 — Delegates.observable: 값 변경을 가로채 후처리
var status: String by Delegates.observable("init") { _, old, new ->
    log.info("status: $old -> $new")
}

// (3) 클래스 위임 — 인터페이스 구현을 멤버 객체에게 통째로 위임 (상속 대신 조합)
class LoggingList<T>(private val inner: MutableList<T>) : MutableList<T> by inner {
    override fun add(element: T): Boolean {
        log.info("add $element"); return inner.add(element)
    }
}
```

리뷰 포인트:

- **`by lazy`의 초기화 시점**: 지연 초기화는 최초 접근 스레드에서 실행됩니다. 무거운 I/O나 예외를 던질 수 있는 로직이 예상치 못한 시점(첫 요청 처리 중)에 실행되지 않는지, 초기화 실패가 매 접근마다 반복되지 않는지 확인합니다.
- **클래스 위임의 숨은 메서드**: `by inner`로 위임하면 오버라이드하지 않은 모든 메서드가 그대로 내부 객체로 전달됩니다. 로깅·검증을 의도한 래퍼라면 우회 경로(오버라이드 안 한 메서드)로 빠져나가는 호출이 없는지 봅니다.

---

## 명명 인자와 기본 인자 (Named & Default Arguments)

Kotlin은 함수 오버로딩 대신 기본값과 명명 인자를 선호합니다. 특히 명명 인자는 JS에 없어, 호출부에서 `param = value` 문법을 처음 보면 대입으로 오해할 수 있습니다.

```kotlin
fun createUser(
    email: String,
    active: Boolean = true,      // 기본값
    role: Role = Role.MEMBER,
) { }

createUser("a@x.com")                       // 기본값 사용
createUser("a@x.com", role = Role.ADMIN)    // 명명 인자로 특정 파라미터만 지정
createUser(email = "a@x.com", active = false)
```

리뷰 포인트:

- **불리언 양의 위치 인자(Boolean trap)**: `createUser("a@x.com", false, ...)`처럼 의미 없는 `true/false`가 나열되면 가독성이 떨어지고 순서 실수가 생깁니다. 명명 인자로 의도를 드러내도록 제안합니다.
- **기본값과 오버로드 노출**: 자바에서 이 함수를 호출한다면 기본 인자가 자동 적용되지 않습니다(`@JvmOverloads` 필요). Java Interop 경계에서 오버로드 누락이 없는지 확인합니다.

---

## 구조 분해, `componentN`, `Pair`/`Triple`, `to`

TypeScript의 구조 분해는 **이름**(객체) 또는 **위치**(배열) 기반입니다. Kotlin은 `component1()`, `component2()` … 연산자를 **위치 기반**으로 호출해 분해합니다. `data class`와 `Map.Entry`가 대표적으로 이를 제공합니다.

```kotlin
val (id, email) = user           // user.component1(), user.component2()
for ((key, value) in map) { }     // Map.Entry 구조 분해

val pair = "key" to 42            // infix 함수 to → Pair("key", 42)
val (k, v) = pair
```

리뷰 포인트:

- **위치 기반 분해의 취약성**: `data class`의 프로퍼티 **순서**로 분해되므로, 필드 순서를 바꾸면 이름은 같아도 값이 뒤바뀝니다. 넓은 스코프에서 구조 분해를 남용하면 리팩터링 위험이 커집니다.
- **`Pair`/`Triple` 남용**: 익명 `Pair<String, Int>`가 시그니처에 노출되면 각 자리의 의미를 알 수 없습니다. 도메인 의미가 있으면 이름 있는 `data class`로 승격하도록 제안합니다.

---

## 연산자 오버로딩과 `infix`

Kotlin은 정해진 이름의 함수를 정의해 `+`, `[]`, `()` 같은 연산자를 오버로딩할 수 있고, `infix`로 점·괄호 없는 중위 호출을 만들 수 있습니다. JS에는 없는 문법이라 `money1 + money2`가 커스텀 로직일 수 있음을 알아야 합니다.

```kotlin
data class Money(val cents: Long) {
    operator fun plus(other: Money) = Money(cents + other.cents) // a + b
    operator fun get(index: Int) = /* ... */                     // a[index]
}

infix fun Int.repeatedly(action: () -> Unit) { repeat(this) { action() } }
3 repeatedly { println("hi") } // 중위 호출
```

리뷰 포인트:

- **연산자의 의미 왜곡**: `+`, `*` 같은 연산자를 직관과 다른 동작(부수효과, 비가환 연산)에 오버로딩하면 오히려 코드를 오해하게 만듭니다. 관례에 맞는 순수 연산인지 봅니다.
- **`infix` 가독성**: 중위 표기는 DSL에서는 우아하지만 남용하면 호출 관계가 흐려집니다. 표준 라이브러리의 `to`, `until` 수준을 넘어서는 커스텀 infix가 팀에 공유된 관례인지 확인합니다.

---

## `==` vs `===`: JavaScript와 뒤바뀐 동등성

가장 위험한 함정입니다. **JS와 의미가 반대**입니다.

| 연산자 | JavaScript | Kotlin |
| --- | --- | --- |
| `==` | 느슨한 동등(형 변환) | **구조적 동등** — `equals()` 호출 |
| `===` | 엄격한 동등(형 일치) | **참조 동등** — 같은 인스턴스인지 |

```kotlin
val a = Money(100)
val b = Money(100)
a == b   // true  — 값이 같음 (data class의 equals)
a === b  // false — 서로 다른 인스턴스
```

리뷰 포인트:

- **`===`를 JS 습관으로 값 비교에 사용**: JS의 `===`(엄격 비교)를 그대로 옮겨와 값 비교에 `===`를 쓰면, 값이 같아도 다른 인스턴스면 `false`가 되어 미묘한 버그가 됩니다. 값 비교는 `==`가 정답입니다.
- **`equals()` 미구현 클래스의 `==`**: 일반 `class`(data class 아님)는 `equals()`가 참조 비교로 기본 동작하므로 `==`도 참조 비교가 됩니다. 값 동등이 필요하면 `data class`이거나 `equals` 구현이 있는지 확인합니다.

---

## `Unit`, `Nothing`, 그리고 라벨 반환(`return@`)

```kotlin
fun log(msg: String): Unit { }     // Unit ≈ void/undefined. 값을 반환하지 않음
fun fail(): Nothing = throw Error() // Nothing: 절대 정상 반환하지 않는 타입

// 람다 안에서의 return: 어디로 반환되는가?
list.forEach {
    if (it == 0) return@forEach // 이 람다 한 번만 건너뜀 (continue처럼)
    process(it)
}
```

리뷰 포인트:

- **`Nothing`의 의미 활용**: `?: throw ...`나 `?: return`의 우변이 `Nothing`이기 때문에 엘비스 연산자가 널을 제거하고도 타입 추론이 유지됩니다. 커스텀 실패 함수의 반환 타입이 `Nothing`으로 되어 있으면 스마트 캐스트/널 제거가 이어집니다.
- **비지역 반환(non-local return) 혼동**: 인라인 람다(예: `forEach`) 안의 맨 `return`은 **바깥 함수 전체**를 종료시킵니다. 루프 한 번만 건너뛰려는 의도라면 `return@forEach`를 썼는지 확인합니다. 이 차이가 조기 종료 버그의 원인이 됩니다.

---

## 제네릭 변성(`out`/`in`), `reified`, 스타 프로젝션

TypeScript의 제네릭 변성은 대체로 암묵적·구조적입니다. Kotlin은 선언 지점에서 `out`(공변, 생산자)·`in`(반공변, 소비자)을 명시합니다.

```kotlin
interface Producer<out T> { fun next(): T }   // T를 반환만 함 → 공변
interface Consumer<in T> { fun accept(t: T) } // T를 받기만 함 → 반공변

inline fun <reified T> Gson.fromJson(json: String): T = // reified: 런타임에 타입 유지
    fromJson(json, T::class.java)

fun printAll(list: List<*>) { }               // 스타 프로젝션: 원소 타입 무관
```

리뷰 포인트:

- **`reified`와 타입 소거**: JVM은 제네릭 타입을 런타임에 지웁니다(type erasure). `reified`(+`inline`)로만 `T::class` 같은 런타임 타입 접근이 가능합니다. 리플렉션·역직렬화 헬퍼가 이를 올바로 쓰는지 봅니다.
- **`in`/`out` 방향 오류**: 변성 선언이 실제 사용(생산/소비)과 어긋나면 컴파일 에러 또는 불필요한 캐스팅을 부릅니다. 대체로 읽기 전용 컬렉션 반환에는 `out`이 자연스럽습니다.

---

## `lateinit`, `by lazy`, 그리고 초기화

```kotlin
lateinit var repo: TenantRepository // 나중에 반드시 초기화된다고 컴파일러에 약속 (non-null)
val cache by lazy { buildCache() }   // 최초 접근 시 초기화
```

리뷰 포인트:

- **`lateinit` 접근 시점**: 초기화 전에 접근하면 `UninitializedPropertyAccessException`으로 크래시합니다. 프레임워크 주입(테스트 셋업 등)에 의존하는 `lateinit`이 모든 경로에서 초기화 후 접근되는지, 원시 타입엔 쓸 수 없다는 점(그럴 땐 `by lazy` 또는 nullable)을 지켰는지 봅니다.
- **`lateinit` 대신 생성자 주입**: 스프링 빈이라면 대부분 `lateinit` 필드 주입보다 생성자 주입이 안전합니다. 불필요한 `lateinit`이 널 안전성을 우회하고 있지 않은지 확인합니다.

---

## 전제조건 함수: `require`, `check`, `requireNotNull`

예외를 던지는 방어 코드를 표준 함수로 간결하게 표현합니다. 이름에 따라 던지는 예외가 다릅니다.

```kotlin
fun withdraw(amount: Long) {
    require(amount > 0) { "amount must be positive" } // 실패 → IllegalArgumentException (인자 검증)
    check(balance >= amount) { "insufficient balance" } // 실패 → IllegalStateException (상태 검증)
    val user = requireNotNull(currentUser) { "no user" } // null이면 예외, 아니면 non-null로 스마트 캐스트
}
```

리뷰 포인트:

- **`require` vs `check` 구분**: `require`는 **입력 인자**의 계약 위반(호출자 잘못 → 400 계열), `check`는 **객체 상태**의 불변식 위반(내부 로직 잘못 → 500 계열)에 씁니다. 의미에 맞게 골랐는지 보면 에러의 책임 소재가 명확해집니다.
- **전제조건과 비즈니스 검증 혼동**: 사용자에게 정돈된 메시지를 돌려줘야 하는 도메인 검증을 `require`의 `IllegalArgumentException`으로 처리하면, 전역 예외 핸들러가 이를 400으로 일괄 변환해 세밀한 에러 코드를 잃을 수 있습니다. 도메인 커스텀 예외와의 경계를 확인합니다(`Validation and Errors` 참고).

---

## 다음 문서

- 코루틴(`suspend`/`launch`/`async`) 문법과 동시성 모델은 `Async and Concurrency`에서 다룹니다.
- 이 문법들이 실제 Spring 아키텍처에서 어떻게 쓰이고 어디서 문제가 되는지는 `Kotlin Ecosystem`과 `Kotlin Spring Review Guide`로 이어집니다.
