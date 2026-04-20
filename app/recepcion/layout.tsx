'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import RecepcionNav from '../../components/RecepcionNav'

export default function RecepcionLayout({ children }: { children: React.ReactNode }) {
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.replace('/login')
        return
      }

      const rol = user.user_metadata?.rol
      if (rol !== 'recepcion') {
        window.location.replace('/admin/dashboard')
        return
      }

      setVerificado(true)
    }

    verificar()
  }, [])

  if (!verificado) return (
    <div className="min-h-screen bg-gray-50" />
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <RecepcionNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}