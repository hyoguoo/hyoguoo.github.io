---
title: "MySQL COUNT() 함수의 동작 원리와 성능"
date: 2024-06-03
lastUpdated: 2024-11-20
tags: [MySQL]
---

> 실행 환경: MySQL 8.0.33, InnoDB Storage Engine

MySQL에서 `COUNT()`함수 인자로 아래 두 가지 방식을 사용할 수 있다.

- `COUNT(*)`(= `COUNT(1)`): 테이블의 전체 레코드 수를 반환
- `COUNT(column_name)`: 특정 컬럼의 값이 NULL이 아닌 레코드 수를 반환

`COUNT(*)`은 테이블의 전체 레코드 수를 반환하기 때문에, PK인 `id` 컬럼을 사용할 것 처럼 보이지만, 실제로 옵티마이저는 다른 방식을 사용하여 처리하게 된다.

## COUNT(*) 실행 계획과 옵티마이저 동작

`SELECT COUNT(*)`는 `SELECT *`처럼 전체 컬럼 혹은 PK를 의미하는 것이 아닌, 옵티마이저가 최적화하여 가장 빠르게 처리할 수 있는 컬럼을 의미한다.  
여기서 가장 빠르게 처리할 수 있는 컬럼이란 사용 가능한 가장 작은 세컨더리 인덱스인데, 실제로 MySQL 공식 문서에서도 아래와 같이 설명하고 있다.

> InnoDB processes SELECT COUNT(*) statements by traversing the smallest available secondary index
> unless an index or optimizer hint directs the optimizer to use a different index. If a secondary
> index is not present, InnoDB processes SELECT COUNT(*) statements by scanning the clustered index.
> \
> 인덱스 또는 옵티마이저 힌트가 옵티마이저에 다른 인덱스를 사용하도록 지시하지 않는 한, InnoDB는 사용 가능한 가장 작은 보조 인덱스를 탐색하여 SELECT COUNT(*)
> 문을 처리합니다. 보조 인덱스가 없는 경우, InnoDB는 클러스터된 인덱스를 스캔하여 SELECT COUNT(*) 문을 처리합니다.

실제로 그런지 확인하기 위해 `employees` 테이블에 `COUNT(*)` 쿼리를 실행하고, 실행 계획을 확인해보자.  
테스트에는 MySQL 샘플 데이터의 `employees` 테이블을 사용하였다.

```sql
-- 데이터 개수 300,024개
create table employees
(
    emp_no     int             not null primary key,
    birth_date date            not null,
    first_name varchar(14)     not null,
    last_name  varchar(16)     not null,
    gender     enum ('M', 'F') not null,
    hire_date  date            not null
);
```

```sql
EXPLAIN
SELECT COUNT(*)
FROM employees;

-- | id | select\_type | table     | partitions | type  | possible\_keys | key     | key\_len | ref  | rows   | filtered | Extra       |
-- |:---|:-------------|:----------|:-----------|:------|:---------------|:--------|:---------|:-----|:-------|:---------|:------------|
-- | 1  | SIMPLE       | employees | null       | index | null           | PRIMARY | 4        | null | 298841 | 100      | Using index |
```

실행 계획을 확인해보면, `PRIMARY` 키를 사용하여 인덱스 스캔을 수행하는 것을 확인할 수 있는데, 여기서 인덱스를 추가하면 달라지는 것을 확인할 수 있다.

```sql
CREATE INDEX idx_first_name
    ON employees (first_name);

EXPLAIN
SELECT COUNT(*)
FROM employees;

-- | id | select\_type | table     | partitions | type  | possible\_keys | key              | key\_len | ref  | rows   | filtered | Extra       |
-- |:---|:-------------|:----------|:-----------|:------|:---------------|:-----------------|:---------|:-----|:-------|:---------|:------------|
-- | 1  | SIMPLE       | employees | null       | index | null           | idx\_first\_name | 58       | null | 298841 | 100      | Using index |
```

