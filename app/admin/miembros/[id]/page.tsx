'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import type QRCodeType from 'qrcode'

type Miembro = {
  id: string
  nombre: string
  telefono: string
  estado: string
  created_at: string
}

type Pago = {
  id: string
  monto: number
  metodo: string
  fecha_inicio: string
  fecha_vencimiento: string
  membresias: { tipo: string }
}

type Visita = {
  id: string
  fecha_entrada: string
}

export default function PerfilMiembroPage() {
  const { id } = useParams()
  // useParams obtiene el id de la URL — ej: /admin/miembros/123 → id = "123"

  const router = useRouter()
  const [miembro, setMiembro] = useState<Miembro | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [totalPagado, setTotalPagado] = useState(0)
  const [loading, setLoading] = useState(true)
  const [accionLoading, setAccionLoading] = useState(false)

  useEffect(() => {
    if (id) cargarDatos()
  }, [id])

  async function cargarDatos() {
    // Carga los datos del miembro
    const { data: miembroData } = await supabase
      .from('miembros')
      .select('*')
      .eq('id', id)
      .single()
    setMiembro(miembroData)

    // Carga el historial de pagos del miembro
    const { data: pagosData } = await supabase
      .from('pagos')
      .select('*, membresias(tipo)')
      .eq('miembro_id', id)
      .order('created_at', { ascending: false })
    setPagos(pagosData || [])
    setTotalPagado(pagosData?.reduce((sum, p) => sum + p.monto, 0) || 0)

    // Carga el historial de visitas del miembro
    const { data: visitasData } = await supabase
      .from('visitas')
      .select('*')
      .eq('miembro_id', id)
      .order('fecha_entrada', { ascending: false })
    setVisitas(visitasData || [])

    setLoading(false)
  }

  async function congelarMembresia() {
    setAccionLoading(true)
    await supabase
      .from('miembros')
      .update({ estado: miembro?.estado === 'congelado' ? 'activo' : 'congelado' })
      .eq('id', id)
    await cargarDatos()
    setAccionLoading(false)
  }

  async function darDeBaja() {
    // Pide confirmación antes de dar de baja
    const confirmar = window.confirm(`¿Estás seguro de dar de baja a ${miembro?.nombre}?`)
    if (!confirmar) return
    setAccionLoading(true)
    await supabase
      .from('miembros')
      .update({ estado: 'vencido' })
      .eq('id', id)
    router.push('/admin/miembros')
  }

async function reenviarQR() {
  if (!miembro) return

  // Obtiene el qr_code del miembro
  const { data } = await supabase
    .from('miembros')
    .select('qr_code, nombre, telefono')
    .eq('id', id)
    .single()

  if (!data?.qr_code) {
    alert('Este miembro no tiene QR generado')
    return
  }

  // Genera el QR como canvas en el navegador
  const QRCode = (await import('qrcode')).default
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, data.qr_code, { width: 300 })

  // Convierte el canvas a blob
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const file = new File([blob], `qr-${data.nombre}.png`, { type: 'image/png' })

    // Intenta compartir la imagen directamente (funciona en móvil)
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'QR de acceso',
        text: `Hola ${data.nombre}! 👋 Aquí está tu QR de acceso a Aquiles Gym. Guárdalo para entrar al gym.`,
        files: [file]
      })
    } else {
      // Fallback para desktop — abre WhatsApp con link de descarga
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `qr-${data.nombre}.png`
      a.click()
      URL.revokeObjectURL(blobUrl)
    }
  })
}

  // Obtiene el último pago para mostrar el período actual
  const ultimoPago = pagos[0]

  if (loading) {
    return <div className="text-sm text-gray-400">Cargando...</div>
  }

  if (!miembro) {
    return <div className="text-sm text-red-500">Miembro no encontrado</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Botón volver */}
      <button
        onClick={() => router.push('/admin/miembros')}
        className=" cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={16} />
        Volver a miembros
      </button>

      <div className="grid grid-cols-3 gap-6">

        {/* Columna izquierda — información del miembro */}
        <div className="col-span-2 space-y-6">

          {/* Tarjeta de información general */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-bold">{miembro.nombre}</h1>
                <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block ${
                  miembro.estado === 'activo'    ? 'text-green-600 bg-green-50' :
                  miembro.estado === 'congelado' ? 'text-blue-500 bg-blue-50' :
                  'text-red-500 bg-red-50'
                }`}>
                  {miembro.estado.charAt(0).toUpperCase() + miembro.estado.slice(1)}
                </span>
              </div>
              <button
                onClick={() => router.push(`/admin/miembros/${id}/editar`)}
                className=" cursor-pointer text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
            </div>

            {/* Datos del miembro */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="font-medium w-24">Teléfono</span>
                <span>{miembro.telefono}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="font-medium w-24">Membresía</span>
                <span className="capitalize">{ultimoPago?.membresias?.tipo || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="font-medium w-24">Período</span>
                <span>
                  {ultimoPago
                    ? `${new Date(ultimoPago.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX')} - ${new Date(ultimoPago.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-MX')}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Historial de pagos */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-medium mb-4">Historial de pagos</h2>
            {pagos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pagos registrados</p>
            ) : (
              <div className="space-y-3">
                {pagos.map((pago) => (
                  <div key={pago.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs">$</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">${pago.monto}</p>
                        <p className="text-xs text-gray-500 capitalize">{pago.membresias?.tipo} · {pago.metodo}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(pago.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de visitas */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-medium mb-4">Historial de visitas</h2>
            {visitas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin visitas registradas</p>
            ) : (
              <div className="space-y-3">
                {visitas.map((visita) => (
                  <div key={visita.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-blue-500 text-xs">↵</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(visita.fecha_entrada).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                      </p>
                      <p className="text-xs text-gray-500">
                       {new Date(visita.fecha_entrada).toLocaleTimeString('es-MX', {
                        timeZone: 'America/Mexico_City',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Columna derecha — estadísticas y acciones */}
        <div className="space-y-4">

          {/* Estadísticas */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium">Estadísticas</h2>
            <div>
              <p className="text-xs text-gray-500">Total pagado</p>
              <p className="text-2xl font-bold">${totalPagado}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Visitas totales</p>
              <p className="text-2xl font-bold">{visitas.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Miembro desde</p>
              <p className="text-sm font-medium">
                {new Date(miembro.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <h2 className="font-medium mb-2">Acciones</h2>

            {/* Reenviar QR */}
            <button
            onClick={reenviarQR}
            className="cursor-pointer w-full text-left px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            Reenviar QR por WhatsApp
            </button>

            <button
              onClick={congelarMembresia}
              disabled={accionLoading}
              className="cursor-pointer w-full text-left px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {miembro.estado === 'congelado' ? 'Descongelar membresía' : 'Congelar membresía'}
            </button>
            <button         
              onClick={darDeBaja}
              disabled={accionLoading}
              className="cursor-pointer w-full text-left px-4 py-2 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 disabled:opacity-50"
              >
               Dar de baja
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}