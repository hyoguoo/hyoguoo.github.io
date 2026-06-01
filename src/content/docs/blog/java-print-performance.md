---
title: "System.out.println()의 동작 원리와 성능 이슈"
date: 2025-08-05
lastUpdated: 2026-06-01
tags: [ Java ]
description: "System.out.println()이 사용하는 PrintStream의 스트림 계층과 autoFlush·synchronized·블로킹 IO가 맞물려 만드는 성능 이슈를 실측과 함께 분석한다."
---

> 측정 환경: Corretto JDK 24 (macOS), 인용 코드는 JDK 24의 `java.base` 소스 기준

`System.out.println()` 한 줄은, 반복문이나 다중 스레드 환경에서 애플리케이션의 처리량을 끌어내리는 병목이 되기도 한다.

- `System.out.println()`은 한 줄을 출력하기 위해 내부에서 무슨 일을 하는가
- 그 과정의 어떤 비용이 성능을 떨어뜨리는가
- 어떻게 개선할 수 있으며, 로깅 프레임워크는 무엇이 다른가

`PrintStream` 클래스는 `OutputStream`을 상속받아 출력 스트림을 구현하며, 다양한 타입의 데이터를 출력할 수 있는 메서드를 제공한다.

```java
void main() {
    System.out.println("Hello, World!");
}
```

`System.out`은 `PrintStream` 타입의 static 객체이며, `println()`을 포함한 다양한 출력 메서드를 제공하여 간편하게 콘솔에 데이터를 출력할 수 있다.

## `System.out`의 초기화 과정과 `PrintStream` 인스턴스 생성

`PrintStream`을 import하거나 인스턴스를 생성 없이 `System.out.println()`을 바로 사용할 수 있는데, 그 이유는 다음과 같다.

- `System` 클래스는 `java.lang` 패키지에 포함되어 있으며, 기본적으로 import되는 패키지이기 때문에 별도 import 없이 사용 가능
- `System` 클래스 내부에 `PrintStream` 타입의 static 필드 `out`이 정의

```java

public final class System {

    /* Register the natives via the static initializer.
     *
     * The VM will invoke the initPhase1 method to complete the initialization
     * of this class separate from <clinit>.
     */
    private static native void registerNatives();

    static {
        registerNatives();
    }

    private System() {
    }

    public static final PrintStream out = null;

    // ...
}
```

`out`은 처음에는 `null`로 선언되어 있지만, JVM이 초기화 과정에서 실제 `PrintStream` 객체로 할당하게 된다.

1. `System.out`은 Java 코드 상으로는 `null`로 선언되어 있으나, 이는 컴파일 시점 값
2. `registerNatives()`라는 native 메서드가 `System` 클래스 초기화 블록에서 호출
3. JVM의 `initPhase1()`에서 입출력 스트림을 직접 설정

이 작업은 Java 코드가 아닌 JVM 내부 native 코드에서 수행되며, 실제로는 메모리 상의 `System.out` 필드에 객체가 강제로 할당된다.

이때 `initPhase1()`이 만들어 주는 `System.out`의 실제 구성은 다음과 같다.

```java
// java.lang.System
private static PrintStream newPrintStream(OutputStream out, String enc) {
    if (enc != null) {
        return new PrintStream(new BufferedOutputStream(out, 128), true,
                Charset.forName(enc, UTF_8.INSTANCE));
    }
    return new PrintStream(new BufferedOutputStream(out, 128), true);
}
```

- 최하위 스트림은 표준 출력(stdout)에 연결된 `FileOutputStream`이며, 그 위를 128바이트 `BufferedOutputStream`이 래핑
- `PrintStream`은 `autoFlush=true`로 생성되며, 이 설정값이 뒤에서 다룰 성능 이슈의 핵심 원인이 됨

## PrintStream의 스트림 계층 구조

`println()`이 호출한 문자열은 곧바로 OS로 나가지 않고, `PrintStream` 내부의 여러 계층을 거쳐 전달된다.

```java
private PrintStream(boolean autoFlush, OutputStream out) {
    super(out);
    // ...
    this.charOut = new OutputStreamWriter(this, charset);
    this.textOut = new BufferedWriter(charOut);
    // ...
}
```

`PrintStream`은 생성 시 다음과 같이 중간 계층을 구성하며, 각 계층의 역할은 다음과 같이 구분된다.

|    계층     |           타입           |               역할                |
|:---------:|:----------------------:|:-------------------------------:|
| `textOut` |    `BufferedWriter`    |         문자(char) 단위 버퍼링         |
| `charOut` |  `OutputStreamWriter`  | 내부 `StreamEncoder`로 Charset 인코딩 |
|   `out`   | `BufferedOutputStream` |     인코딩된 바이트를 모았다가 하위로 내보냄      |

```mermaid
flowchart TB
    P["println 호출"] --> T["textOut (BufferedWriter)"]
    T -->|" 문자 버퍼링 "| C["charOut (OutputStreamWriter / StreamEncoder)"]
    C -->|" Charset 인코딩하여 바이트화 "| O["out (BufferedOutputStream · 128B)"]
    O -->|" 버퍼가 차거나 flush될 때 "| F["FileOutputStream"]
    F -->|" write 시스템 콜 "| K[("커널 / OS")]
```

1. 문자열은 `textOut`에서 문자 버퍼에 저장
2. `charOut`에서 바이트로 인코딩
3. `out`의 바이트 버퍼를 거쳐 최종적으로 `FileOutputStream`이 `write` 시스템 콜을 통해 커널로 전달

## `System.out.println()` 내부 구현 코드 분석

