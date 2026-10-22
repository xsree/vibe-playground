# PromptProbe 开发任务规范与启动提示词

你需要从零实现或维护一个名为 **PromptProbe** 的本地命令行诊断工具。

PromptProbe 的核心定位非常明确：

**伪装成一个 OpenAI Compatible API 服务，接收 Coding Agent 发出的 Chat Completions 请求，捕获其中的系统提示词（System & Developer Prompts），保存完整未经修改的原始请求 JSON 和易读 Markdown，并将捕获的系统提示词通过 OpenAI Compatible SSE 流式响应原样返回给 Agent。同时兼容 Agent 框架发起的 API 连通性测试探测（Probe）请求，支持持续多轮捕获与可选的单次捕获模式。**

不要把它设计成通用 LLM Proxy，不需要转发真实模型，不需要数据库，不需要 Web UI。保持项目小、清晰、高可靠、开箱即用。

---

## 一、核心使用流程与产品语义

很多 Coding Agent（如 Cline、Aider、Continue、Roo Code、Cursor 等）支持配置：
* **Base URL**: `http://127.0.0.1:8000/v1`
* **API Key**: 任意非空字符串（PromptProbe 不做验证）
* **Model**: 任意模型名（如 `gpt-5`、`claude-3-5`）

### 典型使用流程

1. 用户启动 PromptProbe：
   ```bash
   uv run python main.py
   ```
2. 终端显示服务就绪状态：
   ```text
   PromptProbe
   ────────────────────────────────────────

   Listening on http://127.0.0.1:8000
   OpenAI Base URL: http://127.0.0.1:8000/v1

   Waiting for Chat Completions request...
   ```
3. **Agent 连通性探测处理**：
   部分 Agent 框架连接前会自动发送一次简短的 API 测试请求（通常只有 `user: "ping"` 或短文本，无系统提示词）。
   - PromptProbe 必须识别此行为，返回合规的 `200 OK` 确认信息（如 `"PromptProbe: API connection verified. Ready to capture system prompt."`），确保 Agent 顺利通过连接校验。
   - 探测请求单独保存为 `captures/YYYYMMDD-HHMMSS_probe.json`，**不消耗**正式系统提示词的捕获状态。
4. **正式系统提示词捕获**：
   用户在 Agent 界面中发送真实任务（如“你好”），Agent 组装完整的系统设定和工具说明，发起 `POST /v1/chat/completions`。
   PromptProbe 接收后：
   - 保存未经修改的完整原始请求 JSON。
   - 从 `messages` 中按原始顺序提取所有 `role == "system"` 与 `role == "developer"` 的提示词。
   - 生成方便人工阅读的 Markdown。
   - 终端打印接收详情与摘要统计。
   - 将提取的系统提示词作为 `assistant` 回复，以 OpenAI SSE 格式流式推回 Agent UI。
   - 默认保持服务运行，准备捕获后续请求（`Capture #2`、`Capture #3`...）。若指定 `--one-shot` 参数，则进入单次锁定模式。

---

## 二、技术选型与包管理规范（基于 uv）

### 依赖控制
必须使用现代轻量技术栈，严禁依赖冗余大模型中间件：
* **Python**: 3.11+
* **核心依赖**: `fastapi`, `uvicorn[standard]`
* **测试依赖**: `pytest`, `httpx`
* **标准库**: `asyncio`, `json`, `pathlib`, `datetime`, `argparse`, `sys`, `typing`
* **禁止引入**: OpenAI Python SDK、LangChain、LiteLLM、第三方 SSE 库、数据库驱动、Rich/Loguru（保持终端纯原生输出）。

### 项目目录隔离与全局 Python 保护
必须通过 `uv` 进行现代包管理与依赖隔离：
1. **完全项目内隔离**：所有第三方依赖只下载并安装到项目根目录下的 `.venv`（`./.venv/Lib/site-packages`），**绝对禁止污染系统全局 Python 环境**。
2. **沿用已有 Python 版本**：在 `pyproject.toml` 中配置 `requires-python = ">=3.11"` 与 `tool.uv.python-downloads = "never"`，直接复用当前系统已安装的 Python，禁止私自联网下载额外的 Python 运行时。
3. **确定性锁定**：由 `uv sync` 生成并维护 `uv.lock`。

---

## 三、接口规范

### 1. `GET /`
状态探针，返回当前服务状态与计数：
```json
{
  "name": "PromptProbe",
  "status": "ready",
  "captures_count": 1,
  "probes_count": 1
}
```
若处于 `--one-shot` 模式且已完成捕获，`status` 返回 `"capture_complete"`。

### 2. `GET /health`
健康检查接口：
```json
{
  "status": "ok"
}
```

### 3. `GET /v1/models`
兼容在发起对话前主动探测模型列表的 Agent 框架。**此接口绝不能触发捕获逻辑**：
```json
{
  "object": "list",
  "data": [
    {
      "id": "prompt-probe",
      "object": "model",
      "owned_by": "local"
    }
  ]
}
```

### 4. `POST /v1/chat/completions`
核心接口。不要使用严格的 Pydantic 模型校验 Body，直接使用 `await request.json()` 解析，以完整保留客户端发送的各种 OpenAI-compatible 扩展参数及未知字段。

---

## 四、核心业务逻辑与提取规则

