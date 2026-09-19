import type { Task } from "../../models/taskModel.js";

/**
 * Extended Task interface that includes computed urgency score for sorting purposes.
 */
export interface ScoredTask extends Task {
    urgency_score: number;
}

/**
 * Calculates the Urgency Score for a given task based on its priority, deadline proximity, and dependency weight.
 */
export function calculateUrgencyScore(task: Task, downstreamCount: number, currentDate: Date): number {
    let score = 0;

    // 1. Base Priority
    switch (task.priority) {
        case 'CRITICAL':
            score += 40;
            break;
        case 'HIGH':
            score += 30;
            break;
        case 'MEDIUM':
            score += 20;
            break;
        case 'LOW':
            score += 10;
            break;
    }

    // 2. Deadline Proximity Bonus
    if (task.deadline) {
        let deadlineDate: Date;
        if (typeof task.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline.trim())) {
            const [y, m, d] = task.deadline.trim().split('-').map(Number);
            deadlineDate = new Date(y!, m! - 1, d!, 23, 59, 59, 999);
        } else {
            deadlineDate = new Date(task.deadline);
        }
        // Normalize dates to ignore time components when calculating diff in days
        const diffTime = deadlineDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 2) {
            score += 500;
        } else if (diffDays <= 5) {
            score += 200;
        } else if (diffDays <= 10) {
            score += 100;
        } else if (diffDays <= 14) {
            score += 50;
        }
        // diffDays > 14 adds 0 points
    }

    // 3. Dependency Weight
    score += (downstreamCount * 15);

    return score;
}

/**
 * Sorts an array of ScoredTasks by their urgency score (Descending).
 * Breaks ties using earliest deadline, and then shortest remaining effort.
 */
export function sortTasksByUrgency(tasks: ScoredTask[]): ScoredTask[] {
    return tasks.sort((a, b) => {
        // 1. Highest Urgency Score first
        if (b.urgency_score !== a.urgency_score) {
            return b.urgency_score - a.urgency_score;
        }

        // 2. Tie-Breaker: Earliest Deadline
        if (a.deadline && b.deadline) {
            const dateA = new Date(a.deadline).getTime();
            const dateB = new Date(b.deadline).getTime();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
        } else if (a.deadline) {
            return -1; // a has deadline, b doesn't, so a goes first
        } else if (b.deadline) {
            return 1; // b has deadline, a doesn't, so b goes first
        }

        // 3. Tie-Breaker: Shortest Remaining Effort First
        // Remaining effort = expected_effort - actual_effort (minimum 1.0 if overrun)
        const aRemaining = Math.max(1, a.expected_effort - a.actual_effort);
        const bRemaining = Math.max(1, b.expected_effort - b.actual_effort);
        
        return aRemaining - bRemaining;
    });
}
