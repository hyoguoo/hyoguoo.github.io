---
title: "BeanCreationException 예외로 알아보는 빈 생명주기"
date: 2023-10-25
lastUpdated: 2024-03-10
tags: [Spring & JPA]
description: "BeanCreationException을 통해 스프링 빈 생명주기와 예외 처리 흐름이 어떻게 연관되는지 분석한다."
---

> 실행 환경: Java 17, Spring Boot 3.1.4

스프링 부트로 커맨드 라인 애플리케이션을 만들던 중, csv 관련 에러 테스트 중 예외 처리가 의도하지 않은 방향으로 흘러가는 것을 발견했다.

## 코드 구현

우선 아래는 애플리케이션을 실행하고 유지하는 `CommandLineRunner` 인터페이스를 구현한 `CommandLineExecutor` 클래스이며,  
애플리케이션 실행 및 정책은 다음과 같이 설정하였다.

- `RuntimeException` 발생 시: warning 로그를 남기고 실행 상태 유지
- `Exception` 발생 시: error 로그를 남기고 실행 종료

```java

@Slf4j
@Component
@RequiredArgsConstructor
public class CommandLineExecutor implements CommandLineRunner {

    private final ConsoleIOHandler consoleIOHandler;
    private final FunctionHandler functionHandler;

    private boolean isRunning = true;

    @Override
    public void run(String... args) {
        while (isRunning) {
            progress();
        }
    }

    private void progress() {
        try {
            consoleIOHandler.printMenuTitle(ConsoleConstants.VOUCHER_PROGRAM_START_MESSAGE);
            consoleIOHandler.printEnumString(Function.class);
            String command = consoleIOHandler.getInputWithPrint();

            Function.fromString(command)
                    .ifPresentOrElse(
                            function -> function.execute(functionHandler),
                            () -> {
                                throw InputException.of(InputErrorMessage.INVALID_COMMAND);
                            });
        } catch (RuntimeException e) {
            log.warn(e.getMessage());
        } catch (Exception e) {
            isRunning = false;
            log.error(Arrays.toString(e.getStackTrace()));
        }
    }
}
```

다음으로는 csv 파일을 읽고 쓰는 로직인 `CsvFileHandler` 클래스이며, 호출 시점 및 에러 처리는 아래와 같이 구현하였다.

```java
// CsvCustomerRepository.java: @PostConstruct와 @PreDestroy를 통해 빈 생성 및 소멸될 때 CsvFileHandler 클래스의 파일 입출력 메서드 호출
@Profile("default")
@Repository
public class CsvCustomerRepository implements CustomerRepository {

    private final Map<UUID, Customer> customerDatabase = new ConcurrentHashMap<>();

    // ...

    @PostConstruct
    public void init() {
        Function<String[], Customer> parser = line -> { /* ... */ };
        List<Customer> customers = csvFileHandler.readListFromCsv(
                parser,
                CSV_LINE_TEMPLATE
        ); // CSV 파일 읽기

        customers.forEach(customer -> customerDatabase.put(customer.getId(), customer));
    }

    @PreDestroy
    public void destroy() {
        List<Customer> customers = customerDatabase.values()
                .stream()
                .toList();
        Function<Customer, String> serializer = customer -> { /* ... */ };

        csvFileHandler.writeListToCsv(customers, serializer); // CSV 파일 쓰기
    }
}
```

```java
// CsvFileHandler.java: 파일 입출력 처리 로직, R/W 중 IOException이 발생하면 RuntimeException을 상속 받은 사용자 정의 예외로 변환하여 throw
public class CsvFileHandler {

    private static final String CSV_DELIMITER = ",";
    private final String filePath;

    // ...

    public <T> List<T> readListFromCsv(Function<String[], T> parser, String csvLineTemplate) {
        List<T> itemList = new ArrayList<>();

        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(filePath))) {
            while (true) {
                String line = bufferedReader.readLine();
                if (line == null) {
                    break;
                }
                String[] parts = line.split(CSV_DELIMITER);
                itemList.add(parser.apply(parts));
            }
        } catch (IOException e) {
            throw FileException.of(
                    FileErrorMessage.IO_EXCEPTION
            ); // IOException 발생 시 사용자 정의 예외로 변환하여 throw
        }

        return itemList;
    }

    public <T> void writeListToCsv(List<T> itemList, Function<T, String> serializer) {
        try (BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(filePath))) {
            for (T item : itemList) {
                String csvLine = serializer.apply(item);
                bufferedWriter.write(csvLine);
                bufferedWriter.newLine();
            }
        } catch (IOException e) {
            throw FileException.of(
                    FileErrorMessage.IO_EXCEPTION
            ); // IOException 발생 시 사용자 정의 예외로 변환하여 throw
        }
    }
}
```

## 에러 핸들링 테스트

### 애플리케이션 실행 중 에러

