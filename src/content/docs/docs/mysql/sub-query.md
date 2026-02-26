---
title: "Sub Query(서브쿼리)"
date: 2023-07-13
lastUpdated: 2025-09-20
---

과거 MySQL 버전에서는 서브쿼리가 성능 저하의 주된 원인으로 지목되었지만, MySQL 8.0에서 옵티마이저가 대부분의 서브쿼리를 JOIN과 유사한 방식으로 최적화하도록 개선되어 성능이 크게 향상되었다.

## SELECT 절의 서브쿼리(Scalar Subquery)

`SELECT` 절에 사용되는 서브쿼리는 스칼라 서브쿼리라고 하며, 반드시 단 하나의 값(하나의 행, 하나의 컬럼)만 반환해야 한다.

### JOIN으로의 전환

스칼라 서브쿼리는 외부 쿼리의 각 행마다 실행될 수 있어 비효율을 초래할 수 있어, 대부분의 경우 일반 `JOIN`으로 동일한 결과를 더 효율적으로 얻을 수 있다.

```sql
-- 서브쿼리
SELECT COUNT(CONCAT(e1.first_name,
                    (SELECT e2.first_name FROM employees e2 WHERE e2.emp_no = e1.emp_no))
       )
FROM employees e1;

-- 조인
SELECT COUNT(CONCAT(e1.first_name, e2.first_name))
FROM employees e1,
     employees e2
WHERE e1.emp_no = e2.emp_no;
```

그리고 서브쿼리가 동일하게 여러 번 사용 되는 경우엔 LATERAL JOIN을 사용하면 빠른 성능을 기대할 수 있다.

```sql
-- 서브쿼리
SELECT e.emp_no,
       e.first_name,
       (SELECT s.salary
        FROM salaries s
        WHERE s..emp_no = e.emp_no
        ORDER BY s.from_date DESC
        LIMIT 1) AS salary,
       (SELECT s.from_date
        FROM salaries s
        WHERE s.emp_no = e.emp_no
        ORDER BY s.from_date DESC
        LIMIT 1) AS from_date,
       (SELECT s.to_date
        FROM salaries s
        WHERE s.emp_no = e.emp_no
        ORDER BY s.from_date DESC
        LIMIT 1) AS to_date
FROM employees e
WHERE e.emp_no = 5959;

-- 조인
SELECT e.emp_no,
       e.first_name,
       s2.salary,
       s2.from_date,
       s2.to_date
FROM employees e
         INNER JOIN LATERAL (
    SELECT *
    FROM salaries s
    WHERE s.emp_no = e.emp_no
    ORDER BY s.from_date DESC
    LIMIT 1) s2 ON s2.emp_no = e.emp_no
WHERE e.emp_no = 5959;
```

이렇게 되면 서브쿼리가 3번 사용되어 추가로 3번의 쿼리가 실행되는 것을, 한 번만 실행하게 되어 성능이 향상된다.

## FROM 절에서의 서브쿼리

5.6 이하 버전에서는 FROM 절의 서브쿼리는 항상 결과를 임시 테이블에 저장하는 방식으로 처리되었지만, 서브쿼리를 외부 쿼리로 병합하는 최적화를 수행하도록 개선됐다.

- 서브쿼리 병합 (Merging): 옵티마이저는 가능한 경우, 파생 테이블을 외부 쿼리와 병합하여 하나의 조인 쿼리처럼 최적화하려고 시도
    - `EXPLAIN` 실행 계획에서 파생 테이블(`<derivedN>`)이 보이지 않는다면 병합이 성공한 것
- 서브쿼리 구체화 (Materialization): 옵티마이저는 서브쿼리의 결과를 임시 테이블로 생성(구체화)한 후, 이 임시 테이블과 외부 쿼리를 조인하는 방식
    - 서브쿼리 내에 `GROUP BY`, `LIMIT`, `UNION`, 집계 함수(`COUNT`, `SUM` 등)가 포함되어 있으면 병합이 불가능하므로 구체화 전략이 선택됨

## WHERE 절에서의 서브쿼리

가장 일반적인 서브쿼리 사용 방식이며, 옵티마이저의 최적화 기술이 가장 많이 적용된다.

### 단일 값 반환 서브쿼리(Uncorrelated Subquery)

외부 쿼리의 컬럼을 참조하지 않아 독립적으로 실행 가능한 서브쿼리이다.

```sql
SELECT *
FROM employees
WHERE emp_no = (SELECT MAX(emp_no) FROM employees);
```

과거에는 외부 쿼리의 모든 행마다 서브쿼리를 실행했지만, 현재 옵티마이저는 서브쿼리를 단 한 번만 실행하여 그 결과를 상수로 변환한 뒤, 외부 쿼리를 실행하는 방식으로 최적화한다.

### 세미 조인 (Semi-Join)

`IN` 또는 `EXISTS` 절에 사용되는 서브쿼리는 세미 조인이라는 최적화 기법이 적용된다.

- 세미 조인은 서브쿼리의 조건을 만족하는 외부 쿼리의 레코드만 찾아 반환
- 중복된 결과를 반환하지 않음

옵티마이저는 데이터의 특성에 따라 다음과 같은 다양한 세미 조인 전략을 선택한다.

- FirstMatch: 외부 쿼리의 각 행에 대해, 내부 서브쿼리에서 일치하는 레코드를 하나만 찾으면 즉시 다음 외부 행으로 넘어가는 방식
- Materialization: 서브쿼리의 결과를 중복이 제거된 임시 테이블로 만든 후, 이 임시 테이블과 외부 쿼리를 조인하는 방식
- Duplicate Weed-out: 일반 조인처럼 먼저 두 테이블을 조인한 후, 중복되는 레코드를 제거하는 방식

이러한 최적화 덕분에 현대 MySQL에서는 `IN` 서브쿼리나 `EXISTS`를 성능 저하 걱정 없이 사용할 수 있다.

### 안티 세미 조인 (Anti-Semi-Join)

`NOT IN`과 `NOT EXISTS`는 세미 조인의 반대 개념인 안티 세미 조인으로 처리된다.

- 서브 쿼리의 결과에 `NULL`이 포함된 경우, `NOT IN`은 항상 '알 수 없음(Unknown)'으로 평가되어 외부 쿼리의 결과가 항상 0건이 되는 심각한 논리적 오류 유발 가능
- `NOT EXISTS`는 `NULL`을 직관적으로 처리하며, 옵티마이저가 더 효율적인 실행 계획을 수립할 가능성이 높아 `NOT IN` 대신 `NOT EXISTS` 사용 권장

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)