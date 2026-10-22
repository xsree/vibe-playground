"""Unit and integration tests for PromptProbe."""

import asyncio
from datetime import datetime
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from capture import (
    extract_content_text,
    extract_system_prompts,
    format_agent_prompt,
    format_markdown,
    save_capture_files,
)
from main import app, state
from openai_response import build_non_stream_response, generate_sse_stream


# ---------------------------------------------------------------------------
# Unit tests for pure functions
# ---------------------------------------------------------------------------


def test_single_system_message():
    """1. Single system message extraction."""
    body = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"},
        ],
    }
    prompts, stats = extract_system_prompts(body)
    assert len(prompts) == 1
    assert prompts[0] == ("SYSTEM", "You are a helpful assistant.")
    assert stats["system"] == 1
    assert stats["developer"] == 0
    assert stats["user"] == 1
    assert stats["total_messages"] == 2

    formatted = format_agent_prompt(prompts)
    assert formatted == "[SYSTEM]\n\nYou are a helpful assistant."


def test_system_and_developer():
    """2. System + developer messages."""
    body = {
        "model": "o1-mini",
        "messages": [
            {"role": "system", "content": "Base instructions."},
            {"role": "developer", "content": "Developer policy."},
            {"role": "user", "content": "Write code."},
        ],
    }
    prompts, stats = extract_system_prompts(body)
    assert len(prompts) == 2
    assert prompts[0] == ("SYSTEM", "Base instructions.")
    assert prompts[1] == ("DEVELOPER", "Developer policy.")
    assert stats["system"] == 1
    assert stats["developer"] == 1

    formatted = format_agent_prompt(prompts)
    assert formatted == "[SYSTEM]\n\nBase instructions.\n\n[DEVELOPER]\n\nDeveloper policy."


def test_multiple_system_and_developer_order_preserved():
    """3. Multiple system and developer messages strictly preserve original order."""
    body = {
        "messages": [
            {"role": "system", "content": "AAA"},
            {"role": "developer", "content": "BBB"},
            {"role": "system", "content": "CCC"},
            {"role": "user", "content": "你好"},
        ]
    }
    prompts, stats = extract_system_prompts(body)
    assert len(prompts) == 3
    assert prompts[0] == ("SYSTEM", "AAA")
    assert prompts[1] == ("DEVELOPER", "BBB")
    assert prompts[2] == ("SYSTEM", "CCC")
    assert stats["system"] == 2
    assert stats["developer"] == 1

    formatted = format_agent_prompt(prompts)
    expected = "[SYSTEM]\n\nAAA\n\n[DEVELOPER]\n\nBBB\n\n[SYSTEM]\n\nCCC"
    assert formatted == expected


def test_string_content():
    """4. Plain string content."""
    content = "Hello, plain text string!"
    extracted = extract_content_text(content)
    assert extracted == "Hello, plain text string!"


def test_content_parts_array():
    """5. Content parts array with type text and fallback structures."""
    content = [
        {"type": "text", "text": "Part one."},
        {"type": "text", "text": "Part two."},
        {"type": "custom", "payload": 123},
    ]
    extracted = extract_content_text(content)
    assert "Part one." in extracted
    assert "Part two." in extracted
    assert '{"type": "custom", "payload": 123}' in extracted


def test_no_system_or_developer():
    """6. Handling requests with no system or developer messages."""
    body = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": "Just a user message"},
            {"role": "assistant", "content": "Hello!"},
        ],
    }
    prompts, stats = extract_system_prompts(body)
    assert prompts == []
    assert stats["system"] == 0
    assert stats["developer"] == 0
    assert stats["user"] == 1
    assert stats["assistant"] == 1

    formatted = format_agent_prompt(prompts)
    assert "no system or developer messages were found" in formatted

    md = format_markdown("2026-09-03 09:32:15", "gpt-3.5-turbo", prompts)
    assert "No system or developer messages were found" in md
    assert "Inspect the raw JSON capture" in md


def test_chinese_prompt():
    """7. Chinese characters preserved intact."""
    chinese_text = "你是一个专业的软件工程助手，严谨、细致。请严格遵守编码规范。"
    body = {
        "messages": [
            {"role": "system", "content": chinese_text},
        ]
    }
    prompts, _ = extract_system_prompts(body)
    assert prompts[0][1] == chinese_text

    formatted = format_agent_prompt(prompts)
    assert chinese_text in formatted


