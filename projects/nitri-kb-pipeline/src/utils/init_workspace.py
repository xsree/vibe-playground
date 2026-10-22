"""初始化工作目录结构。

检查并创建 workspace 及其下 01_raw ~ 05_kb 五个标准子目录。
"""

from pathlib import Path

from src.config import WORK_DIR, PATHS


def init_workspace(work_dir: Path | None = None) -> None:
    """初始化工作目录。

    如果 workspace 目录不存在，则创建它以及 01_raw ~ 05_kb 五个子目录。
    如果已存在，则检查并补全缺失的子目录。

    Args:
        work_dir: 工作目录路径，默认使用 config.WORK_DIR。
    """
    base = work_dir or WORK_DIR
    sub_dirs = list(PATHS.values())

    if base.exists():
        print(f"[Init] 工作目录已存在: {base}")
    else:
        base.mkdir(parents=True, exist_ok=True)
        print(f"[Init] 已创建工作目录: {base}")

    for d in sub_dirs:
        if d.exists():
            print(f"  - 已存在: {d.relative_to(base.parent)}")
        else:
            d.mkdir(parents=True, exist_ok=True)
            print(f"  - 已创建: {d.relative_to(base.parent)}")

    print("[Init] 工作目录初始化完成")
