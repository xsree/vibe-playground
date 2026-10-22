import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from src.config import LLM_CONFIG
from src.utils.prompts import PROCESSDRAFT_PROMPT
# 加载 .env 环境变量
load_dotenv()

def post_process_draft(draft_path: Path, output_file: Path) -> Path:
    """
    读取草稿 Markdown 文件，调用 AI 模型进行精修和去重，并流式输出。
    """
    api_key = os.getenv("SILICONFLOW_API_KEY")
    base_url = os.getenv("SILICONFLOW_API_URL")
    model = LLM_CONFIG["default_model"]

    if not api_key:
        raise ValueError("未找到 SILICONFLOW_API_KEY，请在 .env 文件中配置。")

    client = OpenAI(api_key=api_key, base_url=base_url)

    # 读取文件内容
    content = draft_path.read_text(encoding="utf-8")
    
    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": PROCESSDRAFT_PROMPT},
        {"role": "user", "content": f"请对以下草稿内容进行精修、去重和整合：\n\n{content}"}
    ]

    print(f"\n--- [开始后期处理]: {draft_path.name} -> {output_file.name} ---")
    
    try:
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            stream_options={"include_usage": True},
            extra_body={
                "enable_thinking": True,
                "thinking_budget": LLM_CONFIG["thinking_budget"]
            }
        )

        full_content = ""
        has_printed_thinking_header = False
        has_printed_content_header = False
        is_thinking = False
        usage_data = None
        first_content_time = None
        
        for chunk in response:
            if hasattr(chunk, 'usage') and chunk.usage:
                usage_data = chunk.usage

            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta
            
            # 处理思考内容
            reasoning_text = getattr(delta, 'reasoning_content', '') or ''
            if reasoning_text:
                if not has_printed_thinking_header:
                    sys.stdout.write("\033[36m思考内容:\033[0m\n")
                    has_printed_thinking_header = True
                    is_thinking = True
                sys.stdout.write(f"\033[90m{reasoning_text}\033[0m")
                sys.stdout.flush()
            
            # 处理正式内容
            if delta.content:
                if is_thinking:
                    sys.stdout.write("\n" + "-"*40 + "\n")
                    is_thinking = False
                
                if not has_printed_content_header:
                    if not has_printed_thinking_header:
                        sys.stdout.write("\033[32m[直接输出内容]\033[0m\n")
                    has_printed_content_header = True
                    first_content_time = time.time()

                full_content += delta.content
                sys.stdout.write(delta.content)
                sys.stdout.flush()

        end_time = time.time()
        print("\n" + "="*40)
        
        if usage_data:
            total_duration = end_time - start_time
            content_duration = end_time - (first_content_time or start_time)
            speed = usage_data.completion_tokens / content_duration if content_duration > 0 else 0
            
            print(f"输入 Token: \033[1m{usage_data.prompt_tokens}\033[0m")
            print(f"输出 Token: \033[1m{usage_data.completion_tokens}\033[0m")
            print(f"总计耗时:   {total_duration:.2f} s")
            print(f"输出速度:   \033[32m{speed:.2f} tokens/s\033[0m")

        # 保存结果
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(full_content, encoding="utf-8")
        
        return output_file
        
    except Exception as e:
        print(f"\n\033[31m后期处理失败: {e}\033[0m")
        raise e
