---
title: "Servlet"
date: 2023-11-16
lastUpdated: 2025-08-23
tags: [Spring]
description: ""
---

> 자바를 이용한 웹 프로그래밍을 위한 기술

Java 기반 웹 애플리케이션에서 요청-응답 구조의 서버를 구현하기 위한 표준 인터페이스이며, Jakarta EE(현재)에서 제공하는 서버 사이드 컴포넌트 기술이다.

- 클라이언트의 요청에 대해 동적으로 작동하는 웹 애플리케이션 컴포넌트
- 멀티 스레드 기반 동작
- 하나의 서블릿 인스턴스에 여러 요청이 동시에 진입하며, 각 요청은 별도 스레드로 처리
- MVC 패턴에서 Controller 역할을 수행

## Servlet 클래스 계층 구조

서블릿은 `javax.servlet.Servlet` 인터페이스를 기반으로 하며, 주로 `javax.servlet.http.HttpServlet` 클래스를 상속받아 구현된다.

```
javax.servlet.Servlet (인터페이스)
         ↑
javax.servlet.GenericServlet (추상 클래스)
         ↑
javax.servlet.http.HttpServlet (추상 클래스)
```

- `Servlet`: 서블릿의 최상위 인터페이스. `init()`, `service()`, `destroy()` 등의 메서드를 정의
- `GenericServlet`: `Servlet` 인터페이스를 구현한 추상 클래스이며, 프로토콜 독립적인 서블릿 개발에 사용
- `HttpServlet`: `GenericServlet`을 확장한 클래스이며, HTTP 프로토콜에 특화된 기능을 제공

## Servlet 클래스 주요 메서드

- `init(ServletConfig config)`: 서블릿이 최초로 로딩될 때 한 번 호출되며, 초기화 작업 수행
- `service(ServletRequest req, ServletResponse res)`: 클라이언트의 요청이 들어올 때마다 호출하여 요청을 처리
- `doGet()`, `doPost()` 등: `HttpServlet`에서 HTTP 메서드별 처리 메서드
- `destroy()`: 서블릿이 컨테이너에 의해 제거될 때 호출되며, 자원 해제 등의 정리 작업 수행

## Servlet Life Cycle

1. 클래스 로딩과 인스턴스 생성
    - 매핑된 URL로 최초 요청이 들어오면 컨테이너가 클래스를 로딩하고 단일 인스턴스를 생성
    - `web.xml`의 `load-on-startup` 또는 Spring Boot 자동 설정에 따라 애플리케이션 기동 시점에 미리 로딩 가능
2. 초기화
    - `init(ServletConfig config)` 한 번 호출
    - 초기 파라미터(`init-param`)와 `ServletContext` 접근을 통해 외부 리소스 준비
3. 요청 처리
    - 매 요청마다 `service()` 호출
    - `HttpServlet`은 `service()` 내부에서 HTTP 메서드에 따라 `doGet()`, `doPost()` 등으로 위임
4. 소멸
    - 컨테이너 종료 또는 재배포 시 `destroy()` 한 번 호출
    - 내부 자원 정리 후 참조 해제되어 GC 대상이 됨

## Servlet Container

> 서블릿을 실행시키고 관리하는 역할을 하는 컴포넌트

서블릿 컨테이너는 웹 서버와 통신하여 클라이언트 요청을 받아 서블릿에 전달하고, 서블릿의 응답 결과를 클라이언트에 전달한다.

### Servlet Container 역할

1. 웹서버와 통신 지원
    - 서블릿과 웹서버가 통신하기 위해 필요한 기능 제공
    - 통신을 위한 `listen`, `accept` 등의 기능을 서블릿 컨테이너에서 API로 제공하여 직접 구현할 필요 없음
2. 서블릿 생명주기 관리
    - 서블릿의 생성, 초기화, 호출, 소멸 등의 생명주기를 관리
    - 최초 로딩 시점에 서블릿 클래스를 인스턴스화하여 초기화 메서드를 호출하고, 그 외에 요청이 들어오면 적절한 서블릿 메서드를 호출
    - 서블릿이 더 이상 필요하지 않을 때 참조를 해제해 GC 대상이 되도록 함
3. 멀티 스레드 지원 및 관리
    - 서블릿은 스레드로 동작하기 때문에 요청이 올 때마다 스레드 가져와 처리
    - 멀티 스레드 부분을 관리하고, 스레드 풀을 사용하여 스레드를 재사용
    - 개발자가 스레드를 직접 관리할 필요가 없이 싱글 스레드 프로그래밍 하듯이 편하게 개발 가능
4. 선언적인 보안 관리
    - 서블릿에 대한 보안을 관리를 해주어 보안 관련 코드를 작성하지 않아도 됨

### Servlet Request 처리 과정

1. 사용자가 요청한 HTTP Request를 서블릿 컨테이너에 전달
2. 서블릿 컨테이너가 필터 체인을 적용(인코딩, 보안, 로깅 등)
3. 요청을 받은 서블릿 컨테이너에서 `HttpServletRequest`와 `HttpServletResponse` 인스턴스 생성
4. 요청 URL과 매핑 정보를 기반으로 대상 서블릿 탐색 및 로딩
5. 대상 서블릿의 `service()` 호출(내부에서 `doGet()`/`doPost()` 등 분기)
6. 필요 시 멀티파트 처리, 세션 생성/조회, 파라미터 바인딩 수행
7. `HttpServletResponse` 인스턴스에 로직 수행 후 생성된 응답 전송
8. 전송이 완료되면 `HttpServletRequest`, `HttpServletResponse` 인스턴스 소멸

## 서블릿과 스레드 풀

HTTP 요청이 많아질수록, 매번 스레드를 생성하고 종료하는 방식은 성능 저하를 유발하는데, 이러한 비용을 줄이기 위해 서블릿 컨테이너는 스레드 풀(Thread Pool) 방식을 사용한다.

- 스레드 풀은 일정 수의 스레드를 미리 생성해두고, 요청이 들어올 때마다 이를 재사용
- 요청 처리 후, 해당 스레드는 종료되지 않고 다시 풀에 반환되어 다음 요청에 재사용
- 스레드를 매번 생성/종료하지 않아도 되므로 CPU와 메모리 사용을 줄이고, 응답 시간도 단축
- 스레드 풀이 모두 사용 중일 경우, 대기 큐에 요청을 넣거나, 거절 정책을 통해 안전하게 처리
- `maxThreads`, `minSpareThreads`, `acceptCount` 등 설정 값을 통해 성능 튜닝이 가능(적절한 설정은 부하 테스트를 통해 결정)

###### 참고자료

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)