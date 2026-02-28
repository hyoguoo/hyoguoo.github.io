---
title: "Key Management"
date: 2024-09-28
lastUpdated: 2025-10-05
tags: [Redis]
description: "Redis 키의 이름 규칙, 자동 생성 및 소멸 동작, 주요 키 관리 명령어를 정리하고 KEYS와 SCAN의 성능 차이를 비교한다."
---

Redis에서 키(Key)는 모든 데이터에 접근하기 위한 유일한 문자열 식별자로, 데이터를 저장, 조회, 삭제하는 모든 명령어의 기본 단위로 사용된다.

## 키 이름 규칙

정해진 규칙은 없으나, 실무에서는 일관된 규칙을 정해 관리하여 키의 가독성을 높이고, 데이터 구조를 직관적으로 파악하며, 키 충돌을 방지하는 데 도움이 될 수 있도록 해야 한다.

- 표기법: 일반적으로 `객체타입:ID:속성` 형태의 구조를 사용(`user:1001:profile`)
- 장점:
    - 명확성: `user:1001`과 같이 키 이름만으로 어떤 데이터를 담고 있는지 쉽게 유추 가능
    - 그룹화: `user:*`와 같은 패턴으로 특정 타입의 모든 키를 논리적으로 그룹화하고 `SCAN` 명령어로 조회 가능

### 키의 생성과 소멸

Redis의 키는 별도의 생성 명령어 없이, 값을 저장하는 시점에 자동으로 생성된다.

- 자동 생성: 키가 없는 상태에서 `SET`, `LPUSH`, `HSET` 등의 쓰기 명령어가 실행되면 새로운 키가 생성되고 값이 할당
- 키가 이미 존재하는 경우: 기존 키의 값을 업데이트
- 다른 자료구조로 이미 생성 된 경우: 에러 발생

```bash
SET mykey "value"  # mykey가 없으면 생성
SET mykey "new_value"  # mykey가 있으면 값 업데이트
LPUSH mykey "1" "2"  # 에러 발생
```

리스트의 경우 들어간 아이템이 모두 삭제 되면 해당 키도 자동으로 삭제된다.

```bash
LPUSH mylist "1" "2" "3"
LPOP mylist
LPOP mylist
LPOP mylist  # mylist 키 삭제
````

## 주요 키 관리 명령어

|    명령어     |                       기능                       |          예시           |
|:----------:|:----------------------------------------------:|:---------------------:|
|   `SET`    |                    키와 값 설정                     |  `SET mykey "value"`  |
|   `GET`    |                    키의 값 조회                     |      `GET mykey`      |
|  `EXISTS`  |                  키가 존재하는지 확인                   |    `EXISTS mykey`     |
|   `KEYS`   |               특정 패턴에 맞는 키 목록 조회                |     `KEYS user:*`     |
|   `SCAN`   |                 키 목록을 순회하며 조회                  |       `SCAN 0`        |
|   `SORT`   |       list, set, sorted set 데이터를 정렬하여 반환       |     `SORT mylist`     |
|  `RENAME`  |                    키 이름 변경                     | `RENAME mykey newkey` |
|   `COPY`   |                      키 복사                      |  `COPY mykey newkey`  |
|   `TYPE`   |                  키의 데이터 타입 조회                  |     `TYPE mykey`      |
|  `OBJECT`  |      키의 메모리 사용량, 데이터 타입, TTL 등의 상세 정보 조회       |    `OBJECT mykey`     |
| `FLUSHALL` |                레디스에 저장된 모든 키 삭제                |      `FLUSHALL`       |
|   `DEL`    |                키 삭제(동기 방식으로 동작)                |      `DEL mykey`      |
|  `UNLINK`  | 키 삭제(백그라운드에서 삭제 작업을 수행하여 비동기 방식으로 처리하여 블로킹 방지) |    `UNLINK mykey`     |
|  `EXPIRE`  |                키의 TTL(만료 시간) 설정                |   `EXPIRE mykey 60`   |
|   `TTL`    |                  남은 TTL 시간 조회                  |      `TTL mykey`      |
| `PERSIST`  |             TTL을 제거하고 키를 영구적으로 유지              |    `PERSIST mykey`    |

### `KEYS` vs `SCAN`

두 명령어 모두 특정 패턴에 맞는 키를 조회하는데 사용되지만, 안정성과 성능 면에서 차이가 있다.

- `KEYS`: 전체 키 공간을 한 번에 탐색하여 키를 반환
    - 싱글 스레드인 레디스에선 해당 작업을 수행하는 동안 다른 명령어를 수행 할 수 없어 성능 이슈가 발생
- `SCAN`: 커서를 기반으로 특정 범위의 키만 조회
    - 전체 키 탐색 과정을 여러 번의 짧은 명령으로 나누어 실행하므로, 서버의 블로킹 없이 안전하게 키를 조회

###### 참고자료

- [개발자를 위한 레디스](https://kobic.net/book/bookInfo/view.do?isbn=9791161757926)
