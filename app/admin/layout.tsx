'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import AdminSidebar from '../../components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.replace('/login'); return }
      const rol = user.user_metadata?.rol
      if (rol !== 'admin') { window.location.replace('/recepcion/qr'); return }
      setVerificado(true)
    }

    verificar()
  }, [])

  if (!verificado) return <div className="min-h-screen bg-gray-50" />

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}