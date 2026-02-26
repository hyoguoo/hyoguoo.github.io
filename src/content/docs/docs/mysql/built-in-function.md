---
title: "Built-in Function(내장 함수)"
date: 2023-05-23
lastUpdated: 2025-09-18
---

MySQL은 다양한 데이터 처리와 연산을 위해 풍부한 내장 함수를 제공한다.

- DBMS 종류와 관계없이 기본적인 기능의 SQL 함수는 대부분 동일하게 제공
- 이름이나 사용법에 표준이 없어 각 DBMS 마다 호환되지 않는 경우가 많음

## 날짜 및 시간 함수

아래 두 함수 모두 현재 시간을 반환하지만, 동작 방식에 결정적인 차이가 있다.

- `NOW()`: 쿼리나 함수가 시작되는 시점의 시간을 기준으로 고정된 값을 반환(=`CURRENT_TIMESTAMP`)
- `SYSDATE()`: 함수가 호출되는 순간의 시간을 반환

```sql
SELECT NOW()     -- 2021-08-17 22:38:00
     , SYSDATE() -- 2021-08-17 22:38:00
     , SLEEP(2)
     , NOW()     -- 2021-08-17 22:38:00
     , SYSDATE() -- 2021-08-17 22:38:02
```

## 집계 함수

### GROUP_CONCAT - GROUP BY 문자열 결합

`GROUP BY`의 결과로 나온 여러 행의 값을 하나의 문자열로 결합하는 함수이다.

- 값들을 연결하기 위해 제한적인 메모리 버퍼 공간을 사용
- 기본적으로 1024 바이트의 메모리 버퍼를 사용(`max_group_concat_len` 시스템 변수로 조정 가능)

```sql
SELECT dept_no, GROUP_CONCAT(emp_no ORDER BY hire_date SEPARATOR ', ')
FROM employees
GROUP BY dept_no;
```

### `COUNT` 함수의 종류

`COUNT`는 행의 개수를 세는 함수지만, 인자에 따라 동작과 결과가 다르다.

- `COUNT(*)`: `NULL`을 포함한 모든 행의 개수
- `COUNT(컬럼명)`: 해당 컬럼의 값이 `NULL`이 아닌 행의 개수
- `COUNT(DISTINCT 컬럼명)`: 해당 컬럼에서 중복을 제거한 유니크한 값 중 `NULL`이 아닌 값들의 개수(내부적으로 임시 테이블을 사용할 수 있음)

## 기타 유틸리티 함수

### `BENCHMARK()`

특정 표현식이나 쿼리를 주어진 횟수만큼 반복 실행하고 총 소요 시간을 반환하는 함수이다.

```sql
-- 'Hello' 문자열을 SHA1 함수로 100만 번 암호화하는 시간 측정
SELECT BENCHMARK(1000000, SHA1('Hello'));
```

이 함수는 순수한 연산 처리 시간만 측정하며, 네트워크 전송이나 쿼리 파싱 등의 오버헤드는 제외되므로, 따라서 절대적인 성능 지표보다는 두 가지 방식의 상대적인 성능을 비교하는 용도로 적합하다.

### 그 외

- `ROW_COUNT()`: 직전에 실행된 `INSERT`, `UPDATE`, `DELETE` 문에 의해 영향받은 행의 수를 반환
- `LAST_INSERT_ID()`: 가장 최근에 자동 증가된 `AUTO_INCREMENT` 값을 반환
- `Geometry` 함수: 공간 데이터 타입과 관련된 다양한 함수 제공

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)