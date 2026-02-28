---
title: "INSERT"
date: 2023-07-18
lastUpdated: 2025-09-22
tags: [MySQL]
description: "MySQL INSERT의 IGNORE·ON DUPLICATE KEY UPDATE 옵션과 LOAD DATA를 활용한 대량 데이터 적재 방법을 설명한다."
---

일반적인 애플리케이션 서비스에서는 INSERT 할 때 대부분 한 건 혹은 소량의 레코드만 추가하는 형태인데, 이 경우엔 성능에 대해 고려할 부분이 없다.

## 삽입 옵션

- `INSERT IGNORE`: 중복된 레코드(UNIQUE 컬럼)가 있을 경우, 오류를 발생시키지 않고 무시하고 다음 레코드로 넘어가는 옵션
    - 데이터의 정교함이 덜 요구되는 대량 데이터 적재 시, 중복 오류로 인해 전체 작업이 중단되는 것을 방지하기 위해 사용
- `INSERT ... ON DUPLICATE KEY UPDATE`: 중복된 레코드(UNIQUE 컬럼)가 있을 경우, 오류를 발생시키지 않고 해당 레코드를 UPDATE하는 옵션
    - INSERT와 UPDATE를 하나의 쿼리로 처리할 수 있어 애플리케이션 로직을 단순화하는 데 유용

## LOAD DATA

`LOAD DATA` 명령어는 대용량 텍스트 파일을 테이블에 고속으로 적재하기 위한 전용 구문이다.

- MySQL 엔진과 스토리지 엔진 호출 횟수를 최소화
- 스토리지 엔진 레벨에서 직접 데이터를 적재

하지만 LOAD DATA 명령을 사용할 때 주의할 점이 있다.

- 단일 스레드 동작: 데이터를 적재하는 작업이 단일 스레드로만 처리
- 단일 트랜잭션 실행: 파일 전체가 하나의 트랜잭션으로 묶여 실행

따라서 매우 큰 파일을 적재할 경우, 장시간 동안 테이블에 잠금이 발생하여 다른 트랜잭션의 성능에 영향을 줄 수 있다.

## `INSERT` 성능에 영향을 미치는 요소

### 프라이머리 키(Primary Key) 특성

`INSERT` 쿼리 자체보다는 테이블의 구조, 특히 프라이머리 키(Primary Key)의 특성이 성능에 결정적인 영향을 미친다.

- 순차적 PK(예: `AUTO_INCREMENT`): 새로운 데이터가 항상 테이블의 마지막에 추가
    - 디스크에 순차적으로 쓰기 작업을 수행하게 만들어 높은 성능을 유지
- 비순차적 PK(예: UUID): 새로운 데이터가 테이블의 중간 여러 위치에 삽입
    - 해당 과정에서 기존 데이터 페이지를 찾아가고, 공간이 부족할 경우 페이지 분할(Page Split)을 일으켜 심각한 성능 저하 유발
    - 페이지 분할은 많은 랜덤 디스크 I/O를 발생시키고 데이터 파편화 증가

### 다중 행 `INSERT`(Multi-row INSERT)

여러 건의 데이터를 `INSERT`할 때는 한 건씩 반복 실행하는 것보다, 하나의 `INSERT` 문에 여러 `VALUES` 절을 포함하여 실행하는 것이 훨씬 효율적이다.

```sql
-- 비효율적인 방식
INSERT INTO users (name)
VALUES ('user1');
INSERT INTO users (name)
VALUES ('user2');

-- 효율적인 방식
INSERT INTO users (name)
VALUES ('user1'),
       ('user2');
```

하나의 `INSERT` 문에 여러 행을 포함하면, 네트워크 왕복 횟수, 쿼리 파싱 및 계획 수립 오버헤드, 트랜잭션 커밋 오버헤드가 크게 줄어들어 성능이 향상된다.

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)