---
title: "Date Time"
date: 2023-07-25
lastUpdated: 2025-09-26
tags: [MySQL]
description: ""
---

MySQL은 날짜, 시간 또는 두 정보를 함께 저장할 수 있는 여러 데이터 타입을 제공한다.

|   데이터 타입    | 저장 공간(Bytes) | 표현 가능한 값의 범위                                           |
|:-----------:|:------------:|:-------------------------------------------------------|
|   `YEAR`    |      1       | 1901 \~ 2155                                           |
|   `DATE`    |      3       | '1000-01-01' \~ '9999-12-31'                           |
|   `TIME`    |  3 + 소수점 초   | '-838:59:59' \~ '838:59:59'                            |
| `DATETIME`  |  5 + 소수점 초   | '1000-01-01 00:00:00' \~ '9999-12-31 23:59:59'         |
| `TIMESTAMP` |  4 + 소수점 초   | '1970-01-01 00:00:01' UTC \~ '2038-01-19 03:14:07' UTC |

각 타입은 필요로 하는 정보의 종류와 범위, 그리고 저장 공간에 따라 선택하여 사용하며, 아래 두 개의 타입은 다음과 같은 특징이 있다.

- `TIME`: 시각뿐만 아니라, 두 시점 간의 시간 간격(Elapsed Time)을 저장하는 용도로도 사용될 수 있어 표현 범위가 24시간 초과
- `TIMESTAMP`: 1970년 1월 1일 자정(UTC)을 기준으로 초(Second)를 누적하여 시간을 표현(2038년 이슈에 취약점 존재)

## 소수점 이하 초(Fractional Seconds) 정밀도

`TIME`, `DATETIME`, `TIMESTAMP` 타입은 소수점 이하 초를 지정하여 정밀도를 조절할 수 있다.

- 소수점 이하 자리수를 0부터 6까지의 숫자로 지정(기본값 = 0)
- 2자리당 1바이트씩 추가 저장 공간 필요(`DATETIME(6)` = 5 + 3 바이트)

## 타임존(Time Zone) 처리

MySQL에서 날짜와 시간 타입은 타임존 처리에 따라 중요한 차이점을 보인다.

- `DATETIME` / `DATE`: 타임존 정보와 무관하게 동작한다
    - 데이터베이스 커넥션의 `time_zone` 설정에 영향을 받지 않음
    - 입력된 문자열 값을 그대로 저장하고 조회 시에도 그대로 반환
- `TIMESTAMP`: 타임존 정보에 반응한다
    - 값을 저장할 때 현재 세션의 `time_zone`을 기준으로 UTC(Coordinated Universal Time)로 변환하여 저장
    - 값을 조회할 때는 저장된 UTC 값을 다시 현재 세션의 `time_zone`에 맞게 변환하여 반환

```sql
CREATE TABLE tb_timezone
(
    fd_datetime  DATETIME,
    fd_timestamp TIMESTAMP
);

-- 세션 타임존을 'Asia/Seoul' (UTC+9)로 설정
SET time_zone = 'Asia/Seoul';

INSERT INTO tb_timezone
VALUES (NOW(), NOW());

SELECT *
FROM tb_timezone;
-- fd_datetime과 fd_timestamp가 동일하게 표시된다.
-- +---------------------+---------------------+
-- | fd_datetime         | fd_timestamp        |
-- +---------------------+---------------------+
-- | 2023-05-05 05:09:00 | 2023-05-05 05:09:00 |
-- +---------------------+---------------------+

-- 세션 타임존을 'America/Los_Angeles' (UTC-7, 서머타임 적용 시)로 변경
SET time_zone = 'America/Los_Angeles';

SELECT *
FROM tb_timezone;
-- fd_datetime은 그대로 유지되지만, fd_timestamp는 LA 시간에 맞게 변환되어 표시된다.
-- +---------------------+---------------------+
-- | fd_datetime         | fd_timestamp        |
-- +---------------------+---------------------+
-- | 2023-05-05 05:09:00 | 2023-05-04 13:09:00 |
-- +---------------------+---------------------+
```

## 자동 초기화 및 업데이트

`DATETIME`과 `TIMESTAMP` 타입은 행이 생성되거나 변경될 때 자동으로 현재 시각을 기록하도록 설정할 수 있다.

- `DEFAULT CURRENT_TIMESTAMP`: 행이 처음 생성될 때의 시각을 자동으로 기록
- `ON UPDATE CURRENT_TIMESTAMP`: 해당 행의 다른 컬럼 값이 변경될 때마다 시각을 자동으로 갱신

```sql
CREATE TABLE tb_autoupdate
(
    id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME  DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)