
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Item } from "jstodotxt";

export function registerResources(server: McpServer, loadTasks: () => Promise<Item[]>) {
    server.resource(
        "tasks",
        "tasks://list",
        async () => {
          const tasks = await loadTasks();
          return {
            contents: [
              {
                uri: "tasks://list",
                text: tasks.map((task, index) => `${index}: ${task.toString()}`).join("\n"),
              },
            ],
          };
        }
    );
}