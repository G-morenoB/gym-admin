'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { CreditCard } from 'lucide-react'

type Miembro = {
  id: string
  nombre: string
  telefono: string
}

type Membresia = {
  id: string
  tipo: string
  precio: number
}

export default function CobrosPage() {
  const searchParams = useSearchParams()
  // Obtiene el id del miembro si viene desde el escáner de QR
  const idDesdeQR = searchParams.get('id')

  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<Miembro | null>(null)
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Miembro[]>([])
  const [membresiaId, setMembresiaId] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarMembresias()
    // Si viene con id desde el QR, carga el miembro automáticamente
    if (idDesdeQR) cargarMiembroPorId(idDesdeQR)
  }, [idDesdeQR])

  async function cargarMembresias() {
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .eq('activo', true)
      .order('precio')
    setMembresias(data || [])
    if (data && data.length > 0) setMembresiaId(data[0].id)
  }

  async function cargarMiembroPorId(id: string) {
    const { data } = await supabase
      .from('miembros')
      .select('id, nombre, telefono')
      .eq('id', id)
      .single()
    if (data) setMiembroSeleccionado(data)
  }

  async function buscarMiembro() {
    if (!busqueda.trim()) return
    const { data } = await supabase
      .from('miembros')
      .select('id, nombre, telefono')
      .ilike('nombre', `%${busqueda}%`)
      .order('nombre')
    setResultadosBusqueda(data || [])
  }

  async function registrarPago() {
    if (!miembroSeleccionado || !membresiaId) {
      setError('Selecciona un miembro y tipo de membresía')
      return
    }

    setGuardando(true)
    setError('')

    const membresia = membresias.find(m => m.id === membresiaId)
    if (!membresia) return

    // Calcula fechas según el tipo de membresía
    const fechaInicio = new Date()
    const fechaVencimiento = new Date()
    if (membresia.tipo === 'mensual') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)
    } else if (membresia.tipo === 'semanal') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7)
    } else {
      // Por visita — registra visita directamente
      await supabase
        .from('visitas')
        .insert({ miembro_id: miembroSeleccionado.id })
      setExito(true)
      setGuardando(false)
      return
    }

    // Registra el pago
    const { error: errorPago } = await supabase
      .from('pagos')
      .insert({
        miembro_id: miembroSeleccionado.id,
        membresia_id: membresiaId,
        monto: membresia.precio,
        metodo,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
      })

    if (errorPago) {
      setError('Error al registrar el pago. Intenta de nuevo.')
      setGuardando(false)
      return
    }

    // Actualiza el estado del miembro a activo
    await supabase
      .from('miembros')
      .update({ estado: 'activo' })
      .eq('id', miembroSeleccionado.id)

    setExito(true)
    setGuardando(false)
  }

  function nuevocobro() {
    setMiembroSeleccionado(null)
    setBusqueda('')
    setResultadosBusqueda([])
    setExito(false)
    setError('')
  }

  const membresiaSeleccionada = membresias.find(m => m.id === membresiaId)

  // Pantalla de éxito
  if (exito && miembroSeleccionado) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <h2 className="font-bold text-lg">¡Pago registrado!</h2>
        <p className="text-sm text-gray-500">
          {miembroSeleccionado.nombre} · {membresiaSeleccionada?.tipo} · ${membresiaSeleccionada?.precio}
        </p>
        <button
          onClick={nuevocobro}
          className="cursor-pointer w-full border py-3 rounded-lg text-sm hover:bg-gray-50"
        >
          Registrar otro pago
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <CreditCard size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-medium">Registrar pago</h2>
            <p className="text-sm text-gray-500">Cobra o renueva la membresía de un cliente</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Miembro seleccionado o buscador */}
          {miembroSeleccionado ? (
            <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium">{miembroSeleccionado.nombre}</p>
                <p className="text-xs text-gray-500">{miembroSeleccionado.telefono}</p>
              </div>
              <button
                onClick={() => setMiembroSeleccionado(null)}
                className="cursor-pointer text-xs text-gray-400 hover:text-gray-600"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Buscar cliente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarMiembro()}
                  placeholder="Nombre del cliente..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={buscarMiembro}
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Buscar
                </button>
              </div>

              {/* Resultados de búsqueda */}
              {resultadosBusqueda.length > 0 && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  {resultadosBusqueda.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMiembroSeleccionado(m)
                        setResultadosBusqueda([])
                        setBusqueda('')
                      }}
                      className="cursor-pointer w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-0"
                    >
                      <p className="font-medium">{m.nombre}</p>
                      <p className="text-xs text-gray-500">{m.telefono}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tipo de membresía */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de membresía</label>
            <select
              value={membresiaId}
              onChange={(e) => setMembresiaId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {membresias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)} — ${m.precio}
                </option>
              ))}
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium mb-1">Método de pago</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          {/* Resumen del cobro */}
          {miembroSeleccionado && membresiaSeleccionada && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total a cobrar</span>
                <span className="font-bold text-lg">${membresiaSeleccionada.precio}</span>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={registrarPago}
            disabled={guardando || !miembroSeleccionado}
            className="cursor-pointer w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Registrando...' : 'Confirmar pago'}
          </button>

        </div>
      </div>
    </div>
  )
}