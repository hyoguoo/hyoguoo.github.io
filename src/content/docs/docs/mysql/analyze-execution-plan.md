---
title: "Analyze Execution Plan"
date: 2023-05-08
lastUpdated: 2025-09-17
tags: [MySQL]
description: "MySQL EXPLAIN의 실행 계획 출력 구조와 type·key·rows·Extra 컬럼의 의미를 해석하는 방법을 정리한다."
---

MySQL의 `EXPLAIN`은 실행 계획(Execution Plan)을 확인하는 명령으로, 옵티마이저가 수립한 쿼리 처리 경로를 분석하여 성능 문제를 진단하고 쿼리를 튜닝하는 데 핵심적인 역할을 한다.

## 실행 계획의 기본 구조와 순서

```sql
EXPLAIN
SELECT *
FROM employees e
         INNER JOIN salaries s ON s.emp_no = e.emp_no
WHERE e.first_name = 'ABC';
```

| id | select_type | table | partitions | type |    possible_keys     |     key      | key_len |        ref         | rows | filtered | Extra |
|:---|:-----------:|:-----:|:----------:|:----:|:--------------------:|:------------:|:-------:|:------------------:|:----:|:--------:|:-----:|
| 1  |   SIMPLE    |   e   |    NULL    | ref  | PRIMARY,ix_firstname | ix_firstname |   58    |       const        |  1   |  100.00  | NULL  |
| 1  |   SIMPLE    |   e   |    NULL    | ref  |       PRIMARY        |   PRIMARY    |    4    | employees.e.emp_no |  10  |  100.00  | NULL  |

`EXPLAIN` 결과의 각 행은 쿼리 실행의 한 단계를 의미하며, 일반적으로 다음 규칙에 따라 실행 순서를 파악할 수 있다.

1. `id` 컬럼 값이 클수록 먼저 실행
2. `id` 값이 같다면 위쪽에 있는 행이 먼저 실행(= 드라이빙 테이블)
3. 들여쓰기(TREE, JSON 형식)는 다른 행에 종속됨을 의미하며, 가장 안쪽부터 실행

## 주요 컬럼

실행 계획 테이블을 살펴보면, 여러 컬럼이 표시되는데 각 컬럼의 의미는 다음과 같다.

| 키             | 설명                                                              | 비고                                                                    |
|:--------------|:----------------------------------------------------------------|:----------------------------------------------------------------------|
| id            | 쿼리 내의 SELECT 문 실행 순서                                            | 하나의 SELECT 문 안에 서브쿼리나 UNION 등이 포함되면 여러 개의 id가 나타날 수 있음                |
| select_type   | 각 단위 SELECT 쿼리가 어떤 타입의 쿼리인지 표시                                  | SIMPLE, PRIMARY, SUBQUERY, DERIVED, UNION 등 다양한 유형 존재                 |
| table         | 테이블의 이름에 별칭이 부여된 경우에는 별칭이 표시되며 `<>`로 둘러싸인 테이블은 임시 테이블을 의미       | 안의 숫자는 단위 쿼리의 id값                                                     |
| type          | 테이블 접근 방식                                                       | const, ref, eq_ref, range, index, ALL 등 성능의 큰 핵심 지표                   |
| possible_keys | 옵티마이저가 쿼리 처리를 위해 고려했던 후보 인덱스 목록                                 | 실제로 사용된 인덱스와 다를 수 있음                                                  |
| extra         | 쿼리 실행 계획에 대한 추가적인 정보를 쉼표로 구분해서 표시                               | Using where, Using index, Using filesort, Using temporary 등 다양한 정보 존재 |
| key           | 옵티마이저가 최종적으로 선택한 인덱스                                            | 인덱스가 사용되지 않은 경우 NULL로 표시                                              |
| key_len       | 사용된 인덱스의 길이(바이트 단위, CHAR(4) + INTEGER 인덱스를 사용한 경우 4*4 + 4 = 20) | 인덱스 효율성 추정 가능                                                         |
| ref           | 접근 방법(`type`)이 ref인 경우, 참조 조건으로 어떤 값이 제공됐는지 표시                  | 연산이 적용된 경우 func로 표시                                                   |
| rows          | 실행 계획상 접근해야 할 것으로 예측하는 레코드의 수                                   | 예상 접근 레코드 수로, 실제와 다를 수 있음                                             |
| filtered      | `rows` 컬럼에서 예상한 레코드 중 WHERE 조건에 일치하는 데이터의 비율                    | 예측 값으로 실제와 일치하지 않음, 실제 데이터와 비슷하게 예측할수록 쿼리 성능 향상                       |

