---
title: "Go Idioms: JS/TS에 없는 문법"
category: "syntax"
language: "go"
order: 9
summary: "포인터와 nil, 구조체 임베딩, 암시적 인터페이스와 typed nil 함정, 타입 스위치, iota, 슬라이스 공유 백킹 배열, 채널과 select 등 JavaScript/TypeScript에 대응물이 없어 처음 보면 추측하기 어려운 Go 고유 문법을 정리합니다."
tags: [syntax, idioms, structs, interfaces, channels, generics, error-handling]
---

# Go Idioms: JS/TS에 없는 문법

`Syntax Map`과 `Functions and Control Flow`가 TypeScript와 대응되는 Go 문법을 다뤘다면, 이 문서는 **JavaScript/TypeScript에 대응물이 없거나 의미가 달라 처음 보면 오해하기 쉬운** Go 고유 문법을 모았습니다. Go는 문법이 작지만, 포인터·슬라이스·인터페이스·채널처럼 JS에는 개념 자체가 없는 영역이 있어 이 부분에서 리뷰어가 자주 막힙니다.

> [!NOTE]
> `defer`, `if err != nil`, 조기 반환은 `Functions and Control Flow`에서, 고루틴·컨텍스트·에러 래핑(`%w`)은 `Async and Concurrency`·`Validation and Errors`에서 다룹니다. 이 문서는 그 밖의 "낯선 기호"들에 집중합니다.

---

## `:=`, 제로 값, 그리고 변수 섀도잉

`:=`는 선언과 대입을 동시에 하는 단축 문법이며, 타입은 우변에서 추론됩니다. `=`는 이미 선언된 변수에 대한 재대입입니다. 이 둘의 혼동이 미묘한 버그를 만듭니다.

```go
count := 0            // 선언 + 대입 (타입 추론: int)
var name string       // 선언만 → 제로 값 "" 로 초기화

if v, err := load(); err == nil {
    use(v)            // v, err 는 이 if 블록 스코프에만 존재
}
```

리뷰 포인트:

- **`:=`로 인한 변수 섀도잉**: 안쪽 블록에서 `err :=`를 다시 쓰면 바깥 `err`를 가리는 **새 변수**가 만들어집니다. 바깥에서 확인하려던 에러가 안쪽 그림자에 갇혀 항상 `nil`로 보이는 버그를 특히 조심합니다(`go vet`, `shadow` 린터로 탐지).
- **제로 값이 유효 상태인지**: 선언만 하면 숫자는 `0`, 문자열은 `""`, 불리언은 `false`, 포인터·슬라이스·맵·인터페이스는 `nil`입니다. 이 제로 값이 "미설정"과 "값이 0"을 구분해야 하는 도메인에서 안전한지 확인합니다(`Syntax Map`의 제로 값 항목 참고).

---

## 명명 반환값(Named Returns)과 naked return

Go 함수는 반환값에 **이름**을 붙일 수 있습니다. 이름 붙은 반환값은 함수 시작 시 제로 값으로 선언되며, 인자 없는 `return`(naked return)으로 현재 값을 그대로 반환합니다.

```go
func split(sum int) (x, y int) { // x, y 가 반환값으로 미리 선언됨
    x = sum * 4 / 9
    y = sum - x
    return // naked return → 현재 x, y 반환
}
```

가장 흔한 용도는 `defer`에서 반환 에러를 후처리하는 것입니다.

```go
func process() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r) // 명명 반환값이라 defer가 수정 가능
        }
    }()
    // ...
    return nil
}
```

리뷰 포인트:

- **naked return의 가독성**: 함수가 길어지면 naked `return`이 무엇을 반환하는지 추적하기 어렵습니다. 짧은 함수에 한정해 쓰고, 긴 함수는 명시적으로 값을 반환하도록 제안합니다.
- **명명 반환값 수정 의도**: `defer`가 명명 반환값(`err`)을 덮어쓰는 패턴은 강력하지만 눈에 잘 안 띕니다. 정상 경로의 반환값이 `defer`에서 조용히 바뀌는 부분이 의도된 것인지 확인합니다.

---

## 포인터(`*`, `&`)와 nil

