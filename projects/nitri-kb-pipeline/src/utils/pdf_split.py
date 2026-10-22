from __future__ import annotations

import re
from pathlib import Path
from pypdf import PdfReader, PdfWriter

INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1F]+')
WHITESPACE = re.compile(r"\s+")
MAX_FILENAME_LENGTH = 120


def get_top_level_bookmarks(reader: PdfReader) -> list:
    outline = getattr(reader, "outline", None)
    if outline is None:
        outline = getattr(reader, "outlines", [])

    return [item for item in outline if not isinstance(item, list)]


def normalize_filename(title: str, fallback: str) -> str:
    cleaned = INVALID_FILENAME_CHARS.sub(" ", title)
    cleaned = WHITESPACE.sub(" ", cleaned).strip().rstrip(". ")
    if not cleaned:
        cleaned = fallback
    if len(cleaned) > MAX_FILENAME_LENGTH:
        cleaned = cleaned[:MAX_FILENAME_LENGTH].rstrip()
    return cleaned


def build_output_path(output_dir: Path, title: str, fallback: str, used_names: set[str]) -> Path:
    base_name = normalize_filename(title, fallback)
    candidate = base_name
    suffix = 2

    while candidate.lower() in used_names:
        candidate = f"{base_name} ({suffix})"
        suffix += 1

    used_names.add(candidate.lower())
    return output_dir / f"{candidate}.pdf"


def split_pdf_by_top_level_bookmarks(input_pdf: Path, output_dir: Path) -> list[Path]:
    if not input_pdf.exists():
        raise FileNotFoundError(f"找不到输入 PDF: {input_pdf}")

    reader = PdfReader(str(input_pdf))
    if reader.is_encrypted and reader.decrypt("") == 0:
        raise ValueError(f"无法打开加密 PDF: {input_pdf}")

    bookmarks = get_top_level_bookmarks(reader)
    if not bookmarks:
        raise ValueError("PDF 中没有可用于拆分的顶级目录/书签")

    page_ranges: list[tuple[str, int, int]] = []
    for index, bookmark in enumerate(bookmarks):
        title = getattr(bookmark, "title", None) or f"chapter_{index + 1:02d}"
        try:
            start_page = reader.get_destination_page_number(bookmark)
        except Exception as exc:
            raise ValueError(f"无法解析目录项页码: {title}") from exc

        if index + 1 < len(bookmarks):
            next_title = getattr(bookmarks[index + 1], "title", None) or f"chapter_{index + 2:02d}"
            try:
                end_page = reader.get_destination_page_number(bookmarks[index + 1])
            except Exception as exc:
                raise ValueError(f"无法解析目录项页码: {next_title}") from exc
        else:
            end_page = len(reader.pages)

        if end_page <= start_page:
            raise ValueError(f"目录页码顺序异常: {title} 的结束页不大于起始页")

        page_ranges.append((title, start_page, end_page))

    output_dir.mkdir(parents=True, exist_ok=True)

    used_names: set[str] = set()
    written_files: list[Path] = []
    for index, (title, start_page, end_page) in enumerate(page_ranges, start=1):
        writer = PdfWriter()
        for page_number in range(start_page, end_page):
            writer.add_page(reader.pages[page_number])

        output_path = build_output_path(output_dir, title, f"chapter_{index:02d}", used_names)
        with output_path.open("wb") as handle:
            writer.write(handle)
        written_files.append(output_path)

    return written_files
