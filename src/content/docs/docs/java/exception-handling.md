---
title: "Exception Handling"
date: 2024-03-07
lastUpdated: 2025-11-02
tags: [Java]
description: "Java의 Checked/Unchecked 예외 계층 구조와 try-catch-finally 처리 방법, 사용자 정의 예외 작성 방법을 정리한다."
---

프로그램이 실행되는 동안 발생하는 예외적인 상황(오류)을 관리하고 처리하는 메커니즘이다.

- 컴파일 에러: 소스 코드가 자바 문법에 맞지 않아 컴파일 자체가 실패하는 경우
- 런타임 에러: 컴파일은 성공했으나, 프로그램 실행 중에 발생하는 오류
- 논리적 에러: 컴파일과 실행은 모두 되지만, 의도와 다르게 동작하는 경우

Java의 예외 클래스는 계층 구조를 통해 다양한 종류의 예외를 체계적으로 관리할 수 있으며, 개발자는 필요한 예외를 선택하여 적절히 처리할 수 있다.

## 예외 클래스 계층 구조

자바의 모든 예외 클래스는 `java.lang.Throwable` 클래스를 상속받고, `Throwable`은 다시 `Error`와 `Exception`으로 나뉜다.

- `Error`
    - 시스템 레벨에서 발생하는 심각한 오류(예: `OutOfMemoryError`, `StackOverflowError`)
    - 프로그램 코드로 수습할 수 없는 경우가 대부분
    - 개발자가 `try-catch`로 처리하는 것을 고려하지 않음
- `Exception`
    - 프로그램 코드에서 수습(처리)할 수 있는 비교적 미약한 오류
    - 개발자가 `try-catch` 등을 이용해 적극적으로 처리해야 하는 대상

`Exception`은 다시 두 가지로 나뉜다.

- Checked Exception
    - `Exception`을 상속하지만 `RuntimeException`을 상속하지 않는 클래스(예: `IOException`, `SQLException`)
    - 컴파일러가 예외 처리를 강제
    - `try-catch`로 감싸거나, `throws` 키워드로 호출한 메서드에 처리를 위임 필요
- Unchecked Exception
    - `RuntimeException` 클래스와 그 자손들을 의미(예: `NullPointerException`, `ArrayIndexOutOfBoundsException`)
    - 컴파일러가 예외 처리를 강제하지 않음
    - 주로 프로그래머의 논리적 실수로 인해 발생하며, 예외를 잡기보다는 원인 코드를 수정하는 것이 권장

