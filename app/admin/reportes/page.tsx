'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Pago = {
  id: string
  monto: number
  metodo: string
  fecha_inicio: string
  fecha_vencimiento: string
  created_at: string
  miembros: { nombre: string }
  membresias: { tipo: string }
}

type Miembro = {
  id: string
  nombre: string
  telefono: string
  ultimo_vencimiento?: string
  tipo?: string
}

export default function ReportesPage() {
  const [pestana, setPestana] = useState<'historial' | 'vencidas' | 'ingresos'>('historial')
  const [pagos, setPagos] = useState<Pago[]>([])
  const [vencidos, setVencidos] = useState<Miembro[]>([])
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [totalPagos, setTotalPagos] = useState(0)
  const [promedio, setPromedio] = useState(0)

  useEffect(() => {
    if (pestana === 'historial' || pestana === 'ingresos') cargarPagos()
    if (pestana === 'vencidas') cargarVencidos()
  }, [pestana, fechaInicio, fechaFin])

  async function cargarPagos() {
    // Trae pagos dentro del rango de fechas seleccionado
    const { data } = await supabase
      .from('pagos')
      .select('*, miembros(nombre), membresias(tipo)')
      .gte('created_at', fechaInicio)
      .lte('created_at', fechaFin + 'T23:59:59')
      .order('created_at', { ascending: false })

    const lista = data || []
    setPagos(lista)
    setTotalPagos(lista.length)
    const total = lista.reduce((sum, p) => sum + p.monto, 0)
    setTotalIngresos(total)
    setPromedio(lista.length > 0 ? Math.round(total / lista.length) : 0)
  }

  async function cargarVencidos() {
    const hoy = new Date().toISOString().split('T')[0]

    // Trae pagos vencidos con datos del miembro
    const { data } = await supabase
      .from('pagos')
      .select('miembro_id, fecha_vencimiento, miembros(id, nombre, telefono), membresias(tipo)')
      .lt('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: false })

    // Elimina duplicados — solo muestra el vencimiento más reciente por miembro
    const vistos = new Set()
    const unicos = (data || []).filter((p: any) => {
      if (vistos.has(p.miembro_id)) return false
      vistos.add(p.miembro_id)
      return true
    })

    setVencidos(unicos.map((p: any) => ({
      id: p.miembro_id,
      nombre: p.miembros?.nombre,
      telefono: p.miembros?.telefono,
      ultimo_vencimiento: p.fecha_vencimiento,
      tipo: p.membresias?.tipo
    })))
  }

  return (
    <div className="space-y-6">

      {/* Título */}
      <h1 className="text-2xl font-bold">Reportes de pagos</h1>

      {/* Pestañas */}
      <div className="flex gap-2">
        {[
          { key: 'historial', label: 'Historial de pagos' },
          { key: 'vencidas',  label: 'Membresías vencidas' },
          { key: 'ingresos',  label: 'Ingresos por período' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPestana(p.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pestana === p.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border hover:bg-gray-50 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Selector de fechas — aparece en historial e ingresos */}
      {pestana !== 'vencidas' && (
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">hasta</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Pestaña: Historial de pagos */}
      {pestana === 'historial' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Miembro</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Método</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                   {new Date(pago.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{pago.miembros?.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{pago.membresias?.tipo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{pago.metodo}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">${pago.monto}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay pagos en este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pestaña: Membresías vencidas */}
      {pestana === 'vencidas' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Miembro</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Teléfono</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Membresía</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Venció</th>
              </tr>
            </thead>
            <tbody>
              {vencidos.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.telefono}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{m.tipo}</td>
                  <td className="px-4 py-3 text-sm text-red-500">
                    {m.ultimo_vencimiento
                      ? new Date(m.ultimo_vencimiento + 'T00:00:00').toLocaleDateString('es-MX')
                      : '—'}
                  </td>
                </tr>
              ))}
              {vencidos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay membresías vencidas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pestaña: Ingresos por período */}
      {pestana === 'ingresos' && (
        <div className="space-y-4">

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">Total ingresos</p>
              <p className="text-2xl font-bold">${totalIngresos}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">Pagos realizados</p>
              <p className="text-2xl font-bold">{totalPagos}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">Promedio por pago</p>
              <p className="text-2xl font-bold">${promedio}</p>
            </div>
          </div>

          {/* Tabla de pagos del período */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="text-sm font-medium">Pagos del período</h2>
            </div>
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Miembro</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(pago.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{pago.miembros?.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{pago.membresias?.tipo}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">${pago.monto}</td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                      No hay pagos en este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}