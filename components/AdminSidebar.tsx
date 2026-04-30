'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const menuItems = [
  { href: '/admin/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/miembros',      label: 'Miembros',      icon: Users },
  { href: '/admin/reportes',      label: 'Reportes',      icon: FileText },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
    })
    window.location.href = '/login'
  }

  return (
    <>
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white border rounded-lg p-2 shadow-sm"
      >
        {abierto ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay oscuro al abrir en móvil */}
      {abierto && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-60 bg-white border-r flex flex-col
        transform transition-transform duration-200
        ${abierto ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>

        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="font-bold text-lg">Aquiles Gym</h1>
          <p className="text-xs text-gray-500">Panel de Gestión</p>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>

      </aside>
    </>
  )
}