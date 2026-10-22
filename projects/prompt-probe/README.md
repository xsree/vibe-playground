# PromptProbe

PromptProbe 是一个极简、专用的本地命令行诊断工具，伪装成 OpenAI Compatible API 服务，专门用于捕获 Coding Agent 发出的**第一次** Chat Completions 请求中的系统提示词（System / Developer Prompts）。

它不是通用的 LLM Proxy，不转发真实大模型，没有数据库，没有 Web UI，遵循 **“一次启动 = 捕获一次请求”** 的单一职责设计。

---

## 核心特性

- **完整保留原始请求**：未经修改的 JSON 请求体原样写入 `captures/YYYYMMDD-HHMMSS.json`，包括所有未识别扩展字段、`tools`、`tool_choice`、`stream_options` 等。
- **可读 Markdown 提取**：按原顺序提取 `system` 和 `developer` 消息并保存为 `captures/YYYYMMDD-HHMMSS.md`，便于人工阅读与比对。
- **OpenAI Compatible 流式回显**：通过标准的 Server-Sent Events (SSE) 流式协议，将捕获的系统提示词作为 assistant 回复即时流式返回给客户端。
- **单次捕获语义**：捕获一次后锁定，后续请求一律拒绝（409 Conflict），避免客户端重试或多轮会话污染记录。
- **零干扰与高兼容**：兼容 `/health`、`/v1/models`；不验证 API Key，不强制 Schema 截断未知字段。

---

## 使用场景

- 调试或逆向研究各类 Coding Agent（如 Cline、Aider、Continue、Roo Code、Cursor 等）在发送给 LLM 时的系统设定与规则提示词。
- 确认 Agent 的 Rules / Skills / System Prompt 是否按预期正确注入到了 Chat Completions API 请求中。
- 分析客户端构造的 tools 和参数定义。

> **特别说明**：PromptProbe 捕获的是**客户端实际发送给 HTTP API 请求体中的 `messages`（包含 `system` 与 `developer` role）**，并非大模型服务商内部或开源模型运行时经过分词器（Tokenizer/Chat Template）渲染后的底层原始 Token 序列。

---

## 环境要求

- Python 3.11+
- `fastapi`
- `uvicorn[standard]`

---

## 安装与环境隔离（推荐使用 uv）

