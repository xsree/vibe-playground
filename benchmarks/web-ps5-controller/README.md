类型: spec-driven

# PS5 手柄 (web-ps5-controller)

## 提示词
见 [prompt.md](prompt.md)（包含核心提示词与跨模型测试规范说明）。

## 想测什么
用纯前端画出高保真、可交互的 DualSense 手柄：造型、按键反馈、摇杆、灯带。

## 答卷

| 厂商 | 模型 | Harness | effort | 答卷 | 说明 |
|---|---|---|---|---|---|
| Tencent | Hy4-preview | WorkBuddy | high | [workbuddy-hy4-preview-high.html](workbuddy-hy4-preview-high.html) | 独立从零绘制：白色本体+黑色蝙蝠翼下护板、触控板灯带与机身下方地面灯带、可拖动双摇杆（L3/R3 光环点亮）、L2/R2 模拟量渐变、触控板按压涟漪与坐标反馈、部件标注开关、视角拖动旋转、键盘映射与 Gamepad API 实时驱动 |