`key` 컬럼이 `PRIMARY`에서 `idx_first_name`으로 변경되었는데, 여기서 또 다른 인덱스를 추가하면 어떻게 처리되는지 확인해보자.

```sql
CREATE INDEX idx_gender
    ON employees (gender);
CREATE INDEX idx_birth_date
    ON employees (birth_date);

EXPLAIN
SELECT COUNT(*)
FROM employees;

-- | id | select\_type | table     | partitions | type  | possible\_keys | key         | key\_len | ref  | rows   | filtered | Extra       |
-- |:---|:-------------|:----------|:-----------|:------|:---------------|:------------|:---------|:-----|:-------|:---------|:------------|
-- | 1  | SIMPLE       | employees | null       | index | null           | idx\_gender | 1        | null | 298841 | 100      | Using index |
```

`idx_gender`로 변경되었는데, 해당 컬럼은 `enum` 데이터 타입을 사용하고 있다.  
`enum` 데이터 타입은 1-2바이트만 사용하는 가장 작은 크기의 인덱스이기 때문에 옵티마이저가 해당 인덱스를 사용하여 `COUNT(gender)` 쿼리로 처리한 것이다.

```sql
EXPLAIN
SELECT COUNT(emp_no)
FROM employees;

-- | id | select\_type | table     | partitions | type  | possible\_keys | key         | key\_len | ref  | rows   | filtered | Extra       |
-- |:---|:-------------|:----------|:-----------|:------|:---------------|:------------|:---------|:-----|:-------|:---------|:------------|
-- | 1  | SIMPLE       | employees | null       | index | null           | idx\_gender | 1        | null | 298841 | 100      | Using index |
```

추가적으로 `COUNT(emp_no)`처럼 PK 컬럼으로 명시하더라도 옵티마이저에서 PK가 아닌 가장 작은 크기의 인덱스를 사용하여 처리하는 것을 확인할 수 있었다.

## 가장 작은 크기의 세컨더리 인덱스가 더 빠른 이유

`COUNT(*)` 쿼리는 가장 작은 크기의 세컨더리 인덱스를 사용하여 처리하는 것이 더 빠른 이유는 InnoDB 엔진의 세컨더리 인덱스 구조 때문이다.

![InnoDB Non-Clustered Index](/posts/images/how-count-query-work/innodb-btree.png)

InnoDB의 세컨더리 인덱스는 Non-Clustered Index로, 해당 인덱스에는 해당 컬럼 값과 PK 값만 저장되어 있는데,  
때문에 `COUNT(*)` 쿼리에선 아래의 이유로 더 빠르게 처리할 수 있게 된다.

1. 레코드 수 집계의 특성: COUNT 쿼리에서 필요한 것은 실제 데이터가 아닌 레코드 수이기 때문에 논 클러스터 인덱스더라도 실제 데이터에 대한 I/O가 필요 없음
2. 인덱스 크기와 스캔 속도: 세컨더리 인덱스는 해당 인덱스와 PK만 저장하므로 작은 데이터 크기를 가져, 하나의 페이지에 많은 레코드가 들어가 디스크 읽기 작업이 줄어듦

** 페이지: 디스크에 데이터를 저장하는 기본 단위로, 디스크의 모든 읽기 및 쓰기 작업의 최소 작업 단위

### COUNT(column_name) 인자의 컬럼 데이터 크기가 미치는 영향

아래 예시는 세컨더리 인덱스를 사용하여 처리하는 것은 아니지만, 컬럼의 데이터 크기와 양에 따라 처리 속도가 크게 달라질 수 있음을 확인할 수 있다.

```sql
-- TEXT 타입 컬럼 추가
alter table employees
    add text_column text null;

-- 컬럼에 대량의 데이터 추가
UPDATE employees
SET test_column = '...'; -- 약 2^16 길이의 영문자

SELECT COUNT(text_column)
FROM employees;
-- 17025ms

SELECT COUNT(last_name)
FROM employees;
-- 50-100ms
```

이처럼 데이터의 크기는 `COUNT()` 쿼리에 큰 영향을 미치는 요인 중 하나이며, 특히 `TEXT`와 같이 큰 데이터 타입을 사용할 때는 더욱 주의하는 것이 좋다.

