import type { Task, TaskDependency } from "../../models/taskModel.js";

/**
 * Checks if a directed graph of task dependencies contains any cycles using Kahn's Algorithm.
 * @throws Error if a cycle is detected.
 */
export function detectCycles(tasks: Task[], dependencies: TaskDependency[]): boolean {
    const inDegree: Record<number, number> = {};
    const adjList: Record<number, number[]> = {};

    // Initialize data structures
    for (const task of tasks) {
        inDegree[task.task_id] = 0;
        adjList[task.task_id] = [];
    }

    // Build the graph
    for (const dep of dependencies) {
        // dep.predecessor_task_id -> dep.task_id
        if (inDegree[dep.task_id] !== undefined && inDegree[dep.predecessor_task_id] !== undefined) {
            adjList[dep.predecessor_task_id]!.push(dep.task_id);
            inDegree[dep.task_id]!++;
        }
    }

    // Collect all nodes with 0 in-degree
    const queue: number[] = [];
    for (const taskId in inDegree) {
        if (inDegree[taskId] === 0) {
            queue.push(Number(taskId));
        }
    }

    let visitedCount = 0;
    while (queue.length > 0) {
        const current = queue.shift()!;
        visitedCount++;

        const successors = adjList[current] || [];
        for (const succ of successors) {
            inDegree[succ]!--;
            if (inDegree[succ] === 0) {
                queue.push(succ);
            }
        }
    }

    if (visitedCount !== tasks.length) {
        throw new Error("Circular dependency detected in tasks.");
    }

    return false;
}

/**
 * Prunes cyclic dependencies incrementally, returning only the acyclic subset of dependencies.
 */
export function pruneCycles(
    tasks: Task[],
    dependencies: TaskDependency[]
): { validDependencies: TaskDependency[]; removedDependencies: TaskDependency[] } {
    const validDependencies: TaskDependency[] = [];
    const removedDependencies: TaskDependency[] = [];

    for (const dep of dependencies) {
        const { hasCycle } = wouldCreateCycle(dep.task_id, dep.predecessor_task_id, validDependencies);
        if (hasCycle) {
            removedDependencies.push(dep);
        } else {
            validDependencies.push(dep);
        }
    }

    return { validDependencies, removedDependencies };
}

/**
 * Returns all downstream descendant task IDs that depend directly or indirectly on the given taskId.
 */
export function getDownstreamDescendants(taskId: number, dependencies: TaskDependency[]): Set<number> {
    const adjList: Record<number, number[]> = {};

    for (const dep of dependencies) {
        if (!adjList[dep.predecessor_task_id]) {
            adjList[dep.predecessor_task_id] = [];
        }
        adjList[dep.predecessor_task_id]!.push(dep.task_id);
    }

    const visited = new Set<number>();
    const queue: number[] = [taskId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const successors = adjList[current] || [];

        for (const succ of successors) {
            if (!visited.has(succ)) {
                visited.add(succ);
                queue.push(succ);
            }
        }
    }

    return visited;
}

/**
 * Determines whether adding a dependency edge (predecessorTaskId -> taskId) would introduce a cycle.
 * Adding an edge predecessorTaskId -> taskId creates a cycle if and only if
 * taskId === predecessorTaskId OR taskId can already reach predecessorTaskId via existing dependencies.
 */
export function wouldCreateCycle(
    taskId: number,
    predecessorTaskId: number,
    dependencies: TaskDependency[]
): { hasCycle: boolean; cyclePath?: number[] } {
    if (taskId === predecessorTaskId) {
        return { hasCycle: true, cyclePath: [taskId, predecessorTaskId] };
    }

    // Build adjacency list (predecessor -> successor)
    const adjList: Record<number, number[]> = {};
    for (const dep of dependencies) {
        if (!adjList[dep.predecessor_task_id]) {
            adjList[dep.predecessor_task_id] = [];
        }
        adjList[dep.predecessor_task_id]!.push(dep.task_id);
    }

    // BFS to find path from taskId to predecessorTaskId
    const queue: number[] = [taskId];
    const parentMap = new Map<number, number>();
    const visited = new Set<number>([taskId]);

    let found = false;
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === predecessorTaskId) {
            found = true;
            break;
        }

        const successors = adjList[current] || [];
        for (const succ of successors) {
            if (!visited.has(succ)) {
                visited.add(succ);
                parentMap.set(succ, current);
                queue.push(succ);
            }
        }
    }

    if (!found) {
        return { hasCycle: false };
    }

    // Reconstruct cycle path: predecessorTaskId -> taskId -> ... -> predecessorTaskId
    const path: number[] = [predecessorTaskId];
    let curr = predecessorTaskId;
    while (curr !== taskId && parentMap.has(curr)) {
        curr = parentMap.get(curr)!;
        path.unshift(curr);
    }
    path.unshift(predecessorTaskId); // show full loop

    return { hasCycle: true, cyclePath: path };
}

/**
 * Determines which tasks are available to work on vs which are blocked by incomplete predecessors.
 * A task is AVAILABLE if it has no predecessors, or if all of its predecessors have a status of 'COMPLETED'.
 * Otherwise, it is WAITING.
 */
export function getTaskAvailability(tasks: Task[], dependencies: TaskDependency[]): { AVAILABLE: Task[], WAITING: Task[] } {
    const available: Task[] = [];
    const waiting: Task[] = [];
    
    // Create a quick lookup for task status
    const taskStatusMap: Record<number, string> = {};
    for (const task of tasks) {
        taskStatusMap[task.task_id] = task.status;
    }

    for (const task of tasks) {
        // Find all dependencies where this task is the successor
        const myPredecessors = dependencies.filter(d => d.task_id === task.task_id);
        
        let allCompleted = true;
        for (const dep of myPredecessors) {
            const predStatus = taskStatusMap[dep.predecessor_task_id];
            // If the predecessor doesn't exist in our map (maybe deleted or from another project?), 
            // or if it's not COMPLETED, then we are blocked.
            if (predStatus !== 'COMPLETED') {
                allCompleted = false;
                break;
            }
        }

        if (allCompleted) {
            available.push(task);
        } else {
            waiting.push(task);
        }
    }

    return { AVAILABLE: available, WAITING: waiting };
}

/**
 * Calculates the total number of downstream tasks that depend on the given task recursively.
 */
export function getDownstreamDependencyCount(taskId: number, dependencies: TaskDependency[]): number {
    const adjList: Record<number, number[]> = {};
    
    for (const dep of dependencies) {
        if (!adjList[dep.predecessor_task_id]) {
            adjList[dep.predecessor_task_id] = [];
        }
        adjList[dep.predecessor_task_id]!.push(dep.task_id);
    }

    const visited = new Set<number>();
    const queue: number[] = [taskId];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        const successors = adjList[current] || [];
        
        for (const succ of successors) {
            if (!visited.has(succ)) {
                visited.add(succ);
                queue.push(succ);
            }
        }
    }

    return visited.size;
}
