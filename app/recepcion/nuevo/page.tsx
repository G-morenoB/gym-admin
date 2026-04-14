'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { UserPlus } from 'lucide-react'

type Membresia = {
  id: string
  tipo: string
  precio: number
}

type MiembroCreado = {
  nombre: string
  telefono: string
  qrCode: string
  tipo: string
  precio: number
}

export default function NuevoMiembroPage() {
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [membresiaId, setMembresiaId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [miembroCreado, setMiembroCreado] = useState<MiembroCreado | null>(null)
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    cargarMembresias()
  }, [])

  async function cargarMembresias() {
    const { data } = await supabase
      .from('membresias')
      .select('*')
      .eq('activo', true)
      .order('precio')
    setMembresias(data || [])
    if (data && data.length > 0) setMembresiaId(data[0].id)
  }

  async function registrarMiembro() {
    if (!nombre.trim() || !telefono.trim() || !membresiaId) {
      setError('Todos los campos son obligatorios')
      return
    }

    setGuardando(true)
    setError('')

    // Genera un QR code único basado en timestamp + nombre
    const qrCode = `GYM-${Date.now()}-${nombre.replace(/\s/g, '').toUpperCase()}`

    // Inserta el miembro en la base de datos
    const { data: miembro, error: errorMiembro } = await supabase
      .from('miembros')
      .insert({ nombre, telefono, qr_code: qrCode, estado: 'activo' })
      .select()
      .single()

    if (errorMiembro || !miembro) {
      setError('Error al registrar el miembro. Intenta de nuevo.')
      setGuardando(false)
      return
    }

    // Busca los datos de la membresía seleccionada
    const membresia = membresias.find(m => m.id === membresiaId)
    if (!membresia) return

    // Calcula la fecha de vencimiento según el tipo de membresía
    const fechaInicio = new Date()
    const fechaVencimiento = new Date()
    if (membresia.tipo === 'mensual') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)
    } else if (membresia.tipo === 'semanal') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7)
    } else {
      // Por visita — vence el mismo día
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 1)
    }

    // Registra el pago inicial
    await supabase
      .from('pagos')
      .insert({
        miembro_id: miembro.id,
        membresia_id: membresiaId,
        monto: membresia.precio,
        metodo: 'efectivo',
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
      })

    // Genera la URL del QR usando una API gratuita
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`
    setQrUrl(qrImageUrl)

    setMiembroCreado({
      nombre,
      telefono,
      qrCode,
      tipo: membresia.tipo,
      precio: membresia.precio,
    })

    setGuardando(false)
  }

  function enviarWhatsApp() {
    if (!miembroCreado) return
    const mensaje = `Hola ${miembroCreado.nombre}! 👋 Tu membresía en Aquiles Gym ha sido registrada exitosamente. Aquí está tu código QR de acceso: ${qrUrl} Guárdalo para entrar al gym. ¡Te esperamos!`
    const url = `https://wa.me/52${miembroCreado.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  function nuevoRegistro() {
    setNombre('')
    setTelefono('')
    setMembresiaId(membresias[0]?.id || '')
    setMiembroCreado(null)
    setQrUrl('')
    setError('')
  }

  // Pantalla de éxito con QR generado
  if (miembroCreado) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="font-bold text-lg mb-1">¡Miembro registrado!</h2>
          <p className="text-sm text-gray-500 mb-6">{miembroCreado.nombre} · {miembroCreado.tipo} · ${miembroCreado.precio}</p>

          {/* QR generado */}
          {qrUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={qrUrl}
                alt="Código QR del miembro"
                className="w-48 h-48 border rounded-lg"
              />
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6 font-mono break-all">{miembroCreado.qrCode}</p>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={enviarWhatsApp}
              className="cursor-pointer w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
            >
              Enviar por WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="cursor-pointer w-full border py-3 rounded-lg text-sm hover:bg-gray-50"
            >
              Imprimir QR
            </button>
            <button
              onClick={nuevoRegistro}
              className="cursor-pointer w-full border py-3 rounded-lg text-sm hover:bg-gray-50"
            >
              Registrar otro miembro
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de registro
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <UserPlus size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-medium">Registro de nuevo miembro</h2>
            <p className="text-sm text-gray-500">Completa el formulario para generar el código QR</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 5512345678"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={registrarMiembro}
            disabled={guardando}
            className="cursor-pointer w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Registrando...' : 'Registrar y generar QR'}
          </button>
        </div>
      </div>
    </div>
  )
}