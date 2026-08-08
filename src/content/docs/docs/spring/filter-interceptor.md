---
title: "Filter & Interceptor"
date: 2024-03-07
lastUpdated: 2026-08-09
tags: [ Spring ]
description: "서블릿 Filter와 Spring Interceptor의 동작 범위·실행 시점을 비교하고 preHandle·postHandle·afterCompletion의 활용 패턴을 정리한다."
---

```mermaid
flowchart LR
    subgraph wc["Web Context"]
        F[Filter]
        subgraph sc["Spring Context"]
            DS[Dispatcher Servlet]
            I[Interceptor]
            CT[Controller]
        end
    end
    F <--> DS <--> I <--> CT
```

## 필터 (Filter)

자바에서 제공하는 스펙으로, 디스패처 서블릿 (DispatcherServlet)에 요청이 전달되기 전과 후에 작업을 필터링 (Filter) 처리 할 수 있는 기능을 제공한다.

### 동작 순서

1. 클라이언트 요청이 서블릿 컨테이너에 도착
2. 등록된 필터 체인이 dispatcherType 설정에 맞는 요청에 대해 순서대로 실행
3. 체인 마지막에서 디스패처 서블릿으로 전달
4. 서블릿 처리 완료 후 필터 체인의 나머지 구간이 역순으로 실행

- 서블릿 계층에서 동작하므로 스프링의 예외 처리기 (`@ControllerAdvice` 등)를 적용받지 못해 별도의 예외 처리가 필요
- 체인 (Chain) 형태로 여러 개를 구성할 수 있으며, 지정된 순서대로 실행

필터는 `jakarta.servlet.Filter` 인터페이스를 구현하여 사용한다.

```java
public interface Filter {

    default void init(FilterConfig filterConfig) throws ServletException {
    }

    void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException;

    default void destroy() {
    }
}
```

- `init()`: 필터 초기화 메서드, 서블릿 컨테이너가 생성될 때 호출
- `doFilter()`: 고객의 요청이 올 때 마다 해당 메서드가 호출되는 곳으로, 필터의 로직 구현 부분
- `destroy()`: 필터 종료 메서드, 서블릿 컨테이너가 종료될 때 호출

doFilter 구현부에서 `chain.doFilter(request, response)`를 호출하지 않으면 다음 필터가 실행되지 않는다.

```java
public class MyFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        // 다음 필터로 넘기기 전의 로직
        chain.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse());
        // 다음 필터가 실행된 후의 로직
    }
}
```

파라미터로 넘기는 `request` / `response`는 다음 필터에 전달되며, 아예 다른 객체로 교체할 수 있다.

### 등록 방법

스프링 부트에서는 FilterRegistrationBean으로 순서와 URL 패턴을 제어할 수 있다.

```java

@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<MyFilter> myFilter() {
        FilterRegistrationBean<MyFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(new MyFilter());
        reg.addUrlPatterns("/*");      // 적용 경로
        reg.setOrder(1);               // 실행 순서(값이 작을수록 먼저 실행)
        reg.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ERROR);
        return reg;
    }
}
```

### 용도

필터는 스프링과 무관하게 전역적으로 처리해야 하는 작업들을 처리하는데 사용한다.

- 인코딩 변환
- 모든 요청에 대한 로깅
- 공통된 인증/인가 작업 (Spring Security)
- 요청/응답 본문 로깅 시 ContentCachingRequestWrapper/ResponseWrapper 활용
- OncePerRequestFilter를 상속해 중복 실행을 방지

## 인터셉터 (Interceptor)

Spring에서 제공하는 스펙으로, 디스패처 서블릿이 컨트롤러를 호출하기 전과 후에 요청과 응답을 가로채 (intercept) 처리하는 기능을 제공한다.

- 스프링 영역 내부에서 동작하므로 `@ControllerAdvice` 등 스프링 예외 처리 인프라를 온전히 활용할 수 있음
- 디스패처 서블릿이 핸들러 매핑을 통해 대상 컨트롤러를 찾은 후, 연결된 실행 체인 (HandlerExecutionChain)을 가져옴
- 체인에 등록된 인터셉터가 존재하면 컨트롤러 호출 전후로 가로채어 로직을 실행함

### 동작 순서

1. 디스패처 서블릿이 핸들러 매핑으로부터 HandlerExecutionChain 조회
2. 체인에 등록된 인터셉터의 preHandle이 순서대로 실행 (false를 반환하면 이후 체인을 중단)
3. 컨트롤러가 실행되고 핸들러 반환 후 postHandle이 실행 (예외 발생 시 생략)
4. 뷰 렌더링 단계가 끝난 뒤 afterCompletion이 역순으로 실행 (예외 발생 여부와 무관)

인터셉터는 `org.springframework.web.servlet.HandlerInterceptor` 인터페이스를 구현하여 사용한다.

```java
public interface HandlerInterceptor {

    default boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) throws Exception {
        return true;
    }

    default void postHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            @Nullable ModelAndView modelAndView
    ) throws Exception {
    }

    default void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            @Nullable Exception ex
    ) throws Exception {
    }
}
```

- `preHandle()`: 컨트롤러 호출 전에 실행, boolean 값에 따라 다음 단계 진행 여부를 결정
- `postHandle()`: 컨트롤러 호출 후에 실행, 컨트롤러에서 예외가 발생하면 실행되지 않음
- `afterCompletion()`: 컨트롤러 호출 후에 실행, 컨트롤러에서 예외가 발생해도 실행

구현된 인터셉터는 아래와 같이 등록할 수 있다.

```java

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private LoggingInterceptor loggingInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 모든 요청에 대해 인터셉터 적용
        registry.addInterceptor(loggingInterceptor).addPathPatterns("/**");
    }
}
```

## 필터 vs 인터셉터 비교

|   구분    |                             필터(Filter)                              |                 인터셉터(HandlerInterceptor)                  |
|:---------:|:---------------------------------------------------------------------:|:-------------------------------------------------------------:|
|   위치    |                         서블릿 컨테이너 레벨                          |                스프링 MVC 디스패처 서블릿 내부                |
| 적용 범위 |         컨트롤러 외 정적 리소스, 에러 디스패치까지 포함 가능          |           핸들러 매핑으로 선택된 컨트롤러 실행 흐름           |
| 예외 처리 |                   @ControllerAdvice 적용 대상 아님                    |             HandlerExceptionResolver 체계에 포함              |
| 객체 교체 |                    Request/Response 래퍼 교체 가능                    |         객체 자체 교체 불가능 (메타데이터 접근 가능)          |
|   목적    | 스프링 컨텍스트 진입 전, 앞단에서 전역적으로 처리해야하는 로직에 적합 | 애플리케이션 비즈니스 로직과 밀접하게 연관된 공통 처리에 적합 |
| 주요 사례 |                  인코딩, 보안 필터 체인, 요청 전처리                  |                인증/인가 체크, 공통 모델 주입                 |

###### 참고자료

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/173)
