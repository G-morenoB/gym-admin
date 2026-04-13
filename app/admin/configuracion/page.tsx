'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type GymConfig = {
  id: string
  nombre_gym: string
  logo_url: string
  direccion: string
  telefono: string
  email: string
}

type Membresia = {
  id: string
  tipo: string
  precio: number
  activo: boolean
}

export default function ConfiguracionPage() {
  const [pestana, setPestana] = useState<'gym' | 'membresias' | 'usuarios'>('gym')
  const [config, setConfig] = useState<GymConfig | null>(null)
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarConfig()
    cargarMembresias()
  }, [])

  async function cargarConfig() {
    const { data } = await supabase
      .from('gym_config')
      .select('*')
      .single()
    setConfig(data)
  }

  async function cargarMembresias() {
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .order('precio')
    setMembresias(data || [])
  }

  async function guardarConfig() {
    if (!config) return
    setGuardando(true)
    await supabase
      .from('gym_config')
      .update({
        nombre_gym: config.nombre_gym,
        logo_url: config.logo_url,
        direccion: config.direccion,
        telefono: config.telefono,
        email: config.email,
      })
      .eq('id', config.id)
    setMensaje('Cambios guardados correctamente')
    setTimeout(() => setMensaje(''), 3000)
    setGuardando(false)
  }

  async function guardarMembresia(m: Membresia) {
    setGuardando(true)
    await supabase
      .from('membresias')
      .update({ precio: m.precio, activo: m.activo })
      .eq('id', m.id)
    setMensaje('Precio actualizado correctamente')
    setTimeout(() => setMensaje(''), 3000)
    setGuardando(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Título y botón guardar */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configuración</h1>
        {pestana !== 'usuarios' && (
          <button
            onClick={pestana === 'gym' ? guardarConfig : undefined}
            disabled={guardando}
            className="cursor-pointer bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {/* Mensaje de éxito */}
      {mensaje && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg">
          {mensaje}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-2">
        {[
          { key: 'gym',        label: 'Datos del gym' },
          { key: 'membresias', label: 'Membresías y precios' },
          { key: 'usuarios',   label: 'Usuarios del sistema' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPestana(p.key as any)}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === p.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border hover:bg-gray-50 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pestaña: Datos del gym */}
      {pestana === 'gym' && config && (
        <div className="bg-white rounded-lg border p-6 space-y-6">

          <div>
            <h2 className="font-medium mb-4">Información del gimnasio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del gimnasio</label>
                <input
                  type="text"
                  value={config.nombre_gym || ''}
                  onChange={(e) => setConfig({ ...config, nombre_gym: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo (URL)</label>
                <input
                  type="text"
                  value={config.logo_url || ''}
                  onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">URL de la imagen del logo</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-medium mb-4">Información de contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  value={config.direccion || ''}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  placeholder="Calle Principal #123"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={config.telefono || ''}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    placeholder="555-0100"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    placeholder="info@aquilesgym.com"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Pestaña: Membresías y precios */}
      {pestana === 'membresias' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-medium mb-4">Tipos de membresía y precios</h2>
          <div className="space-y-4">
            {membresias.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  {/* Toggle activo/inactivo */}
                  <input
                    type="checkbox"
                    checked={m.activo}
                    onChange={(e) => {
                      const actualizada = membresias.map(mb =>
                        mb.id === m.id ? { ...mb, activo: e.target.checked } : mb
                      )
                      setMembresias(actualizada)
                      guardarMembresia({ ...m, activo: e.target.checked })
                    }}
                    className="cursor-pointer w-4 h-4"
                  />
                  <span className="text-sm font-medium capitalize">{m.tipo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    value={m.precio}
                    onChange={(e) => {
                      const actualizada = membresias.map(mb =>
                        mb.id === m.id ? { ...mb, precio: Number(e.target.value) } : mb
                      )
                      setMembresias(actualizada)
                    }}
                    onBlur={() => guardarMembresia(m)}
                    className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400">MXN</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Los precios se guardan automáticamente al salir del campo.
          </p>
        </div>
      )}

      {/* Pestaña: Usuarios del sistema */}
      {pestana === 'usuarios' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-medium mb-4">Usuarios del sistema</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="text-sm font-medium">admin@aquilesgym.com</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Admin</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="text-sm font-medium">recepcion@aquilesgym.com</p>
                <p className="text-xs text-gray-500">Recepcionista</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Recepción</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}