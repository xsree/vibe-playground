类型: spec-driven

# 鹈鹕骑自行车 · 3D (3d-pelican-bicycle)

## 提示词

见 [prompt.md](prompt.md)，保存用户原话、多选一载体确认、身份确认及 Three.js 3D 适配执行规范。源题目为 [SVG 版](../svg-pelican-bicycle/prompt.md)。

## 想测什么

测试模型通过纯程序化 Three.js 几何指令（`LatheGeometry`、`ExtrudeGeometry`、`TubeGeometry`、参数化曲面等）在三维空间独立构造可辨识的鹈鹕与自行车，并验证 360° 视角下的立体结构闭合度、双侧机械对称性以及三维双连杆逆运动学（Two-Bone IK）骑行动画协调能力。禁止加载外部 3D 模型资产或读取其他答卷。

## 答卷

画廊共 **1** 条，入口为 [index.html](index.html)，数据来自 [gallery-data.js](gallery-data.js)。无需本地构建步骤，直接打开 HTML 即可运行预览。

| 厂商 | 模型 | Harness | effort | 答卷 | 日期 |
|---|---|---|---|---|---|
| Google | Gemini-4-Carbon | Antigravity | medium | [海风巡航 · 3D 动态版](antigravity-gemini-4-carbon-medium-animated/index.html) | 2026-11-11 |

场景包含圆形海岸木栈道微缩岛屿底座、灯塔旋转光束、海浪起伏、盘旋海鸥、36 节行进滚子链条、双侧曲柄与三维双连杆 IK 脚踏联动、双翼握把 IK、参数化弹性晃动喉囊与飘动条纹围巾；支持自由视角环绕缩放、速率切换、晴昼/落日氛围切换、暂停播放与 PNG 截图导出，并尊重系统减少动态效果偏好。
