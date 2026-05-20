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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

const router = useRouter()
const isLoggedIn = ref(false)

onMounted(() => {
  // Check initial auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    isLoggedIn.value = !!session
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    isLoggedIn.value = !!session
  })

  // Cleanup subscription on unmount
  return () => {
    subscription?.unsubscribe()
  }
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
