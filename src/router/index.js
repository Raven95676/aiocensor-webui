import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'audit',
        name: 'AuditLog',
        component: () => import('@/components/AuditLog.vue'),
        meta: { title: '审核日志' },
      },
      {
        path: 'blacklist',
        name: 'BlackList',
        component: () => import('@/components/BlackList.vue'),
        meta: { title: '黑名单管理' },
      },
      {
        path: 'sensitive',
        name: 'SensitiveWords',
        component: () => import('@/components/SensitiveWords.vue'),
        meta: { title: '敏感词管理' },
      },
      {
        path: ':pathMatch(.*)*',
        redirect: '/',
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 用于存储目标路由
let targetRoute = null

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  document.title = to.meta.title ? `AIOCENSOR - ${to.meta.title}` : 'AIOCENSOR管理系统'

  // 检查认证状态
  const isAuthenticated = authStore.checkAuth()

  // 如果是访客路由且已认证，重定向到 Dashboard
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  // 如果需要认证但未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 存储目标路由
    targetRoute = to
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 如果是从登录页过来且有存储的目标路由
  if (from.name === 'Login' && targetRoute && isAuthenticated) {
    const redirectTo = targetRoute
    targetRoute = null // 清除存储的路由
    next(redirectTo)
    return
  }

  // 默认情况继续导航
  next()
})

export default router
