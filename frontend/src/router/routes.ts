import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/LoginPage.vue'),
  },

  // Main app routes
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: 'second', component: () => import('@/pages/SecondPage.vue') },
    ],
  },

  // Auth routes (standalone, no MainLayout)
  {
    path: '/login',
    redirect: '/',
  },
  {
    path: '/signup',
    component: () => import('@/pages/SignupPage.vue'),
  },
  {
    path: '/forgot-password',
    component: () => import('@/pages/forgot-password.vue'),
  },
  {
    path: '/reset-password',
    component: () => import('@/pages/reset-password.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
