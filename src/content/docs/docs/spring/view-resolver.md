---
title: "View Resolver"
date: 2024-03-07
lastUpdated: 2025-08-25
---

Spring MVC 프레임워크에서 ViewResolver는 컨트롤러 메서드에 의해 반환된 논리적 뷰 이름을 클라이언트에 대한 응답을 렌더링하는 데 사용할 수 있는 실제 뷰 구현으로 해석하는 역할을 한다.

## ViewResolver 종류

|         ViewResolver         |                        설명                        |
|:----------------------------:|:------------------------------------------------:|
| InternalResourceViewResolver | 논리적 뷰 이름을 JSP(InternalResourceView/JstlView)로 매핑 |
|    ThymeleafViewResolver     |           논리적 뷰 이름을 Thymeleaf 템플릿으로 매핑           |

이외에도 UrlBasedViewResolver, FreeMarkerViewResolver 등 다양한 ViewResolver 구현체가 존재한다.

## prefix / suffix

ViewResolver는 논리적 뷰 이름에 prefix와 suffix를 추가하여 뷰를 찾을 수 있도록 처리할 수 있다.

```text
spring.mvc.view.prefix=/WEB-INF/views/
spring.mvc.view.suffix=.jsp
```

## ViewResolver 동작 과정

1. 핸들러 어댑터가 컨트롤러의 반환 결과를 전달
    - String, ModelAndView, View인 경우 뷰 해석 단계로 진행
2. 뷰 이름으로 ViewResolver를 순서대로 호출
3. ViewResolver가 뷰 이름을 처리할 수 있는지 확인
    - 처리할 수 있다면 해당 뷰를 반환
    - 처리할 수 없다면 다음 ViewResolver를 호출(처리할 수 없다면 예외 발생)
4. ViewResolver가 반환한 View를 사용하여 뷰 렌더링
5. 뷰 렌더링 결과를 클라이언트에게 응답

## 뷰 이름 해석 규칙

- String: 논리적 뷰 이름, prefix/suffix 적용
    - redirect:/, forward:/ 접두사는 별도 처리
    ```java
    @GetMapping("/hello")
    public String hello() {
        return "hello"; // 논리적 뷰 이름 -> /WEB-INF/views/hello.jsp
    }
    ```
- ModelAndView: 뷰 이름 또는 View 인스턴스와 모델을 함께 전달
    ```java
    @GetMapping("/hello-model")
    public ModelAndView helloModel() {
        ModelAndView mav = new ModelAndView("hello");
        mav.addObject("message", "hi");
        return mav;
    }
    ```
- View: 리졸버 단계를 건너뛰고 주어진 View로 렌더링
    ```java
    @GetMapping("/redirect")
    public View redirect() {
        return new RedirectView("/home");
    }
    ```
- void/HttpServletResponse: 컨트롤러에서 직접 응답 작성
    ```java
    @GetMapping("/direct")
    public void direct(HttpServletResponse response) throws IOException {
        response.getWriter().write("plain text response");
    }
    ```

###### 참고자료

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)