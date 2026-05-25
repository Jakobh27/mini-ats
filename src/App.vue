<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Navbar -->
    <nav class="border-b border-neutral-200 bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-neutral-900">Mini ATS</h1>
        
        <div class="flex gap-6 items-center">
          <!-- Protected links (only show if logged in) -->
          <template v-if="isLoggedIn">
            <router-link 
              to="/" 
              class="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Dashboard
            </router-link>
            
            <router-link 
              to="/create-job" 
              class="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Create Job
            </router-link>

            <router-link 
              to="/add-candidate" 
              class="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Add Candidate
            </router-link>
            
            <!-- Admin Panel link (only show if admin) -->
            <router-link 
              v-if="isAdmin"
              to="/admin" 
              class="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
            >
              Admin Panel
            </router-link>

            <!-- User info badge -->
            <div class="flex items-center gap-2 pl-6 border-l border-neutral-200">
              <div class="text-right">
                <p class="text-sm font-medium text-neutral-900">{{ companyName }}</p>
                <p class="text-xs text-neutral-500">{{ userRoleLabel }}</p>
              </div>
            </div>
            
            <!-- Logout button -->
            <button
              @click="handleLogout"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </template>

          <!-- Login link (only show if logged out) -->
          <router-link
            v-else
            to="/login"
            class="text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Login
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-6xl mx-auto px-8 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

const router = useRouter()
const isLoggedIn = ref(false)
const isAdmin = ref(false)
const companyName = ref(null)
const userRole = ref(null)

const userRoleLabel = computed(() => {
  return userRole.value === 'admin' ? 'Admin' : 'Customer'
})

onMounted(() => {
  // Check initial auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    isLoggedIn.value = !!session
    if (session) {
      checkAdminRole()
    }
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    isLoggedIn.value = !!session
    if (session) {
      checkAdminRole()
    } else {
      isAdmin.value = false
    }
  })

  // Cleanup subscription on unmount
  return () => {
    subscription?.unsubscribe()
  }
})

const checkAdminRole = async () => {
  try {
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) {
      isAdmin.value = false
      companyName.value = null
      userRole.value = null
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_name')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      isAdmin.value = false
      companyName.value = null
      userRole.value = null
      return
    }

    userRole.value = profile?.role
    companyName.value = profile?.company_name
    isAdmin.value = profile?.role === 'admin'
  } catch (err) {
    console.error('Error checking admin role:', err)
    isAdmin.value = false
    companyName.value = null
    userRole.value = null
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  isAdmin.value = false
  companyName.value = null
  userRole.value = null
  router.push('/login')
}
</script>
