类型: spec-driven

# 鹈鹕骑自行车 (svg-pelican-bicycle)

## 提示词
见 [prompt.md](prompt.md)。该文件同时是测试规范和"已有结果"记录表，被测 agent 会按其中流程更新。

## 想测什么
纯手写 SVG 的造型能力：能否让鹈鹕与自行车两个主体比例合理、语义清晰。

## 答卷
- 画廊：[index.html](index.html)（数据来自 [gallery-data.js](gallery-data.js)，已登记 65 条，记录见 [prompt.md](prompt.md#已有结果)）。
- `vendor` 填厂商名称，`model` 保留模型名。前端直接从 `gallery-data.js` 的 `vendor` 字段生成厂商列表、模型分组和筛选，不维护内置厂商名单；新增或更名只需更新数据。
- 直接打开 HTML 即可使用：筛选条件保存在浏览器本地；页面可见时每 3 秒检查一次 `gallery-data.js`，数据变化后自动更新画廊并保留仍有效的筛选。后台页面暂停检查，切回后立即检查。新增 SVG 仍需登记到数据文件；仅修改 SVG 内容不会触发数据更新。
- 页头日月按钮可切换明暗主题，首次打开跟随系统，手动选择后自动记忆。支持圆形展开过渡与日月图标动画；不支持视图过渡时使用配色渐变，并尊重系统的减少动态效果设置。
- SVG 产物统一存放在 [artworks/](artworks/) 子目录，页面、脚本、样式与文档保留在当前目录。`gallery-data.js` 的 `file` 字段填写相对于画廊页面的路径，例如 `artworks/文件名.svg`。
- 答卷文件命名沿用提示词内定义的 `{harness}-{model}-{effort}[-animated]-pelican-riding-bicycle.svg`，不要改名，画廊依赖它。