def test_long_prompt(tmp_path: Path):
    """8. Very long prompt handling and file saving."""
    long_text = "Instructions: " + ("abcdefghijklmnopqrstuvwxyz0123456789\n" * 1000)
    body = {
        "model": "claude-3-5-sonnet",
        "messages": [
            {"role": "system", "content": long_text},
        ],
    }
    prompts, stats = extract_system_prompts(body)
    assert len(prompts[0][1]) == len(long_text)

    json_path, md_path, _, _ = save_capture_files(
        body=body,
        prompts=prompts,
        captures_dir=tmp_path,
        now=datetime(2026, 9, 3, 9, 32, 15),
    )

    saved_json = json.loads(json_path.read_text(encoding="utf-8"))
    assert saved_json["messages"][0]["content"] == long_text

    saved_md = md_path.read_text(encoding="utf-8")
    assert "## SYSTEM" in saved_md
    assert long_text in saved_md


def test_extra_fields_and_tools_preserved(tmp_path: Path):
    """9. Raw JSON preserves tools, tool_choice, temperature, custom_unknown_field untouched."""
    body = {
        "model": "deepseek-coder",
        "stream": True,
        "temperature": 0.2,
        "custom_unknown_field": {"some_key": [1, 2, 3]},
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read file contents",
                    "parameters": {"type": "object", "properties": {"path": {"type": "string"}}},
                },
            }
        ],
        "tool_choice": "auto",
        "messages": [
            {"role": "system", "content": "You have file tools."},
            {"role": "user", "content": "Show file."},
        ],
    }

    prompts, stats = extract_system_prompts(body)
    assert stats["tools"] == 1

    json_path, _, _, _ = save_capture_files(
        body=body,
        prompts=prompts,
        captures_dir=tmp_path,
        now=datetime(2026, 9, 3, 10, 0, 0),
    )

    saved_raw = json.loads(json_path.read_text(encoding="utf-8"))
    assert saved_raw["custom_unknown_field"] == {"some_key": [1, 2, 3]}
    assert len(saved_raw["tools"]) == 1
    assert saved_raw["temperature"] == 0.2
    assert saved_raw["tool_choice"] == "auto"


def test_sse_streaming_generator():
    """Verify SSE streaming format: role delta, content chunks, stop chunk, [DONE]."""
    text = "Hello world! This is a test prompt to stream back."
    chunks = []
    completed = False

    def on_done():
        nonlocal completed
        completed = True

    async def _run():
        async for event in generate_sse_stream(
            text, chunk_size=10, delay_seconds=0, on_complete=on_done
        ):
            chunks.append(event)

    asyncio.run(_run())

    assert len(chunks) >= 4
    # First chunk: role
    assert chunks[0].startswith("data: ")
    data_0 = json.loads(chunks[0][6:].strip())
    assert data_0["choices"][0]["delta"]["role"] == "assistant"

    # Middle chunks: content
    content_accumulated = ""
    for c in chunks[1:-2]:
        assert c.startswith("data: ")
        data_c = json.loads(c[6:].strip())
        content_accumulated += data_c["choices"][0]["delta"]["content"]
    assert content_accumulated == text

    # Second to last chunk: finish_reason: stop
    data_penultimate = json.loads(chunks[-2][6:].strip())
    assert data_penultimate["choices"][0]["finish_reason"] == "stop"

    # Last chunk: [DONE]
    assert chunks[-1].strip() == "data: [DONE]"
    assert completed is True


def test_build_non_stream_response():
    """Verify non-stream response format."""
    text = "Assistant system prompt text."
    resp = build_non_stream_response(text, model="test-model")
    assert resp["id"] == "chatcmpl-promptprobe"
    assert resp["object"] == "chat.completion"
    assert resp["model"] == "test-model"
    assert resp["choices"][0]["message"]["role"] == "assistant"
    assert resp["choices"][0]["message"]["content"] == text
    assert resp["choices"][0]["finish_reason"] == "stop"


# ---------------------------------------------------------------------------
# Integration tests using FastAPI TestClient
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def reset_server_state(tmp_path: Path):
    """Reset the capture state and isolate captures directory before each test."""
    import main

    state.reset()
    original_captures_dir = main.CAPTURES_DIR
    main.CAPTURES_DIR = tmp_path
    yield
    main.CAPTURES_DIR = original_captures_dir


def test_endpoint_health_and_root():
    client = TestClient(app)

    # Initial root status: ready
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json() == {
        "name": "PromptProbe",
        "status": "ready",
        "captures_count": 0,
        "probes_count": 0,
    }

    # Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "ok"}


def test_endpoint_models_does_not_trigger_capture():
    client = TestClient(app)

    res_models = client.get("/v1/models")
    assert res_models.status_code == 200
    data = res_models.json()
    assert data["object"] == "list"
    assert data["data"][0]["id"] == "prompt-probe"

    # Capture counts must still be 0
    assert state.captures_count == 0
    res_root = client.get("/")
    assert res_root.json()["status"] == "ready"


