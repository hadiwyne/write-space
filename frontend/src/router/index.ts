import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: () => import('@/views/HomeView.vue'), meta: { hideLayout: true } },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true, hideLayout: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { public: true, hideLayout: true } },
    { path: '/feed', name: 'Feed', component: () => import('@/views/FeedView.vue') },
    { path: '/search', name: 'Search', component: () => import('@/views/SearchView.vue') },
    { path: '/notifications', name: 'Notifications', component: () => import('@/views/NotificationsView.vue'), meta: { auth: true } },
    { path: '/write', name: 'Write', component: () => import('@/views/WriteView.vue'), meta: { auth: true } },
    { path: '/posts/:id', name: 'Post', component: () => import('@/views/PostView.vue') },
    { path: '/posts/:id/edit', name: 'EditPost', component: () => import('@/views/EditPostView.vue'), meta: { auth: true } },
    { path: '/u/:username', name: 'Profile', component: () => import('@/views/ProfileView.vue') },
    { path: '/archived', name: 'Archived', component: () => import('@/views/ArchivedView.vue'), meta: { auth: true } },
    { path: '/bookmarks', name: 'Bookmarks', component: () => import('@/views/BookmarksView.vue'), meta: { auth: true } },
    { path: '/collections', name: 'Collections', component: () => import('@/views/CollectionsView.vue'), meta: { auth: true } },
    { path: '/collections/:idOrSlug', name: 'Collection', component: () => import('@/views/CollectionView.vue') },
    { path: '/settings', name: 'Settings', component: () => import('@/views/SettingsView.vue'), meta: { auth: true } },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.token) return next({ name: 'Login', query: { redirect: to.fullPath } })
  if (to.meta.public && auth.token && (to.name === 'Login' || to.name === 'Register')) return next({ name: 'Feed' })
  next()
})

export default router
