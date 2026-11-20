# 书签笔记生成器 (Bookmark Note Generator)

把一组网址与 Markdown 整理成一页自包含笔记，编码为 `data:text/html` 书签保存在浏览器中。无需任何后端服务，完全离线运行，同时随浏览器账号在多设备间无感同步。

## 本地运行

直接使用现代浏览器打开 [index.html](index.html) 或 [standalone.html](standalone.html)，亦可通过任意静态 Web 服务器访问。

## 核心特性

- ✍️ **Markdown 渲染与编辑**：支持 1-4 级标题、无序/有序列表、任务复选框、代码高亮、引用块与超链接自动识别。
- 📁 **书签 HTML 导入**：支持将 Chrome、Edge、Firefox 导出的书签文件拖拽导入，自动提取文件夹目录树并转换为 Markdown 结构。
- 🔁 **双向读取与逆向还原**：可粘贴已有笔记的 `data:text/html` 链接，完整还原源 Markdown 文本或提取网页超链接。
- 💾 **笔记内就地编辑**：生成的笔记自带极限压缩的微型编辑器与自解压引导（空白可编辑笔记总计仅 ~2.6 KB），在打开的书签页内即可编辑并按 `Ctrl+S` 重新压缩、复制新书签地址。
- ⚡ **智能编码与体积优化**：支持浏览器原生 `deflate-raw` 极限压缩（`CompressionStream` / `DecompressionStream`）、Base64 与 URL 百分号编码，自动对比并选用最短格式，配备字符长度与浏览器书签同步容量健康提示。
- 🔒 **纯离线安全**：不发起任何外部网络请求，零第三方外部库依赖。

## 文件结构

- `index.html`：生成器页面骨架与交互面板。
- `styles.css`：界面布局、暗色模式适配与视觉交互样式。
- `app.js`：Markdown 解析器、笔记模板构建、书签导入及数据编码逻辑。
- `standalone.html`：单文件一体化版本，方便随时拷贝与单文件便携离线使用。
