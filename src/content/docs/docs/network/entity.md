---
title: "Entity"
date: 2023-08-09
lastUpdated: 2025-12-14
tags: [Network]
description: "HTTP 엔티티 헤더 필드(Content-Type, Content-Length 등)와 엔티티 본문의 구조 및 무결성 검사 방식을 정리한다."
---

## 메시지와 엔티티

HTTP 메시지 - 컨테이너, HTTP 엔티티 - 실질적인 화물 비유로 설명할 수 있다.

```http request
HTTP/1.1 200 OK
Server: Apache/2.4.41
Date: Mon, 26 Jul 2021 12:00:00 GMT
Connection: keep-alive
Content-Type: text/plain; charset=utf-8   <-- 엔티티 헤더
Content-Length: 18                        <-- 엔티티 헤더

Hi! I'm a message!                        <-- 엔티티 본문
```

- 엔티티 헤더: 본문에 대한 메타데이터(데이터의 타입, 크기, 압축 방식, 언어 등)를 설명하는 필드
- 엔티티 본문: 가공되지 않은 실제 데이터가 들어가는 공간. 헤더와 본문은 빈 줄(CRLF)로 구분됨

## 주요 엔티티 헤더 필드

엔티티 본문을 올바르게 해석하기 위해 필요한 정보를 담고 있다.

|      헤더 필드       |                    설명                    |
|:----------------:|:----------------------------------------:|
|   Content-Type   | 본문의 미디어 타입(MIME)과 문자 인코딩 방식(Charset)을 명시 |
|  Content-Length  |     본문의 길이를 바이트 단위로 명시(인코딩 후의 본문 기준)     |
| Content-Encoding |      본문의 압축 방식(gzip, deflate 등)을 명시      |
| Content-Language |          본문의 자연어(ko, en 등)를 명시           |
| Content-Location |    반환된 데이터가 실제로 위치하는 URI (리다이렉션과는 다름)    |

## Content-Length

엔티티 본문의 크기(Byte)를 나타내는 헤더로, HTTP 통신의 안정성을 위해 매우 중요하다.

- 지속 커넥션: 응답 메시지 간 구분
    - HTTP/1.1은 기본적으로 연결을 유지하는 `Keep-Alive`를 사용
    - 하나의 TCP 연결로 여러 요청/응답이 오가는데, `Content-Length`가 없다면 여러 응답 간 메시지 구분이 불가능
- 잘림 검출: 본문이 중간에 잘렸는지 확인
    - 본문의 크기와 비교해 본문을 받는 도중 잘림이 발생했는지 확인 가능
    - 전송 받은 데이터가 `Content-Length`보다 작으면 재전송 요청

## 엔티티 요약과 무결성 검사

전송 중 데이터가 변조되거나 깨지는 것을 방지하기 위해 무결성 검사 메커니즘을 사용할 수 있다.

- 발생 원인: 불완전한 프록시 서버의 트랜스코딩(메시지가 일부 변경), 네트워크 노이즈, 버그 등
- Content-MD5: 과거에는 MD5 체크섬을 헤더에 포함하여 무결성을 검증했으나, 현재는 보안상 취약하여 권장되지 않음
- Digest: 최신 표준에서는 `Digest` 헤더를 사용하여 무결성을 검증하거나, HTTPS(TLS) 계층에서의 암호화 및 무결성 보장에 의존하는 편임

엔티티 본문이 의도치 않은 변경을 감지하기 위해, 최초 엔티티가 생성될 때 간단한 체크섬을 생성하여, 그 체크섬으로 기본적인 검사를하여 엔티티가 변형되었는지 확인할 수 있다.

## 미디어 타입과 차셋(Charset)

`Content-Type` 헤더는 데이터가 어떻게 렌더링되어야 하는지를 브라우저(클라이언트)에 알려준다.

- 구조: `type/subtype; parameter`
- Type: 데이터의 대분류 (text, image, audio, video, application, multipart 등)
- Subtype: 구체적인 포맷 (html, plain, jpeg, json 등)

텍스트 데이터의 경우, 바이너리를 어떤 문자로 해석할지 결정하는 `charset` 파라미터가 필수적이다.

###### 참고자료

- [HTTP 완벽 가이드](https://kobic.net/book/bookInfo/view.do?isbn=9788966261208)
