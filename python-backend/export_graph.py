from agent.graph import graph
try:
    with open("langgraph_diagram.png", "wb") as f:
        f.write(graph.get_graph().draw_mermaid_png())
    print("Graph diagram saved successfully.")
except Exception as e:
    print(f"Failed to generate png: {e}")
    print("Generating ASCII instead:")
    print(graph.get_graph().draw_ascii())
