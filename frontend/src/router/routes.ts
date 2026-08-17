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
          

    ],
  },

  // Catch-all 404 route
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
