"""Capture logic for PromptProbe: message extraction, prompt formatting, and file persistence."""

import json
from datetime import datetime
from pathlib import Path
from typing import Any


def extract_content_text(content: Any) -> str:
    """Extract plain text from message content.
    
    Handles:
    - String content: returns as-is.
    - Content parts list: extracts all `type == 'text'` text fields.
    - Unrecognized structures: safely serializes to JSON so data is never lost.
    """
    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict):
                part_type = part.get("type")
                if part_type == "text" and "text" in part:
                    text_parts.append(str(part["text"]))
                else:
                    # Non-text part in list (e.g. image_url or custom part)
                    text_parts.append(json.dumps(part, ensure_ascii=False))
            elif isinstance(part, str):
                text_parts.append(part)
            else:
                text_parts.append(json.dumps(part, ensure_ascii=False))
        return "\n".join(text_parts)

    # If content is a dict or other unexpected type
    try:
        return json.dumps(content, ensure_ascii=False)
    except Exception:
        return str(content)


def extract_system_prompts(
    body: dict[str, Any]
) -> tuple[list[tuple[str, str]], dict[str, int]]:
    """Extract all system and developer messages in original order and calculate role stats.
    
    Returns:
    - prompts: list of (role, text) tuples where role is 'SYSTEM' or 'DEVELOPER'
    - stats: dictionary of message counts by role, total messages, and tools count
    """
    messages = body.get("messages")
    tools = body.get("tools")
    
    stats: dict[str, int] = {
        "total_messages": 0,
        "system": 0,
        "developer": 0,
        "user": 0,
        "assistant": 0,
        "tools": len(tools) if isinstance(tools, list) else 0,
    }

    if not isinstance(messages, list):
        return [], stats

    prompts: list[tuple[str, str]] = []

    for msg in messages:
        if not isinstance(msg, dict):
            continue

        stats["total_messages"] += 1
        role = str(msg.get("role", "")).lower()

        if role == "system":
            stats["system"] += 1
            text = extract_content_text(msg.get("content"))
            prompts.append(("SYSTEM", text))
        elif role == "developer":
            stats["developer"] += 1
            text = extract_content_text(msg.get("content"))
            prompts.append(("DEVELOPER", text))
        elif role == "user":
            stats["user"] += 1
        elif role == "assistant":
            stats["assistant"] += 1
        else:
            # Other roles (e.g. tool, function)
            stats[role] = stats.get(role, 0) + 1

    return prompts, stats


def format_agent_prompt(prompts: list[tuple[str, str]]) -> str:
    """Format extracted prompts for streaming/returning back to the agent.
    
    If no prompts were found, returns the standard warning message.
    """
    if not prompts:
        return (
            "PromptProbe captured the request, but no system or developer messages were found.\n\n"
            "Inspect the saved raw JSON file."
        )

    sections = []
    for role, text in prompts:
        sections.append(f"[{role}]\n\n{text}")

    return "\n\n".join(sections)


def format_markdown(
    captured_at: str,
    model: str,
    prompts: list[tuple[str, str]]
) -> str:
    """Format capture content as human-readable Markdown."""
    if not prompts:
        return (
            "# PromptProbe Capture\n\n"
            f"Captured: {captured_at}\n"
            f"Model: {model}\n\n"
            "No system or developer messages were found.\n\n"
            "Inspect the raw JSON capture for additional request fields.\n"
        )

    lines = [
        "# PromptProbe Capture",
        "",
        f"Captured: {captured_at}",
        f"Model: {model}",
        "",
    ]

    for role, text in prompts:
        lines.append(f"## {role}")
        lines.append("")
        lines.append(text)
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def save_capture_files(
    body: dict[str, Any],
    prompts: list[tuple[str, str]],
    captures_dir: Path | None = None,
    now: datetime | None = None,
    is_probe: bool = False,
) -> tuple[Path, Path, str, str]:
    """Save raw JSON and reader-friendly Markdown captures.
    
    Avoids file overwrite collisions by appending a counter if files exist.
    Returns:
    - (json_path, md_path, file_identifier, display_ts)
    """
    if captures_dir is None:
        captures_dir = Path("captures")
    if now is None:
        now = datetime.now()

    captures_dir.mkdir(parents=True, exist_ok=True)

    filename_ts = now.strftime("%Y%m%d-%H%M%S")
    display_ts = now.strftime("%Y-%m-%d %H:%M:%S")

    suffix = "_probe" if is_probe else ""
    candidate_name = f"{filename_ts}{suffix}"

    json_path = captures_dir / f"{candidate_name}.json"
    md_path = captures_dir / f"{candidate_name}.md"

    counter = 1
    while json_path.exists():
        candidate_name = f"{filename_ts}{suffix}_{counter}"
        json_path = captures_dir / f"{candidate_name}.json"
        md_path = captures_dir / f"{candidate_name}.md"
        counter += 1

    # Save raw JSON with indent=2 and ensure_ascii=False
    raw_json_str = json.dumps(body, ensure_ascii=False, indent=2)
    json_path.write_text(raw_json_str, encoding="utf-8")

    # Save Markdown
    model = str(body.get("model", "unknown"))
    md_content = format_markdown(display_ts, model, prompts)
    md_path.write_text(md_content, encoding="utf-8")

    return json_path, md_path, candidate_name, display_ts
