import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import CreateJobView from '../views/CreateJobView.vue'
import AddCandidateView from '../views/AddCandidateView.vue'

const routes = [
  {
    path: '/',
    component: DashboardView
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/create-job',
    component: CreateJobView
  },
  {
    path: '/add-candidate',
    component: AddCandidateView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const protectedRoutes = ['/', '/create-job', '/add-candidate']
  
  if (protectedRoutes.includes(to.path)) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
