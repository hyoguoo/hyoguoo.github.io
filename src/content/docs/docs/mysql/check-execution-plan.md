---
title: "Check Execution Plan(실행 계획 확인)"
date: 2023-05-07
lastUpdated: 2025-09-16
---

MySQL에서 쿼리 성능을 분석하고 최적화하기 위해 실행 계획(Execution Plan)을 확인할 수 있다.

## EXPLAIN ANALYZE

MySQL 8.0.18부터 도입된 `EXPLAIN ANALYZE`는 기존의 예측 실행 계획에 더해, 쿼리를 실제로 실행한 후의 통계 정보를 함께 보여준다.

- 실제 실행 시간 (Actual Time): 첫 레코드를 가져오는 데 걸린 시간 / 모든 레코드를 가져오는 데 걸린 시간
- 실제 처리 건수 (Actual Rows): 각 단계에서 실제로 처리한 레코드 수
- 반복 실행 횟수 (Loops): 해당 작업이 반복 실행된 횟수

```sql
EXPLAIN ANALYZE
SELECT e.emp_no, avg(s.salary)
FROM employees e
         INNER JOIN salaries s ON s.emp_no = e.emp_no
    AND s.salay > 50000
    AND s.from_date <= '1990-01-01'
    AND s.to_date > '1990-01-01'
WHERE e.first_name = 'Matt'
GROUP BY e.hire_date;
```

결과는 아래와 같이 항상 TREE 포맷으로 출력된다.(다른 포맷으론 출력 불가능)

```
A -> Table scan on <temporary> (actual time=0.001..0.004 rows=48 loops=1)
B     -> Aggregate using temporary table (actual time=3.799..3.888 rows=48 loops=1)
C         -> Nested loop inner join (cost=685.24 rows=135)
                        (actual time=0.367..3.602 rows=48 loops=1)
D             -> Index lookup on e using ix_firstname (first_name='Matt') (cost=215.08 rows=233)
                        (actual time-0.348..1.046 rows=233 loops=1)
E             -> Filter: ((s.salary > 50000) and (s.from_date <= DATE'1990-01-01')
                                    and (s.to_date > DATE'1990-01-01')) (cost=0.98 rows=1)
                        (actual time=0.009..0.011 rows=0 loops=233)
F                 -> Index lookup on s using PRIMARY (emp_no=e.emp_no) (cost=0.98 rows=10)
                        (actual time=0.007..0.009 rows=10 loops=233)
```

위에서 들여 쓰기는 호출 순서를 의미하며 실제 실행 순서는 아래의 규칙을 따른다.

- 들여쓰기가 같은 레벨: 상단에 위치한 라인이 먼저 실행
- 들여쓰기가 다른 레벨: 가장 안쪽에 위치한 라인이 먼저 실행

| 실행 순서 |                 실행 계획                  |                                                    실행 내용                                                     |
|:-----:|:--------------------------------------:|:------------------------------------------------------------------------------------------------------------:|
| 1 - D | `Index lookup on e using ix_firstname` |                    employees 테이블의 ix_firstname 인덱스를 통해 first_name='Matt' 조건에 일치하는 레코드를 찾음                    |
| 2 - F |   `Index lookup on s using PRIMARY`    |                        salaries 테이블의 PRIMARY 키를 통해 emp_no가 1번 결과의 emp_no와 동일한 레코드를 찾음                        |
| 3 - E |                `Filter`                | ((s.salary > 50000) and (s.from_date <= DATE'1990-01-01') and (s.to_date > DATE'1990-01-01')) 조건에 일치하는 건 필터링 |
| 4 - C |        `Nested loop inner join`        |                                                1번과 3번의 결과를 조인                                                |
| 5 - B |   `Aggregate using temporary table`    |                                       임시 테이블에 결과를 저장하면서 GROUP BY 집계 실행                                       |
| 6 - A |      `Table scan on <temporary>`       |                                            임시 테이블의 결과를 읽어서 결과 반환                                             |

### 실행 통계 해석

위 실행 계획이 표시되면서 괄호 안에 실제 소요된 시간(`actual time`)과 처리한 레코드 건수(`rows`), 반복 횟수(`loops`)가 표시되는데, F열의 의미는 다음과 같다.

```
-> Index lookup on s using PRIMARY (emp_no=e.emp_no) (cost=0.98 rows=10)
      (actual time=0.007..0.009 rows=10 loops=233)
```

- actual time: 테이블에서 읽은 emp_no 기준으로 salaries 테이블에서 일치하는 레코드를 검색하는 데 걸린 시간
    - 0.007: 첫 번째 레코드를 읽어오는 데 걸린 평균 시간
    - 0.009: 모든 레코드를 가져오는 데 걸린 평균 시간
- rows: employees 테이블에서 읽은 emp_no과 일치하는 salaries 테이블의 평균 레코드 건수를 의미
- loops: employees 테이블에서 읽은 emp_no를 이용해 salaries 테이블의 레코드를 찾는 작업이 반복된 횟수를 의미

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)
- [MySQL Docs MySQL EXPLAIN ANALYZE](https://dev.mysql.com/blog-archive/mysql-explain-analyze)