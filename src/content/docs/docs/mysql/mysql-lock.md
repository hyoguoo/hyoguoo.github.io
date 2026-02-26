---
title: "MySQL Engine Lock"
date: 2023-03-22
lastUpdated: 2025-10-07
---

MySQL 엔진 레벨의 잠금은 MySQL 서버의 상위 레벨에서 동작한다.

- 사용되는 스토리지 엔진의 종류와 관계 없이 적용
- 테이블이나 데이터베이스 전체와 같이 상대적으로 넓은 범위에 영향을 미침

## 글로벌 락(Global Lock)

- 범위: MySQL 서버 전체에 영향
- 동작: 한 세션에서 글로벌 락을 획득하면, 해당 세션을 제외한 다른 모든 세션에서 `SELECT`를 제외한 대부분의 DDL, DML 대기
- 획득 및 해제: `FLUSH TABLES WITH READ LOCK` 명령으로 획득하고, `UNLOCK TABLES` 명령으로 해제

## 백업 락(Backup Lock)

스토리지 엔진 환경에서 온라인 백업을 위해 도입된 더 가벼운 형태의 락으로, 아래의 작업만 제한되고 일반적인 데이터 변경은 허용된다.

- 데이터베이스 및 테이블 등의 변경 및 삭제
- REPAIR TABLE / OPTIMIZE TABLE 명령
- 사용자 관리 및 비밀번호 변경

주로 복제(Replication) 환경의 레플리카 서버에서 백업을 수행할 때, 서비스 중단 없이 안전한 백업을 위해 사용된다.

## 테이블 락(Table Lock)

개별 테이블 단위로 설정되는 잠금으로, 명시적 또는 묵시적으로 특정 테이블의 락을 획득할 수 있다.

- 명시적 락
    - `LOCK TABLES tbl_name [READ | WRITE]` 명령으로 획득
    - `UNLOCK TABLES` 명령으로 해제
    - 특별한 상황이 아니면 애플리케이션에서 사용할 일이 거의 없음
    - 명시적으로 테이블을 잠그는 작업은 글로벌 락과 동일하게 다른 작업에 큰 영향을 미침
- 묵시적 락
    - `ALTER TABLE`과 같은 DDL 문장을 실행하면 모든 스토리지 엔진에서 MySQL 서버가 내부적으로 테이블에 잠금 설정
    - InnoDB 엔진에서는 스토리지 엔진 차원에서 레코드 기반의 잠금을 제공하기 때문에 DML 쿼리로 묵시적 락이 설정되지 않음(MyISAM에선 발생)

## 네임드 락(Named Lock)

테이블이나 레코드 같은 데이터베이스 객체가 아닌, 사용자가 지정한 임의의 문자열(String)에 대해 잠금을 획득하고 해제하는 기능이다.

```sql
-- lock_name 문자열을 10초 동안 락을 획득
SELECT GET_LOCK('lock_name', 10);

-- lock_name 문자열에 대해 잠금 확인
SELECT IS_FREE_LOCK('lock_name');

-- lock_name 문자열에 대해 잠금 해제
SELECT RELEASE_LOCK('lock_name');
```

- 네임드 락은 트랜잭션과 무관하게 동작하여, 트랜잭션이 커밋되거나 롤백되어도 자동으로 해제되지 않음(명시적으로 `RELEASE_LOCK`을 호출 필요)
- 여러 서버 인스턴스가 동일한 데이터에 접근하는 분산 환경에서 특정 작업을 하나의 인스턴스만 수행하도록 보장하기 위한 분산 락(Distributed Lock)을 구현하는 데 유용하게 사용

### 응용 - 분산 락

네임드 락은 아래와 같이 명시적으로 락을 설정하고 해제하는 방식으로 분산 락을 구현할 수 있다.

```java
// LockRepository.java
public interface LockRepository extends JpaRepository<Stock, Long> {

    @Query(value = "SELECT GET_LOCK(:key, 3000)", nativeQuery = true)
    void getLock(String key);

    @Query(value = "SELECT RELEASE_LOCK(:key)", nativeQuery = true)
    void releaseLock(String key);
}

// NamedLockService.java
public class NamedLockService {

    private LockRepository lockRepository;
    private StockService stockService;

    @Transactional
    public void decrease(Long id, Long quantity) {
        try {
            // 1. 락 획득, 이미 락이 설정되어 있는 경우 대기하게 됨
            lockRepository.getLock(id.toString());
            // 2. 재고 감소 로직
            stockService.decreaseStock(id, quantity);
        } finally {
            // 3. 락 해제
            lockRepository.releaseLock(key);
        }
    }
}
```

## 메타데이터 락(Metadata Lock)

데이터베이스 객체(테이블, 뷰 등)의 구조나 이름을 변경하는 작업을 할 때, 해당 객체의 정의 정보를 보호하기 위해 내부적으로 획득하는 잠금이다.

```sql
-- Case 1: 테이블 이름 두 번에 걸쳐 변경
RENAME TABLE rank TO rank_backup;
RENAME TABLE rank_new TO rank;
-- 잠금 획득 실패로 변경 불가

-- Case 2: 테이블 이름 한 번에 변경
RENAME TABLE rank TO rank_backup, rank_new TO rank;
```

