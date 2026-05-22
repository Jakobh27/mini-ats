import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

export function useUserContext() {
  const userId = ref(null)
  const isAdmin = ref(false)
  const userRole = ref(null)
  const loading = ref(true)

  onMounted(async () => {
    try {
      // Get current user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        loading.value = false
        return
      }

      userId.value = user.id

      // Fetch user profile to get role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        loading.value = false
        return
      }

      userRole.value = profileData?.role
      isAdmin.value = profileData?.role === 'admin'
    } catch (err) {
      console.error('Error in useUserContext:', err)
    } finally {
      loading.value = false
    }
  })

  return {
    userId,
    isAdmin,
    userRole,
    loading
  }
}
