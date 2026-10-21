# 鹈鹕骑自行车 Canvas 测试提示词

## 用户原话

```text
[prompt.md](benchmarks/svg-pelican-bicycle/prompt.md) 改用canvas而不是svg来生成。
```

引用文件：[原 SVG 提示词](../svg-pelican-bicycle/prompt.md)。

身份确认原话：

> GPT 6.1 Sol，high，Codex

## 执行提示词（根据上述要求适配，非用户原话）

在 `benchmarks/canvas-pelican-bicycle/` 内，独立生成高质量纯手写 Canvas 2D 绘图代码，绘制一只正在骑自行车的鹈鹕（pelican riding a bicycle）。保留原 SVG 题目及其历史答卷。

1. 使用原生 HTML、CSS、JavaScript，文件物理分离，无构建步骤、无外部依赖，可以直接打开 HTML 预览。画面中的鹈鹕、自行车和场景均通过 Canvas 2D API 手写绘制，禁止使用 SVG、外部图片或图像生成模型。
2. 鹈鹕与自行车比例合理、语义清晰；可制作动画，动画需要考虑减少动态效果偏好。
3. 不得读取、参考或借鉴任何已有答卷的绘图代码，必须完全独立构思和绘制。
4. 生成前确认真实 harness、model、effort、vendor，不得臆测。此次用户确认 Codex / GPT 6.1 Sol / high；厂商为 OpenAI。
5. 答卷保存于 `{harness}-{model}-{effort}[-animated]/`，名称全部小写。自动追加到本题 `gallery-data.js` 的 `window.CANVAS_PELICAN_RESULTS` 数组，字段包含 harness、vendor、model、effort、animated、file。
6. 更新本题 README 的答卷记录与总数、根 README 的题目索引，并打开可视化预览。

## 已有结果

画廊已登记共 **1** 条。

- **OpenAI**
  - GPT 6.1 Sol（动态版）+ Codex：`codex-gpt-6.1-sol-high-animated/index.html`（2026-10-21，effort: high）
