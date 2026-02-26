---
title: "InnoDB Storage Engine Lock"
date: 2023-03-23
lastUpdated: 2025-09-10
---

InnoDB 스토리지 엔진의 다른 MySQL 스토리지 엔진과는 다음과 같은 차이점이 있다.

- 레코드 기반의 잠금(Row-level Lock)을 제공하여 높은 동시성 처리 가능
- 잠금 정보를 효율적인 자료구조로 관리하므로 잠금의 개수가 많아져도 레코드 락이 페이지 락이나 테이블 락으로 확장되는 잠금 에스컬레이션(Lock Escalation)이 발생하지 않음

## 잠금의 기본 모드

InnoDB의 모든 레코드 수준 잠금은 기본적으로 공유(Shared) 모드와 배타적(Exclusive) 모드로 나뉜다.

- 공유 잠금 (Shared Lock, S-Lock): 여러 트랜잭션이 동시에 동일한 레코드에 대해 공유 잠금을 가질 수 있음
    - 데이터를 읽는 것은 허용하지만, 다른 트랜잭션이 해당 레코드를 변경(배타적 잠금 획득)하는 것은 허용하지 않음
    - `SELECT ... LOCK IN SHARE MODE` 구문을 통해 획득
- 배타적 잠금 (Exclusive Lock, X-Lock): 오직 잠금을 소유한 트랜잭션만이 해당 레코드를 읽고 변경할 수 있음
    - 배타적 잠금이 설정된 레코드는 다른 어떤 트랜잭션에서도 공유 잠금이나 배타적 잠금을 추가로 획득할 수 없음
    - `SELECT ... FOR UPDATE`, `UPDATE`, `DELETE` 구문을 통해 획득

## 레코드 락(Record Lock)

레코드 락은 인덱스의 레코드에 잠금을 설정하는 가장 단순한 형태의 잠금이다.

- 동작 방식: 데이터 레코드 자체가 아닌, 해당 레코드를 가리키는 인덱스 엔트리를 잠금
    - 테이블에 인덱스가 없다면, InnoDB가 내부적으로 생성한 클러스터 인덱스(ROW_ID)를 사용해 잠금 설정
- 잠금 범위: 쿼리가 어떤 인덱스를 통해 데이터에 접근하는지에 따라 잠금의 범위가 결정
    - 프라이머리 키나 유니크 인덱스를 통해 단일 레코드를 조회하고 잠그는 경우, 정확히 해당 인덱스 레코드 하나에만 잠금이 설정

### 레코드 자체 잠금 & 인덱스의 레코드 잠금 차이

레코드 락은 테이블 레코드가 아닌 인덱스를 잠그는 방식으로 처리하기 때문에, 아래와 같은 상황을 주의해야 한다.

```sql
-- 테이블 정보
-- TABLE NAME: employees
-- KEY ix_firstname (first_name)
SELECT COUNT(*)
FROM employees; -- 300000

SELECT COUNT(*)
FROM employees
WHERE first_name = 'Kwon'; -- 253

SELECT COUNT(*)
FROM employees
WHERE first_name = 'Kwon'
  AND last_name = 'Ogu'; -- 1

UPDATE employees
SET hire_date = NOW()
WHERE first_name = 'Kwon'
  AND last_name = 'Ogu';
```

- 위의 실행 문에서 `UPDATE` 문장은 단 한 건의 레코드만 변경
- 하지만 이 문장의 조건에서 인덱스를 이용할 수 있는 조건은 `first_name` 컬럼 하나만 존재
- 때문에 `first_name` 컬럼의 인덱스를 잠그게 되고, 이에 따라 `first_name` 컬럼의 값이 `Kwon`인 모든 레코드가 락 생성
- 인덱스를 통해 스캔할 수 없는 상황에는 레코드 조회 시 테이블을 풀 스캔하면서 30만 건의 레코드 전부 락이 걸리게 됨

## 갭 락(Gap Lock)

레코드가 지정된 범위에 해당하는 인덱스 테이블 공간을 대상으로 거는 잠금으로, 실제 레코드가 아닌 구간(Gap)에 대해 설정된다.

