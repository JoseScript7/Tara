import os
from langchain_mistralai import ChatMistralAI
from tools.mcp_server import TOOLS

os.environ["MISTRAL_API_KEY"] = os.getenv("MISTRAL_API_KEY", "")

for model in ["mistral-small-latest", "open-mixtral-8x7b", "open-mistral-nemo"]:
    try:
        print(f"Testing {model}...")
        llm = ChatMistralAI(model=model, temperature=0)
        llm_with_tools = llm.bind_tools(TOOLS)
        res = llm_with_tools.invoke("test")
        print("SUCCESS")
        break
    except Exception as e:
        print("ERROR:", e)
