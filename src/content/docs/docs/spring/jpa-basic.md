---
title: "JPA (Java Persistence API)"
date: 2024-03-07
lastUpdated: 2025-09-06
tags: [Spring]
description: "JPA의 객체 중심 개발 이점과 EntityManagerFactory·EntityManager를 통한 엔티티 관리 방식, Spring Boot에서의 JPA 자동 구성을 정리한다."
---

Java Persistence API의 약자로, 자바 진영의 ORM 기술 표준이다.

- ORM 기술을 사용하기 위한 표준 인터페이스의 모음
- 인터페이스를 구현한 구현체는 Hibernate, EclipseLink, DataNucleus 등 존재(보통 Hibernate 사용)

## JPA 사용의 이점

### 객체 중심 개발

SQL 중심의 데이터 접근에서 벗어나 객체 중심의 개발이 가능하다.

```java

@Entity
public class Member {

    @Id
    @GeneratedValue
    private Long id;
    private String name;

    // 연관관계 매핑
    @OneToMany(mappedBy = "member")
    private List<Order> orders = new ArrayList<>();
}
```

SQL 쿼리에 의존하는 대신 객체지향적인 코드를 작성하여 데이터를 관리할 수 있다.

### 생산성 및 유지보수성

- 생산성: `save()`, `findById()` 등 기본적인 CRUD 메서드가 기본으로 제공
- 유지보수성: 테이블에 컬럼이 추가되거나 변경될 때, 매핑된 엔티티 클래스 중심의 수정 작업

### 패러다임 불일치 해결

객체지향 언어와 관계형 데이터베이스 사이에는 근본적인 패러다임의 불일치를 JPA가 해결해준다.

- 연관관계: 외래 키(Foreign Key) 대신 객체의 참조(Reference)를 사용한 연관관계 매핑
- 객체 그래프 탐색: 연관된 객체를 사용할 때, JOIN 쿼리 없이 객체 그래프를 자유롭게 탐색 가능
- 동일성 비교: JPA는 같은 트랜잭션 내에서 조회한 동일한 로우에 대해 항상 동일한 객체 인스턴스를 반환하도록 보장 및 객체의 동등성 비교 가능

### 데이터베이스 독립성

JPA는 표준 인터페이스이므로, 설정 파일에서 데이터베이스 방언(Dialect)만 교체하면 애플리케이션 코드의 수정 없이 데이터베이스 종류를 변경할 수 있다.

### 성능 최적화

JPA는 단순히 SQL을 대신 생성해주는 것에서 그치지 않고, 다양한 성능 최적화 기능을 제공한다.

- 1차 캐시
    - 영속성 컨텍스트 내부에 존재하는 엔티티 저장소로, 트랜잭션 범위 안에서 동작
    - `em.find()` 등을 통해 데이터베이스에서 엔티티를 처음 조회하면, 해당 엔티티의 인스턴스를 1차 캐시에 저장하고 그 인스턴스를 반환
    - 이후 같은 트랜잭션 내에서 동일한 엔티티를 다시 조회할 경우, 데이터베이스에 접근하지 않고 1차 캐시에 있는 엔티티 인스턴스를 반환
    - 같은 트랜잭션 내에서 조회한 엔티티의 반복 가능한 읽기(Repeatable Read)와 객체 동일성 보장
- 쓰기 지연 (Transactional Write-Behind)
    - `em.persist()`와 같은 메서드가 호출되면, JPA는 해당 SQL 쿼리를 생성하여 영속성 컨텍스트 내부의 쓰기 지연 SQL 저장소에 쿼리를 저장
    - 이렇게 모아둔 쿼리들은 트랜잭션이 커밋되는 시점에 `flush()`가 호출되면서 한꺼번에 데이터베이스로 전송
- 지연 로딩 (Lazy Loading)
    - 연관관계가 설정된 엔티티를 조회할 때, 실제로 해당 엔티티를 사용하는 시점까지 데이터베이스 조회를 미루는 기술
    - 데이터 조회 시 연관된 엔티티 컬렉션(`@OneToMany(fetch = FetchType.LAZY)`)은 실제 데이터가 아닌 프록시(Proxy) 객체로 초기
        - `***ToOne` -> 기본값 즉시 로딩 / `***ToMany` -> 기본값 지연 로딩
    - 이후 코드에서 실제 컬렉션에 접근하는 시점에, JPA가 조회 쿼리를 실행하여 프록시 객체를 실제 데이터로 초기화