JavaScript에는 명시적 포인터가 없습니다. Go에서는 `&`로 주소를 얻고 `*`로 역참조하며, 옵셔널 값·공유 변경·복사 회피를 위해 포인터를 씁니다.

```go
u := User{Name: "Alan"}
p := &u          // p 는 *User (u의 주소)
p.Name = "Bob"   // (*p).Name 의 축약 — u.Name 이 실제로 바뀜
fmt.Println(u.Name) // "Bob"

var q *User      // nil 포인터 (제로 값)
fmt.Println(q.Name) // panic: nil pointer dereference
```

리뷰 포인트:

- **nil 포인터 역참조 패닉**: nil 포인터의 필드/메서드에 접근하면 즉시 패닉입니다. 옵셔널 값을 `*string` 같은 포인터로 표현했다면, 사용 전에 `if p != nil` 가드가 있는지 확인합니다(`Syntax Map`의 옵셔널 표현 참고).
- **포인터 vs 값 리시버**: 메서드가 리시버 상태를 변경하거나 구조체가 크면 포인터 리시버(`*T`)를, 작고 불변이면 값 리시버(`T`)를 씁니다. 한 타입의 리시버 종류가 일관적인지, 값 리시버 메서드가 복사본만 수정해 원본에 반영되지 않는 버그가 없는지 봅니다.

---

## 구조체 임베딩(Embedding): 상속 없는 합성

Go에는 클래스 상속이 없습니다. 대신 구조체 안에 다른 타입을 **이름 없이** 박아 넣으면(embedding), 그 타입의 필드와 메서드가 바깥 구조체로 **승격(promotion)**되어 마치 상속처럼 보입니다.

```go
type Logger struct{ prefix string }
func (l Logger) Log(msg string) { fmt.Println(l.prefix, msg) }

type Server struct {
    Logger      // 임베디드 필드 (필드명 없음)
    port int
}

s := Server{Logger: Logger{prefix: "[srv]"}, port: 8080}
s.Log("started") // Logger.Log 이 승격되어 s.Log 로 바로 호출됨
```

리뷰 포인트:

- **상속과 혼동 금지**: 임베딩은 "is-a"가 아니라 "has-a + 메서드 승격"입니다. 다형성이 필요하면 인터페이스로 풀어야 하며, 임베딩된 메서드는 바깥 타입을 알지 못합니다(가상 디스패치 없음). 상속처럼 오버라이드를 기대한 코드가 없는지 봅니다.
- **필드·메서드 이름 충돌**: 바깥 구조체와 임베디드 타입에 같은 이름의 필드가 있으면 바깥이 우선하고 안쪽은 가려집니다. 승격이 의도치 않게 깨지거나 모호해지는 지점이 없는지 확인합니다.

---

## 인터페이스의 암시적 구현과 nil 인터페이스 함정

인터페이스 구현이 암시적이라는 점은 `Types and Modeling`에서 다뤘습니다. 여기서는 리뷰어를 자주 속이는 **typed nil** 함정을 봅니다.

인터페이스 값은 내부적으로 `(타입, 값)` 쌍입니다. 타입 정보가 채워져 있으면, 값이 nil이어도 인터페이스 자체는 `!= nil`이 됩니다.

```go
func doWork() error {
    var e *MyError = nil // 구체 타입 포인터, 값은 nil
    // ... e를 채우지 않음
    return e             // error 인터페이스로 반환 → (*MyError, nil)
}

func main() {
    if err := doWork(); err != nil {
        // 여기 들어옴! err는 타입(*MyError)이 있어 nil이 아님 — 예상과 반대
    }
}
```

리뷰 포인트:

- **typed nil로 인한 오탐**: 에러를 반환할 때 구체 포인터 타입 변수를 그대로 `error`로 반환하면, 값이 nil이어도 `err != nil` 검사를 통과합니다. 성공 시에는 반드시 `return nil`(리터럴)을 반환하고, 에러 변수를 인터페이스 타입(`error`)으로 선언했는지 확인합니다.
- **인터페이스 크기(미니멀 인터페이스)**: 소비자 쪽에 1~2개 메서드로 작게 정의하는 관례는 `Types and Modeling`·`Go Ecosystem`을 참고합니다.