- 목적: 이 간격 내에 다른 트랜잭션이 새로운 데이터 `INSERT` 방지
- 동작: 갭 락은 그 자체로 특정 레코드를 잠그는 효과는 없으며, 오직 새로운 항목의 삽입만 방지
    - 갭 락끼리는 서로 충돌하지 않으며, 여러 트랜잭션이 동일한 갭에 대해 갭 락을 동시에 보유 가능

```sql
-- 51 ~ 55 사이의 레코드에 대해 베타적 잠금 획득하는 쿼리
SELECT *
FROM member
WHERE 51 <= age
  AND age <= 55
    FOR
UPDATE;
```

age 52 / 53을 가진 레코드가 있을 때, 위 쿼리가 실행된다면, 실제 존재하는 레코드 뿐만 아니라, 51과 55 사이의 공간에 대해 갭 락이 걸리게 된다.

| age | PK  |        잠금 여부        |
|:---:|:---:|:-------------------:|
| ... | ... |         ...         |
| 50  | 59  |          X          |
|     |     | 갭 락(51 ~ 52 사이의 공간) |
| 52  | 61  |        레코드 락        |
| 53  | 62  |        레코드 락        |
|     |     | 갭 락(53 ~ 55 사이의 공간) |
| 56  | 65  |          X          |

## 넥스트 키 락(Next-Key Lock)

넥스트 키 락은 레코드 락과 갭 락을 합친 형태로, InnoDB의 기본 격리 수준인 `REPEATABLE READ`에서 팬텀 리드(Phantom Read)를 방지하기 위한 핵심적인 메커니즘이다.

- 특정 인덱스 레코드에 대한 레코드 락 + 해당 인덱스 레코드 이전의 간격에 대한 갭 락
- 특정 레코드와 그 앞뒤 간격을 포함하는 범위에 대해 `(prev, current]` 방식으로 잠금 설정

즉, 쿼리에서 참조한 인덱스 레코드뿐만 아니라 그 이전과 다음 레코드와의 갭까지 함께 잠금이 걸리므로, 조회된 범위 내에 새로운 레코드가 삽입되는 것을 차단하는 데 사용된다.

### 예시

| age | PK  |
|:---:|:---:|
| 50  | 101 |
| 52  | 102 |
| 56  | 103 |

`age` 컬럼에 대한 인덱스를 가진 member 테이블이 있고, 다음과 같은 쿼리를 실행하면 InnoDB는 넥스트 키 락을 설정하게 된다.

```sql
SELECT *
FROM member
WHERE age = 52 FOR
UPDATE;
```

위 쿼리는 단일 값(age = 52)만 조회하지만, 실제로는 다음과 같은 넥스트 키 락이 설정된다.

- (50, 52] 범위: 레코드 52와 그 앞 공간
- (52, 56] 범위: 레코드 52 다음 값과의 갭도 포함

이처럼 유니크 하지 않은 인덱스의 단일 값을 조회하더라도 넥스트 키 락은 인덱스 순서상 앞뒤 갭을 모두 포함해서 잠금하게 된다.

|   구분    |    범위    |            설명             |
|:-------:|:--------:|:-------------------------:|
| 넥스트 키 락 | (50, 52] |      레코드 52와 앞의 갭 포함      |
| 넥스트 키 락 | (52, 56] | 레코드 52 이후 인덱스상 다음 레코드와의 갭 |
|  레코드 락  |    52    |     명시적으로 선택된 레코드 자체      |

### 단일 조회 시에도 범위에 대해 넥스트 키 락이 걸리는 이유

락을 이용한 읽기, UPDATE, DELETE와 같은 명령문은 SQL 명령문 처리 시 InnoDB는 정확한 WHERE 조건을 기억하지 않고, 스캔된 인덱스 범위에 대해 잠금을 설정한다.

- 유니크한 인덱스를 사용할 경우: InnoDB는 발견된 인덱스 레코드만 잠금
- 유니크하지 않은 인덱스 or 범위 조건: InnoDB는 스캔된 인덱스 범위에 대해 넥스트 키 락을 설정

## 자동 증가 락(Auto-Increment Lock)

`AUTO_INCREMENT` 속성을 가진 컬럼에 대해 중복되지 않는 유니크한 값을 할당하기 위해 내부적으로 사용되는 특수한 테이블 수준의 잠금이다.

