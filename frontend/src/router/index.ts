import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { isTokenExpired } from '@/services/api';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, _from, next) => {
    let token: string | null = null;
    let userRole: string | null = null;

    try {
      const storedAuth = sessionStorage.getItem('auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed?.token) {
          token = parsed.token;
          userRole = parsed.user?.role || null;
        }
      }
    } catch {
      // Ignore JSON error
    }

    if (!token) {
      try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.token) {
            token = parsed.token;
            userRole = parsed.role || null;
          }
        }
      } catch {
        // Ignore JSON error
      }
    }

    // Check if stored token has expired
    if (token && isTokenExpired(token)) {
      token = null;
      userRole = null;
      sessionStorage.removeItem('auth');
      sessionStorage.removeItem('user');
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const publicOnly = to.matched.some((record) => record.meta.publicOnly);

    if (requiresAuth && !token) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }

    if (publicOnly && token && to.path !== '/reset-password' && to.path !== '/forgot-password') {
      if (userRole === 'PROJECT_MANAGER') {
        return next('/pm/projects');
      } else if (userRole === 'RESOURCE') {
        return next('/app/resource-dashboard');
      }
    }

    const allowedRoles = to.matched
      .map((record) => record.meta.roles as string[] | undefined)
      .find((roles) => Array.isArray(roles) && roles.length > 0);

    if (requiresAuth && allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      if (userRole === 'PROJECT_MANAGER') {
        return next('/pm/projects');
      } else if (userRole === 'RESOURCE') {
        return next('/app/resource-dashboard');
      }
    }

    return next();
  });

  return Router;
});
