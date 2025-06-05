import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";


export function registerPrompts(server: McpServer) {
    
    server.prompt(
        "suggest-context-tasks",
        { context: z.string() },
        ({ context }) => ({
            messages: [
            {
                role: "user",
                content: {
                type: "text",
                text: `Based on the context provided, suggest new tasks:\n\nContext: ${context}`,
                },
            },
            ],
        })
    );

    server.prompt(
        "suggest-project-tasks",
        { project: z.string() },
        ({ project }) => ({
            messages: [
            {
                role: "user",
                content: {
                type: "text",
                text: `Based on the project provided, suggest new tasks:\n\nProject: ${project}`,
                },
            },
            ],
        })
    );
}