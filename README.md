[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/guifelix-mcp-server-todotxt-badge.png)](https://mseep.ai/app/guifelix-mcp-server-todotxt)

[
  ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/guifelix/mcp-server-todotxt/release-please.yml)
  ![NPM Downloads](https://img.shields.io/npm/dy/mcp-server-todotxt?label=NPM%20downloads)
  ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/guifelix/mcp-server-todotxt/total?label=GitHub%20downloads)
  ![NPM Version](https://img.shields.io/npm/v/mcp-server-todotxt)
  ![License](https://img.shields.io/npm/l/mcp-server-todotxt)
  ![Types](https://img.shields.io/npm/types/mcp-server-todotxt)
  ![Last Commit](https://img.shields.io/github/last-commit/guifelix/mcp-server-todotxt)
  ![GitHub issues](https://img.shields.io/github/issues/guifelix/mcp-server-todotxt)
  ![GitHub starts](https://img.shields.io/github/stars/guifelix/mcp-server-todotxt?style=flat)
](https://www.npmjs.com/package/mcp-server-todotxt)

---

# MCP Todo.txt Integration

## Overview

The MCP Todo.txt Integration is a server implementation of the Model Context Protocol (MCP) that enables interaction with Todo.txt files. This project allows LLMs to manage tasks in a Todo.txt file programmatically using the MCP protocol.

## Features

### Core Features
- **Resources**
  - Expose the list of tasks as a resource.
  - Filter tasks by context, project, or priority.

- **Tools**
  1. Add Task: Add a new task with optional metadata.
  2. Mark Task as Completed: Mark a task as completed.
  3. Delete Task: Remove a task.
  4. List Tasks: Retrieve all tasks with filtering options.
  5. Search Tasks: Search for tasks based on keywords or metadata.
  6. Sort Tasks: Sort tasks by priority, creation date, or completion date.
  7. Filter Tasks: Filter tasks by specific criteria.
  8. Add Metadata: Add custom metadata to tasks.
  9. Remove Metadata: Remove specific metadata from tasks.
  10. Batch Operations: Perform batch updates or deletions.

- **Prompts**
  - Summarize tasks.
  - Generate a new task description.

### Advanced Features
- Dynamic Task Management: Update tasks dynamically based on input or triggers.
- Session Management: Manage tasks across multiple requests.

## Installation

For quick installation, use the one-click installation button below

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)
](https://insiders.vscode.dev/redirect/mcp/install?name=todotxt&config=%7B%22type%22%3A%20%22stdio%22%2C%22command%22%3A%20%22npx%22%2C%22args%22%3A%20%5B%22-y%22%2C%22guifelix%2Fmcp-server-todotxt%40latest%22%5D%2C%22gallery%22%3A%20true%2C%22env%22%3A%20%7B%22TODO_FILE_PATH%22%3A%20%22full_path%2Ftodo.txt%22%7D%7D)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd todomcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

1. Start the MCP server:
   ```bash
   npm start
   ```

2. Interact with the server using MCP-compliant clients or tools.

## Configuration

- The path to the Todo.txt file can be configured using the `TODO_FILE_PATH` environment variable. If not set, the default path is `todo.txt` in the project root.

## Development

- To run the project in development mode:
  ```bash
  npm run dev
  ```

- To run tests:
  ```bash
  npm test
  ```

## Dependencies

- `@modelcontextprotocol/sdk`
- `jsTodoTxt`
- `zod`

## Documentation

- [Todo.txt Format](https://github.com/todotxt/todo.txt)
- [jsTodoTxt Documentation](https://jstodotxt.velvetcache.org/)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