우선 애플리케이션 실행 중에 파일 경로에 파일 명을 수정하여 존재하지 않는 파일을 읽도록 하여 `IOException`이 발생하도록 했다.  
의도한 대로 사용자 정의 에러가 발생하고 `CommandLineExecutor`에서 예외를 처리하여 정의한 메시지가 warning 로그로 남은 뒤 애플리케이션이 계속 유지됐다.

```
2023-10-24 23:36:51.326 [main] WARN  d.s.commandline.CommandLineExecutor -- An error occurred during file input/output operations.
```

### 애플리케이션 초기화 중 에러

이번에는 애플리케이션 시작 전 파일명을 잘못 입력하여 애플리케이션 초기화 중에 `IOException`이 발생하도록 했다.  
이번에는 `CommandLineExecutor`에서 예외를 처리하지 못하고 애플리케이션이 바로 종료되었고, 아래 로그가 출력되었다.

```
2023-10-24 23:06:39.147 [main] WARN  o.s.c.a.AnnotationConfigApplicationContext -- Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'commandLineExecutor' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/commandline/CommandLineExecutor.class]: Unsatisfied dependency expressed through constructor parameter 1: Error creating bean with name 'functionHandler' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/commandline/function/FunctionHandler.class]: Unsatisfied dependency expressed through constructor parameter 1: Error creating bean with name 'customerController' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/controller/CustomerController.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'customerService' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/service/CustomerService.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
2023-10-24 23:06:39.169 [main] ERROR o.s.boot.SpringApplication -- Application run failed
org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'commandLineExecutor' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/commandline/CommandLineExecutor.class]: Unsatisfied dependency expressed through constructor parameter 1: Error creating bean with name 'functionHandler' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/commandline/function/FunctionHandler.class]: Unsatisfied dependency expressed through constructor parameter 1: Error creating bean with name 'customerController' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/controller/CustomerController.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'customerService' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/service/CustomerService.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
...
Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'functionHandler' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/commandline/function/FunctionHandler.class]: Unsatisfied dependency expressed through constructor parameter 1: Error creating bean with name 'customerController' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/controller/CustomerController.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'customerService' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/service/CustomerService.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
...
Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'customerController' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/controller/CustomerController.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'customerService' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/service/CustomerService.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
...
Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'customerService' defined in file [/Users/hyoguoo/Repositories/hyoguoo/springboot-basic/out/production/classes/devcourse/springbootbasic/service/CustomerService.class]: Unsatisfied dependency expressed through constructor parameter 0: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
...
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'csvCustomerRepository': Invocation of init method failed
...
Caused by: springbootbasic.exception.FileException: An error occurred during file input/output operations.
...
```

로그를 살펴보면 직접 정의한 `FileException`은 가장 마지막 라인에 존재하고, 그 위엔 `BeanCreationException`가 존재하여 빈 생성 중 발생한 예외로 추측 할 수 있다.  
빈 관련 에러라는 것을 확인했으니 빈 생명주기를 살펴보자.

1. 스프링 컨테이너 생성
2. 스프링 빈 생성
3. 의존 관계 주입
4. 초기화 콜백
5. 사용(실제 애플리케이션(빈) 동작 단계)
6. 소멸 전 콜백
7. 스프링 종료

여기서 파일을 읽어오는 단계는 `@PostConstruct`는 4번 초기화 콜백에 해당하며, 빈이 생성되고, 빈의 의존관계 주입이 완료된 후 호출된다.  
하지만 `CommandLineExecutor`가 동작하는 순간은 5번 사용 단계에 해당하기 때문에, 애초에 해당 에러를 처리하지 못하는 것이다.  
그 흐름을 자세히 살펴보면 아래와 같다.

1. 애플리케이션 시작 전 파일명 잘못 입력
2. 빈 초기화 중 `@PostConstruct` 애노테이션을 통해 `CsvCustomerRepository`의 `init()` 메서드 호출
3. `init()` 메서드에서 `CsvFileHandler`의 `readListFromCsv()` 메서드 호출
4. `CsvFileHandler` 내부에서 `IOException` 발생
5. `FileException`으로 변환하여 throw
6. `@PostContruct` 애노테이션에서 발생한 빈 초기화 중 발생한 예외이기 때문에 `BeanCreationException`으로 감싸져서 throw
7. 애플리케이션 초기화 중 발생했기 때문에 `CommandLineExecutor`이 동작하기 전에 예외가 발생

## 결론

사실 어찌보면 너무나 당연한 지식을 기반한 내용이지만, Spring의 여러 기능을 사용하게 되면서 생각하지 못한(의도하지 않은) 경로로 예외가 흘러가는 것을 확인할 수 있었다.  
다시 한 번 빈 생명주기에 대해 공부할 수 있었고, 그 흐름을 이해하는 것이 중요하다는 것을 깨달았다.  
만약 `BeanCreationException`이 발생하면, 빈이 생성되는 과정에서 문제가 있는 것이므로 빈 생명주기를 생각하면서 디버깅을 해보자. 

###### 참고

- [Bean 생명주기](/docs/spring/beans/)
- [예외 처리](/docs/java/exception-handling/)