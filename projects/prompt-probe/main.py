"""PromptProbe: OpenAI-compatible system prompt capture server."""

import argparse
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import json
from pathlib import Path
import sys
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

from capture import (
    extract_system_prompts,
    format_agent_prompt,
    save_capture_files,
)
from openai_response import build_non_stream_response, generate_sse_stream


class CaptureState:
    """Maintains capture and probe state with concurrency protection."""

    def __init__(self) -> None:
        self.captures_count = 0
        self.probes_count = 0
        self.one_shot = False
        self.captured = False
        self._lock: asyncio.Lock | None = None

    @property
    def lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    def reset(self) -> None:
        """Reset state (useful for test isolation)."""
        self.captures_count = 0
        self.probes_count = 0
        self.one_shot = False
        self.captured = False
        self._lock = None


state = CaptureState()
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
SERVER_CONFIG = {"host": DEFAULT_HOST, "port": DEFAULT_PORT, "one_shot": False}
CAPTURES_DIR = Path("captures")


def print_banner(host: str, port: str | int, one_shot: bool = False) -> None:
    """Print the startup banner."""
    mode_info = " (One-shot mode)" if one_shot else ""
    print(f"PromptProbe{mode_info}")
    print("────────────────────────────────────────")
    print()
    print(f"Listening on http://{host}:{port}")
    print(f"OpenAI Base URL: http://{host}:{port}/v1")
    print()
    print("Waiting for Chat Completions request...")
    print(flush=True)


def print_probe_received(
    now: datetime,
    endpoint: str,
    model: str,
    is_stream: bool,
    stats: dict[str, int],
    json_path: Path,
) -> None:
    """Print details when an agent connectivity probe is received."""
    ts = now.strftime("%H:%M:%S")
    print()
    print(f"[{ts}] Agent probe / connectivity check received (no system prompt)")
    print()
    print(f"Endpoint        {endpoint}")
    print(f"Model           {model}")
    print(f"Stream          {str(is_stream).lower()}")
    print(f"Messages        {stats['total_messages']} (User: {stats['user']})")
    print()
    print("Saved:")
    print(f"  JSON  {json_path.as_posix()}")
    print()
    action = "Streaming" if is_stream else "Returning"
    print(f"{action} OK response to pass agent connectivity test...", flush=True)


def print_probe_complete() -> None:
    """Print status after responding to a connectivity probe."""
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Probe test passed. Ready for system prompt request.", flush=True)


def print_capture_received(
    capture_index: int,
    now: datetime,
    endpoint: str,
    model: str,
    is_stream: bool,
    stats: dict[str, int],
    prompt_len: int,
    json_path: Path,
    md_path: Path,
) -> None:
    """Print details of a captured request containing system prompt."""
    ts = now.strftime("%H:%M:%S")
    print()
    print(f"[{ts}] Capture #{capture_index} received")
    print()
    print(f"Endpoint        {endpoint}")
    print(f"Model           {model}")
    print(f"Stream          {str(is_stream).lower()}")
    print(f"Messages        {stats['total_messages']}")
    print(f"System          {stats['system']}")
    print(f"Developer       {stats['developer']}")
    print(f"User            {stats['user']}")
    print(f"Assistant       {stats['assistant']}")
    print(f"Tools           {stats['tools']}")
    print()
    print(f"System prompt   {prompt_len:,} chars")
    print()
    print("Saved:")
    print(f"  JSON  {json_path.as_posix()}")
    print(f"  MD    {md_path.as_posix()}")
    print()
    action = "Streaming" if is_stream else "Returning"
    print(f"{action} captured prompt back to client...", flush=True)


def print_capture_complete(capture_index: int, one_shot: bool) -> None:
    """Print completion status after streaming or sending response."""
    ts = datetime.now().strftime("%H:%M:%S")
    print()
    print(f"[{ts}] Capture #{capture_index} complete")
    print()
    if one_shot:
        print("This PromptProbe instance has completed its one-shot capture.")
        print("Restart the server to capture another request.")
    else:
        print("Ready to capture subsequent requests.")
    print()
    print("Press Ctrl+C to exit.", flush=True)


def print_rejected_request() -> None:
    """Print rejection notice when in one-shot mode and already captured."""
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Rejected request: one-shot capture already complete", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print_banner(SERVER_CONFIG["host"], SERVER_CONFIG["port"], SERVER_CONFIG["one_shot"])
    yield


app = FastAPI(title="PromptProbe", lifespan=lifespan)


