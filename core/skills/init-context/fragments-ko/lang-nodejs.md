---
name: lang-nodejs
description: Node.js / TypeScript 프로젝트 규약 (pnpm + 보일러플레이트)
condition: 주 언어가 Node.js / TypeScript (package.json 존재, *.ts / *.tsx / *.js 다수 등).
---

## Node.js / TypeScript

### 보일러플레이트

신규 프로젝트 생성 시 아래 보일러플레이트를 사용한다.

- 일반 라이브러리 / 패키지 / 기본형:
  ```
  git clone https://github.com/hve4638/npm-boilerplate.git <project-name>
  ```
- React / SPA 프론트엔드:
  ```
  git clone https://github.com/hve4638/react-template.git <project-name>
  ```

초기화 후 `.git/` 디렉터리는 제거하여 원본 히스토리를 분리한다.

### 패키지 매니저

- `pnpm` 만 사용한다. `npm`, `yarn`, `bun` 은 사용하지 않는다.
- 의존성 설치: `pnpm install`
- 패키지 추가: `pnpm add <package>`
- 스크립트 실행: `pnpm run <script>`
- `pnpm approve-builds` 는 인터랙티브 명령이므로 사용하지 않는다.

### post-install 허용

안전한 패키지의 post-install 스크립트는 `package.json` 의 `pnpm.onlyBuiltDependencies` 에 추가한다.

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "protobufjs"]
  }
}
```