## 테이블 레코드 전체 개수 조회

MyISAM과 InnoDB 스토리지 엔진에서 테이블의 레코드 전체 개수를 조회하는 쿼리인 `SELECT COUNT(*) FROM table_name`는 아래와 같이 처리된다.

- MyISAM: 메타 데이터를 통해 별도 연산 없이 조회
- InnoDB: 데이터나 인덱스 스캔을 통해 레코드 건수 조회

InnoDB가 MyISAM과 같이 메타 데이터를 통해 조회하지 않는 이유는 InnoDB의 트랜잭션 지원을 위해 MVCC를 사용하기 때문이다.

> InnoDB does not keep an internal count of rows in a table because concurrent transactions might
> “see” different numbers of rows at the same time. Consequently, SELECT COUNT(*) statements only
count rows visible to the current transaction.
> \
> 동시 트랜잭션이 동시에 다른 수의 행을 '볼' 수 있기 때문에 InnoDB는 테이블의 행 내부 개수를 유지하지 않습니다. 따라서 SELECT COUNT(*) 문은 현재
> 트랜잭션에 표시되는 행만 카운트합니다.

### WHERE 조건 / GROUP BY 조건 없는 COUNT(*) 쿼리

이전에 [커서 기반 페이징 성능 개선](/blog/cursor-based-paging-in-spring-data-jpa/)
을 진행하면서 `WHERE` 조건이 없는 `COUNT(*)` 쿼리가 빠르게 처리되는 것을 확인할 수 있었는데, 그 때 상황을 재현하면 아래와 같다.

```sql
-- 데이터 개수 3,000,000개
CREATE TABLE bulkinsert
(
    num INT PRIMARY KEY
);

-- 1. 테이블 레코드 전체 개수 조회
SELECT COUNT(*)
FROM bulkinsert;
-- 80-100ms

-- 2. 테이블 레코드의 전체가 걸리는 조건으로 조회
SELECT COUNT(*)
FROM bulkinsert
WHERE num >= 0;
-- 350-400ms

-- 3. 테이블 레코드의 대부분을 조회
SELECT COUNT(*)
FROM bulkinsert
WHERE num < 2950000;
-- 350-400ms

-- 4. 테이블 레코드의 소수만 조회
SELECT COUNT(*)
FROM bulkinsert
WHERE num < 10;
-- 30-50ms
```

| 쿼리 유형                       |       조건        |   실행 시간   |
|:----------------------------|:---------------:|:---------:|
| 1. 테이블 레코드 전체 개수 조회         |       없음        | 80-100ms  |
| 2. 테이블 레코드의 전체가 걸리는 조건으로 조회 |   `num >= 0`    | 350-400ms |
| 3. 테이블 레코드의 대부분을 조회         | `num < 2950000` | 350-400ms |
| 4. 테이블 레코드의 소수만 조회          |   `num < 10`    |  30-50ms  |

테이블 레코드 전체 개수 조회가 비슷한 양의 데이터를 조회하는 2,3번 쿼리보다 훨씬 빠르게 처리되는 것을 확인할 수 있는데,  
이전에는 메타 데이터를 통해 조회하기 때문에 더 빠르다고 생각했지만, 아래의 이유로 이는 틀린 사실임을 알 수 있다.

- InnoDB에서는 MVCC 지원을 위해 실제 스캔을 통해 레코드 건수를 조회
- 메타 데이터를 통해 조회하는 것이라면, 소수만 조회하는 4번 쿼리보다 빠르게 처리되어야 함

전체 레코드를 조회하게 되는 1, 2번 두 쿼리의 EXPLAIN ANALYZE 결과를 확인해보면 아래와 같다.

