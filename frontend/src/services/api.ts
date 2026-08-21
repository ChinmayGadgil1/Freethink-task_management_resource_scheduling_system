import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'RESOURCE';
}

export interface SigninPayload {
  identifier?: string;
  email?: string;
  username?: string;
  password: string;
}

export interface Project {
  project_id: number;
  project_manager_id: number;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  deadline: string | null;
  progress: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  task_id: number;
  project_id: number;
  project_name?: string;
  created_by: number; //added to track who created the task
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date: string | null;
  deadline: string | null;
  expected_effort: number | string;
  actual_effort: number | string;
  progress: number | string;
  created_at?: string;
  updated_at?: string;
  assigned_resource_ids?: number[];
  predecessor_task_ids?: number[];
}

export interface WorkLog {
  log_id: number;
  task_id: number;
  user_id: number;
  hours_logged: number;
  progress_logged: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  notes: string;
  blockers: string | null;
  log_date: string;
  created_at: string;
  author_name?: string;
}

export interface CreateWorkLogPayload {
  hours_logged: number;
  progress_logged: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  notes: string;
  blockers?: string | null;
  log_date: string;
}

function getStoredToken(): string | null {
  try {
    const authStore = useAuthStore();
    if (authStore.token) {
      return authStore.token;
    }
  } catch {
    // Pinia instance not active in current execution context
  }

  const storedAuth = sessionStorage.getItem('auth');
  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      if (parsed && typeof parsed.token === 'string') {
        return parsed.token;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return typeof user.token === 'string' ? user.token : null;
    } catch {
      return null;
    }
  }

  return null;
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function signupApi(payload: SignupPayload) {
  const response = await fetch(`${AUTH_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Signup failed');
  }

  return data;
}

export async function signinApi(payload: SigninPayload) {
  const response = await fetch(`${AUTH_BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Sign in failed');
  }

  return data;
}

export async function getProjectsApi(): Promise<Project[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch projects');
  }

  return data.projects ?? [];
}
export async function getProjectByIdApi(projectId: number): Promise<Project> {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch project');
  }

  return data.project;
}
export interface UpdateProjectPayload {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string | null;
  deadline?: string | null;
}

export async function updateProjectApi(
  projectId: number,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update project');
  }

  return data.project;
}

export async function getTasksApi(projectId?: number): Promise<Task[]> {
  const url = new URL(`${API_BASE_URL}/tasks`);

  if (projectId !== undefined) {
    url.searchParams.set('project_id', String(projectId));
  }

  const response = await authenticatedFetch(url.toString());

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }

  return data.tasks ?? [];
}

export async function getBottleneckTasksApi(): Promise<Task[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/bottlenecks`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch bottleneck tasks');
  }

  return data.tasks ?? [];
}

export interface UpdateResourceTaskPayload {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress?: number;
  actual_effort?: number;
}

/**
 * Resource workload response.
 */
export interface ResourceWorkloadTask {
  task_id: number;
  project_id: number;
  project_name?: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date: string | null;
  deadline: string | null;
  expected_effort: number | string;
  actual_effort: number | string;
  progress: number | string;
}

export interface ResourceWorkload {
  resource_id: number;
  active_tasks_count: number;
  total_expected_effort: number | string;
  total_actual_effort: number | string;
  tasks: ResourceWorkloadTask[];
}

// Get workload for a Resource (or logged-in resource if omitted)
export async function getResourceWorkloadApi(resourceId?: number): Promise<ResourceWorkload> {
  const url = resourceId
    ? `${API_BASE_URL}/tasks/resources/${resourceId}/workload`
    : `${API_BASE_URL}/tasks/resources/me/workload`;

  const response = await authenticatedFetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch resource workload');
  }

  return data;
}

export interface CreateTaskPayload {
  project_id: number;
  title: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date?: string | null;
  deadline?: string | null;
  expected_effort: number;
  assigned_resource_ids?: number[];
}

export async function createTaskApi(payload: CreateTaskPayload): Promise<Task> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task');
  }

  return data.task;
}

export type ProjectStatus =
  'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateProjectPayload {
  project_manager_id: number;
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  deadline?: string | null;
}

export async function createProjectApi(payload: CreateProjectPayload): Promise<Project> {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create project');
  }

  return data.project;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date?: string | null;
  deadline?: string | null;
  expected_effort?: number;
  actual_effort?: number;
  progress?: number;
}

export async function updateTaskApi(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task');
  }

  return data.task;
}

export async function assignProjectMemberApi(projectId: number, userId: number) {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign resource to project');
  }

  return data;
}

export async function assignTaskResourceApi(taskId: number, userId: number) {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to assign resource to task');
  }

  return data;
}

/**
 * Add an existing task as the predecessor of another task.
 * Uses the backend dependency endpoint: POST /tasks/:id/dependencies
 */
export async function addTaskDependencyApi(
  taskId: number,
  predecessorTaskId: number,
): Promise<{ message?: string }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ predecessor_task_id: predecessorTaskId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to add task dependency');
  }

  return data;
}

export interface ResourceUser {
  user_id: number;
  name: string;
  email: string;
  role: 'RESOURCE';
  is_active?: boolean | number;
  created_at?: string;
}

export async function getResourcesApi(projectId?: number): Promise<ResourceUser[]> {
  const url =
    projectId !== undefined
      ? `${API_BASE_URL}/resources?project_id=${projectId}`
      : `${API_BASE_URL}/resources`;

  const response = await authenticatedFetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch resources');
  }

  return Array.isArray(data) ? data : (data.resources ?? []);
}

export async function getResourceByIdApi(resourceId: number): Promise<ResourceUser> {
  const response = await authenticatedFetch(`${API_BASE_URL}/resources/${resourceId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch resource details');
  }

  return data;
}

export async function getResourceProjectsApi(resourceId: number): Promise<Project[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/resources/${resourceId}/projects`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch resource projects');
  }

  return Array.isArray(data) ? data : (data.projects ?? []);
}

export async function createWorkLogApi(
  taskId: number,
  payload: CreateWorkLogPayload,
): Promise<WorkLog> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create work log');
  }

  return data.log;
}

export async function getWorkLogsApi(taskId: number): Promise<WorkLog[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch work history');
  }

  return data.logs ?? [];
}

export async function deleteProjectApi(projectId: number): Promise<{ message?: string }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete project');
  }

  return data;
}

export async function deleteTaskApi(taskId: number): Promise<{ message?: string }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }

  return data;
}

export async function unassignTaskResourceApi(
  taskId: number,
  userId: number,
): Promise<{ message?: string }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}/assignees/${userId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to unassign resource from task');
  }

  return data;
}

export async function removeProjectMemberApi(
  projectId: number,
  userId: number,
): Promise<{ message?: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/projects/${projectId}/members/${userId}`,
    {
      method: 'DELETE',
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove member from project');
  }

  return data;
}

export async function removeTaskDependencyApi(
  taskId: number,
  predecessorTaskId: number,
): Promise<{ message?: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/tasks/${taskId}/dependencies/${predecessorTaskId}`,
    {
      method: 'DELETE',
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove task dependency');
  }

  return data;
}

export interface ProgressFeedLog extends WorkLog {
  task_title?: string;
  project_name?: string;
}

export async function getGlobalProgressFeedApi(limit = 50): Promise<ProgressFeedLog[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/projects/feed/progress?limit=${limit}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch global progress feed');
  }

  return data.logs ?? [];
}
