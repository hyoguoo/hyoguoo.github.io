---
title: "HTTP (HyperText Transfer Protocol)"
date: 2023-08-09
lastUpdated: 2025-12-11
---

웹 브라우저와 웹 서버가 HTML, 이미지, JSON 등 다양한 데이터를 주고받기 위해 사용하는 애플리케이션 계층 프로토콜이다.

## 역사

단순한 텍스트 전송에서 시작해, 성능 최적화와 보안 강화를 목적으로 지속적으로 발전해왔다.

|    버전    |  연도  |                      특징 및 주요 개선점                      |   전송 계층    |
|:--------:|:----:|:-----------------------------------------------------:|:----------:|
| HTTP/0.9 | 1991 |            GET 메서드만 지원, 헤더 없음, HTML만 전송 가능            |    TCP     |
| HTTP/1.0 | 1996 |     헤더 도입, 상태 코드 추가, Content-Type 지원(멀티미디어 전송 가능)     |    TCP     |
| HTTP/1.1 | 1997 |   현재 가장 널리 쓰임. 지속 연결(Keep-Alive), 파이프라이닝, 캐시 제어 향상    |    TCP     |
|  HTTP/2  | 2015 |  성능 개선 목적. 멀티플렉싱(한 커넥션으로 동시 전송), 헤더 압축(HPACK), 서버 푸시  |    TCP     |
|  HTTP/3  | 2022 | QUIC 프로토콜 기반. TCP의 구조적 문제(HOL Blocking) 해결, 핸드셰이크 최소화 | UDP (QUIC) |

### HTTP/3와 UDP

HTTP/3는 TCP가 아닌 UDP 기반의 QUIC 프로토콜을 사용한다.

- TCP는 패킷 하나만 유실되어도 전체 데이터 처리가 중단되는 HOL(Head of Line) Blocking 문제가 발생
- UDP를 튜닝하여 신뢰성을 확보하면서도 위 문제를 해결하고 연결 수립 속도 단축

## HTTP 특징

- 클라이언트-서버 구조: 리소스를 요청하는 클라이언트와 리소스를 제공하는 서버로 분리
- 무상태(Stateless): 서버가 클라이언트의 이전 상태를 보존하지 않음
    - 장점: 서버 확장성이 높음
    - 단점: 로그인 유지 등을 위한 쿠키나 세션 같은 별도의 기술 필요
- 비연결성(Connectionless): 기본적으로 요청을 처리한 후 연결을 끊어 리소스를 절약
    - 매 요청마다 TCP 연결을 새로 맺는 오버헤드를 줄이기 위해 HTTP/1.1부터는 `Keep-Alive`를 통해 연결을 유지하는 기능 도입

## 전송 방식

데이터의 크기와 성격에 따라 다양한 전송 방식을 사용한다.

| 전송 방식 |           사용 헤더            |                        설명                        |
|:-----:|:--------------------------:|:------------------------------------------------:|
| 단순 전송 |       Content-Length       |       데이터의 전체 크기를 미리 알고 있을 때 사용하며, 한 번에 전송       |
| 압축 전송 |      Content-Encoding      |            gzip 등으로 데이터를 압축하여 전송량 절감             |
| 분할 전송 | Transfer-Encoding: chunked | 용량이 큰 데이터를 전송할 때, 전체 크기를 모르더라도 조금씩 쪼개서(Chunk) 전송 |
| 범위 전송 |    Range, Content-Range    |               데이터의 일부분만 요청하거나 응답한                |

## 요청과 응답 메시지 구조

HTTP 통신은 명확한 텍스트 기반의 메시지 구조를 가진다.

```
[Start Line]     HTTP/1.1 200 OK
[Headers]        Content-Type: application/json
                 Content-Length: 34
[Empty Line]     (헤더와 바디의 구분)
[Message Body]   { "username": "user1" }
```

- Start Line: 요청 라인(메서드, 경로, 버전) 또는 상태 라인(버전, 상태 코드, 문구)
- Headers: HTTP 전송에 필요한 메타 데이터
- Body: 실제 전송할 데이터 (HTML, 이미지, JSON 등)

## Content Negotiation

클라이언트가 서버에게 어떤 컨텐츠를 원하는지 알려주는 기능으로, , 서버가 그에 맞춰 가장 적절한 형태의 리소스를 제공하는 메커니즘이다.

- 클라이언트는 `request message`에 Accept* 헤더 필드를 사용하여 요청
- 서버는 `response message`에 Content* 헤더 필드를 사용하여 응답
- 언어 태그(`Accept-Language`) / 문자셋(`Accept-Charset`) / 인코딩(`Accept-Encoding`) / 미디어 타입(`Accept`) 등을 사용
- 0 ~ 1 사이의 Quality Value(QValue)를 사용하여 우선순위를 나타냄(`Accept-Language: ko-KR, en-US;q=0.9, en;q=0.8`)

## Status Code

`request`에 대한 서버의 응답 상태를 나타내는 세 자리 숫자 코드로 구성되어 있으며, 응답 상태를 크게 5가지로 분류할 수 있다.

| code |    class     |     description      |
|:----:|:------------:|:--------------------:|
| 1xx  | information  |   리퀘스트를 받아들여 처리 중    |
| 2xx  |   success    |      리퀘스트 정상 처리      |
| 3xx  | redirection  | 리퀘스트를 완료하려면 추가 행동 필요 |
| 4xx  | client error |     리퀘스트 이해 불가능      |
| 5xx  | server error |    서버가 리퀘스트 처리 실패    |

자세한 내용은 [HTTP Status](https://developer.mozilla.org/ko/docs/Web/HTTP/Status) 참고

## MIME (Multipurpose Internet Mail Extensions)

본래 이메일 전송을 위해 만들어졌으나, 현재는 웹에서 전송되는 모든 데이터의 형식을 명시하기 위해 `Content-Type` 헤더에 기재된다.

- 이미지 등의 바이너리 데이터를 아스키(ASCII) 문자열에 인코딩하는 방법과 데이터 종류를 나타내는 방법 등을 규정
- 확장 사양에 있는 멀티파트(Multipart)라고 하는 여러 다른 종류의 데이터를 수용하는 방법 사용
- `HTTP`도 멀티파트에 대응하고 있어 하나의 메시지 바디 내부에 여러 엔티티를 포함시킬 수 있음
- 전송 방식
    - `text/html`: HTML 문서
    - `application/json`: JSON 데이터 (API 통신 표준)
    - `image/png`, `image/jpeg`: 이미지 파일
    - `multipart/form-data`: HTML Form을 통해 파일과 텍스트 데이터를 함께 전송할 때 사용. 각 파트마다 경계(Boundary)로 구분하여 전송한다.

###### 참고자료

- [HTTP 완벽 가이드](https://kobic.net/book/bookInfo/view.do?isbn=9788966261208)
- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-웹-네트워크)
- [그림으로 배우는 HTTP & Network Basic](https://kobic.net/book/bookInfo/view.do?isbn=9788931447897)