위와 같이 `RENAME TABLE` 명령을 두 번에 걸쳐 실행하면, 첫 번째 명령에서 `rank` 테이블에 대한 메타데이터 락을 획득한 상태로 유지되어 두 번째 명령에서 잠금 획득에 실패한다.

### 응용 - 테이블 구조 변경

MySQL에서는 Online DDL 기능을 제공하지만, 테이블 크기가 크거나 인덱스 재구성이 필요한 경우 상당한 시간이 소요될 수 있다.  
이런 경우에는 신규 테이블을 생성하고 데이터를 점진적으로 복사한 후, 최종적으로 `RENAME TABLE` 명령으로 교체하는 방식이 효과적이다.

1. 새로운 구조의 테이블 생성
2. 과거 데이터부터 Primary Key 기준 범위별로 복사
3. `autocommit = 0` 설정
4. 대상 테이블들에 WRITE 락 설정
5. 최근 데이터 복사 및 COMMIT
6. 테이블 이름 교체 (RENAME)
7. 락 해제 및 기존 테이블 삭제

```sql
-- 1. 새로운 구조의 테이블 생성
CREATE TABLE access_log_new
(
    id        BIGINT NOT NULL AUTO_INCREMENT,
    client_ip INT UNSIGNED,
--  ...
    PRIMARY KEY (id)
)

-- 2. 최근(1시간 직전 또는 하루 전) 데이터까지는 Primary Key인 id 값을 범위별로 나눠서 복사
INSERT INTO access_log_new
SELECT *
FROM access_log_new
WHERE id BETWEEN 1 AND 1000000;

INSERT INTO access_log_new
SELECT *
FROM access_log_new
WHERE id BETWEEN 1000001 AND 2000000;

INSERT INTO access_log_new
SELECT *
FROM access_log_new
WHERE id BETWEEN 2000001 AND 3000000;
-- ...

-- 3. 트랜잭션을 auto commit으로 설정(START TRANSACTION과 테이블 락은 호환되지 않아 autocommit을 0으로 설정)
SET autocommit = 0;

-- 4. 작업 대상 테이블 2개에 대해 테이블 쓰기 락 설정
LOCK TABLES access_log WRITE, access_log_new WRITE;

-- 5. 기존 테이블의 데이터를 새로운 테이블로 복사
SELECT MAX(id) as max_id
FROM access_log;
INSERT INTO access_log_new
SELECT *
FROM access_log
WHERE id > max_id;
COMMIT;

-- 6. 모든 데이터 복사 완료 후 테이블 이름 변경
RENAME TABLE access_log TO access_log_old, access_log_new TO access_log;

-- 7. 테이블 쓰기 락 해제 및 테이블 삭제
UNLOCK TABLES;
DROP TABLE access_log_old;
```

### MDL 주의사항

메타데이터 락(MDL)은 트랜잭션과 밀접하게 연관되어 있어, 트랜잭션이 활성화된 상태에서는 의도치 않게 MDL로 인해 대기 상황이 발생할 수 있다.

1. 테이블에 대한 쿼리(SELECT 포함)가 실행되면, 해당 쿼리가 속한 트랜잭션이 끝날 때까지 테이블에 대한 공유 메타데이터 락 획득
2. `RENAME TABLE`이나 `ALTER TABLE`과 같은 DDL은 배타적 메타데이터 락(`EXCLUSIVE`)을 필요
3. 때문에 해당 테이블을 사용하는 어떠한 활성 트랜잭션도 없을 때만 획득 가능

```sql
-- 세션 1: 장기 실행 트랜잭션 (분석 쿼리 등)
START TRANSACTION;
SELECT *
FROM users
WHERE ...;
-- 쿼리 실행이 오래 걸리거나, COMMIT이 늦어짐
-- 트랜잭션이 종료될 때까지 users 테이블에 대한 Shared MDL을 점유


-- 세션 2: DDL 실행
RENAME TABLE users TO users_backup, users_new TO users;
-- 세션 1의 트랜잭션이 끝나길 기다리며 '대기' 상태에 빠짐


-- 세션 3: 새로운 일반 쿼리
SELECT *
FROM users
WHERE user_id = 123;
-- 이 쿼리는 세션 1의 공유 락과는 충돌하지 않지만, 대기열에 먼저 들어온
-- 세션 2의 DDL 작업 때문에 함께 '대기' 상태에 빠짐
```

단순히 테이블 변경 작업이 계속 대기하는 것이 문제가 아니라, 다른 모든 쿼리가 대기 상태에 빠질 수 있어 주의해야 한다.

1. `RENAME TABLE` 세션 1에 의해 배타적 메타데이터 락 획득 대기
2. 이후의 모든 쿼리가 세션 1의 트랜잭션과 상관 없이 `RENAME TABLE` 명령이 완료될 때까지 대기
3. 새로운 쿼리들이 연쇄적으로 쌓이게 되면서 DB 커넥션이 모두 소진되어 서비스 장애로 이어질 수 있음

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)
- [MySQL 공식 문서 - Metadata Locking](https://dev.mysql.com/doc/refman/8.0/en/metadata-locking.html)