import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Public Landing Page
  {
    path: '/',
    component: () => import('@/pages/LandingPage.vue'),
    meta: { publicOnly: true },
  },

  // Auth routes (sharing AuthLayout for layout and background reuse)
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { publicOnly: true },
    children: [
      { path: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
      { path: 'signup', component: () => import('@/pages/auth/SignupPage.vue') },
      { path: 'forgot-password', component: () => import('@/pages/auth/forgot-password.vue') },
      { path: 'reset-password', component: () => import('@/pages/auth/reset-password.vue') },
    ],
  },

  // Redirect /app to PM dashboard / projects
  {
    path: '/app',
    redirect: '/pm/projects',
  },

  {
    path: '/pm',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true, roles: ['PROJECT_MANAGER'] },

    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/pm/DashboardPage.vue'),
      },
      {
        path: 'projects',
        component: () => import('@/pages/pm/ProjectsPage.vue'),
      },
      {
        path: 'projects/:id',
        component: () => import('@/pages/pm/ProjectDetailsPage.vue'),
      },
      {
        path: 'tasks',
        component: () => import('@/pages/pm/TasksPage.vue'),
      },
      {
        path: 'resources',
        component: () => import('@/pages/pm/ResourcesPage.vue'),
      },
      {
        path: 'resources/:id',
        component: () => import('@/pages/pm/ResourceDetailsPage.vue'),
      },
      {
        path: 'schedule',
        component: () => import('@/pages/pm/SchedulePage.vue'),
      },
      {
        path: 'calendar',
        component: () => import('@/pages/common/CalendarPage.vue'),
      },
      {
        path: 'leaves',
        component: () => import('@/pages/common/LeavesPage.vue'),
      },
      {
        path: 'progress',
        redirect: '/pm/projects',
      },
      {
        path: 'analytics',
        component: () => import('@/pages/pm/AnalyticsPage.vue'),
      },
      {
        path: 'help',
        component: () => import('@/pages/help/HelpPage.vue'),
      },
      {
        path: 'profile',
        component: () => import('@/pages/common/ProfilePage.vue'),
      },
      {
        path: 'bin',
        component: () => import('@/pages/pm/BinPage.vue'),
      },
    ],
  },

  //resource routes
  {
    path: '/app/resource-dashboard',
    component: () => import('@/layouts/ResourceLayout.vue'),
    meta: { requiresAuth: true, roles: ['RESOURCE'] },

    children: [
      {
        path: '',
        component: () => import('@/pages/resource/DashboardPage.vue'),
      },
      {
        path: 'task-details',
        component: () => import('@/pages/resource/TaskDetailsPage.vue'),
      },
      {
        path: 'task-details/:id',
        component: () => import('@/pages/resource/TaskDetailsPage.vue'),
      },
      {
        path: 'schedule',
        component: () => import('@/pages/resource/SchedulePage.vue'),
      },
      {
        path: 'calendar',
        component: () => import('@/pages/common/CalendarPage.vue'),
      },
      {
        path: 'leaves',
        component: () => import('@/pages/common/LeavesPage.vue'),
      },
      {
        path: 'progress',
        component: () => import('@/pages/resource/ProgressPage.vue'),
      },
      {
        path: 'help',
        component: () => import('@/pages/help/HelpPage.vue'),
      },
      {
        path: 'profile',
        component: () => import('@/pages/common/ProfilePage.vue'),
      },
    ],
  },

  // Public preview route for isolated analytics prototype
  {
    path: '/analytics-preview',
    component: () => import('@/pages/pm/AnalyticsPage.vue'),
  },

  // Catch-all 404 route
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
