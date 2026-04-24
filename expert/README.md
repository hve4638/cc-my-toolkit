# expert

고급·특수 작업용 플러그인. 일상 개발에 필요한 경량 도구는 `frame`, `common`, `hud` 에 있고, 이쪽엔 무거운 기능만 들어간다.

## MCP 서버 (`bridge/mcp-server.cjs`)

`.mcp.json` 이 단일 서버 `t` 로 등록. 현재 1개 툴:

| 툴 | 설명 |
|---|---|
| `python_repl` | 지속 namespace 에서 Python 실행. `bridge/gyoshu_bridge.py` 백엔드 spawn. 수치 계산·데이터 분석·정규식 검증 등 |

## 요구사항

- `python3` 가 PATH 에 있어야 함 (`gyoshu_bridge.py` spawn 용)
- 추가 네이티브 npm 패키지 없음 (frame 과 달리 `@ast-grep/napi` 불필요)

## MCP 재빌드 (개발자용)

```bash
cd _build
pnpm install
node build-mcp-server.mjs
```

출력: `bridge/mcp-server.cjs`.

툴 추가·제외는 `_build/src/mcp/tool-registry.ts` 편집.

## 향후

- `ralph` 등 고급 워크플로 스킬 추가 예정 (OMC 에서 이식)
- 경량 워크플로 스킬 (예: `interview`) 은 `frame` 에 배치 — 네이티브/무거운 실행 엔진만 이쪽에 유지
