# Agent Guidelines & Repository Architecture

本仓库（vibe-playground，本地路径 c:\Users\lizp0\Documents\ChatGPT\vibe-playground\）作为**多项目聚合目录（Multi-Vibe Hub）**，供存放不同主题、不同 Vibe 的独立前端项目。

---

## 1. 目录结构与隔离规范

1. **根目录整洁原则**：
   - 根目录下**严禁直接存放任何业务源码文件**（如散落的 .html, .css, .js 等）。
   - 根目录只保留项目入口索引、公共规范说明文档（如 AGENTS.md）或全局项目导航。
2. **独立子项目目录**：
   - 每一个新项目/Vibe 应用必须拥有属于自己的独立子文件夹（例如：learning/web-tech-visual-lab/）。
   - 每个子项目应具备完备的自包含结构（HTML/CSS/JS 物理分离，零后端，零强依赖构建）。

---

## 1.1 顶层目录

顶层只有两类目录（最多 3 层：`顶层/题目或项目/答卷或内容`）：
- `benchmarks/`：LLM 能力评测。核心资产是**提示词**，答卷是附属。
- `learning/`：把知识点做成网页的学习工具。第 2 节的设计规范只作用于此目录。

`.vite/`、`.workbuddy/`、`node_modules/` 等工具产物不入库。

## 1.2 命名规范

- 目录和文件名一律**英文、全小写、kebab-case**；中文名只写在 README 标题和正文里。
- 仅 `README.md`、`AGENTS.md`、`DESIGN.md` 这类约定文档允许大写。
- 评测题目录命名为 `{载体}-{主题}`，载体前缀如 `svg-`、`web-`、`webgpu-`、`3d-`。来自外部站点的逆向素材用 `{站点}-{主题}`（如 `newapi-black-hole-controls`），**不得丢掉来源站点名**。
- 答卷：单文件用 `{harness}-{model}-{effort}[-animated].{ext}`，多文件用同名目录。不确定工具和模型时不必强行标注，但新增答卷时应向用户确认真实身份，不得臆测。

## 1.3 评测题目规范（`benchmarks/`）

每道题一个目录，答卷直接放在题目目录下，不再嵌套 `results/`。

- **必备文件**：
  - `prompt.md`：提示词**原话**。提示词是最重要的资产，必须原文保存；原话丢失时在文件中标注 TODO，不得编造。
  - `README.md`：首行 `类型: open-ended | spec-driven | reverse-engineering`，包含「提示词」「想测什么」「答卷」三节。
- **可选文件**：`acceptance.md`（验收标准）、`prompt-history.md`（提示词的修改原因与效果变化，有迭代时才建）。
- **类型含义**：`open-ended` 为无约束自由发挥（如 "impress me"）；`spec-driven` 为有明确规格；`reverse-engineering` 为参考外部站点的逆向或改造，README 必须写明来源，逆向得到的原始文件放 `base/`。
- **独立性**：提示词要求各答卷独立从零生成时，agent 不得读取同题其他答卷的内容。
- **提示词里写到路径时**，必须使用真实目录名；目录改名后要同步修改提示词。
- **新建一道题的流程**：先存 `prompt.md` → 放入答卷 → 写 `README.md` → 更新根 `README.md` 的索引表。

## 1.4 学习项目规范（`learning/`）

每个子项目自包含，目录名 `{主题}-visual-lab` 或 `{主题}-lab`，并遵守第 2 节。

---

## 2. Web 技术全景可视化项目核心设计规范（适用于 `learning/`）

针对 Web 技术可视化看板项目：

### 核心认知模型：全站六大认知工具箱驱动
所有卡片与交互**原生贯彻六大认知模型**，无需任何额外开关，卡片结构统一包含：
1. **简化问题（Simplification）**：区分信号与噪声，每张卡片只提炼最小必要心智模型，剔除冗余修饰。
2. **直觉类比（Analogy）**：为所有抽象底层技术配备现实物理/物理机制类比（💡 现实映射）。
3. **重新提问（Reframing）**：摆脱冷冰冰的语法罗列，全部以**真实痛点与场景化提问**作为卡片驱动核心。
4. **结构分析（Structural Analysis）**：提供解构透视能力，分层剖析 HTML 骨架、CSS 盒模型/布局、JS 状态流。
5. **反向推导（Inversion）**：提供目标反推演练（给定渲染目标，反推最少必要代码/类名）与翻车反模式排查。
6. **归纳与推广（Induction & Generalization）**：从单点语法提炼出通用 Pattern（如 Design Tokens、布局公式），并推广到整站 UI。

### 界面与视觉规范
- **视觉风格**：精工质感 · Bento Grid 卡片式编辑看板风格。
- **主题系统**：内置原生深色（Dark）/浅色（Light）模式无缝切换。
- **架构模式**：纯原生前端（Modern Vanilla Web），HTML / CSS / JS 物理文件严格解耦，模块化动态加载，无需本地编译打包即可秒开运行。
- **文案规范**：严禁在页面或卡片文案中提及任何人物名字或方法论源头名称，完全以纯粹的交互工具与直觉知识库形态呈现。
