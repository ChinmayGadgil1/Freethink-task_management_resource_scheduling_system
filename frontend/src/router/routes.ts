import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Auth routes (sharing AuthLayout for layout and background reuse)
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/auth/LoginPage.vue') },
      { path: 'signup', component: () => import('@/pages/auth/SignupPage.vue') },
      { path: 'forgot-password', component: () => import('@/pages/auth/forgot-password.vue') },
      { path: 'reset-password', component: () => import('@/pages/auth/reset-password.vue') },
    ],
  },
  {
    path: '/login',
    redirect: '/',
  },

  // Main app routes (sharing MainLayout)
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      {
        path: 'pm-dashboard',
        component: () => import('@/pages/pm/DashboardPage.vue'),
      },

      { path: 'second', component: () => import('@/pages/SecondPage.vue') },
    ],
  },

  {
    path: '/pm',
    component: () => import('@/layouts/MainLayout.vue'),

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
        redirect: '/pm/dashboard',
      },
      {
        path: 'progress',
        redirect: '/pm/projects',
      },
      {
        path: 'reports',
        redirect: '/pm/dashboard',
      },
    ],
  },

  //resource routes
  {
    path: '/app/resource-dashboard',
    component: () => import('@/layouts/ResourceLayout.vue'),

    children: [
      {
        path: '',
        component: () => import('@/pages/resource/DashboardPage.vue'),
      },
      {
        path: 'tasks',
        component: () => import('@/pages/resource/MyTasksPage.vue'),
      },
      {
        path: 'task-details',
        component: () => import('@/pages/resource/TaskDetailsPage.vue'),
      },
      {
        path: 'task-details/:id',
        component: () => import('@/pages/resource/TaskDetailsPage.vue'),
      },
    ],
  },

  // Catch-all 404 route
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