### id 컬럼

각 SELECT 문에 부여되는 식별자 값으로, 하나의 SELECT 문 안에 서브쿼리나 UNION 등이 포함되면 여러 개의 id가 나타날 수 있다.

```sql
EXPLAIN
SELECT ((SELECT COUNT(*) FROM employees) + (SELECT COUNT(*) FROM departments)) AS total_count;
```

| id | select_type |    table    | type  |     key     | ref  |  rows  |     Extra      |
|:---|:-----------:|:-----------:|:-----:|:-----------:|:----:|:------:|:--------------:|
| 1  |   PRIMARY   |    NULL     | NULL  |    NULL     | NULL |  NULL  | No tables used |
| 3  |  SUBQUERY   | departments | index | ux_deptname | NULL |   9    |  Using index   |
| 2  |  SUBQUERY   |  employees  | index | ix_hiredate | NULL | 300252 |  Using index   |

### select_type 컬럼

각 단위 SELECT 쿼리가 어떤 타입의 쿼리인지 표시되는 컬럼으로, 쿼리의 종류에 따라 다음과 같이 표시된다.

- SIMPLE: UNION이나 서브쿼리를 사용하지 않는 단순한 SELECT 쿼리
- PRIMARY: UNION이나 서브쿼리를 가지는 SELECT 쿼리의 실행 계획에서 가장 바깥쪽에 있는 단위 쿼리
- SUBQUERY: FROM 절 이외에서 사용되는 서브쿼리
- DERIVED: FROM 절에서 단위 SELECT 쿼리의 실행 결과로 메모리나 디스크에 임시 테이블을 생성하게 되는 쿼리
- UNION: UNION으로 결합하는 단위 SELECT 쿼리 가운데 첫 번째를 제외한 두 번째 이후 단위 SELECT 쿼리
- UNION RESULT: UNION 결과를 담아두는 임시 테이블을 생성하는 쿼리(단위 쿼리가 아니기 때문에 id 값이 NULL로 표시)
- DEPENDENT SUBQUERY/UNION: 외부 쿼리의 값에 의존하는 단위 SELECT 쿼리, 외부 쿼리가 먼저 수행되어야 하므로 일반 서브쿼리보다 성능 저하가 발생할 수 있음
- DEPENDENT DERIVED: 외부 쿼리의 값에 의존하는 단위 SELECT 쿼리로, LATERAL JOIN을 사용하여 외부 컬럼을 참조하는 경우
- UNCACHEABLE SUBQUERY/UNION: 캐시가 불가능한 서브쿼리로, 사용자 변수 / NOT-DETERMINISTIC 속성의 스토어드 루틴 / RAND() 같은 함수가 서브쿼리 내에 사용된 경우
- MATERIALIZE: DERIVED와 비슷하게 쿼리의 내용을 임시 테이블로 생성하는 쿼리(동일하지는 않음)

```sql
EXPLAIN
SELECT *
FROM employees e1
WHERE e1.emp_no IN (SELECT e2.emp_no
                    FROM employees e2
                    WHERE e2.first_name = 'Matt'
                    UNION
                    SELECT e3.emp_no
                    FROM employees e3
                    WHERE e3.last_name = 'Matt');
# IN 절에 사용되어 있어, 내부적으로 e2.emo_no=e1.emp_no 같은 조건이 추가되어 외부 쿼리의 값에 의존하는 서브쿼리로 수행됨
```

