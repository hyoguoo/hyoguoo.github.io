---
title: "UPDATE / DELETE"
date: 2023-07-18
lastUpdated: 2025-09-22
tags: [MySQL]
description: ""
---

`UPDATE` / `DELETE` 쿼리를 단일 테이블에 대해 한 건(또는 소량) 뿐만 아니라, 조인을 통해 여러 테이블을 동시에 대상으로 하여 `UPDATE` / `DELETE` 쿼리를 실행할 수 있다.

## UPDATE(DELETE) ... ORDER BY ... LIMIT n

일반적으로 `WHERE` 조건에 일치하는 모든 레코드를 처리하지만, **`ORDER BY` + `LIMIT`** 조합을 사용하면 상위 n개의 레코드만 처리할 수 있다.

```sql
-- 오래된 로그를 1,000건씩 안전하게 삭제
DELETE
FROM event_logs
WHERE event_date < '2024-01-01'
ORDER BY event_date
LIMIT 1000;
```

- 장시간 잠금(Lock)으로 인한 다른 트랜잭션 영향 최소화
- 운영 환경에서 점진적 데이터 정리 가능
- 배치 단위 처리에 자주 사용

## JOIN UPDATE

두 개 이상의 테이블을 조인해, 조인된 결과를 대상으로 UPDATE / DELETE를 실행하는 기능으로, 주로 다음과 같은 경우에 사용한다.

1. 한쪽 테이블의 값을 다른 테이블의 컬럼에 반영해야 하는 경우
2. 양쪽 테이블에 공통으로 존재하는 레코드만 찾아 갱신해야 하는 경우

```sql
-- Sales 부서에 속한 직원들의 급여를 5,000씩 인상
UPDATE employees e
    INNER JOIN departments d ON e.dept_id = d.dept_id
SET e.salary = e.salary + 5000
WHERE d.dept_name = 'Sales';
```

- JOIN 순서에 따라 성능이 달라질 수 있으므로, 실행 계획(Execution Plan) 확인
- 읽기 전용 테이블도 읽기 잠금(Read Lock), 갱신 대상 테이블은 쓰기 잠금(Write Lock)이 걸리므로, 웹 서비스 환경에서는 데드락 가능성에 주의

## 여러 레코드 UPDATE

8.0부터는 Row Constructor를 이용해 각 레코드에 서로 다른 값을 한 번에 적용할 수 있다.(MySQL 5.7 이하 버전은 동일한 값으로만 업데이트 가능)

```sql
-- 1번 사용자의 레벨을 1 증가, 2번 사용자의 레벨을 4 증가
UPDATE user_level ul
    INNER JOIN
        (VALUES ROW (1, 1), ROW (2, 4)) new_user_level (user_id, level_increase)
    ON new_user_level.user_id = ul.user_id
SET ul.user_lv = ul.user_lv + new_user_level.level_increase;
```

- `VALUES ROW(...)` 구문은 임시 테이블을 생성하는 효과
- 이를 기존 테이블과 조인하여 각 레코드를 선택적으로 업데이트하는 방식
- 다수의 UPDATE를 개별로 실행하는 것보다 네트워크/트랜잭션 오버헤드 절감

## JOIN DELETE

JOIN DELETE 문장은 일반적인 단일 테이블 DELETE와 달리, 삭제 대상 테이블을 DELETE 키워드 뒤에 직접 명시해야 한다.

```sql
-- 3개 테이블 조인 후 employees, dept_emp만 삭제
DELETE e, de
FROM employees e
         INNER JOIN dept_emp de ON e.emp_no = de.emp_no
         INNER JOIN departments d ON de.dept_no = d.dept_no
WHERE d.dept_no = 'd59';
```

- JOIN 순서에 따라 성능이 달라질 수 있으므로, 실행 계획(Execution Plan) 확인
- 여러 테이블을 동시에 삭제할 수 있으므로 관계 데이터 정리 유용

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)