---

## 타입 단언과 타입 스위치

인터페이스에 담긴 구체 타입을 꺼내는 문법입니다. JS의 `typeof`/`instanceof`와 목적은 비슷하지만 문법이 고유합니다.

```go
// 타입 단언 — 반드시 comma-ok 형태로 안전하게
if s, ok := val.(string); ok {
    use(s) // val이 string일 때만
}
n := val.(int) // ok 없이 쓰면 실패 시 panic — 지양

// 타입 스위치 — 여러 구체 타입 분기
switch v := val.(type) {
case string:
    fmt.Println("string", len(v))
case int, int64:
    fmt.Println("integer")
case nil:
    fmt.Println("nil")
default:
    fmt.Printf("unknown %T\n", v)
}
```

리뷰 포인트:

- **comma-ok 없는 단언**: `val.(int)`를 ok 없이 쓰면 타입 불일치 시 패닉으로 크래시합니다. 외부 입력이나 `any`를 다룰 때는 반드시 `v, ok :=` 형태로 방어했는지 봅니다.
- **타입 스위치 과용**: `interface{}`(=`any`)에 대한 큰 타입 스위치가 반복되면 설계 신호가 나쁩니다. 명시적 인터페이스 메서드나 제네릭으로 풀 수 있는지 검토합니다.

---

## `iota`와 const 블록으로 만드는 열거형

Go에는 전용 `enum` 키워드가 없습니다. 명명 타입 + `const` 블록 + `iota`(0부터 자동 증가하는 상수 생성기)로 열거형을 흉내 냅니다.

```go
type Status int

const (
    Pending Status = iota // 0
    Active                // 1 (표현식 반복 → iota 자동 증가)
    Closed                // 2
)

func (s Status) String() string { // Stringer 구현으로 로그·JSON 가독성 확보
    return [...]string{"pending", "active", "closed"}[s]
}
```

리뷰 포인트:

- **제로 값이 곧 첫 상수**: `iota`는 0부터 시작하므로 `Status`의 제로 값은 `Pending`입니다. "미설정"과 "Pending"을 구분해야 한다면 `Unknown Status = iota`를 0번에 두는 등 제로 값 설계를 확인합니다.
- **열거값의 무결성**: Go는 `Status(99)`처럼 범위 밖 정수도 허용합니다(컴파일러가 막지 않음). 외부에서 들어온 정수를 상수 타입으로 변환할 때 유효성 검사가 있는지, `String()`/JSON 매핑이 정의되어 있는지 봅니다.

---

## 슬라이스: 배열과의 차이, 그리고 공유 백킹 배열

JS 배열과 가장 크게 다른 지점입니다. Go의 슬라이스는 **백킹 배열에 대한 뷰**(포인터+길이+용량)이며, 여러 슬라이스가 같은 배열을 공유할 수 있습니다.

```go
arr := [3]int{1, 2, 3}   // 배열: 고정 길이, 값 타입(복사됨)
s := []int{1, 2, 3}      // 슬라이스: 가변 길이, 참조 성격
s = append(s, 4)         // 용량 초과 시 새 배열로 재할당

sub := s[1:3]            // s의 백킹 배열을 공유하는 뷰
sub[0] = 99              // s[1] 도 함께 바뀜 — 같은 배열을 보고 있으므로
```

리뷰 포인트:

- **`append`와 백킹 배열 공유(aliasing)**: 슬라이스를 재슬라이싱한 뒤 한쪽을 수정하면 다른 쪽도 바뀔 수 있습니다. 또 `append`가 용량 안에서 일어나면 원본 배열을 덮어씁니다. 함수에 슬라이스를 넘긴 뒤 호출자가 예상 못 한 변경을 겪지 않는지, 독립 복사가 필요한 곳에 `copy`나 `slices.Clone`을 썼는지 봅니다.
- **nil 슬라이스 vs 빈 슬라이스**: `var s []int`(nil)과 `[]int{}`(빈)는 대부분 동일하게 동작하지만 JSON 인코딩 시 각각 `null`과 `[]`로 달라집니다(`Types and Modeling` 참고). 응답 스키마 의도를 확인합니다.