- 내부적으로 테이블 수준의 잠금을 걸어 중복되지 않는 값을 보장
- 명시적으로 획득하거나 해제할 수 없음
- MySQL 8.0에서는 잠금을 걸지 않는 방법을 기본 값으로 사용 중이며 `innodb_autoinc_lock_mode` 시스템 변수를 이용하여 변경 가능(기본값: 1)

|        값         | AUTO_INCREMENT 값 연속성 | 동시 INSERT 처리 성능 | 락 동작 방식 설명                                                                                          |
|:----------------:|:--------------------:|:---------------:|:----------------------------------------------------------------------------------------------------|
| `0`(TRADITIONAL) |        항상 연속적        |  매우 낮음 (직렬 처리)  | 모든 INSERT에서 테이블 단위 락을 걸고 순차적으로 AUTO_INCREMENT 값을 할당                                                 |
| `1`(CONSECUTIVE) |       대부분 연속적        |       보통        | 삽입 수를 알 수 있는 단일 INSERT는 락을 최소한으로 걸음 / `INSERT ... SELECT` 같은 삽입 수를 알 수 없는 경우 구문이 끝날 때까지 테이블 단위 락 유지 |
| `2`(INTERLEAVED) |      연속성 보장 안 됨      |      매우 높음      | 락을 잡지 않아 빠르게 삽입하나 ID는 비연속적일 수 있음                                                                    |

## 레코드 수준의 잠금 확인 및 해제

테이블 잠금은 잠금의 대상이 테이블 자체이므로 쉽게 문제 파악이 되지만, 레코드 수준의 잠금은 걸려있는지 확인하기가 어렵다.

|                            커넥션1                             |                            커넥션2                            |                                     커넥션3                                     |
|:-----------------------------------------------------------:|:----------------------------------------------------------:|:----------------------------------------------------------------------------:|
|                          `BEGIN;`                           |                                                            |                                                                              |
| `UPDATE employees SET birth_date=NOW() WHERE emp_no=10001;` |                                                            |                                                                              |
|                                                             | `UPDATE employees SET hire_date=NOW() WHERE emp_no=10001;` |                                                                              |
|                                                             |                                                            | `UPDATE employees SET hire_date=NOW(), birth_date=NOW() WHERE emp_no=10001;` |

위 시나리오는 커넥션 1이 아직 `COMMIT`을 실행하지 않은 상태이므로 해당 레코드의 잠금을 그대로 가지고 있으며, 커넥션 2 / 커넥션 3은 해당 레코드의 잠금을 대기하고 있음을 확인할 수 있다.

```sql
SELECT
    -- 대기 중인 트랜잭션 정보
    r.trx_id              waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query           waiting_query,
    -- 잠금을 보유한 트랜잭션 정보
    b.trx_id              blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query           blocking_query
FROM performance_schema.data_lock_waits w
         INNER JOIN information_schema.innodb_trx b
                    ON b.trx_id = w.blocking_engine_transaction_id
         INNER JOIN information_schema.innodb_trx r
                    ON r.trx_id = w.requesting_engine_transaction_id
```

MySQL 8.0 기준 `performance_schema` 테이블을 이용하여 잠금과 대기 순서를 확인할 수 있다.

| waiting_trx_id | waiting_thread |     waiting_query     | blocking_trx_id | blocking_thread |    blocking_query     |
|:--------------:|:--------------:|:---------------------:|:---------------:|:---------------:|:---------------------:|
|  0x7f9b1c0003  |       3        | `UPDATE employees...` |  0x7f9b1c0002   |        2        | `UPDATE employees...` |
|  0x7f9b1c0003  |       3        | `UPDATE employees...` |  0x7f9b1c0001   |        1        |         NULL          |
|  0x7f9b1c0002  |       2        | `UPDATE employees...` |  0x7f9b1c0001   |        1        |         NULL          |

위 결과를 보고 각 스레드가 어떤 쿼리를 실행하고 어떤 스레드의 잠금을 대기하고 있는지 확인할 수 있다.

- 2번 스레드: 1번 스레드의 락 대기
- 3번 스레드: 2번 스레드 + 1번 스레드의 락 대기

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)