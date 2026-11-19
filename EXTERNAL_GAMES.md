# 大体积第三方 AI 游戏与本地体验清单

本文件用于记录**体积较大（含大量二进制 3D 模型、贴图、高程或音频资产）、不适合入库推送**的第三方 AI 游戏与交互体验项目。

## 存放边界

- **轻量、纯代码自包含项目**（如 [projects/duskward/](projects/duskward/)、[projects/saltline/](projects/saltline/)）：保留在 `projects/` 下，随 Git 仓库提交和同步。
- **大体积第三方体验项目**：统一放在根目录 `local-demos/` 下供本地游玩；`local-demos/` 已写入 `.gitignore`，**不会被 Git 追踪、提交或推送**。

## 游戏清单

| 项目 | 技术栈 | 体积说明 | 原仓库 / 在线试玩 | 本地目录 |
| --- | --- | --- | --- | --- |
| **Petalwake** | Three.js / WebGL2 | 完整仓库约 196 MB（运行时 `assets/` 约 169 MB，不适合入库或直接打包为小红书小工具） | [jjcm/petalwake](https://github.com/jjcm/petalwake) · [在线试玩 v2](https://petalwake.non.io/v2) | `local-demos/petalwake` |

---

## 本地体验说明

### Petalwake

5.2 "one" shot 骑扫帚飞行送货 3D 游戏：低空掠过花田、海崖与港湾，扫帚尾流涡旋会实时卷起花瓣、压倒草地并撕起海浪水花（支持键盘 `WASD` + `Shift` + `Space`、鼠标或手柄，需桌面端 WebGL2）。

新设备拉取与启动：

```powershell
git clone --depth 1 https://github.com/jjcm/petalwake.git local-demos/petalwake
cd local-demos/petalwake
python tools/serve.py 6280
# 浏览器打开 http://localhost:6280/
```
