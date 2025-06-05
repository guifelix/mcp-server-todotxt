[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/guifelix/mcp-server-todotxt/release-please.yml)
![NPM Downloads](https://img.shields.io/npm/dy/mcp-server-todotxt)
![NPM Version](https://img.shields.io/npm/v/mcp-server-todotxt)
![License](https://img.shields.io/npm/l/mcp-server-todotxt)
![Types](https://img.shields.io/npm/types/mcp-server-todotxt)
![Last Commit](https://img.shields.io/github/last-commit/guifelix/mcp-server-todotxt)
![GitHub issues](https://img.shields.io/github/issues/guifelix/mcp-server-todotxt)](https://www.npmjs.com/package/mcp-server-todotxt)

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