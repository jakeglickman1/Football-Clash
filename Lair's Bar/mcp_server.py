from mcp import MCPServer


server = MCPServer("local-server")


@server.tool("say_hello")
def say_hello(name: str):
    return {"message": f"Hello, {name}!"}


if __name__ == "__main__":
    server.run()