def test_agent_probe_connectivity_handling():
    """Agent sends an initial connectivity probe without system prompt.
    
    PromptProbe answers with 200 OK without consuming the capture, then captures
    the subsequent real request containing the system prompt.
    """
    client = TestClient(app)

    # 1. Agent probe test (only user message)
    probe_payload = {
        "model": "gpt-5",
        "stream": True,
        "messages": [
            {"role": "user", "content": "hi"},
        ],
    }
    probe_resp = client.post("/v1/chat/completions", json=probe_payload)
    assert probe_resp.status_code == 200
    assert "text/event-stream" in probe_resp.headers["content-type"]
    assert "API connection verified" in probe_resp.text
    assert state.probes_count == 1
    assert state.captures_count == 0

    # 2. Subsequent real request with system prompt
    real_payload = {
        "model": "gpt-5",
        "stream": True,
        "messages": [
            {"role": "system", "content": "You are a coding assistant."},
            {"role": "user", "content": "Write tests."},
        ],
    }
    real_resp = client.post("/v1/chat/completions", json=real_payload)
    assert real_resp.status_code == 200
    assert "coding assistant" in real_resp.text
    assert state.captures_count == 1


def test_chat_completions_continuous_multi_request():
    """PromptProbe does NOT fail on subsequent calls; captures multiple requests."""
    client = TestClient(app)

    payload_1 = {
        "model": "gpt-5",
        "stream": True,
        "messages": [
            {"role": "system", "content": "System prompt 1"},
            {"role": "user", "content": "Hello 1"},
        ],
    }

    payload_2 = {
        "model": "gpt-5",
        "stream": True,
        "messages": [
            {"role": "system", "content": "System prompt 2"},
            {"role": "user", "content": "Hello 2"},
        ],
    }

    # 1. First request captures successfully
    res1 = client.post("/v1/chat/completions", json=payload_1)
    assert res1.status_code == 200
    assert "System prompt 1" in res1.text
    assert state.captures_count == 1

    # 2. Second request also succeeds and captures prompt 2 (not rejected!)
    res2 = client.post("/v1/chat/completions", json=payload_2)
    assert res2.status_code == 200
    assert "System prompt 2" in res2.text
    assert state.captures_count == 2

    # Root endpoint reports status and count
    res_root = client.get("/")
    assert res_root.json()["status"] == "ready"
    assert res_root.json()["captures_count"] == 2


def test_chat_completions_one_shot_mode():
    """When one_shot is enabled, second request with system prompt is rejected with 409."""
    client = TestClient(app)
    state.one_shot = True

    payload = {
        "model": "gpt-5",
        "stream": False,
        "messages": [
            {"role": "system", "content": "One shot prompt"},
            {"role": "user", "content": "Hello"},
        ],
    }

    res1 = client.post("/v1/chat/completions", json=payload)
    assert res1.status_code == 200
    assert state.captures_count == 1
    assert state.captured is True

    # Second request in one-shot mode returns 409
    res2 = client.post("/v1/chat/completions", json=payload)
    assert res2.status_code == 409
    assert res2.json()["error"]["type"] == "capture_complete"


def test_chat_completions_non_streaming():
    """Test non-streaming completion."""
    client = TestClient(app)

    payload = {
        "model": "test-model",
        "stream": False,
        "messages": [
            {"role": "system", "content": "Direct assistant instruction."},
            {"role": "user", "content": "ping"},
        ],
    }

    response = client.post("/v1/chat/completions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["object"] == "chat.completion"
    assert data["choices"][0]["message"]["content"] == "[SYSTEM]\n\nDirect assistant instruction."
    assert state.captures_count == 1


def test_chat_completions_invalid_json():
    """Invalid JSON body returns 400 Bad Request and does not trigger capture."""
    client = TestClient(app)

    response = client.post(
        "/v1/chat/completions",
        content="invalid-json-string{{{",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    assert state.captures_count == 0


def test_concurrent_chat_completions():
    """Ensure that concurrent requests are safely handled without data race."""
    import httpx

    payload = {
        "model": "concurrency-test",
        "stream": False,
        "messages": [
            {"role": "system", "content": "Concurrent test system prompt"},
            {"role": "user", "content": "Hi"},
        ],
    }

    async def _run_concurrent():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            tasks = [ac.post("/v1/chat/completions", json=payload) for _ in range(5)]
            return await asyncio.gather(*tasks)

    responses = asyncio.run(_run_concurrent())
    status_codes = [r.status_code for r in responses]
    assert all(code == 200 for code in status_codes)
    assert state.captures_count == 5

