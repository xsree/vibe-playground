from pathlib import Path

# 基础路径配置
CWD = Path.cwd()
WORK_DIR = CWD / "workspace"

PATHS = {
    "raw": WORK_DIR / "01_raw",
    "split": WORK_DIR / "02_split",
    "mineru_output": WORK_DIR / "03_mineru_output",
    "markdown": WORK_DIR / "04_markdown",
    "kb": WORK_DIR / "05_kb",
}

def get_scoped_paths(pdf_stem: str) -> dict[str, Path]:
    """获取特定 PDF 在各个阶段的路径"""
    return {
        "split": PATHS["split"] / pdf_stem,
        "mineru_output": PATHS["mineru_output"] / pdf_stem,
        "markdown": PATHS["markdown"] / pdf_stem,
        "draft": PATHS["kb"] / f"{pdf_stem}知识库草稿.md",
        "final": PATHS["kb"] / f"{pdf_stem}知识库送审.md",
    }

# 默认文件名
FILENAMES = {
    "draft": "企业知识库草稿.md",
    "final": "企业知识库送审.md",
}

# 模型配置
LLM_CONFIG = {
    "default_model": "Pro/deepseek-ai/DeepSeek-V3",
    "thinking_budget": 32768,
}
