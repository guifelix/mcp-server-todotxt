#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Item } from "jstodotxt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { registerTools } from "./src/tools.js";
import { registerPrompts } from "./src/prompts.js";
import { registerResources } from "./src/resources.js";


// Define Todo.txt file path using environment variable with fallback
const defaultTodoFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "todo.txt");
const TODO_FILE_PATH = process.env.TODO_FILE_PATH
  ? path.isAbsolute(process.env.TODO_FILE_PATH)
    ? process.env.TODO_FILE_PATH
    : path.join(path.dirname(fileURLToPath(import.meta.url)), process.env.TODO_FILE_PATH)
  : defaultTodoFilePath;

// Ensure the Todo.txt file exists, creating it if necessary
async function ensureTodoFileExists() {
  try {
    await fs.access(TODO_FILE_PATH);
  } catch {
    await fs.writeFile(TODO_FILE_PATH, "", "utf-8");
  }
}

// Helper function to load tasks
async function loadTasks() {
  const content = await fs.readFile(TODO_FILE_PATH, "utf-8");
  return content.split("\n").filter(Boolean).map((line) => new Item(line));
}

// Get the project root directory (one level up from dist or src)
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

const server = new McpServer({
  name: packageJson.description,
  version: packageJson.version,
});

registerResources(server, loadTasks);
registerTools(server, loadTasks, TODO_FILE_PATH);
registerPrompts(server);

// Call the function to ensure the file exists before starting the server
await ensureTodoFileExists();

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);