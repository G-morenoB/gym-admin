'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const menuItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/miembros',       label: 'Miembros',       icon: Users },
  { href: '/admin/reportes',       label: 'Reportes',       icon: FileText },
  { href: '/admin/configuracion',  label: 'Configuración',  icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

async function handleLogout() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  await supabase.auth.signOut()

  // Elimina la cookie de Supabase manualmente
  const cookieName = Object.keys(document.cookie.split(';').reduce((acc: any, c) => {
    const [k, v] = c.trim().split('=')
    acc[k] = v
    return acc
  }, {})).find(k => k.includes('auth'))

  if (cookieName) {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  window.location.replace('/login')
}

  return (
    <aside className="w-60 bg-white border-r flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="font-bold text-lg">Gym</h1>
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
  )
}