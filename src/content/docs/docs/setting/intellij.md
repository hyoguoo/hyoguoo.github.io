---
title: "IntelliJ"
date: 2022-09-29
lastUpdated: 2026-01-26
tags: [Setting]
description: ""
---

## 라이브 템플릿 생성

라이브 템플릿은 자주 사용하는 코드 조각을 미리 지정한 단축어(Abbreviation)로 쉽게 입력할 수 있게 돕는 기능이다.

- 설정 경로: `Settings > Editor > Live Templates`
- 우측의 `+` 버튼을 눌러 새로운 템플릿이나 그룹을 추가 가능
- 주요 항목
    - `Abbreviation`: 템플릿을 호출할 때 사용할 단축어 지정
    - `Description`: 템플릿에 대한 설명 작성
    - `Template text`: 실제로 생성될 코드 내용 작성
        - 변수를 사용하고 싶을 경우 `$VARIABLE_NAME$` 형식으로 지정
    - `Applicable in`: 템플릿이 활성화될 언어와 코드 영역(예: 주석, 문자열 등) 정의
    - `Edit variables`: `Template text`에서 사용한 변수(`$VARIABLE_NAME$`)의 기본값이나 동적으로 생성될 값을 설정

## 생산성 향상 설정

- 메모리 최적화: 힙 사이즈(`-Xmx`, `-Xms`) 조절로 성능 저하 방지
    - `Help > Edit Custom VM Options`
- 메모리 인디케이터 활성화: 실시간 메모리 사용량 모니터링
- 파일 끝에 개행 추가: 파일 저장 시 자동으로 파일 끝에 개행 추가
    - `Settings > Editor > General > Ensure every saved file ends with a line break`
- Gradle 빌드 위임: Gradle 빌드를 IntelliJ IDEA에 위임하여 빌드 속도 향상
    - `Settings > Build, Execution, Deployment > Build Tools > Gradle > Build and run using: IntelliJ IDEA`

## 코드 품질 향상 설정

- 코드 스타일 및 컨벤션 적용: 팀/개인 코드 컨벤션 적용으로 일관된 스타일 유지 및 가독성 증진
    - 저장 시 코드 자동 포맷팅: 활성화로 파일 저장 시 자동 코드 스타일 적용
        - `Settings > Tools > Actions on Save > Reformat Code`
    - 저장 시 임포트 최적화: 미사용 임포트 자동 정리 및 최적화로 코드 청결성 유지
      -`Settings > Editor > General > Auto Import > Optimize imports on the fly (for Java)`
    - 와일드카드 임포트 비활성화: 와일드카드 임포트 대신 명시적 클래스 임포트로 의존성 명확화
      -`Settings > Editor > Code Style > Java > Imports > Use single class import`
- SonarLint 플러그인: 실시간 코드 품질 문제 감지, 버그 및 개선 방안 제시