本项目推荐使用 [uv](https://docs.astral.sh/uv/) 进行包管理与环境隔离。
通过 `pyproject.toml` 中的 `tool.uv` 配置：
- **完全项目内隔离**：依赖直接安装在项目目录下的 `.venv`，绝不污染系统全局 Python 环境。
- **沿用已有 Python**：直接使用本机现有的 Python 版本（`requires-python = ">=3.11"`），且配置了 `python-downloads = "never"`，不会私自下载额外的 Python 解释器。

### 方式一：使用 uv（推荐）

直接同步依赖到项目本地 `.venv`：

```bash
# 同步生产依赖与开发依赖（自动创建并管理项目目录下的 .venv）
uv sync
```

### 方式二：使用原生 venv + pip（备选）

若未安装 `uv`，亦可使用 Python 自带的 `venv` 模块在项目目录下创建虚拟环境：

```bash
# 1. 创建本地虚拟环境
python -m venv .venv

# 2. 激活虚拟环境
# Linux / macOS:
source .venv/bin/activate
# Windows (cmd):
.venv\Scripts\activate.bat
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# 3. 安装依赖到本地虚拟环境
pip install -r requirements.txt
# （可选）安装测试依赖：
pip install -r requirements-dev.txt
```

---

## 启动方法

### 使用 uv 启动（推荐）

无需手动激活虚拟环境，`uv` 会自动定位并使用项目目录下的 `.venv`：

```bash
uv run python main.py
```

指定端口或主机：

```bash
uv run python main.py --host 127.0.0.1 --port 8000
```

运行自动化测试：

```bash
uv run pytest -v
```

### 在激活的虚拟环境中启动

```bash
python main.py
```

启动后终端显示：

```text
PromptProbe
────────────────────────────────────────

Listening on http://127.0.0.1:8000
OpenAI Base URL: http://127.0.0.1:8000/v1

Waiting for first Chat Completions request...
```

---

## Agent 配置指引

在 Coding Agent（或任何支持配置自定义 OpenAI 兼容接口的应用）中配置：

| 配置项 | 推荐填入值 | 说明 |
| :--- | :--- | :--- |
| **Base URL** | `http://127.0.0.1:8000/v1` | 指向 PromptProbe 的 `/v1` 路径 |
| **API Key** | `anything` | PromptProbe 不做 Key 校验，填任意非空字符串即可 |
| **Model** | `任意模型名称`（如 `gpt-5`、`claude-3-5`） | 仅用于标识，不影响捕获 |

---

## Agent 探测（Probe）与多次调用支持

许多 Coding Agent 框架（如 Cline、Aider、Roo Code、Continue 等）在首次连接或用户输入前，会**自动发起一次简短测试请求**（如 `user: "ping"` 或短消息）以验证 API 是否真正可用。

- **智能探测通过**：若收到无 `system` / `developer` 提示词的测试请求，PromptProbe 会自动判定为连通性探测（Probe），立即返回合规的 `200 OK` 响应，使 Agent 顺利通过连接检测。
- **不损耗捕获状态**：探测请求不会提前锁定服务，它会被单独记录为 `captures/YYYYMMDD-HHMMSS_probe.json`。
- **持续捕获模式（默认）**：默认情况下，服务在完成捕获后**不会对后续请求报错失效**，而是持续监听并保存每一次带有系统提示词的请求（`Capture #1`、`Capture #2`...），生成独立时间戳文件，保证多轮交互或多次测试顺畅进行。
- **单次捕获模式（可选）**：若确实需要严格的“一次启动仅捕获一次并拒绝后续请求”，只需添加 `--one-shot` 参数：
  ```bash
  uv run python main.py --one-shot
  ```

---

## 捕获流程

1. 保持 PromptProbe 在终端中运行。
2. 在 Coding Agent 中向其发送一条消息，例如：
   ```text
   你好
   ```
3. Agent 会按照自身的完整工作流组装上下文，向 PromptProbe 发起 `POST /v1/chat/completions` 请求。
4. PromptProbe 接收请求后：
   - 提取所有 `system` 与 `developer` prompt。
   - 终端打印接收详情及统计数据（如 `Capture #1 received`）。
   - 保存完整原始 JSON 和 Markdown。
   - 将系统提示词以 SSE 格式流式推回给 Agent，Agent 窗口中即可直接看到自己的系统提示词。
   - 终端提示本次捕获完成，并继续保持监听准备捕获下一轮请求。
5. 服务保持运行，直到用户按下 `Ctrl+C` 退出。

终端日志示例：

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

## 文件保存位置

所有捕获记录存储于 `captures/` 目录下：

- **`captures/YYYYMMDD-HHMMSS.json`**：保留客户端发送的完整无损 JSON 请求体（保留所有未知字段、中文、`tools`、`temperature` 等）。
- **`captures/YYYYMMDD-HHMMSS.md`**：仅包含时间戳、模型名称以及按序呈现的 `## SYSTEM` 和 `## DEVELOPER` 提示词内容。
- **`captures/YYYYMMDD-HHMMSS_probe.json`**：Agent 自动探测请求的原始数据备份。
- 同一秒内发生多次请求时，自动追加序号后缀（如 `_1.json`），绝不互相覆盖。

---

## 接口说明

- **`GET /`**：查看当前捕获状态。未捕获返回 `{"name": "PromptProbe", "status": "waiting"}`；已捕获返回 `{"name": "PromptProbe", "status": "capture_complete"}`。
- **`GET /health`**：健康检查接口，返回 `{"status": "ok"}`。
- **`GET /v1/models`**：模型列表查询接口，返回兼容模型条目，供启动时探测模型列表的 Agent 使用。此接口**不会**触发捕获。
- **`POST /v1/chat/completions`**：核心接口。首个请求被捕获并回显，后续请求返回 409。

---

## 边界与异常处理

1. **未包含 system/developer 消息**：
   若请求中仅有 `user` 消息或 `messages` 为空，PromptProbe 依然会完整保存原始 JSON 文件，并在终端、Markdown 及 SSE 流中发出警告提示。
2. **非纯字符串 Content**：
   兼容 OpenAI Content Parts（`[{"type": "text", "text": "..."}]`）；未知结构自动序列化为 JSON 字符串，确保内容不丢失、不崩溃。
3. **并发安全**：
   内部使用异步锁互斥，严格确保同一时间内仅有单个请求被确认为 First Capture。

---

## 当前已知限制

1. 当前仅支持 OpenAI Compatible `/v1/chat/completions` 协议，不支持 Anthropic Messages API、Google Vertex AI 等私有协议。
2. 不支持多轮对话交互（这是有意为之的设计）。
3. 捕获的是发送至 HTTP API 的请求内容，不能捕获端侧 Agent 内部未上报的本地临时状态或敏感环境变量（除非 Agent 自身将它们拼入了 system prompt）。
