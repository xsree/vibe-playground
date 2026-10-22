"""OpenAI-compatible SSE streaming and non-streaming response generators."""

import asyncio
import json
from typing import AsyncGenerator, Callable, Optional


async def generate_sse_stream(
    prompt_text: str,
    model: str = "prompt-probe",
    chunk_size: int = 500,
    delay_seconds: float = 0.01,
    on_complete: Optional[Callable[[], None]] = None,
) -> AsyncGenerator[str, None]:
    """Generate OpenAI Chat Completion SSE formatted events.
    
    1. Role delta event
    2. Content delta events in chunks of ~300-800 characters
    3. Final finish_reason: stop event
    4. data: [DONE]
    """
    # 1. First event: role delta
    first_chunk = {
        "id": "chatcmpl-promptprobe",
        "object": "chat.completion.chunk",
        "created": 0,
        "model": model,
        "choices": [
            {
                "index": 0,
                "delta": {
                    "role": "assistant"
                },
                "finish_reason": None,
            }
        ],
    }
    yield f"data: {json.dumps(first_chunk, ensure_ascii=False)}\n\n"
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    # 2. Content chunks
    # Ensure at least one chunk is yielded even if prompt_text is empty
    if not prompt_text:
        text_chunks = [""]
    else:
        text_chunks = [
            prompt_text[i : i + chunk_size]
            for i in range(0, len(prompt_text), chunk_size)
        ]

    for chunk in text_chunks:
        content_chunk = {
            "id": "chatcmpl-promptprobe",
            "object": "chat.completion.chunk",
            "created": 0,
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "delta": {
                        "content": chunk
                    },
                    "finish_reason": None,
                }
            ],
        }
        yield f"data: {json.dumps(content_chunk, ensure_ascii=False)}\n\n"
        if delay_seconds > 0:
            await asyncio.sleep(delay_seconds)

    # 3. Final event: finish_reason: "stop"
    final_chunk = {
        "id": "chatcmpl-promptprobe",
        "object": "chat.completion.chunk",
        "created": 0,
        "model": model,
        "choices": [
            {
                "index": 0,
                "delta": {},
                "finish_reason": "stop",
            }
        ],
    }
    yield f"data: {json.dumps(final_chunk, ensure_ascii=False)}\n\n"
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    # 4. Stream completion marker
    yield "data: [DONE]\n\n"

    # Callback when streaming finishes
    if on_complete:
        try:
            on_complete()
        except Exception:
            pass


def build_non_stream_response(
    prompt_text: str,
    model: str = "prompt-probe"
) -> dict:
    """Build standard OpenAI Chat Completion JSON response."""
    return {
        "id": "chatcmpl-promptprobe",
        "object": "chat.completion",
        "created": 0,
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": prompt_text,
                },
                "finish_reason": "stop",
            }
        ],
    }
