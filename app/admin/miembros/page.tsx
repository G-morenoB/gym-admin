'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'

// Tipos de datos que vamos a manejar
type Miembro = {
  id: string
  nombre: string
  telefono: string
  estado: string
  created_at: string
  ultimo_pago?: {
    fecha_vencimiento: string
    membresias: { tipo: string }
  }
}

export default function MiembrosPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [total, setTotal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    cargarMiembros()
  }, [])

  async function cargarMiembros() {
    // Trae todos los miembros con su último pago
    const { data } = await supabase
      .from('miembros')
      .select(`
        id,
        nombre,
        telefono,
        estado,
        created_at,
        pagos(
          fecha_vencimiento,
          membresias(tipo)
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      // Para cada miembro toma solo el pago más reciente
      const miembrosConPago = data.map((m: any) => ({
        ...m,
        ultimo_pago: m.pagos?.sort((a: any, b: any) =>
          new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime()
        )[0]
      }))
      setMiembros(miembrosConPago)
      setTotal(miembrosConPago.length)
    }
  }

// Filtra miembros según búsqueda y filtro de estado
const miembrosFiltrados = miembros.filter(m => {
  const coincideBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  
  // Usa el estado calculado (por fecha) en lugar del estado guardado en BD
  const estadoCalculado = calcularEstado(m)
  
  const coincideEstado = 
    filtroEstado === 'todos' ||
    filtroEstado === estadoCalculado ||
    // Si filtra por 'activo' incluye también los 'por_vencer'
    (filtroEstado === 'activo' && estadoCalculado === 'por_vencer') ||
    // Si filtra por 'congelado' usa el estado de la BD directamente
    (filtroEstado === 'congelado' && m.estado === 'congelado')

  return coincideBusqueda && coincideEstado
})
  // Calcula el estado visual basado en la fecha de vencimiento
  function calcularEstado(miembro: Miembro) {
    if (miembro.estado === 'congelado') return 'congelado'
    
    const hoy = new Date()
    const vencimiento = miembro.ultimo_pago?.fecha_vencimiento
    
    if (!vencimiento) return 'vencido'
    
    const fechaVence = new Date(vencimiento)
    const diffDias = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDias < 0) return 'vencido'
    if (diffDias <= 3) return 'por_vencer'
    return 'activo'
  }

  // Estilos y textos según el estado
  function badgeEstado(estado: string) {
    switch (estado) {
      case 'activo':     return { clase: 'text-green-600 bg-green-50',  texto: 'Activo' }
      case 'vencido':    return { clase: 'text-red-500 bg-red-50',      texto: 'Vencido' }
      case 'por_vencer': return { clase: 'text-orange-500 bg-orange-50', texto: 'Por vencer' }
      case 'congelado':  return { clase: 'text-blue-500 bg-blue-50',    texto: 'Congelado' }
      default:           return { clase: 'text-gray-500 bg-gray-50',    texto: estado }
    }
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Miembros</h1>
        <span className="text-sm text-gray-500">{total} miembros en total</span>
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      <select
        value={filtroEstado}
        onChange={(e) => setFiltroEstado(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="todos">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="vencido">Vencido</option>
        <option value="por_vencer">Por vencer</option>
        <option value="congelado">Congelado</option>
      </select>
      </div>
        
      {/* Tabla de miembros */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contacto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Membresía</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Vencimiento</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {miembrosFiltrados.map((miembro) => {
              const estado = calcularEstado(miembro)
              const badge = badgeEstado(estado)
              const vencimiento = miembro.ultimo_pago?.fecha_vencimiento
              const fechaVence = vencimiento ? new Date(vencimiento + 'T00:00:00') : null
              const esCercano = fechaVence && 
                Math.ceil((fechaVence.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3

              return (
                <tr key={miembro.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{miembro.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{miembro.telefono}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {miembro.ultimo_pago?.membresias?.tipo || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.clase}`}>
                      {badge.texto}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${esCercano ? 'text-orange-500 font-medium' : 'text-gray-600'}`}>
                    {fechaVence
                      ? fechaVence.toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => router.push(`/admin/miembros/${miembro.id}`)}
                      className=" cursor-pointer text-blue-600 hover:underline"
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              )
            })}

            {/* Si no hay resultados */}
            {miembrosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No se encontraron miembros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}