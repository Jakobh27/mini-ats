import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import LoginView from '../views/LoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import CustomerDashboardView from '../views/CustomerDashboardView.vue'
import CreateJobView from '../views/CreateJobView.vue'
import AddCandidateView from '../views/AddCandidateView.vue'
import AdminView from '../views/AdminView.vue'
import CandidateDetailView from '../views/CandidateDetailView.vue'
import EditCandidateView from '../views/EditCandidateView.vue'

const DashboardWrapper = {
  name: 'DashboardWrapper',
  components: { AdminDashboardView, CustomerDashboardView },
  template: `<AdminDashboardView v-if="userRole === 'admin'" /><CustomerDashboardView v-else />`,
  data() {
    return {
      userRole: null
    }
  },
  async mounted() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        this.userRole = profileData?.role
      }
    } catch (err) {
      console.error('Error loading user role:', err)
    }
  }
}

const routes = [
  {
    path: '/',
    component: DashboardWrapper
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
  },
  {
    path: '/admin',
    component: AdminView
  },
  {
    path: '/candidate/:id',
    component: CandidateDetailView
  },
  {
    path: '/candidate/:id/edit',
    component: EditCandidateView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const protectedRoutes = ['/', '/create-job', '/add-candidate', '/admin', '/candidate/:id', '/candidate/:id/edit']
  
  const isProtectedRoute = protectedRoutes.some(route => {
    // Check if the current path matches the protected route (handle dynamic segments)
    const routeParts = route.split('/')
    const pathParts = to.path.split('/')
    
    if (routeParts.length !== pathParts.length) return false
    
    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === pathParts[index]
    })
  })
  
  if (isProtectedRoute) {
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
