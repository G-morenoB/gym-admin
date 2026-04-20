'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

type Membresia = {
  id: string
  tipo: string
  precio: number
}

export default function EditarMiembroPage() {
  const { id } = useParams()
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState('')
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    if (id) cargarDatos()
  }, [id])

  async function cargarDatos() {
    // Carga los datos actuales del miembro
    const { data: miembro } = await supabase
      .from('miembros')
      .select('*')
      .eq('id', id)
      .single()

    if (miembro) {
      setNombre(miembro.nombre)
      setTelefono(miembro.telefono)
      setEstado(miembro.estado)
    }

    // Carga los tipos de membresía disponibles
    const { data: membresiasData } = await supabase
      .from('membresias')
      .select('*')
      .eq('activo', true)
      .order('precio')
    setMembresias(membresiasData || [])

    setLoading(false)
  }

  async function guardarCambios() {
    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y teléfono son obligatorios')
      return
    }

    setGuardando(true)
    setError('')

    const { error: errorUpdate } = await supabase
      .from('miembros')
      .update({ nombre, telefono, estado })
      .eq('id', id)

    if (errorUpdate) {
      setError('Error al guardar los cambios. Intenta de nuevo.')
      setGuardando(false)
      return
    }

    setExito(true)
    setGuardando(false)

    // Regresa al perfil después de 1.5 segundos
    setTimeout(() => {
      router.push(`/admin/miembros/${id}`)
    }, 1500)
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Cargando...</div>
  }

  return (
    <div className="space-y-6 max-w-lg">

      {/* Botón volver */}
      <button
        onClick={() => router.push(`/admin/miembros/${id}`)}
        className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={16} />
        Volver al perfil
      </button>

      <h1 className="text-2xl font-bold">Editar miembro</h1>

      <div className="bg-white rounded-lg border p-6 space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => {
              const valor = e.target.value.replace(/\D/g, '').slice(0, 10)
              setTelefono(valor)
            }}
            maxLength={10}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="activo">Activo</option>
            <option value="congelado">Congelado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>

        {/* Mensaje de error */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* Mensaje de éxito */}
        {exito && (
          <p className="text-green-600 text-sm">Cambios guardados correctamente. Redirigiendo...</p>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push(`/admin/miembros/${id}`)}
            className="cursor-pointer flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={guardarCambios}
            disabled={guardando || exito}
            className="cursor-pointer flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}