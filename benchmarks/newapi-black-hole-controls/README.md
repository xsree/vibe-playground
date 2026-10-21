> **类型**: reverse-engineering
> **来源**: 从 newapi 官网逆向得到的黑洞效果（生产 bundle 中提取），在此基础上二次开发。
> **目录**: `base/` 保存逆向得到的原始文件，其余为二次开发版。

# New API Black Hole — controls build

在上一版 180° 视角黑洞基础上新增：

1. **颜色调节**
   - 面板内 3 个颜色选择器分别对应 shader 中的 `uTintA / uTintB / uTintC`
   - 它们会同时影响吸积盘、背景星点、星云和 halo 的品牌色调

2. **鼠标滚轮缩放**
   - 通过新增 `uCamDist` uniform 控制相机轨道半径
   - 滚轮向上/向下可实时拉近/拉远
   - 也提供滑块做精确调节

3. **保留能力**
   - 上下 180° 视角切换
   - 居中黑洞
   - 左右亮度不平衡修正版 Doppler

## 文件

- `index.html`：带控制面板的独立版
- `base/index-original.html`：较早版本的原始独立壳
- `blackhole.vert.glsl`：顶点着色器
- `blackhole.frag.glsl`：当前平衡版片元着色器参考
- `base/blackhole.frag.original.glsl`：从生产 bundle 提取的原始片元着色器
