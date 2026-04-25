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
  const [metodo, setMetodo] = useState('efectivo')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')
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

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = () => setFotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Sube la foto a Supabase Storage y devuelve la URL pública
  async function subirFoto(miembroId: string): Promise<string | null> {
    if (!foto) return null

    const extension = foto.name.split('.').pop()
    const path = `${miembroId}.${extension}`

    const { error } = await supabase.storage
      .from('fotos-miembros')
      .upload(path, foto, { upsert: true })

    if (error) {
      console.error('Error subiendo foto:', error)
      return null
    }

    const { data } = supabase.storage
      .from('fotos-miembros')
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function registrarMiembro() {
    if (!nombre.trim() || !telefono.trim() || !membresiaId) {
      setError('Todos los campos son obligatorios')
      return
    }

    setGuardando(true)
    setError('')

    const qrCode = `GYM-${Date.now()}-${nombre.replace(/\s/g, '').toUpperCase()}`

    // Inserta el miembro
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

    // Sube la foto y actualiza el miembro
    const fotoUrl = await subirFoto(miembro.id)
    if (fotoUrl) {
      await supabase
        .from('miembros')
        .update({ foto_url: fotoUrl })
        .eq('id', miembro.id)
    }

    const membresia = membresias.find(m => m.id === membresiaId)
    if (!membresia) return

    const fechaInicio = new Date()
    const fechaVencimiento = new Date()

    if (membresia.tipo === 'mensual') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)
    } else if (membresia.tipo === 'semanal') {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7)
    } else {
      // Por visita
      await supabase
        .from('visitas')
        .insert({ miembro_id: miembro.id })
      setMiembroCreado({
        nombre,
        telefono,
        qrCode: '',
        tipo: membresia.tipo,
        precio: membresia.precio,
      })
      setGuardando(false)
      return
    }

    // Registra el pago
    await supabase
      .from('pagos')
      .insert({
        miembro_id: miembro.id,
        membresia_id: membresiaId,
        monto: membresia.precio,
        metodo: metodo,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
      })

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

  async function enviarWhatsApp() {
    if (!miembroCreado) return
    const QRCode = (await import('qrcode')).default
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, miembroCreado.qrCode, { width: 300 })
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `qr-${miembroCreado.nombre}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'QR de acceso',
          text: `Hola ${miembroCreado.nombre}! 👋 Aquí está tu QR de acceso a Aquiles Gym.`,
          files: [file]
        })
      } else {
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `qr-${miembroCreado.nombre}.png`
        a.click()
        URL.revokeObjectURL(blobUrl)
      }
    })
  }

  function nuevoRegistro() {
    setNombre('')
    setTelefono('')
    setMembresiaId(membresias[0]?.id || '')
    setMiembroCreado(null)
    setQrUrl('')
    setError('')
    setFoto(null)
    setFotoPreview('')
  }

  // Pantalla de éxito
  if (miembroCreado) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="font-bold text-lg mb-1">¡Miembro registrado!</h2>
          <p className="text-sm text-gray-500 mb-6">
            {miembroCreado.nombre} · {miembroCreado.tipo} · ${miembroCreado.precio}
          </p>

          {qrUrl && miembroCreado.tipo !== 'por_visita' && (
            <div className="flex justify-center mb-6">
              <img
                src={qrUrl}
                alt="Código QR"
                className="w-48 h-48 border rounded-lg"
              />
            </div>
          )}

          {miembroCreado.tipo !== 'por_visita' && (
            <p className="text-xs text-gray-400 mb-6 font-mono break-all">
              {miembroCreado.qrCode}
            </p>
          )}

          <div className="space-y-3">
            {miembroCreado.tipo !== 'por_visita' && (
              <button
                onClick={enviarWhatsApp}
                className="cursor-pointer w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
              >
                Enviar QR por WhatsApp
              </button>
            )}
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

  // Formulario
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
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').slice(0, 10)
                setTelefono(valor)
              }}
              maxLength={10}
              placeholder="Ej: 5512345678"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Foto del miembro */}
          <div>
            <label className="block text-sm font-medium mb-1">Foto del miembro</label>
            {fotoPreview && (
              <div className="mb-2 flex justify-center">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              </div>
            )}
            <div className="flex gap-2">
              <label className="cursor-pointer flex-1 border rounded-lg px-3 py-2 text-sm text-center hover:bg-gray-50 md:hidden">
                📷 Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFoto}
                  className="hidden"
                />
              </label>
              <label className="cursor-pointer flex-1 border rounded-lg px-3 py-2 text-sm text-center hover:bg-gray-50">
                🖼 Subir foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFoto}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1">Opcional pero recomendado para verificar identidad</p>
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

          {membresiaId && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total a cobrar</span>
                <span className="font-bold text-lg">
                  ${membresias.find(m => m.id === membresiaId)?.precio || 0}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={registrarMiembro}
            disabled={guardando}
            className="cursor-pointer w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Registrando...' : 'Registrar y cobrar'}
          </button>

        </div>
      </div>
    </div>
  )
}