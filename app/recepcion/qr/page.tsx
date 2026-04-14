'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'

type ResultadoScan = {
  nombre: string
  tipo: string
  estado: 'activo' | 'por_vencer' | 'vencido'
  fechaVencimiento: string
  miembroId: string
}

export default function EntradaQRPage() {
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoScan | null>(null)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Limpia el escáner al salir de la página
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  async function iniciarEscaner() {
    setResultado(null)
    setError('')
    setEscaneando(true)

    // Pequeño delay para que el div esté en el DOM
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' }, // usa la cámara trasera
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (qrCode) => {
            // Al detectar un QR detiene el escáner y procesa el resultado
            await scanner.stop()
            setEscaneando(false)
            await procesarQR(qrCode)
          },
          () => {} // error silencioso mientras busca el QR
        )
      } catch {
        setEscaneando(false)
        setError('No se pudo acceder a la cámara. Verifica los permisos.')
      }
    }, 100)
  }

  async function procesarQR(qrCode: string) {
    // Busca el miembro por su qr_code
    const { data: miembro } = await supabase
      .from('miembros')
      .select('id, nombre, estado')
      .eq('qr_code', qrCode)
      .single()

    if (!miembro) {
      setError('QR no reconocido. El miembro no existe.')
      return
    }

    if (miembro.estado === 'congelado') {
      setError(`La membresía de ${miembro.nombre} está congelada.`)
      return
    }

    // Busca el último pago activo del miembro
    const hoy = new Date().toISOString().split('T')[0]
    const { data: pago } = await supabase
      .from('pagos')
      .select('fecha_vencimiento, membresias(tipo)')
      .eq('miembro_id', miembro.id)
      .order('fecha_vencimiento', { ascending: false })
      .limit(1)
      .single()

    // Calcula el estado según la fecha de vencimiento
    let estado: 'activo' | 'por_vencer' | 'vencido' = 'vencido'
    if (pago) {
      const fechaVence = new Date(pago.fecha_vencimiento + 'T00:00:00')
      const diffDias = Math.ceil((fechaVence.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (diffDias < 0) estado = 'vencido'
      else if (diffDias <= 3) estado = 'por_vencer'
      else estado = 'activo'
    }

    // Si está activo o por vencer registra la entrada
    if (estado !== 'vencido') {
      await supabase
        .from('visitas')
        .insert({ miembro_id: miembro.id })
    }

    setResultado({
      nombre: miembro.nombre,
      tipo: (pago as any)?.membresias?.tipo || '—',
      estado,
      fechaVencimiento: pago?.fecha_vencimiento || '',
      miembroId: miembro.id,
    })
  }

  // Colores y textos según el estado
  const estiloEstado = {
    activo:     { bg: 'bg-green-500',  texto: 'ACCESO PERMITIDO',  icono: '✓' },
    por_vencer: { bg: 'bg-yellow-500', texto: 'ACCESO PERMITIDO',  icono: '⚠' },
    vencido:    { bg: 'bg-red-500',    texto: 'ACCESO DENEGADO',   icono: '✗' },
  }

  return (
    <div className="space-y-6">

      {/* Tarjeta del escáner */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">⊞</span>
          </div>
          <div>
            <h2 className="font-medium">Entrada por QR</h2>
            <p className="text-sm text-gray-500">Escanea el código QR del miembro</p>
          </div>
        </div>

        {/* Área del escáner */}
        {escaneando && (
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden mb-4" />
        )}

        {/* Botón activar cámara */}
        {!escaneando && !resultado && (
          <button
            onClick={iniciarEscaner}
            className="cursor-pointer w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <span>⊞</span>
            Activar cámara para escanear
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-500 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Resultado del escaneo */}
      {resultado && (
        <div className={`rounded-lg p-6 text-white ${estiloEstado[resultado.estado].bg}`}>
          <div className="text-center mb-4">
            <span className="text-4xl">{estiloEstado[resultado.estado].icono}</span>
            <h2 className="text-xl font-bold mt-2">{estiloEstado[resultado.estado].texto}</h2>
          </div>

<div style={{backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'white'}}>  <div className="flex justify-between">
      <span style={{opacity: 0.8}}>Miembro</span>
  <span className="font-medium">{resultado.nombre}</span>
</div>
<div style={{display: 'flex', justifyContent: 'space-between'}}>
  <span style={{opacity: 0.8}}>Membresía</span>
  <span className="font-medium capitalize">{resultado.tipo}</span>
</div>
<div style={{display: 'flex', justifyContent: 'space-between'}}>
  <span style={{opacity: 0.8}}>Vence</span>
  <span className="font-medium">
    {resultado.fechaVencimiento
      ? new Date(resultado.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-MX')
      : '—'}
  </span>
</div>
{resultado.estado !== 'vencido' && (
  <div style={{display: 'flex', justifyContent: 'space-between'}}>
    <span style={{opacity: 0.8}}>Entrada</span>
    <span className="font-medium">
      {new Date().toLocaleTimeString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </span>
  </div>
  )}
</div>

          <div className="mt-4 space-y-2">
            {resultado.estado === 'vencido' && (
              <button
                onClick={() => window.location.href = `/recepcion/cobros?id=${resultado.miembroId}`}
                className="cursor-pointer w-full bg-white text-red-500 py-2 rounded-lg font-medium text-sm"
              >
                Registrar pago
              </button>
            )}
            <button
              onClick={() => { setResultado(null); setError('') }}
              className="cursor-pointer w-full bg-white bg-opacity-20 py-2 rounded-lg text-sm"
            >
              Escanear otro
            </button>
          </div>
        </div>
      )}

    </div>
  )
}