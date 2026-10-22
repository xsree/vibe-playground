import subprocess
import sys
from pathlib import Path

def convert_pdf_to_markdown(pdf_path: Path, output_dir: Path) -> Path:
    """
    使用 mineru 命令行工具将 PDF 转换为 Markdown。
    
    参数:
        pdf_path: PDF 文件的路径
        output_dir: Markdown 输出的根目录
        
    返回:
        生成的 markdown 文件路径
    """
    # 构造命令
    # mineru -p <input_pdf> -o <output_dir> -b hybrid-auto-engine -l ch
    command = [
        "mineru",
        "-p", str(pdf_path),
        "-o", str(output_dir),
        "-b", "hybrid-auto-engine",
        "-l", "ch"
    ]
    
    print(f"正在转换: {pdf_path.name} ...")
    
    try:
        # 使用 subprocess.run 执行命令
        # 移除了 capture_output=True 和 text=True，让 mineru 的输出直接打印到终端
        # 1. 解决了 Windows 下 GBK/UTF-8 编码冲突导致的 UnicodeDecodeError
        # 2. 实现了实时查看 mineru 转换进度（原本的输出会直接显示）
        subprocess.run(command, check=True)
        
        # mineru 会在 output_dir 下创建一个以文件名命名的子目录，里面包含 .md 文件
        # 例如: 2 生产装置概况.pdf -> 2 生产装置概况/hybrid_auto/2 生产装置概况.md (取决于 mineru 版本)
        # 根据用户提供的结构:
        # data/03_markdown/2 生产装置概况/hybrid_auto/2 生产装置概况.md
        
        md_file = output_dir / pdf_path.stem / "hybrid_auto" / f"{pdf_path.stem}.md"
        
        if not md_file.exists():
            # 有些版本可能直接在 stem 目录下，或者结构不同，这里做一个简单的容错/查找
            # 或者如果 mineru 更新了目录结构，可以根据实际观察调整
            print(f"警告: 预期文件 {md_file} 未找到，请检查输出目录结构")
            
        return md_file
        
    except subprocess.CalledProcessError as e:
        print(f"转换失败: {pdf_path.name}")
        print(f"错误信息: {e.stderr}")
        raise e
    except Exception as e:
        print(f"发生未知错误: {e}")
        raise e