```sql
-- 1. 테이블 레코드 전체 개수 조회
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM bulkinsert;
-- -> Count rows in bulkinsert  (actual time=58.3..58.3 rows=1 loops=1)

-- 2. 테이블 레코드의 전체가 걸리는 조건으로 조회
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM bulkinsert
WHERE num >= 0;
-- -> Aggregate: count(0)  (cost=408276 rows=1) (actual time=627..627 rows=1 loops=1)
--     -> Filter: (bulkinsert.num >= 0)  (cost=272398 rows=1.36e+6) (actual time=0.0403..546 rows=3e+6 loops=1)
--         -> Covering index range scan on bulkinsert using PRIMARY over (0 <= num)  (cost=272398 rows=1.36e+6) (actual time=0.0377..412 rows=3e+6 loops=1)
```

- 1번 쿼리: 전체 행을 카운트하는데, 2번보다 비교적 빠르게 처리(58.3ms vs 627ms)
- 2번 쿼리: `num >= 0` 지점을 찾고 필터링을 수행하는 부분 뿐만 아니라, 집계하는 부분에서도 많은 시간이 소요됨

필터링하는 부분과 집계하는 부분에서 예상보다 많은 시간이 소요되는 것을 확인할 수 있었는데, 아래의 이유들로 인해 두 쿼리의 처리 속도 차이가 발생한 것으로 추측해보았다.

- 오라클 진영의 Single/Multi Block IO 개념과 같이, 1번 쿼리는 MBR(Multi-Block-Read)의 방식처럼 데이터 블록을 빠르게 읽어옴
- 전체 레코드를 조회할 때는 다른 `COUNT` 쿼리와 다른 읽기 방식 사용(`Count rows in ...`, `Aggregate: count(0)`)
- 2번 쿼리는 WHERE 조건 필터링 과정을 거치지만(`Filter: (bulkinsert.num >= 0)`), 1번 쿼리는 이러한 과정이 생략됨

결국 옵티마이저가 최적의 방법을 찾아 수행하는 것이기 때문에, 정확한 처리 방법과 그 차이는 알 수 없었지만,  
이러한 결과가 나온 이유를 설명할 수 있는 부분을 공식 문서에서 찾을 수 있었다.(실제 개선 내용은
[SELECT COUNT(*) 성능 향상](https://dev.mysql.com/worklog/task/?id=10398)에서 확인 가능)

> As of MySQL 8.0.13, SELECT COUNT(*) FROM tbl_name query performance for InnoDB tables is optimized
for single-threaded workloads if there are no extra clauses such as WHERE or GROUP BY.
> \
> MySQL 8.0.13부터 InnoDB 테이블에 대한 tbl_name의 SELECT COUNT(*) FROM 쿼리 성능은 WHERE 또는 GROUP BY와 같은 추가 절이 없는
> 경우 단일 스레드 워크로드에 최적화되어 있습니다.

## 결론

`COUNT()` 함수는 단일 row를 반환하기 때문에 단순하고 빠르게 처리하는 것으로 보일 수 있지만, 예상치 못한 성능 이슈가 발생할 수 있으니, 유의해서 사용하는 것이 좋다.

1. 인덱스 활용 최적화: `COUNT(*)` 쿼리는 옵티마이저에서 가능한 가장 작은 세컨더리 인덱스를 사용하여 처리되므로, 적절한 인덱스를 추가하여 성능을 향상시킬 수 있음
2. 데이터 타입: `COUNT(column_name)`을 사용할 때는 데이터 타입을 고려해야 하며, 특히, `TEXT`나 `BLOB`과 같은 대용량 데이터 타입은 주의 필요
3. 조건이 없는 COUNT 최적화: 전체 레코드를 조회할 땐 조건이 없는 `COUNT(*)` 쿼리를 사용하여 빠르게 처리할 수 있음
4. 캐싱과 추정치 사용: `COUNT` 쿼리는 많은 비용이 발생하기 때문에, 정확한 행 수를 계산이 필요한 요구사항이 아니라면, 캐싱이나 추정치를 계산하는 방법을 고려할 수 있음

###### 참고자료

- [MySQL Docs Function Count](https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html#function_count)
- [B-Tree Index](/docs/mysql/btree-index/)
- [실행 계획 확인](/docs/mysql/check-execution-plan/)