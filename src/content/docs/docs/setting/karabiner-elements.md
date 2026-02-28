---
title: "Karabiner-Elements"
date: 2024-03-07
lastUpdated: 2026-01-26
tags: [Setting]
description: "Karabiner-Elements의 JSON 기반 사용자 정의 규칙 작성으로 키 매핑과 입력 소스 조건을 설정하는 방법을 정리한다."
---

## 사용자 정의 규칙 추가

`json` 확장자의 파일로 Rule 설정을 작성하여 Karabiner-Elements에 사용자 정의 규칙을 추가할 수 있다.

- 디렉토리: `~/.config/karabiner/assets/complex_modifications`
- 활성화: `Complex Modifications > Rules` 설정에서 `Add rule`을 통해 활성화

## 설정

- 변경 키
    - `from`: 변경 전 키 설정
    - `to`: 변경 후 키 설정
- 입력 소스 조건
    - `input_source_if`: 특정 입력 소스(언어)일 때만 규칙이 적용되도록 설정
- 활성화 규칙
    - `frontmost_application_if`: 특정 애플리케이션이 활성화되어 있을 때만 규칙이 적용되도록 설정

### 예시

```json
// 한글 입력 시 원화(`₩`) 기호를 Grave Accent(\`)로 변경
{
  "title": "Change Won (₩) to grave accent (`) in IntelliJ",
  "rules": [
    {
      "description": "Change Won (₩) to grave accent (`) in Korean layout for IntelliJ.",
      "manipulators": [
        {
          "type": "basic",
          "from": {
            "key_code": "grave_accent_and_tilde",
            "modifiers": {
              "optional": [
                "any"
              ]
            }
          },
          "to": [
            {
              "key_code": "grave_accent_and_tilde",
              "modifiers": [
                "option"
              ]
            }
          ],
          "conditions": [
            {
              "type": "frontmost_application_if",
              "bundle_identifiers": [
                "^com\\.jetbrains\\.intellij$"
              ]
            },
            {
              "type": "input_source_if",
              "input_sources": [
                {
                  "language": "ko"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

// 실수로 누르기 쉬운 시스템 단축키를 비활성화하여 원치 않는 동작 방지
{
  "title": "Disable Unwanted Command-Shortcuts",
  "rules": [
    {
      "description": "Disable COMMAND-H (Hide Window)",
      "manipulators": [
        {
          "type": "basic",
          "from": {
            "key_code": "h",
            "modifiers": {
              "mandatory": [
                "command"
              ]
            }
          }
        }
      ]
    },
    {
      "description": "Disable COMMAND-M (Minimize)",
      "manipulators": [
        {
          "type": "basic",
          "from": {
            "key_code": "m",
            "modifiers": {
              "mandatory": [
                "command"
              ]
            }
          }
        }
      ]
    }
  ]
}
```
