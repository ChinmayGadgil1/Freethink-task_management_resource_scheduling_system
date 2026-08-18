const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'RESOURCE';
}

export interface SigninPayload {
  email: string;
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
}

function getStoredToken(): string | null {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser);

    return typeof user.token === 'string' ? user.token : null;
  } catch {
    return null;
  }
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