---

## 맵: `make`, comma-ok, nil 맵 쓰기 패닉, 순회 순서

```go
m := make(map[string]int) // 반드시 make로 초기화해야 쓰기 가능
m["a"] = 1

v, ok := m["missing"]     // comma-ok: ok=false, v=제로 값(0). "없음"과 "값이 0"을 구분
if !ok { /* 키 없음 */ }

var nm map[string]int     // nil 맵 (제로 값)
nm["x"] = 1               // panic: assignment to entry in nil map
```

리뷰 포인트:

- **nil 맵 쓰기 패닉**: 초기화되지 않은 맵(제로 값 nil)에 쓰면 즉시 패닉입니다. 구조체 필드로 선언된 맵이 생성자에서 `make`로 초기화됐는지 확인합니다(읽기는 nil 맵에서도 안전).
- **순회 순서 비결정성**: `for k := range m`의 순서는 매번 무작위입니다. 순서에 의존하는 로직(정렬된 출력, 재현 가능한 해시 등)이 있으면 키를 뽑아 정렬했는지 봅니다.
- **키 존재 검사**: 값만 꺼내 제로 값으로 "없음"을 판단하면 실제 0/""과 구분되지 않습니다. comma-ok로 존재를 검사했는지 확인합니다.

---

## `range`와 rune vs byte

`for ... range`는 슬라이스·맵·문자열·채널을 순회합니다. 문자열 순회에서 특히 놀라운 점은, 인덱스가 **바이트 오프셋**이고 값이 **rune(유니코드 코드포인트)**이라는 것입니다.

```go
for i, v := range slice { }   // i: 인덱스, v: 값(복사본)
for k, v := range m { }        // 맵
for v := range ch { }          // 채널: 닫힐 때까지 수신

s := "가A"
for i, r := range s {          // r 은 rune. i 는 바이트 위치(0, 3, ...)
    fmt.Printf("%d: %c\n", i, r)
}
len(s)                         // 바이트 길이(4), 문자 수 아님 → utf8.RuneCountInString 사용
```

리뷰 포인트:

- **문자열 길이/인덱싱 오해**: `s[i]`는 i번째 **바이트**이고 `len(s)`는 바이트 수입니다. 멀티바이트(한글·이모지) 문자열을 문자 단위로 다루려면 rune 기반 순회나 `[]rune(s)` 변환이 필요합니다.
- **range 값은 복사본**: `for _, v := range slice`의 `v`는 원소의 복사본입니다. `v`를 수정해도 원본 슬라이스는 바뀌지 않습니다. 원본을 바꾸려면 `slice[i]`로 접근했는지 봅니다.
- **루프 변수 캡처(Go 버전 주의)**: Go 1.22부터 루프 변수가 반복마다 새로 생성되어 클로저·고루틴 캡처 함정이 대부분 해소됐습니다. 그 이전 버전 코드에서는 고루틴이 마지막 값 하나를 공유하는 고전적 버그가 있으니 모듈의 Go 버전을 함께 확인합니다.

---

## 채널과 `select`

채널은 고루틴 사이에 값을 주고받는 타입 있는 파이프입니다. JS에는 대응 문법이 없습니다.

```go
ch := make(chan int)      // 언버퍼드: 송신은 수신자가 받을 때까지 블록
buf := make(chan int, 10) // 버퍼드: 버퍼가 찰 때까지 논블록

ch <- 42                  // 송신
v := <-ch                 // 수신
v, ok := <-ch             // ok=false 면 채널이 닫힘
close(ch)                 // 송신 측이 닫음 (수신 측이 닫으면 안 됨)

select {                  // 여러 채널 중 준비된 것을 처리
case v := <-ch:
    use(v)
case <-ctx.Done():
    return ctx.Err()      // 취소 신호 (Async and Concurrency 참고)
default:
    // 아무 채널도 준비 안 됨 → 논블로킹 분기
}
```

리뷰 포인트:

- **닫힌 채널·nil 채널 함정**: 닫힌 채널에 송신하거나 이미 닫은 채널을 다시 닫으면 패닉입니다. 반대로 nil 채널에 대한 송수신은 영원히 블록됩니다. 채널을 닫는 주체가 송신 측 하나로 명확한지 봅니다.
- **`select` + `ctx.Done()`**: 채널 대기 루프에 취소/타임아웃 탈출구(`<-ctx.Done()`)가 있는지 확인합니다. 없으면 고루틴 누수로 이어집니다(`Async and Concurrency`의 고루틴 누수 참고).

---

## 가변 인자(`...`)와 스프레드

JS의 rest/spread(`...`)와 개념은 같지만 위치와 표기가 다릅니다. 파라미터 쪽 `...T`는 가변 인자, 인자 쪽 `slice...`는 슬라이스 펼치기입니다.

```go
func sum(nums ...int) int { // nums 는 []int
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

sum(1, 2, 3)
xs := []int{1, 2, 3}
sum(xs...) // 슬라이스를 개별 인자로 펼침
```

리뷰 포인트:

- **가변 인자로 넘긴 슬라이스 공유**: `f(xs...)`는 경우에 따라 원본 슬라이스를 그대로 전달합니다. 함수 내부에서 `append`로 변형하면 호출자에 영향이 갈 수 있으므로, 방어적 복사가 필요한지 봅니다.

---

## 제네릭(`[T any]`)과 제약(Constraints)

Go 1.18부터 제네릭이 추가됐습니다. 대괄호 타입 파라미터와 제약(constraint) 인터페이스 문법이 낯설 수 있습니다.

```go
func Map[T, U any](in []T, f func(T) U) []U {
    out := make([]U, len(in))
    for i, v := range in {
        out[i] = f(v)
    }
    return out
}

type Number interface {          // 제약: ~ 는 기저 타입 허용
    ~int | ~int64 | ~float64
}
func Sum[T Number](xs []T) T { /* ... */ }

func indexOf[T comparable](xs []T, target T) int { /* ... */ } // comparable: == 가능한 타입
```

리뷰 포인트:

- **제네릭 남용 경계**: Go 커뮤니티는 제네릭을 신중히 씁니다. 구체 타입이나 작은 인터페이스로 충분한데 과도하게 제네릭화해 가독성을 해치고 있지 않은지 봅니다.
- **`comparable`·제약 적합성**: 타입 파라미터에 `==`나 정렬을 쓰려면 `comparable`이나 적절한 제약이 필요합니다. 제약과 실제 사용이 맞는지 확인합니다.

---

## `panic`/`recover`와 `init()`

```go
func init() { // 패키지 로드 시 자동 실행 (main 이전). 파일당 여러 개 가능
    registerDrivers()
}

func safeHandler() {
    defer func() {
        if r := recover(); r != nil { // 패닉을 잡아 프로세스 붕괴 방지
            log.Printf("recovered: %v", r)
        }
    }()
    riskyWork()
}
```

리뷰 포인트:

- **`panic`을 흐름 제어로 오용**: 일반적인 비즈니스 오류는 `error` 반환으로 다뤄야 합니다. `panic`은 회복 불가능한 프로그래밍 오류(불변식 위반)에 한정하고, 예상 가능한 실패를 `panic`으로 처리하지 않았는지 봅니다(`Go Service Review Guide`의 Red Flags 참고).
- **`recover`의 위치**: `recover`는 반드시 `defer` 함수 안에서만 동작합니다. HTTP 서버 최상단(미들웨어)에 패닉 복구가 있어 한 요청의 패닉이 전체 프로세스를 죽이지 않는지 확인합니다.
- **`init()`의 숨은 부수효과**: `init`은 암묵적으로 실행되어 추적이 어렵습니다. 전역 상태 등록·설정 로드가 `init`에 숨어 테스트나 기동 순서를 예측 불가능하게 만들지 않는지 봅니다.

---

## 다음 문서

- 고루틴·컨텍스트 취소·채널 데드락은 `Async and Concurrency`에서 더 깊이 다룹니다.
- 이 문법들이 실제 HTTP 서비스에서 어떻게 조립되고 어디서 문제가 되는지는 `Go Ecosystem`과 `Go Service Review Guide`로 이어집니다.