## JPA의 동작 과정

JPA는 `EntityManagerFactory`와 `EntityManager`를 중심으로 동작한다.

- `EntityManagerFactory`
    - `EntityManager`를 생성하는 팩토리
    - 데이터베이스 커넥션 풀과 같은 리소스를 관리(애플리케이션 전체에서 단 하나만 생성되어 공유)
    - 여러 스레드가 동시에 접근해도 안전하게 공유 가능
- `EntityManager`
    - 실질적인 데이터베이스 작업(저장, 수정, 삭제, 조회 등)을 처리하는 객체
    - 내부에 데이터베이스 커넥션을 유지하면서 영속성 컨텍스트를 통해 엔티티를 관리

## 스프링 부트에서의 JPA 설정

과거에는 `DataSource`, `EntityManagerFactory`, `PlatformTransactionManager` 등 JPA를 사용하기 위한 여러 컴포넌트를 개발자가 직접 빈으로 등록해야 했다.

- `DataSource`: 데이터베이스 커넥션 정보를 담고 있는 객체
- `JpaVendorAdapter`: 사용할 JPA 구현체(예: Hibernate)에 대한 세부 설정을 담는 객체
- `LocalContainerEntityManagerFactoryBean`: `DataSource`와 `JpaVendorAdapter` 정보를 조합하여 `EntityManagerFactory`를 생성하는 객체
- `JpaTransactionManager`: JPA의 트랜잭션을 스프링의 트랜잭션 관리 체계(`@Transactional`)와 연동시켜주는 객체

```java

@Configuration
public class JpaConfig {

    // 어떤 데이터베이스를 사용할 것인지 설정
    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/jpa_basic?serverTimezone=UTC");
        dataSource.setUsername("root");
        dataSource.setPassword("password");

        return dataSource;
    }

    // JPA 구현체 설정
    @Bean
    public JpaVendorAdapter jpaVendorAdapter(JpaProperties jpaProperties) {
        HibernateJpaVendorAdapter jpaVendorAdapter = new HibernateJpaVendorAdapter();
        jpaVendorAdapter.setShowSql(jpaProperties.isShowSql());
        jpaVendorAdapter.setGenerateDdl(jpaProperties.isGenerateDdl());
        jpaVendorAdapter.setDatabasePlatform(jpaProperties.getDatabasePlatform());

        return jpaVendorAdapter;
    }

    // Entity 객체를 생성하고 관리해주는 EntityManagerFactory 설정
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource,
            JpaVendorAdapter jpaVendorAdapter, JpaProperties jpaProperties) {
        LocalContainerEntityManagerFactoryBean entityManagerFactoryBean = new LocalContainerEntityManagerFactoryBean();
        entityManagerFactoryBean.setDataSource(dataSource);
        entityManagerFactoryBean.setPackagesToScan("com.example.jpa_basic.domain");
        entityManagerFactoryBean.setJpaVendorAdapter(jpaVendorAdapter);

        Properties jpaProperties = new Properties();
        jpaProperties.putAll(jpaProperties.getProperties());
        entityManagerFactoryBean.setJpaProperties(jpaProperties);

        return entityManagerFactoryBean;
    }

    // Transaction을 관리해주는 TransactionManager 설정
    @Bean
    public PlatformTransactionManager transactionManager(LocalContainerEntityManagerFactoryBean entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory.getObject());

        return transactionManager;
    }
}
```

### 스프링 부트의 JPA 자동 설정

하지만 오늘날 스프링 부트 환경에서는 두 가지 설정만으로 JPA를 바로 사용할 수 있다.

- `spring-boot-starter-data-jpa` 의존성 추가
- `application.properties` (또는 `.yml`) 파일에 데이터베이스 접속 정보와 기본적인 JPA 옵션 명시

###### 참고자료

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
