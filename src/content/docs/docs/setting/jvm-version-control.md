---
title: "JVM (Java Virtual Machine) Version Control"
date: 2024-03-07
lastUpdated: 2026-01-26
tags: [Setting]
description: "macOS에서 셸 함수를 등록하여 JAVA_HOME을 변경하는 방식으로 여러 JVM 버전을 전환하는 방법을 설명한다."
---

MacOS 환경에서 간단한 셸 함수를 등록하여 여러 버전의 JVM(Java Virtual Machine)을 쉽게 전환하며 사용하는 방법을 다룬다.

### 1. 버전 변경 셸 함수 추가

지정된 버전의 Java 홈 디렉토리를 찾아 `JAVA_HOME` 환경 변수를 설정하기 위해, 사용하는 셸의 설정 파일(예: `~/.zshrc`)에 아래 함수를 추가한다.

```shell
# ~/.zshrc
function javahome() {
  export JAVA_HOME=$(/usr/libexec/java_home -v "${1:-1.8}");
  java -version
}
```

설정 파일을 수정한 후에는 터미널을 재시작하거나 `source ~/.zshrc` 명령어로 변경 사항을 적용해야 한다.

### 2. 설치된 Java 버전 확인

시스템에 설치된 모든 JVM 버전을 확인하려면 다음 명령어를 사용한다.

```shell
/usr/libexec/java_home -V
```

```
Matching Java Virtual Machines (3):
    17.0.4 (arm64) "Amazon.com Inc." - "Amazon Corretto 17" /Users/hyogu/Library/Java/JavaVirtualMachines/corretto-17.0.4.1/Contents/Home
    11.0.16 (x86_64) "GraalVM Community" - "GraalVM CE 22.2.0" /Users/hyogu/Library/Java/JavaVirtualMachines/graalvm-ce-11/Contents/Home
    1.8.0_352 (arm64) "Amazon.com Inc." - "Amazon Corretto 8" /Users/hyogu/Library/Java/JavaVirtualMachines/corretto-1.8.0_352/Contents/Home
```

`javahome` 함수 사용 시 이 목록에 있는 버전 문자열(예: `1.8`, `11`, `17`)을 인자로 사용하게 된다.

### 3. Java 버전 변경

`javahome` 함수에 위에서 확인한 버전 번호를 인자로 전달하여 Java 버전을 변경할 수 있다.

```shell
# Java 17로 변경
javahome 17
```

```
openjdk version "17.0.4" 2022-07-18 LTS
OpenJDK Runtime Environment Corretto-17.0.4.8.1 (build 17.0.4+8-LTS)
OpenJDK 64-Bit Server VM Corretto-17.0.4.8.1 (build 17.0.4+8-LTS, mixed mode, sharing)
```
