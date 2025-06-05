import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Item } from 'jstodotxt';
import fs from 'fs/promises';
import path from 'path';
import { registerTools } from '../src/tools.js';

const TODO_FILE_PATH = path.join(__dirname, '../todo.txt');

function createTestServer() {
  const server = new McpServer({ name: 'Test', version: '1.0.0' });
  // Patch: collect tools in a local array for test access
  const tools: { name: string; schema: any; handler: Function }[] = [];
  // Patch registerTools to use our local tools array
  const patchedRegisterTools = (srv: any, loadTasks: any, todoPath: string) => {
    const origTool = srv.tool.bind(srv);
    srv.tool = (name: string, schema: any, handler: Function) => {
      tools.push({ name, schema, handler });
      return origTool(name, schema, handler);
    };
    registerTools(srv, loadTasks, todoPath);
    srv.tool = origTool; // restore
  };
  patchedRegisterTools(server, async () => {
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    return content.split('\n').filter(Boolean).map((line) => new Item(line));
  }, TODO_FILE_PATH);
  // Expose tools for test helper
  (server as any)._testTools = tools;
  return server;
}

// Patch: getTaskIndex returns null, not 0 for first task, so check for null not falsy
// Helper to call a tool handler directly
async function invokeTool(server: any, name: string, params: any) {
  const tool = server._testTools.find((t: any) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return await tool.handler(params);
}

describe('MCP server.tools', () => {
  beforeEach(async () => {
    await fs.writeFile(TODO_FILE_PATH, '', 'utf-8');
  });

  afterAll(async () => {
    // Remove the todo.txt file after all tests
    try {
      await fs.unlink(TODO_FILE_PATH);
    } catch (e) {
      // ignore if file does not exist
    }
  });

  it('add-task', async () => {
    const server = createTestServer();
    const result = await invokeTool(server, 'add-task', { description: 'Test task' });
    expect(result.content[0].text).toContain('Task added successfully');
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('Test task');
  });

  it('complete-task', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Task to complete' });
    // Now taskId=1 should mark the first task as completed
    const result = await invokeTool(server, 'complete-task', { taskId: 1 });
    expect(result.content[0].text).toContain('Task marked as completed');
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toMatch(/x ?\d{4}-\d{2}-\d{2} Task to complete/);
  });

  it('complete-task with invalid id', async () => {
    const server = createTestServer();
    const result = await invokeTool(server, 'complete-task', { taskId: 99 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Task not found');
  });

  it('delete-task', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Task to delete' });
    const result = await invokeTool(server, 'delete-task', { taskId: 1 });
    expect(result.content[0].text).toContain('Task deleted successfully');
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).not.toContain('Task to delete');
  });

  it('delete-task with invalid id', async () => {
    const server = createTestServer();
    const result = await invokeTool(server, 'delete-task', { taskId: 99 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid task ID');
  });

  it('list-tasks', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Task 1' });
    await invokeTool(server, 'add-task', { description: 'Task 2' });
    const result = await invokeTool(server, 'list-tasks', {});
    expect(result.content[0].text).toContain('Task 1');
    expect(result.content[0].text).toContain('Task 2');
  });

  it('search-tasks', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Alpha' });
    await invokeTool(server, 'add-task', { description: 'Beta' });
    const result = await invokeTool(server, 'search-tasks', { query: 'Alpha' });
    expect(result.content[0].text).toContain('Alpha');
    expect(result.content[0].text).not.toContain('Beta');
  });

  it('sort-tasks by priority', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'A', priority: 'B' });
    await invokeTool(server, 'add-task', { description: 'B', priority: 'A' });
    const result = await invokeTool(server, 'sort-tasks', { by: 'priority' });
    const lines = result.content[0].text.split('\n');
    // The task with priority 'A' should come first, then 'B'
    // So, 'A' (desc) should be second, 'B' (desc) should be first
    // But the description is 'A' and 'B', so we check priorities
    // lines[0] should have priority 'A', lines[1] should have priority 'B'
    expect(lines[0]).toContain('B'); // description 'B', priority 'A'
    expect(lines[1]).toContain('A'); // description 'A', priority 'B'
  });

  it('filter-tasks by context', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'With @home', contexts: ['home'] });
    await invokeTool(server, 'add-task', { description: 'No context' });
    const result = await invokeTool(server, 'filter-tasks', { criteria: { context: 'home' } });
    expect(result.content[0].text).toContain('With @home');
    expect(result.content[0].text).not.toContain('No context');
  });

  it('add-metadata and remove-metadata', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Meta task' });
    await invokeTool(server, 'add-metadata', { taskId: 1, metadata: { foo: 'bar' } });
    let content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('foo:bar');
    await invokeTool(server, 'remove-metadata', { taskId: 1, keys: ['foo'] });
    content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).not.toContain('foo:bar');
  });

  it('add-metadata and remove-metadata with invalid id', async () => {
    const server = createTestServer();
    let result = await invokeTool(server, 'add-metadata', { taskId: 99, metadata: { foo: 'bar' } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid task ID');
    result = await invokeTool(server, 'remove-metadata', { taskId: 99, keys: ['foo'] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid task ID');
  });

  it('batch-operations (delete)', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Batch 1', priority: 'A' });
    await invokeTool(server, 'add-task', { description: 'Batch 2', priority: 'B' });
    await invokeTool(server, 'batch-operations', { operations: [ { action: 'delete', criteria: { priority: 'A' } } ] });
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).not.toContain('Batch 1');
    expect(content).toContain('Batch 2');
  });

  it('update-task with invalid id', async () => {
    const server = createTestServer();
    const result = await invokeTool(server, 'update-task', { taskId: 99, updates: { description: 'nope' } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid task ID');
  });

  it('update-task', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Update me' });
    await invokeTool(server, 'update-task', { taskId: 1, updates: { description: 'Updated', priority: 'A', contexts: ['work'], projects: ['proj'], extensions: { foo: 'bar' } } });
    const content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('Updated');
    expect(content).toContain('A');
    expect(content).toContain('@work');
    expect(content).toContain('+proj');
    expect(content).toContain('foo:bar');
  });

  it('add-metadata with multiple keys and overwrite', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Meta task' });
    await invokeTool(server, 'add-metadata', { taskId: 1, metadata: { foo: 'bar', baz: 'qux' } });
    let content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('foo:bar');
    expect(content).toContain('baz:qux');
    // Overwrite foo
    await invokeTool(server, 'add-metadata', { taskId: 1, metadata: { foo: 'new' } });
    content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('foo:new');
    expect(content).not.toContain('foo:bar');
  });

  it('remove-metadata with multiple keys', async () => {
    const server = createTestServer();
    await invokeTool(server, 'add-task', { description: 'Meta task' });
    await invokeTool(server, 'add-metadata', { taskId: 1, metadata: { foo: 'bar', baz: 'qux' } });
    let content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).toContain('foo:bar');
    expect(content).toContain('baz:qux');
    await invokeTool(server, 'remove-metadata', { taskId: 1, keys: ['foo', 'baz'] });
    content = await fs.readFile(TODO_FILE_PATH, 'utf-8');
    expect(content).not.toContain('foo:bar');
    expect(content).not.toContain('baz:qux');
  });
});