`System.out.println("Hello, World!")`처럼 문자열을 출력하면 `println(String x)`가 호출되며, 그 흐름은 다음과 같다.

```java
public void println(String x) {
    if (getClass() == PrintStream.class) {
        writeln(String.valueOf(x));
    } else {
        // 하위 클래스 확장 시의 예외적 경로
        synchronized (this) {
            print(x);
            newLine();
        }
    }
}
```

`getClass() == PrintStream.class` 분기는 `PrintStream`을 그대로 쓰는 경우와 상속받아 오버라이드한 경우를 가르는 최적화 장치다.

- `System.out`은 JVM이 직접 생성한 순수 `PrintStream` 인스턴스이므로 항상 `writeln()` 경로로 실행
- 하위 클래스라면 오버라이드된 `print()`/`newLine()`이 호출되어야 하므로 별도 경로로 분기
- `println(Object)` 등 다른 오버로드도 동일한 구조로 `writeln()`을 호출

`writeln(String s)`의 상세 구현을 살펴보면 다음과 같다.

```java
private void writeln(String s) {
    try {
        synchronized (this) {
            ensureOpen();
            textOut.write(s);
            textOut.newLine();
            textOut.flushBuffer();
            charOut.flushBuffer();
            if (autoFlush)
                out.flush();
        }
    } catch (InterruptedIOException x) {
        Thread.currentThread().interrupt();
    } catch (IOException x) {
        trouble = true;
    }
}
```

1. ensureOpen()
    - 스트림이 닫히지 않았는지 확인
    - 닫힌 경우 `IOException` 발생시켜 출력 중단
2. textOut.write(s) / textOut.newLine()
    - 문자열 및 줄바꿈 문자를 내부 문자 버퍼(`BufferedWriter`)에 쓰기 수행
    - 개행은 플랫폼에 맞는 \n, \r\n 등 줄바꿈 문자로 추가
    - 실제 출력은 하지 않고, 버퍼에만 저장
3. textOut.flushBuffer()
    - 문자 버퍼에 저장된 내용을 `charOut`으로 흘려보내 지정된 Charset으로 인코딩
    - 인코딩된 바이트 배열 데이터를 `StreamEncoder` 내부에 저장
4. charOut.flushBuffer()
    - `StreamEncoder`에 저장된 바이트 데이터를 최하위 출력 스트림 `out`으로 전달
    - 이 단계까지는 `out`의 바이트 버퍼에 쌓일 뿐, OS로 나가지는 않음
5. if (autoFlush) out.flush()
    - `System.out`은 `autoFlush=true`이므로 매 호출마다 `out.flush()`를 수행
    - 버퍼에 남은 데이터까지 강제로 비워 즉시 출력되도록 보장하며, 이때 native 메서드를 통해 실제 `write` 시스템 콜이 발생

## 성능 저하의 원인

모든 과정이 synchronized 블록 안에서 수행되기 때문에, 여러 쓰레드가 `System.out.println()`을 호출해도 출력 순서를 보장한다.  
하지만 내부적으로 동기화와 IO 작업을 수반하기 때문에 성능 저하를 유발할 수 있다.

- `println()` 호출 시, 내부적으로 `write()`와 `flush()`가 함께 수행
- 출력 스트림은 기본적으로 블로킹 IO이기 때문에, 호출 시점마다 시스템 콜을 발생시키고 쓰레드는 출력 완료까지 대기
- 특히 반복문 내에서 출력이 빈번하게 발생하는 경우, 다음과 같은 문제 발생
    - 출력 버퍼가 자주 flush되어 성능 저하
    - synchronized/lock 경쟁으로 인한 쓰레드 병목 현상 발생
    - 콘솔 IO 속도는 CPU 연산보다 훨씬 느림
- 톰캣 등에서 여러 스레드가 동시에 출력을 시도할 경우 락 경합으로 인한 병목 현상 발생
- 하나의 스레드가 I/O 작업을 완료할 때까지 다른 스레드들은 대기 상태에 머물게 되어 시스템 처리량이 급격히 저하

## Logback과 AsyncAppender를 통한 개선

로깅 프레임워크는 이러한 성능 문제를 해결하기 위해 비동기 전파 및 사용자 공간 버퍼링 기술을 활용한다.

### 사용자 공간 버퍼링

Logback의 FileAppender는 BufferedOutputStream을 사용하여 데이터를 사용자 공간 메모리에 모아두었다가 한꺼번에 커널로 전달한다.

- 시스템 콜 빈도를 획기적으로 줄여 Mode Switch로 인한 오버헤드 최소화
- 기본 8KB 등의 버퍼를 사용하여 디스크 쓰기 효율을 극대화

### AsyncAppender를 통한 비동기 분리

비즈니스 스레드와 I/O 스레드를 분리하여 응답 시간에서 입출력 부담을 제거하는 방식이다.

```mermaid
flowchart TB
    A[비즈니스 스레드들] -->|로그 이벤트| Q[ArrayBlockingQueue]
    Q --> W[Worker 스레드]
    W -->|위임| F[FileAppender]
    F -->|write 시스템 콜| OS[(커널)]
```

- 비즈니스 스레드는 큐에 로그 이벤트를 넣고 즉시 반환되므로 디스크 지연의 영향을 직접 받지 않음
- 큐를 통해 백프레셔(Backpressure)를 통제하며, 큐가 가득 찼을 때의 동작(drop 또는 block)을 명시적으로 설정할 수 있음
- 결과적으로 시스템의 응답성과 처리량을 보장하면서 안전하게 로그를 기록

