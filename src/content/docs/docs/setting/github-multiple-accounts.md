---
title: "GitHub Multiple Accounts"
date: 2024-03-07
lastUpdated: 2026-01-26
tags: [Setting]
description: "SSH 키 분리와 gitconfig includeIf를 활용하여 하나의 macOS 환경에서 여러 GitHub 계정을 관리하는 방법을 설명한다."
---

하나의 컴퓨터에서 여러 개의 GitHub 계정을 사용하기 위해 SSH 키와 `gitconfig`를 설정하는 방법을 다룬다.(MacOS 기준)

## 설정 방법

계정별로 SSH 키를 생성하고, Git 설정을 분리하여 특정 디렉토리에서는 지정된 계정 정보로 커밋하도록 설정한다.

### 1. 계정별 SSH 키 생성

각 GitHub 계정은 고유한 SSH 키를 통해 저장소 접근 권한을 관리하므로, 계정마다 별도의 키를 생성해야 한다.

```shell
# personal / work 계정에 맞게 GitHub 이메일 주소 설정, rsa 부분도 동일하게 하는 것을 권장 
# personal 계정용 SSH 키 생성
ssh-keygen -t rsa -C "personal@email.com" -f "id_rsa_personal"

# work 계정용 SSH 키 생성
ssh-keygen -t rsa -C "work@email.com" -f "id_rsa_work"
```

위 명령어 실행 시 키를 저장할 위치와 비밀번호를 입력받으며(비밀번호 설정 권장), 실행이 완료되면 `~/.ssh` 디렉토리에서 공개키(`id_rsa_*.pub`)와 개인키(`id_rsa_*`)를 확인할 수 있다.

### 2. SSH Agent에 키 등록

생성한 SSH 키를 SSH Agent에 등록하여 생성한 키를 등록한다.

```shell
ssh-add ~/.ssh/id_rsa_personal
ssh-add ~/.ssh/id_rsa_work
```

### 3. SSH 설정 파일 수정

`~/.ssh/config` 파일에 각 키를 사용할 호스트 정보를 추가하여, SSH가 특정 호스트에 접속할 때 지정된 키를 사용할 수 있게 한다.

```shell
# ~/.ssh/config

# Personal GitHub Account
Host github.com-personal
  HostName github.com
  IdentityFile ~/.ssh/id_rsa_personal
  User git

# Work GitHub Account
Host github.com-work
  HostName github.com
  IdentityFile ~/.ssh/id_rsa_work
  User git
```

### 4. GitHub 계정에 공개키 등록

각 계정의 GitHub 설정 페이지(`Settings > SSH and GPG keys`)에서 `New SSH Key` 버튼을 눌러 생성한 공개키(`id_rsa_*.pub`)의 내용을 등록한다.

```
Title: 구분할 수 있는 이름
Key type: Authenication Key
Key: {공개 키}
```

등록 후 아래 명령어로 각 설정이 올바르게 적용되었는지 테스트할 수 있다.

```shell
ssh -T git@github.com-personal
# Hi {username}! You've successfully authenticated...

ssh -T git@github.com-work
# Hi {username}! You've successfully authenticated...
```

### 5. 디렉토리별 Git 설정 분리

디렉토리 별로 커밋 될 사용자 이름과 이메일 정보를 계정별로 분리된 설정 파일에 각각 작성한다.

```
# ~/.gitconfig-personal
[user]
  name = personal_username
  email = personal@email.com

# ~/.gitconfig-work
[user]
  name = work_username
  email = work@email.com
```

그 후, 메인 `~/.gitconfig` 파일에 `includeIf` 조건을 사용하여 특정 디렉토리 경로에 따라 해당 계정의 설정 파일을 불러오도록 설정한다.

```
# ~/.gitconfig
[includeIf "gitdir:~/Repositories/personal/"]
    path = ~/.gitconfig-personal

[includeIf "gitdir:~/Repositories/work/"]
    path = ~/.gitconfig-work
```

- `~/Repositories/personal/` 디렉토리 하위: `~/.gitconfig-personal` 파일의 설정 사용
- `~/Repositories/work/` 디렉토리 하위: `~/.gitconfig-work` 파일의 설정 사용

### 6. 설정된 계정으로 저장소 사용

저장소를 `clone`하거나 `remote`를 추가할 때, `~/.ssh/config`에 설정한 호스트(`github.com-personal` 등)를 사용하여야 올바른 SSH 키가 사용된다.

- 기본 SSH 주소: `git@github.com:hyoguoo/DOCS.git`
- 변경할 주소: `git@github.com-personal:hyoguoo/DOCS.git`

```shell
# 'personal' 계정으로 clone
git clone git@github.com-personal:hyoguoo/DOCS.git
```
