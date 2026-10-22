from __future__ import annotations

import argparse
import sys
from pathlib import Path
from collections.abc import Sequence

sys.path.insert(0, str(Path(__file__).parent / "src"))

# 导入编排模块，将业务逻辑与 CLI 解耦
from src.orchestrator import (
    run_split, 
    run_convert, 
    run_organize, 
    run_md2kb, 
    run_post_process, 
    run_pipeline,
    run_init_workspace
)

def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="PDF知识库构建管线 - PDF 批量处理系统")
    subparsers = parser.add_subparsers(dest="command", help="可用的命令")

    # 1. init-workspace
    p = subparsers.add_parser("init-workspace", help="初始化工作目录结构 (workspace/01_raw ~ 05_kb)")

    # 2. pipeline
    p = subparsers.add_parser("pipeline", help="运行完整处理流程 (支持断点续传)")
    p.add_argument("--target", type=str, help="指定处理特定的 PDF 文件名 (无需扩展名)")

    # 为了保留灵活性，保留原子命令但提示其行为已变更为 scoped
    # 也可以选择移除这些原子命令，但在调试时它们很有用
    p = subparsers.add_parser("split", help="拆分 PDF")
    p.add_argument("pdf", type=Path, help="PDF 文件路径")
    p.add_argument("-o", "--output", type=Path, required=True, help="输出子目录")

    return parser.parse_args(argv)

def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    
    if args.command == "init-workspace":
        run_init_workspace()
    elif args.command == "pipeline":
        run_pipeline(args.target)
    elif args.command == "split":
        run_split(args.pdf, args.output)
    elif args.command is None:
        parse_args(["--help"])
    else:
        print(f"原子命令 {args.command} 暂不建议直接调用，请优先使用 pipeline")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