![출처(https://rollbar.com/blog/java-exceptions-hierarchy-explained/)](image/throwable-class.png)

## try-catch-finally

예외 처리를 위한 구문으로, 각 블록은 다음과 같은 역할을 한다.

- `try`: 예외가 발생할 수 있는 코드
- `catch`: 예외가 발생했을 때 수행할 코드
    - 프로그램의 비정상 종료를 막고, 정상적인 실행상태를 유지
    - 여러 개의 `catch` 블록 작성 가능
    - 여러 예외를 하나의 `catch` 블록에서 처리 가능
    - `catch` 블록의 순서 중요 (하위 타입 예외를 먼저 명시 후 상위 타입 예외 명시)
- `finally`: 예외 발생 여부와 상관없이 항상 수행되어야 하는 코드
    - 주로 자원 해제 코드 작성
    - `try` 블록에서 `return` 문을 만나도 `finally` 블록은 실행된 후 메서드가 종료
    - `System.exit()`가 호출되거나 JVM 자체가 다운되는 등 극히 예외적인 상황을 제외하고는 항상 실행 보장

```java
class Example {

    public static void main(String[] args) {
        try {
            // 예외가 발생할 수 있는 코드
        } catch (Exception1 e1) {
            // Exception1 예외가 발생했을 때 처리하는 코드
        } catch (Exception2 e2) {
            // Exception2 예외가 발생했을 때 처리하는 코드
        } catch (Exception3 e3) {
            // Exception3 예외가 발생했을 때 처리하는 코드
        } catch (ExceptionA | ExceptionB e5) {
            // ExceptionA, ExceptionB 예외가 발생했을 때 처리하는 코드
        } finally {
            // 예외 발생 여부와 상관없이 항상 수행되어야 하는 코드
        }
        // 발생한 예외와 일치하는 catch 블록이 없으면 예외는 처리되지 않는다.
    }
}
```

### try-with-resources

`finally` 블록에서 자원을 해제하는 것 대신, 자바 7부터 `try-with-resources` 구문이 도입되어 자원 해제를 자동으로 처리할 수 있게 되었다.

- `AutoCloseable` 인터페이스를 구현한 클래스만 사용 가능
- `try` 괄호 `()` 안에 자원 객체를 선언하면, `try` 블록이 종료될 때 자동으로 `close()` 메서드가 호출

```java
public static void main(String[] args) {
    try (FileInputStream fis = new FileInputStream("file.txt")) {
        // 파일 읽기 로직
    } catch (IOException e) {
        // 예외 처리
    }
    // fis.close()가 자동으로 호출됨
}
```

## 예외 발생 정보

`catch` 블록에서 잡은 예외 객체 `e`는 예외에 대한 정보를 담고 있다.

- `e.printStackTrace()`: 예외 발생 당시의 호출 스택(Call Stack)과 예외 메시지를 화면(System.err)에 출력
    - 개발 및 디버깅 시에는 유용
    - 대신 로깅 프레임워크(SLF4J, Logback 등)를 사용하여 `logger.error("에러 메시지", e)` 형태로 로그를 남기는 것을 권장
- `e.getMessage()`: 발생한 예외 객체에 저장된 메시지를 문자열로 반환

```java
class Example {

    public static void main(String[] args) {
        try {
            int result = 3 / 0;
            System.out.println(result);
        } catch (ArithmeticException e) {
            e.printStackTrace(); // java.lang.ArithmeticException: / by zero, at Example.main(Example.java:5)
            System.out.println(e.getMessage()); // / by zero
        }
    }
}
```

## 메서드에 예외 선언

메서드 선언부에 `throws` 키워드를 사용하여, 해당 메서드가 호출 도중 발생시킬 수 있는 `Checked Exception`을 명시한다.

- 이 메서드를 호출하는 쪽(Caller)에게 예외 처리를 강제
- 호출자는 해당 예외를 `try-catch`로 처리하거나, 다시 `throws`로 상위 메서드에 처리를 위임 필요

```java
class Exception {

    public static void main(String[] args) {
        try {
            // 호출자는 try-catch로 처리
            File f = createFile(args[0]);
            System.out.println(f.getName() + "파일이 성공적으로 생성되었습니다.");
        } catch (Exception e) {
            System.out.println(e.getMessage() + " 다시 입력해 주시기 바랍니다.");
        }
    }

    // createFile 메서드는 Exception(Checked Exception)을 발생시킬 수 있음을 선언
    static File createFile(String fileName) throws Exception {
        if (fileName == null || fileName.equals("")) {
            throw new Exception("파일이름이 유효하지 않습니다.");
        }
        File f = new File(fileName);
        f.createNewFile();
        return f;
    }
}
```

## 사용 자정의 예외

기존에 정의된 예외 클래스 외에, 애플리케이션의 특정 비즈니스 로직에 맞는 예외를 직접 정의할 수 있다.

- `Exception` 또는 `RuntimeException`을 상속받아생성
- `Checked Exception`으로 만들어 호출자에게 처리를 강제하려면 `Exception` 상속
- `Unchecked Exception`으로 만들어 처리를 강제하지 않으려면 `RuntimeException` 상속
- 예외 상황에 대한 구체적인 정보(예: 에러 코드, 관련 데이터)를 멤버 변수 추가 가능

```java
class MyException extends Exception { // Exception 또는 RuntimeException 상속

    private final int ERR_CODE;

    MyException(String msg, int errCode) {
        super(msg);
        ERR_CODE = errCode;
    }

    MyException(String msg) {
        this(msg, 100);
    }

    public int getErrorCode() {
        return ERR_CODE;
    }
}
```

## 예외 되던지기

`catch` 블록에서 예외를 처리한 후, 의도적으로 다시 예외를 발생시켜 상위 호출 메서드로 예외를 전달하는 기법이다.

1. 예외 로깅 및 재전파
    - 현재 위치에서 예외를 로그로 기록하되, 처리는 상위 호출자가 하도록 예외를 다시 전달
2. 로직 수행 및 전파
    - 예외가 발생했을 때, 수행해야하는 로직 처리
    - 후처리 완료 후, 예외가 발생했음을 상위 호출자에게도 알리기 위해 예외를 다시 전달
2. 예외 변환 (Exception Translation)
    - `SQLException`과 같은 저수준(low-level)의 특정 구현 예외를, `DataAccessException`과 같은 추상화된 사용자 정의 예외로 변환
    - 이때 `throw new DataAccessException(e)`처럼 생성자에 원본 예외(`e`)를 넘겨주어야(예외 체이닝), 원본 스택 트레이스가 소실되지 않음

```java
class ExceptionEx3 {

    public static void main(String[] args) {
        try {
            method1();
        } catch (Exception e) {
            System.out.println("main 메서드에서 최종 처리");
            // e.printStackTrace(); // 원인 예외(method1의 Exception) 확인 가능
        }
    }

    static void method1() throws Exception {
        try {
            // 고유한 예외 발생
            throw new Exception("최초 발생 예외");
        } catch (Exception e) {
            System.out.println("method1에서 예외 로깅");
            // 1. 예외를 그대로 다시 던지기
            // throw e;
            // 2. 예외를 감싸서(wrapping) 던지기 (예외 변환)
            // 원인(cause) 예외 e를 포함시켜 예외 체이닝(Exception Chaining)을 수행한다.
            throw new RuntimeException("method1 처리 중 오류", e);
        }
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
