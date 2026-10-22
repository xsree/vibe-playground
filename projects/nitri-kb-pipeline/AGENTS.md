# PDF知识库构建管线 - Agent 开发指南

## 核心设计模式

1. 模块化分层 (Engineering Layout)：
    - `src/`: 程序 Package。
    - `config.py`: 配置中心。
    - `orchestrator.py`: 业务流程编排器 (Controller)，负责循环、增量检查与 UI 输出。
    - `utils/`: 原子化任务层，只处理具体的"点"任务（如 `md2kb.py`、`init_workspace.py`）。
    - `main.py`: CLI 启动器。

2. 并发与隔离原则：
    - 严禁并发解析 PDF：解析操作极度消耗资源，必须在 `orchestrator` 中采用串行处理。
    - 资源回收：建议通过 `subprocess` 调用重型工具链，确保处理后内存能有效回收。

3. 稳定性保障：
    - 增量处理：在 `orchestrator` 执行具体 `run_xxx` 函数前，务必检查目标输出是否存在，支持断点续传。
    - 子命令模式：`main.py` 必须严格通过 `argparse` 子命令暴露内部功能。
    - 流式输出：AI 相关操作须保留 `streaming` 特性，实时打印思考过程，增强用户体验。

## 路径约定

- 数据流动路径遵循：`workspace/01_raw` -> `02_split/{pdf}` -> `03_mineru_output/{pdf}` -> `04_markdown/{pdf}` -> `05_kb/{pdf}知识库送审.md`。
- 隔离原则：每个 PDF 及其过程文件必须位于以其命名的独立子目录中（05_kb 阶段除外，采用文件名前缀区分）。

## 环境与执行

- 依赖管理: 本项目使用 `uv` 进行开发与依赖管理，Python 版本约束详见 `pyproject.toml`。
- 运行命令: 建议使用 `uv run python main.py <command>` 或 `uv run python pipeline.py` 运行脚本。
- 工作目录初始化: `workspace/` 不纳入版本控制，首次使用需运行 `python main.py init-workspace` 创建目录结构。

## 代码修养

- 联动修改: 修改底层原子脚本（`utils/`）时，务必检查并同步修改调用方（`orchestrator.py`）的接口适配。
- 文档维护: 在添加新功能，重构目录结构等操作后，必须同步更新 `README.md` 的结构说明与 `AGENTS.md` 的分层约定。
- Markdown 规范: 在生成或处理 Markdown 文件时，严禁或尽量少用加粗（``）和斜体（`*`）标记，以保持知识库格式的纯净。
- 类型提示 (Type Hinting): 所有函数的参数及返回值需标注类型。可选参数应使用 `Path | None = None` 避免 LSP 报错。
- 包导入规范: 在根目录下运行时，需动态调整 `sys.path` 以确保 `src` 包能被正确引用。
