---
title: "Homebrew"
date: 2023-06-15
lastUpdated: 2026-01-26
tags: [Setting]
description: ""
---

Homebrew는 macOS용 패키지 관리자로, 커맨드라인 프로그램과 GUI 애플리케케이션의 설치, 업데이트, 삭제를 간편하게 관리할 수 있도록 돕는다.

## 설치

[Homebrew 공식 홈페이지](https://brew.sh)의 안내에 따라 설치를 진행한다. 설치 스크립트 실행 중 추가적인 사용자 확인이나 명령어 입력이 필요할 수 있다.

## 패키지 종류

Homebrew는 세 가지 종류의 패키지를 관리한다.

- `brew`: 커맨드라인 기반 애플리케이션 및 패키지
- `cask`: 웹사이트에서 직접 내려받아 설치하는 애플리케이션
- `mas`: Mac App Store를 통해 설치하는 애플리케이션

### mas-cli 사용법

`mas`는 App Store 애플리케이션의 ID를 사용하여 설치를 진행한다.

1. `mas` 명령어로 설치하려는 애플리케이션을 검색하여 ID를 확인(앱 스토어 URL의 ID와 동일)
   ```shell
   mas search "Magnet"
   ```

2. 확인된 ID를 사용하여 애플리케이션을 설치
   ```shell
   mas install 441258766
   ```

## Brewfile을 이용한 관리

설치하려는 패키지 목록을 `Brewfile`이라는 하나의 파일로 작성하여 관리할 수 있다.

```shell
# Brewfile 예시
brew "git"
brew "git-lfs"

cask "discord"
cask "docker"
cask "google-chrome"
cask "iterm2"
cask "jetbrains-toolbox"
cask "karabiner-elements"

mas "Magnet", id: 441258766
mas "Slack", id: 803453959
```

`Brewfile`을 사용하면 아래 명령어로 파일에 명시된 모든 패키지를 한 번에 설치할 수 있다.

```shell
brew bundle
```

반대로, 현재 시스템에 설치된 패키지 목록을 `Brewfile`로 생성하려면 다음 명령어를 사용한다.

```shell
brew bundle dump
```
