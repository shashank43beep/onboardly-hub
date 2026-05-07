import { useEffect } from 'react'
import { supabase } from './lib/supabase'

export default function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Test connection
    async function testConnection() {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      console.log('Connection test - DATA:', data)
      console.log('Connection test - ERROR:', error)
    }

    testConnection()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
