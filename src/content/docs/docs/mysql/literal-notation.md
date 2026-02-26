---
title: "Literal Notation(리터럴 표기)"
date: 2023-05-16
lastUpdated: 2025-09-17
---

리터럴은 SQL 쿼리 내에 직접 작성되는 고정된 값(예: 문자열, 숫자, 날짜)을 의미하며, 데이터의 타입에 맞는 정확한 리터럴 표기법을 사용하는 것은 쿼리의 성능과 정확성에 직접적인 영향을 미친다.

## 문자열

SQL 표준에서 문자열은 항상 홑따옴표(')를 사용해서 표시하지만, MySQL에서는 홑따옴표와 쌍따옴표를 모두 사용할 수 있다.

```sql
SELECT *
FROM department
WHERE dept_no = 'd''001'; # 표준

SELECT *
FROM department
WHERE dept_no = 'd"001'; # 표준

SELECT *
FROM department
WHERE dept_no = "d'001"; # MySQL에서만 사용 가능

SELECT *
FROM department
WHERE dept_no = "d""001"; # MySQL에서만 사용 가능
```

MySQL에서 쌍따옴표를 문자열 리터럴 표기에 사용하는 것을 방지하려면 SQL_MODE 시스템 변수값에 `ANSI_QUOTES`를 추가하면 된다.

## 숫자

숫자를 SQL에 사용할 때는 따옴표 없이 숫자 값을 입력하면 되며, 비교 대상에 따라 자동 형변환이 발생할 수 있다.

### 암시적 형변환에 따른 성능 문제

형변환을 자동으로 처리해주지만 항상 컬럼의 데이터 타입과 리터럴의 타입을 일치시키는 것이 좋은데, 그 이유는 다음과 같다.

```sql
SELECT *
FROM tab_test
WHERE number_col = '59'; # '59'라는 값 하나만 숫자로 변환

SELECT *
FROM tab_test
WHERE string_col = 59; # string_col 컬럼의 모든 값이 숫자로 변환, 만약 숫자가 아닌 값이 있다면 에러 발생 가능성 존재
```

- 1번 경우: `number_col` 컬럼이 숫자 타입일 때, 상수 값인 `'59'`이 한 번만 숫자로 변환되어 비교되므로 인덱스 사용 가능
- 2번 경우: `string_col` 컬럼이 문자열 타입일 때, 테이블의 모든 `first_name` 컬럼 값을 숫자로 변환하여 비교
    - 컬럼 값에 함수를 적용하는 것과 같아 인덱스를 전혀 활용하지 못하고 풀 테이블 스캔 발생

## 날짜

MySQL은 특정 형식의 문자열을 `DATE`, `DATETIME` 등의 날짜 타입으로 자동 변환해준다.

- 자동 인식 형식: `'YYYY-MM-DD'`나 `'YYYY-MM-DD HH:MI:SS'`와 같은 표준 형식의 문자열은 별도의 변환 함수 없이 날짜 값으로 인식
  ```sql
  SELECT * FROM salaries WHERE from_date = '1985-03-01';
  ```
- 표준 SQL 형식: `DATE`, `TIME`, `TIMESTAMP` 키워드를 사용하여 타입을 명시적으로 표현
  ```sql
  SELECT * FROM salaries WHERE from_date = DATE '1985-03-01';
  ```

## Boolean

`BOOL`/`BOOLEAN` 타입이 존재하지만, `TINYINT(1)` 타입과 동일한 동의어로 동작하여 `TRUE`는 `1`, `FALSE`는 `0`으로 취급된다.

## NULL

`NULL`은 '값이 없음' 또는 '알 수 없는 값'을 나타내는 특별한 값이다.

- `NULL`은 다른 어떤 값과도 같지 않으며, `NULL` 자신과도 같지 않음
- 때문에 `=`나 `!=` 연산자로 비교할 수 없으며, `IS NULL` / `IS NOT NULL` 구문을 사용해야 한다.
  ```sql
  -- 올바른 사용법
  SELECT * FROM employees WHERE middle_name IS NULL;

  -- 잘못된 사용법 (결과를 반환하지 않음)
  SELECT * FROM employees WHERE middle_name = NULL;
  ```

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)