import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Item } from "jstodotxt";
import fs from "fs/promises";

// Helper function to save tasks
export function registerTools(server: McpServer, loadTasks: () => Promise<Item[]>, TODO_FILE_PATH: string) {

    async function saveTasks(tasks: Item[]) {
        const content = tasks.map((task) => task.toString()).join("\n");
        await fs.writeFile(TODO_FILE_PATH, content, "utf-8");
    }

    // Helper: Convert 1-based taskId to 0-based index, return null if out of bounds
    function getTaskIndex(taskId: number, tasks: Item[]): number | null {
        const idx = taskId - 1;
        if (idx < 0 || idx >= tasks.length) return null;
        return idx;
    }

    server.tool(
        "add-task",
        {
            description: z.string(),
            priority: z.string().optional(),
            contexts: z.array(z.string()).optional(),
            projects: z.array(z.string()).optional(),
            extensions: z.record(z.string(), z.string()).optional(),
        },
        async ({ description, priority, contexts, projects, extensions }) => {
            const tasks = await loadTasks();
            const newTask = new Item(description);

            if (priority) newTask.setPriority(priority);
            if (contexts) contexts.forEach(context => newTask.addContext(context));
            if (projects) projects.forEach(project => newTask.addProject(project));
            if (extensions) {
                Object.entries(extensions).forEach(([key, value]) => newTask.setExtension(key, value));
            }

            tasks.push(newTask);
            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: `Task added successfully. ID: ${tasks.length - 1}` },
                ],
            };
        }
    );

    server.tool(
        "complete-task",
        {
            taskId: z.number(),
        },
        async ({ taskId }) => {
            const tasks = await loadTasks();
            const idx = getTaskIndex(taskId, tasks);
            if (idx === null) {
                return {
                    content: [
                        { type: "text", text: "Task not found." },
                    ],
                    isError: true,
                };
            }
            tasks[idx].setCompleted(new Date().toISOString().split("T")[0]);
            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: "Task marked as completed." },
                ],
            };
        }
    );

    server.tool(
        "delete-task",
        {
            taskId: z.number(),
        },
        async ({ taskId }) => {
            const tasks = await loadTasks();
            const idx = getTaskIndex(taskId, tasks);
            if (idx === null) {
                return {
                    content: [
                        { type: "text", text: "Invalid task ID." },
                    ],
                    isError: true,
                };
            }
            tasks.splice(idx, 1);
            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: "Task deleted successfully." },
                ],
            };
        }
    );

    server.tool(
        "list-tasks",
        {
            filter: z.object({
                priority: z.string().optional(),
                context: z.string().optional(),
                project: z.string().optional(),
                extensions: z.record(z.string(), z.string()).optional(),
            }).optional(),
        },
        async ({ filter }) => {
            const tasks = await loadTasks();
            let filteredTasks = tasks;

            if (filter) {
                if (filter.priority) {
                    filteredTasks = filteredTasks.filter(task => task.priority() === filter.priority);
                }
                if (filter.context) {
                    filteredTasks = filteredTasks.filter(task => filter.context && task.contexts().includes(filter.context));
                }
                if (filter.project) {
                    filteredTasks = filteredTasks.filter(task => filter.project && task.projects().includes(filter.project));
                }
                if (filter.extensions) {
                    filteredTasks = filteredTasks.filter(task => {
                        const extensions = task.extensions();
                        return Object.entries(filter.extensions || {}).every(([key, value]) =>
                            extensions.some(ext => ext.key === key && ext.value === value)
                        );
                    });
                }
            }

            return {
                content: [
                    { type: "text", text: filteredTasks.map(task => task.toString()).join("\n") },
                ],
            };
        }
    );

    server.tool(
        "search-tasks",
        {
            query: z.string(),
        },
        async ({ query }) => {
            const tasks = await loadTasks();
            const matchingTasks = tasks.filter(task => task.toString().includes(query));

            return {
                content: [
                    { type: "text", text: matchingTasks.map(task => task.toString()).join("\n") },
                ],
            };
        }
    );

    server.tool(
        "sort-tasks",
        {
            by: z.enum(["priority", "creationDate", "completionDate"]),
        },
        async ({ by }) => {
            const tasks = await loadTasks();
            let sortedTasks;

            switch (by) {
                case "priority":
                    sortedTasks = tasks.sort((a, b) => (a.priority() || "").localeCompare(b.priority() || ""));
                    break;
                case "creationDate":
                    sortedTasks = tasks.sort((a, b) => new Date(a.created()?.toISOString() || 0).getTime() - new Date(b.created()?.toISOString() || 0).getTime());
                    break;
                case "completionDate":
                    sortedTasks = tasks.sort((a, b) => new Date(a.completed()?.toISOString() || 0).getTime() - new Date(b.completed()?.toISOString() || 0).getTime());
                    break;
            }

            return {
                content: [
                    { type: "text", text: sortedTasks.map(task => task.toString()).join("\n") },
                ],
            };
        }
    );

    server.tool(
        "filter-tasks",
        {
            criteria: z.object({
                priority: z.string().optional(),
                context: z.string().optional(),
                project: z.string().optional(),
            }),
        },
        async ({ criteria }) => {
            const tasks = await loadTasks();
            let filteredTasks = tasks;

            if (criteria.priority) {
                filteredTasks = filteredTasks.filter(task => task.priority() === criteria.priority);
            }
            if (criteria.context) {
                filteredTasks = filteredTasks.filter(task => criteria.context && task.contexts().includes(criteria.context));
            }
            if (criteria.project) {
                filteredTasks = filteredTasks.filter(task => criteria.project && task.projects().includes(criteria.project));
            }

            return {
                content: [
                    { type: "text", text: filteredTasks.map(task => task.toString()).join("\n") },
                ],
            };
        }
    );

    server.tool(
        "add-metadata",
        {
            taskId: z.number(),
            metadata: z.record(z.string()),
        },
        async ({ taskId, metadata }) => {
            const tasks = await loadTasks();
            const idx = getTaskIndex(taskId, tasks);
            if (idx === null) {
                return {
                    content: [
                        { type: "text", text: "Invalid task ID." },
                    ],
                    isError: true,
                };
            }

            Object.entries(metadata).forEach(([key, value]) => {
                tasks[idx].setExtension(key, value);
            });

            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: "Metadata added successfully." },
                ],
            };
        }
    );

    server.tool(
        "remove-metadata",
        {
            taskId: z.number(),
            keys: z.array(z.string()),
        },
        async ({ taskId, keys }) => {
            const tasks = await loadTasks();
            const idx = getTaskIndex(taskId, tasks);
            if (idx === null) {
                return {
                    content: [
                        { type: "text", text: "Invalid task ID." },
                    ],
                    isError: true,
                };
            }

            keys.forEach(key => {
                tasks[idx].removeExtension(key);
            });

            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: "Metadata removed successfully." },
                ],
            };
        }
    );

    server.tool("batch-operations", {
        operations: z.array(z.object({
            action: z.enum(["update", "delete", "mark-complete"]),
            criteria: z.object({
                priority: z.string().optional(),
                context: z.string().optional(),
                project: z.string().optional(),
            }).optional(),
            updates: z.object({
                priority: z.string().optional(),
                addContexts: z.array(z.string()).optional(),
                removeContexts: z.array(z.string()).optional(),
                addProjects: z.array(z.string()).optional(),
                removeProjects: z.array(z.string()).optional(),
                extensions: z.record(z.string(), z.string()).optional(),
            }).optional(),
        })),
    }, async ({ operations }) => {
        let tasks = await loadTasks();

        for (const operation of operations) {
            if (operation.action === "delete") {
                tasks = tasks.filter(task => {
                    if (!operation.criteria) return true;
                    return !(
                        (operation.criteria.priority && task.priority() === operation.criteria.priority) ||
                        (operation.criteria.context && task.contexts().includes(operation.criteria.context)) ||
                        (operation.criteria.project && task.projects().includes(operation.criteria.project))
                    );
                });
            } else if (operation.action === "update") {
                tasks.forEach(task => {
                    if (operation.criteria) {
                        if (
                            (operation.criteria.priority && task.priority() === operation.criteria.priority) ||
                            (operation.criteria.context && task.contexts().includes(operation.criteria.context)) ||
                            (operation.criteria.project && task.projects().includes(operation.criteria.project))
                        ) {
                            if (operation.updates) {
                                if (operation.updates.priority) {
                                    task.setPriority(operation.updates.priority);
                                }
                                if (operation.updates.addContexts) {
                                    operation.updates.addContexts.forEach(context => task.addContext(context));
                                }
                                if (operation.updates.removeContexts) {
                                    operation.updates.removeContexts.forEach(context => task.removeContext(context));
                                }
                                if (operation.updates.addProjects) {
                                    operation.updates.addProjects.forEach(project => task.addProject(project));
                                }
                                if (operation.updates.removeProjects) {
                                    operation.updates.removeProjects.forEach(project => task.removeProject(project));
                                }
                                if (operation.updates.extensions) {
                                    Object.entries(operation.updates.extensions).forEach(([key, value]) => task.setExtension(key, value));
                                }
                            }
                        }
                    }
                });
            } else if (operation.action === "mark-complete") {
                tasks.forEach(task => {
                    if (operation.criteria) {
                        if (
                            (operation.criteria.priority && task.priority() === operation.criteria.priority) ||
                            (operation.criteria.context && task.contexts().includes(operation.criteria.context)) ||
                            (operation.criteria.project && task.projects().includes(operation.criteria.project))
                        ) {
                            task.setCompleted(new Date().toISOString().split("T")[0]);
                        }
                    }
                });
            }
        }

        await saveTasks(tasks);
        return {
            content: [
                { type: "text", text: "Batch operations completed successfully." },
            ],
        };
    });

    server.tool(
        "update-task",
        {
            taskId: z.number(),
            updates: z.object({
                description: z.string().optional(),
                priority: z.string().optional(),
                contexts: z.array(z.string()).optional(),
                projects: z.array(z.string()).optional(),
                extensions: z.record(z.string(), z.string()).optional(),
            }),
        },
        async ({ taskId, updates }) => {
            const tasks = await loadTasks();
            const idx = getTaskIndex(taskId, tasks);
            if (idx === null) {
                return {
                    content: [
                        { type: "text", text: "Invalid task ID." },
                    ],
                    isError: true,
                };
            }

            const task = tasks[idx];
            if (updates.description) task.setBody(updates.description);
            if (updates.priority) task.setPriority(updates.priority);
            if (updates.contexts) {
                task.contexts().forEach(context => task.removeContext(context));
                updates.contexts.forEach(context => task.addContext(context));
            }
            if (updates.projects) {
                task.projects().forEach(project => task.removeProject(project));
                updates.projects.forEach(project => task.addProject(project));
            }
            if (updates.extensions) {
                Object.entries(updates.extensions).forEach(([key, value]) => task.setExtension(key, value));
            }

            await saveTasks(tasks);
            return {
                content: [
                    { type: "text", text: "Task updated successfully." },
                ],
            };
        }
    );
}