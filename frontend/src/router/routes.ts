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
      { path: 'second', component: () => import('@/pages/SecondPage.vue') },
    ],
  },

  // Catch-all 404 route
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