| id   |    select_type     |   table    |  type  |   key   | ref  |  rows  |      Extra      |
|:-----|:------------------:|:----------:|:------:|:-------:|:----:|:------:|:---------------:|
| 1    |      PRIMARY       |     e1     |  ALL   |  NULL   | NULL | 300252 |   Using where   |
| 2    | DEPENDENT SUBQUERY |     e2     | eq_ref | PRIMARY | func |   1    |   Using where   |
| 3    |  DEPENDENT UNION   |     e3     | eq_ref | PRIMARY | func |   1    |   Using where   |
| NULL |    UNION RESULT    | <union2,3> |  ALL   |  NULL   | NULL |  NULL  | Using temporary |

```sql
SELECT *
FROM employees e
         LEFT JOIN LATERAL
    (SELECT *
     FROM salaries s
     WHERE s.emp_no = e.emp_no
     ORDER BY s.from_date DESC
     LIMIT 2) AS s2
                   ON s2.emp_no = e.emp_no;
```

| id |    select_type    |   table    | type |     key     |     Extra      |
|:---|:-----------------:|:----------:|:----:|:-----------:|:--------------:|
| 1  |      PRIMARY      |     e      | ALL  |    NULL     |      NULL      |
| 1  |      PRIMARY      | <derived2> | ref  | <auto_key0> |      NULL      |
| 2  | DEPENDENT DERIVED |     s      | ref  |   PRIMARY   | Using filesort |

### type 컬럼

쿼리의 테이블 접근 방식을 의미하며, 인덱스를 사용했는지, 풀 테이블 스캔을 했는지 등을 표시한다.

- const: PRIMARY KEY나 UNIQUE 인덱스 컬럼을 상수 조건으로 조회하여 1건만 읽는 경우 사용
- ref: PRIMARY KEY나 UNIQUE가 아닌 인덱스를 동등(Equal) 조건 검색 시 사용
- eq_ref: 조인 시 첫 번째 테이블의 컬럼 값을 이용해 두 번째 테이블의 PRIMARY KEY나 UNIQUE 인덱스를 조회할 때 사용
- ref_or_null: ref 접근 방법과 동일하나 NULL 비교도 추가된 형태
- range: 인덱스 레인지 스캔 형태의 접근 방법으로, 범위 검색하는 경우 사용
- index: 인덱스를 처음부터 끝까지 읽는 인덱스 풀 스캔하여 접근하는 방법
- ALL: 테이블의 모든 레코드를 처음부터 끝까지 읽는 풀 테이블 스캔 방식으로 접근하는 방법
- system: 레코드가 1건 이하인 테이블에서만 사용
- unique_subquery: WHERE에 사용될 수 있는 IN(subquery) 형태의 서브쿼리를 위한 접근 방법, 서브쿼리에서 중복되지 않는 유니크한 값만 반환 시 사용
- index_subquery: WHERE에 사용될 수 있는 IN(subquery) 형태의 서브쿼리를 위한 접근 방법, 서브쿼리에서 중복되는 값이 있을 수 있을 때 사용(인덱스를 이용해 중복된 값 제거)
- index_merge: 2개 이상의 인덱스를 이용해 각 검색 결과를 병합해서 접근하는 방법
- fulltext: MySQL 서버의 전문 검색(Full-text Search) 인덱스를 사용하는 경우 사용

### extra 컬럼

쿼리의 실행 계획에 대한 추가적인 정보를 쉼표로 구분해서 표시하며, 명시된 순서는 상관 없다.

- Using where: 스토리지 엔진에서 데이터를 받아온 후, MySQL 엔진 레벨에서 추가적인 WHERE 조건으로 필터링이 일어날 때 표시
- Using index: 쿼리에 필요한 모든 데이터를 디스크의 테이블을 읽지 않고 인덱스만으로 처리할 수 있을 때 표시
- Using filesort: 정렬이 필요한데, 적절한 인덱스를 사용하지 못해 별도의 정렬 작업이 발생하는 경우(메모리 또는 디스크에서 수행되어 성능 저하의 원인)
- Using temporary: 쿼리 처리 중 중간 결과를 저장하기 위해 임시 테이블을 사용하는 경우(GROUP BY나 UNION 등에서 나타나며, 성능 저하의 원인)
- Using index condition: 인덱스 조건 푸시다운이 활성화되어 인덱스만으로 WHERE 조건을 평가할 수 있는 경우 표시

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)