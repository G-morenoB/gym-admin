'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { QrCode, Search, UserPlus, CreditCard, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { href: '/recepcion/qr',      label: 'Entrada QR',     icon: QrCode },
  { href: '/recepcion/buscar',  label: 'Búsqueda',       icon: Search },
  { href: '/recepcion/nuevo',   label: 'Nuevo Miembro',  icon: UserPlus },
  { href: '/recepcion/cobros',  label: 'Cobros',         icon: CreditCard },
]

export default function RecepcionNav() {
  const pathname = usePathname()
  const router = useRouter()

async function handleLogout() {
  await supabase.auth.signOut()
  // Fuerza una recarga completa para limpiar todas las cookies
  window.location.href = '/login'
}

  return (
    <header className="bg-white border-b">
      <div className="max-w-3xl mx-auto px-4">

        {/* Título y botón logout */}
        <div className="flex justify-between items-center py-3 border-b">
          <div>
            <h1 className="font-bold text-base">Panel de Recepción</h1>
            <p className="text-xs text-gray-500">Gestión de acceso y membresías</p>
          </div>
          <button
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex gap-1 py-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'border-b-2 border-gray-900 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}