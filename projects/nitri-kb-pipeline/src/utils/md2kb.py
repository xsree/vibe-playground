import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from src.utils.prompts import SYSTEM_PROMPT
from src.config import LLM_CONFIG

# 加载 .env 环境变量
load_dotenv()

def md2kb(md_path: Path, output_file: Path) -> Path:
    """
    读取 Markdown 文件，调用 AI 模型进行结构化提取，并流式输出思考和内容。
    提取完成后将内容追加到目标文件，并在终端显示 Token 统计和速度。
    """
    api_key = os.getenv("SILICONFLOW_API_KEY")
    base_url = os.getenv("SILICONFLOW_API_URL")
    model = LLM_CONFIG["default_model"]

    if not api_key:
        raise ValueError("未找到 SILICONFLOW_API_KEY，请在 .env 文件中配置。")

    client = OpenAI(api_key=api_key, base_url=base_url)

    # 读取文件内容
    content = md_path.read_text(encoding="utf-8")
    
    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"请对以下文档进行结构化提取：\n\n{content}"}
    ]

    print(f"\n--- [开始提取]: {md_path.name} ---")
    
    # 启用流式输出
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
        
        # 流式处理
        for chunk in response:
            # 1. 记录 Usage
            if hasattr(chunk, 'usage') and chunk.usage:
                usage_data = chunk.usage

            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta
            
            # 2. 处理思考内容 (reasoning_content)
            reasoning_text = getattr(delta, 'reasoning_content', '') or ''
            if reasoning_text:
                if not has_printed_thinking_header:
                    sys.stdout.write("\033[36m思考内容:\033[0m\n")
                    has_printed_thinking_header = True
                    is_thinking = True
                # 灰色显示思考过程
                sys.stdout.write(f"\033[90m{reasoning_text}\033[0m")
                sys.stdout.flush()
            
            # 3. 处理正式内容 (content)
            if delta.content:
                # 如果刚从思考模式切换过来，打印分割线
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
        print("--- 提取完成 ---")

        # 4. 显示统计信息
        if usage_data:
            total_duration = end_time - start_time
            content_duration = end_time - (first_content_time or start_time)
            speed = usage_data.completion_tokens / content_duration if content_duration > 0 else 0
            
            print(f"输入 Token: \033[1m{usage_data.prompt_tokens}\033[0m")
            print(f"输出 Token: \033[1m{usage_data.completion_tokens}\033[0m")
            print(f"总 Token:   \033[1m{usage_data.total_tokens}\033[0m")
            print(f"输出速度:   \033[32m{speed:.2f} tokens/s\033[0m")
            print(f"总计耗时:   {total_duration:.2f} s")

        # 追加结果到同一个文件
        output_file.parent.mkdir(parents=True, exist_ok=True)
        # 添加来源标记
        header = f"\n\n# 来自文件: {md_path.name}\n"
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(header)
            f.write(full_content)
        
        return output_file
        
    except Exception as e:
        print(f"\n\033[31mAI 提取知识失败: {e}\033[0m")
        raise e