### 1. 探测与多轮调用设计（重点避免“二次调用失效”）
* **连通性探测（Probe）**：若提取出的 `system` 和 `developer` 提示词为空（例如仅有一条短 user 消息）：
  - 判定为探活测试，立即返回 200 确认响应（支持 stream 与 non-stream）。
  - 记录 `captures/YYYYMMDD-HHMMSS_probe.json`。
  - 服务保持 ready，不报错、不锁定。
* **持续捕获模式（默认）**：
  - 每次收到带有系统提示词的请求，均执行完整捕获与文件保存。
  - 支持多轮交互与多次测试，按次序展示 `Capture #1`、`Capture #2`...
  - 同一秒发生多次写入时，文件名自动追加计数后缀（如 `_1.json`），严禁文件相互覆盖。
* **单次捕获模式（`--one-shot`）**：
  - 仅在用户显式传入 `--one-shot` 标志时生效。
  - 完成首次真实捕获后，后续请求返回 `409 Conflict`：
    ```json
    {
      "error": {
        "message": "PromptProbe has already captured one request in one-shot mode. Restart the server to capture again.",
        "type": "capture_complete"
      }
    }
    ```

### 2. 提示词提取与排序规则
* 遍历 `messages` 数组。
* 提取所有 `role == "system"` 与 `role == "developer"` 的消息。
* **必须严格保持它们在原始 `messages` 数组中的先后顺序**。
* 组合回显格式：
  ```text
  [SYSTEM]

  AAA

  [DEVELOPER]

  BBB

  [SYSTEM]

  CCC
  ```

### 3. Content 结构兼容与异常保护
`message["content"]` 必须同时兼容：
1. **普通字符串**：直接提取。
2. **OpenAI Content Parts 数组**（如 `[{"type": "text", "text": "..."}]`）：提取其中所有 `type == "text"` 的 `text` 并拼接。
3. **未知或复杂嵌套结构**：自动通过 `json.dumps(..., ensure_ascii=False)` 序列化兜底，绝不崩溃报 500。

### 4. 数据留存与 Markdown 输出
保存在 `captures/` 目录中：
1. **原始 JSON** (`YYYYMMDD-HHMMSS.json`)：
   - 完整存储解析得到的请求字典。
   - `json.dumps(body, ensure_ascii=False, indent=2)`，UTF-8 编码。
   - 保留中文、保留未识别扩展字段、保留 `tools`、`tool_choice`、`temperature` 等所有参数。
2. **易读 Markdown** (`YYYYMMDD-HHMMSS.md`)：
   ```markdown
   # PromptProbe Capture

   Captured: 2026-09-03 10:35:12
   Model: gpt-5

   ## SYSTEM

   You are an AI coding agent...

   ## DEVELOPER

   Additional instructions...
   ```
   不添加外部主观总结，不修改原文，不美化改写。

### 5. OpenAI 风格响应回显
* **流式（`stream == true`）**：
  - 返回 `media_type="text/event-stream"`。
  - 首包发送 `role: "assistant"` 声明。
  - 内容以 300~800 字符为切片（推荐 500 字符）发送 `delta: {"content": "..."}`。
  - 发送结束包 `finish_reason: "stop"`。
  - 发送 `data: [DONE]\n\n`。
* **非流式（`stream == false` 或缺省）**：
  - 返回标准 `chat.completion` 格式 JSON，`message.content` 包含提取的提示词。

---

## 五、终端交互规范

终端输出保持极简清晰，避免复杂 TUI。

### 启动界面
```text
PromptProbe
────────────────────────────────────────

Listening on http://127.0.0.1:8000
OpenAI Base URL: http://127.0.0.1:8000/v1

Waiting for Chat Completions request...
```

### 探测请求日志
```text
[10:35:10] Agent probe / connectivity check received (no system prompt)

Endpoint        POST /v1/chat/completions
Model           gpt-5
Stream          true
Messages        1 (User: 1)

Saved:
  JSON  captures/20260903-103510_probe.json

Returning OK response to pass agent connectivity test...
[10:35:10] Probe test passed. Ready for system prompt request.
```

### 真实捕获日志
```text
[10:35:12] Capture #1 received

Endpoint        POST /v1/chat/completions
Model           gpt-5
Stream          true
Messages        5
System          1
Developer       1
User            2
Assistant       1
Tools           18

System prompt   24,381 chars

Saved:
  JSON  captures/20260903-103512.json
  MD    captures/20260903-103512.md

Streaming captured prompt back to client...

[10:35:13] Capture #1 complete

Ready to capture subsequent requests.

Press Ctrl+C to exit.
```

---

## 六、测试覆盖与质量要求

编写完整的自动化测试套件（使用 `pytest`），覆盖：
1. 单个 system 消息提取与格式化。
2. system + developer 消息组合。
3. 多个 system/developer 严格保持原始序列。
4. 字符串 content 与 Content Parts 数组提取。
5. 中文与高并发大文本提示词。
6. 保留 tools 与未定义扩展字段。
7. 探测（Probe）请求判定与通过机制。
8. 持续多轮捕获不报 409。
9. 显式开启 `--one-shot` 模式下的 409 拒绝逻辑。
10. 并发请求下的锁安全性与防文件名覆盖。
11. `GET /`、`GET /health`、`GET /v1/models` 端点行为。
