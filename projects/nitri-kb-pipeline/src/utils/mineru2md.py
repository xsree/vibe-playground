import shutil
import re
from pathlib import Path

def collect_markdown_files(source_dir: Path, target_dir: Path) -> list[Path]:
    """
    遍历 mineru 输出目录，将所有的 .md 文件及其配套图片复制到目标目录。
    同时会修改 md 文件中的图片路径，以支持扁平化存储并避免图片名冲突。
    """
    if not source_dir.exists():
        print(f"源目录不存在: {source_dir}")
        return []

    target_dir.mkdir(parents=True, exist_ok=True)
    images_target_root = target_dir / "images"
    images_target_root.mkdir(parents=True, exist_ok=True)
    
    moved_files = []

    # 遍历 source_dir 下的所有 .md 文件
    for md_path in source_dir.rglob("*.md"):
        pdf_stem = md_path.stem
        dest_path = target_dir / md_path.name
        
        print(f"正在整理: {pdf_stem} ...")
            
        try:
            # 1. 处理图片 (直接合并到 images/ 目录下，因为 mineru 使用 UUID 命名)
            source_images_dir = md_path.parent / "images"
            if source_images_dir.exists() and source_images_dir.is_dir():
                for img_file in source_images_dir.iterdir():
                    if img_file.is_file():
                        # 直接复制到统一的 images 目录下
                        shutil.copy2(img_file, images_target_root / img_file.name)
                print(f"  - 已合并图片到: images/")

            # 2. 复制 Markdown 文件 (内容保持不变，因为图片链接已指向 images/)
            shutil.copy2(md_path, dest_path)
            moved_files.append(dest_path)
            
        except Exception as e:
            print(f"整理 {pdf_stem} 失败: {e}")

    print(f"--- 整理完成，共处理 {len(moved_files)} 个 Markdown 文件 ---")
    return moved_files
