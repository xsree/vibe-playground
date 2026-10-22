# PDF知识库构建管线 (PDF2KB-Pipe)

一套用于将 PDF 自动化处理并构建为高价值知识库的工程化工具集。

## 项目结构 (Engineering Layout)

```text
PDF知识库构建管线/
├── src/                   # 核心源码
│   ├── config.py          # 全局路径与模型配置
│   ├── orchestrator.py    # 业务流程编排
│   └── utils/             # 原子化任务脚本 (PDF拆分、MD提取等)
├── workspace/             # 数据流水线 (01_raw -> ... -> 05_kb)
├── main.py                # 统一命令行入口
└── pyproject.toml         # 依赖管理 (使用 uv)
```

## 功能与用法

### 初始化工作目录 (Init Workspace)
首次使用前，初始化 workspace 及其子目录结构：
```bash
python main.py init-workspace
```
该命令会创建 `workspace/01_raw` ~ `workspace/05_kb` 五个标准子目录，重复运行是安全的（已存在的目录会跳过）。

### 全自动流水线 (One-Click Pipeline)
一键完成所有 PDF 的全生命周期处理：
```bash
python main.py pipeline
```
支持指定特定文件处理：
```bash
python main.py pipeline --target xxx
```

### 自动化逻辑
- **分层隔离**: 每个 PDF 都在其独立的子文件夹中处理，防止数据交叉。
- **断点续传**: 自动检查输出文件是否存在，跳过已完成的任务。
- **流式输出**: AI 处理过程实时显示思考与提取内容。
```

#### 5. 后期处理 (`post-process`)
对知识库草稿进行合并、去重、表格化处理，生成 `企业知识库送审.md`。
```bash
python main.py post-process
```