@app.get("/")
async def root() -> dict[str, Any]:
    """Root endpoint showing current service status."""
    is_complete = state.one_shot and state.captured
    return {
        "name": "PromptProbe",
        "status": "capture_complete" if is_complete else "ready",
        "captures_count": state.captures_count,
        "probes_count": state.probes_count,
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/v1/models")
async def list_models() -> dict[str, Any]:
    """OpenAI-compatible models endpoint. Does not trigger capture."""
    return {
        "object": "list",
        "data": [
            {
                "id": "prompt-probe",
                "object": "model",
                "owned_by": "local",
            }
        ],
    }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Core endpoint: captures chat completions and responds to agent probes."""
    # Fast check for one-shot mode before acquiring lock
    if state.one_shot and state.captured:
        print_rejected_request()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": {
                    "message": "PromptProbe has already captured one request in one-shot mode. Restart the server to capture again.",
                    "type": "capture_complete",
                }
            },
        )

    # Concurrency protection
    async with state.lock:
        if state.one_shot and state.captured:
            print_rejected_request()
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "error": {
                        "message": "PromptProbe has already captured one request in one-shot mode. Restart the server to capture again.",
                        "type": "capture_complete",
                    }
                },
            )

        # Parse request body directly to preserve unknown fields
        try:
            body = await request.json()
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": {
                        "message": "Invalid JSON body",
                        "type": "invalid_request_error",
                    }
                },
            )

        if not isinstance(body, dict):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": {
                        "message": "Request body must be a JSON object",
                        "type": "invalid_request_error",
                    }
                },
            )

        now = datetime.now()
        prompts, stats = extract_system_prompts(body)
        is_probe = len(prompts) == 0
        model = str(body.get("model", "prompt-probe"))
        is_stream = bool(body.get("stream", False))

        # -------------------------------------------------------------------
        # Case 1: Connectivity Probe (No system or developer message)
        # -------------------------------------------------------------------
        if is_probe:
            state.probes_count += 1
            try:
                json_path, _, _, _ = save_capture_files(
                    body=body,
                    prompts=prompts,
                    captures_dir=CAPTURES_DIR,
                    now=now,
                    is_probe=True,
                )
            except Exception as e:
                print(f"Error saving probe file: {e}", file=sys.stderr, flush=True)
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": {
                            "message": f"Failed to save probe file: {e}",
                            "type": "internal_error",
                        }
                    },
                )

            print_probe_received(
                now=now,
                endpoint="POST /v1/chat/completions",
                model=model,
                is_stream=is_stream,
                stats=stats,
                json_path=json_path,
            )

            probe_response_text = "PromptProbe: API connection verified. Ready to capture system prompt."

            if is_stream:
                return StreamingResponse(
                    generate_sse_stream(
                        prompt_text=probe_response_text,
                        model=model,
                        on_complete=print_probe_complete,
                    ),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                )
            else:
                print_probe_complete()
                return JSONResponse(
                    content=build_non_stream_response(prompt_text=probe_response_text, model=model)
                )

        # -------------------------------------------------------------------
        # Case 2: System Prompt Capture
        # -------------------------------------------------------------------
        state.captures_count += 1
        if state.one_shot:
            state.captured = True

        try:
            json_path, md_path, _, _ = save_capture_files(
                body=body,
                prompts=prompts,
                captures_dir=CAPTURES_DIR,
                now=now,
                is_probe=False,
            )
        except Exception as e:
            print(f"Error saving capture files: {e}", file=sys.stderr, flush=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "message": f"Failed to save capture files: {e}",
                        "type": "internal_error",
                    }
                },
            )

        total_prompt_chars = sum(len(text) for _, text in prompts)

        print_capture_received(
            capture_index=state.captures_count,
            now=now,
            endpoint="POST /v1/chat/completions",
            model=model,
            is_stream=is_stream,
            stats=stats,
            prompt_len=total_prompt_chars,
            json_path=json_path,
            md_path=md_path,
        )

        prompt_text = format_agent_prompt(prompts)
        capture_idx = state.captures_count
        one_shot_flag = state.one_shot

        def on_done():
            print_capture_complete(capture_idx, one_shot_flag)

        if is_stream:
            return StreamingResponse(
                generate_sse_stream(
                    prompt_text=prompt_text,
                    model=model,
                    on_complete=on_done,
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )
        else:
            on_done()
            return JSONResponse(
                content=build_non_stream_response(prompt_text=prompt_text, model=model)
            )


def main() -> None:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="PromptProbe: LLM system prompt capture server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Host to listen on (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to listen on (default: {DEFAULT_PORT})")
    parser.add_argument(
        "--one-shot",
        action="store_true",
        help="One-shot mode: reject subsequent requests after capturing first system prompt",
    )
    args = parser.parse_args()

    SERVER_CONFIG["host"] = args.host
    SERVER_CONFIG["port"] = args.port
    SERVER_CONFIG["one_shot"] = args.one_shot
    state.one_shot = args.one_shot

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="warning",
        access_log=False,
    )


if __name__ == "__main__":
    main()
