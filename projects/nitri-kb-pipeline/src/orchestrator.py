import sys
from pathlib import Path
from src.config import PATHS, FILENAMES, get_scoped_paths
from src.utils.pdf_split import split_pdf_by_top_level_bookmarks
from src.utils.pdf2mineru import convert_pdf_to_markdown
from src.utils.mineru2md import collect_markdown_files
from src.utils.md2kb import md2kb
from src.utils.post_process import post_process_draft
from src.utils.init_workspace import init_workspace

def get_files(input_path: Path, ext: str) -> list[Path]:
    """获取指定路径下的所有匹配后缀的文件，如果路径是文件则直接返回。"""
    if input_path.is_file():
        return [input_path]
    elif input_path.is_dir():
        return sorted(list(input_path.glob(f"*{ext}")))
    return []

def run_split(pdf_path: Path, output_dir: Path):
    """拆分单个 PDF 到指定目录"""
    if output_dir.exists() and any(output_dir.glob("*.pdf")):
        print(f"[Split] 跳过: {pdf_path.name} (输出目录已存在且非空)")
        return
    
    print(f"正在拆分: {pdf_path.name} -> {output_dir}")
    split_pdf_by_top_level_bookmarks(pdf_path, output_dir)

def run_convert(input_dir: Path, output_dir: Path):
    """将目录下的所有 PDF 转换为 Markdown (增量)"""
    pdf_files = get_files(input_dir, ".pdf")
    if not pdf_files:
        print(f"[Convert] 警告: {input_dir} 下未发现 PDF")
        return

    for pdf in pdf_files:
        expected_md = output_dir / pdf.stem / "hybrid_auto" / f"{pdf.stem}.md"
        if expected_md.exists():
            print(f"  - 跳过解析: {pdf.name} (MD 已存在)")
            continue
        try:
            print(f"  - 正在解析: {pdf.name}")
            convert_pdf_to_markdown(pdf, output_dir)
        except Exception as e:
            print(f"  - 转换 {pdf.name} 失败: {e}")

def run_organize(input_dir: Path, output_dir: Path):
    """整理 Mineru 输出到指定的扁平目录"""
    if output_dir.exists() and any(output_dir.glob("*.md")):
        print(f"[Organize] 跳过: {input_dir.name} (整理后的文件已存在)")
        return
    print(f"正在整理: {input_dir.name} -> {output_dir}")
    collect_markdown_files(input_dir, output_dir)

def run_md2kb(input_dir: Path, output_file: Path):
    """从 Markdown 提取知识库草稿"""
    md_files = get_files(input_dir, ".md")
    if not md_files:
        return

    print(f"正在提取知识: {input_dir.name} -> {output_file.name}")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    for md in md_files:
        if output_file.exists():
            content = output_file.read_text(encoding="utf-8")
            if f"来自文件: {md.name}" in content:
                print(f"  - 跳过: {md.name} (已在草稿中)")
                continue
        try:
            md2kb(md, output_file)
        except Exception as e:
            print(f"  - 提取 {md.name} 失败: {e}")

def run_post_process(input_file: Path, output_file: Path):
    """后期处理精修草稿"""
    if output_file.exists():
        print(f"[Post-Process] 跳过: {output_file.name} (已存在)")
        return
        
    if not input_file.exists():
        print(f"[Post-Process] 警告: 未找到草稿 {input_file}")
        return
        
    post_process_draft(input_file, output_file)

def process_single_pdf(pdf_path: Path):
    """处理单个 PDF 的全生命周期"""
    pdf_stem = pdf_path.stem
    scopes = get_scoped_paths(pdf_stem)
    
    print(f"\n>>>> 开始处理项目: {pdf_stem} <<<<")
    
    # 1. 拆分
    run_split(pdf_path, scopes["split"])
    
    # 2. 转换 (Mineru)
    run_convert(scopes["split"], scopes["mineru_output"])
    
    # 3. 整理 (收集 MD)
    run_organize(scopes["mineru_output"], scopes["markdown"])
    
    # 4. 提取 (LLM)
    run_md2kb(scopes["markdown"], scopes["draft"])
    
    # 5. 精修 (LLM)
    run_post_process(scopes["draft"], scopes["final"])
    
    print(f">>>> 项目 {pdf_stem} 处理完成 <<<<\n")

def run_init_workspace() -> None:
    """初始化工作目录结构"""
    init_workspace()

def run_pipeline(target_pdf: str | None = None):
    """运行完整流水线"""
    print("\n" + "="*20 + " [PIPELINE START] " + "="*20)
    
    raw_dir = PATHS["raw"]
    if target_pdf:
        pdf_path = raw_dir / target_pdf
        if not pdf_path.suffix:
            pdf_path = pdf_path.with_suffix(".pdf")
            
        if not pdf_path.exists():
            print(f"错误: 找不到目标文件 {pdf_path}")
            return
        
        process_single_pdf(pdf_path)
    else:
        pdf_files = get_files(raw_dir, ".pdf")
        if not pdf_files:
            print(f"错误: 在 {raw_dir} 中未发现任何 PDF")
            return
            
        print(f"发现 {len(pdf_files)} 个 PDF 待处理\n")
        for pdf in pdf_files:
            process_single_pdf(pdf)
            
    print("\n" + "="*20 + " [PIPELINE FINISHED] " + "="*20)
