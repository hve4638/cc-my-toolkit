---
name: lang-nodejs
description: Node.js / TypeScript project rules (pnpm + boilerplate)
condition: Primary language is Node.js / TypeScript (package.json present, many *.ts / *.tsx / *.js files).
---

## Node.js / TypeScript

### Boilerplate

When creating a new project, start from one of these boilerplates.

- General library / package / default:
  ```
  git clone https://github.com/hve4638/npm-boilerplate.git <project-name>
  ```
- React / SPA frontend:
  ```
  git clone https://github.com/hve4638/react-template.git <project-name>
  ```

After cloning, remove the `.git/` directory to detach from the original history.

### Package manager

- Use `pnpm` only. Do not use `npm`, `yarn`, or `bun`.
- Install: `pnpm install`
- Add package: `pnpm add <package>`
- Run script: `pnpm run <script>`
- `pnpm approve-builds` is interactive — do not use it.

### post-install allowlist

Trusted packages' post-install scripts are added to `pnpm.onlyBuiltDependencies` in `package.json`.

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "protobufjs"]
  }
}
```
